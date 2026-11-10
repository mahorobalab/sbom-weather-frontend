import React, { useState } from 'react';
import {
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertCircle,
  ClipboardPaste,
  X,
  Loader2,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Dependency, WeatherStatus } from '../types';
import { calculateWeatherStatus, calculateMaxDaysUnresolved } from '../mockData';
import { isCycloneDX, parseCycloneDX } from '../lib/cyclonedx';
import { isWpSiteHealthText, parseWpSiteHealthText } from '../lib/wpSiteHealth';

interface DropZoneProps {
  onFileParsed: (
    fileName: string,
    dependencies: Dependency[],
    isVulnerable: boolean,
    weatherOverride?: WeatherStatus,
    ecosystemOverride?: 'composer' | 'npm' | 'wordpress'
  ) => void;
}

type ScanStage = 'idle' | 'parsing' | 'matching' | 'generating';

export const DropZone: React.FC<DropZoneProps> = ({ onFileParsed }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [lastInspectedCount, setLastInspectedCount] = useState<number>(0);
  const [scanStage, setScanStage] = useState<ScanStage>('idle');
  const [detectedPkgCount, setDetectedPkgCount] = useState<number>(0);

  // WordPress Site Health Info Modal state
  const [isWpModalOpen, setIsWpModalOpen] = useState(false);
  const [wpInfoText, setWpInfoText] = useState('');
  const [wpModalError, setWpModalError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const sortDependenciesByRisk = (deps: Dependency[]): Dependency[] => {
    return [...deps].sort((a, b) => {
      const aMaxCvss = a.vulnerabilities.reduce((max, v) => Math.max(max, v.cvss || 0), -1);
      const bMaxCvss = b.vulnerabilities.reduce((max, v) => Math.max(max, v.cvss || 0), -1);
      if (aMaxCvss !== bMaxCvss) return bMaxCvss - aMaxCvss;
      return 0;
    });
  };

  const processFileContent = async (content: string, fileName: string): Promise<boolean> => {
    try {
      setParseError(null);
      setCurrentFileName(null);
      setScanStage('parsing');

      let parsedDeps: Dependency[] = [];
      let ecosystem: 'composer' | 'npm' | 'wordpress' = 'composer';

      // 1. Check if input is WordPress Site Health Info plain text
      if (isWpSiteHealthText(content)) {
        const wpParsed = parseWpSiteHealthText(content);
        if (wpParsed.dependencies.length === 0) {
          throw new Error(t('dropzone.wpInvalidFormatError'));
        }
        parsedDeps = wpParsed.dependencies;
        ecosystem = 'wordpress';
      } else {
        // 2. Otherwise parse as JSON (CycloneDX, composer.lock, package-lock.json)
        let json: any;
        try {
          json = JSON.parse(content);
        } catch {
          throw new Error(t('dropzone.jsonParseError'));
        }

        if (isCycloneDX(json)) {
          const cdx = parseCycloneDX(json);
          parsedDeps = cdx.dependencies;
          ecosystem = cdx.ecosystem;
        } else if (json.packages && Array.isArray(json.packages)) {
          ecosystem = 'composer';
          const allPkgs = [...(json.packages || []), ...(json['packages-dev'] || [])];
          allPkgs.forEach((pkg: any) => {
            parsedDeps.push({
              name: pkg.name,
              version: pkg.version || 'unknown',
              ecosystem: 'composer',
              vulnerabilities: []
            });
          });
        } else if (json.packages || json.dependencies) {
          ecosystem = 'npm';
          const pkgs = json.packages || {};
          Object.entries(pkgs).forEach(([key, val]: [string, any]) => {
            if (!key || key === '') return;
            const cleanName = key.replace(/^.*node_modules\//, '');
            parsedDeps.push({
              name: cleanName,
              version: val.version || '1.0.0',
              ecosystem: 'npm',
              vulnerabilities: []
            });
          });
        } else {
          throw new Error(t('dropzone.unsupportedFormat'));
        }
      }

      setDetectedPkgCount(parsedDeps.length);
      setScanStage('matching');

      const syncPayload = {
        packages: parsedDeps.map((d) => ({
          name: d.name,
          displayName: d.displayName,
          needsSlugResolution: d.needsSlugResolution,
          version: d.version,
          ecosystem:
            d.componentType === 'theme'
              ? 'WordPress-Theme'
              : d.componentType === 'core'
              ? 'WordPress-Core'
              : d.componentType === 'runtime'
              ? 'PHP'
              : d.ecosystem === 'wordpress'
              ? 'WordPress'
              : d.ecosystem,
          componentType: d.componentType,
          active: d.active ?? true
        })),
        ecosystem
      };

      // Backend API sync request (/api/v1/sync with fallback to localhost:8787)
      try {
        let response: Response | null = null;
        try {
          response = await fetch('/api/v1/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncPayload)
          });
        } catch {
          response = await fetch('http://localhost:8787/api/v1/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncPayload)
          });
        }

        if (response && response.ok) {
          setScanStage('generating');
          const result = await response.json();

          // Update parsedDeps slugs if backend resolved Display Name -> Official Slug
          if (Array.isArray(result.resolvedPackages)) {
            result.resolvedPackages.forEach((resolvedPkg: any, idx: number) => {
              if (resolvedPkg && resolvedPkg.name && parsedDeps[idx]) {
                parsedDeps[idx].name = resolvedPkg.name;
              }
            });
          }

          if (Array.isArray(result.alerts) && result.alerts.length > 0) {
            result.alerts.forEach((alert: any) => {
              const alertPkgLower = String(alert.packageName || '').toLowerCase();
              const matchedDep = parsedDeps.find(
                (d) =>
                  d.name.toLowerCase() === alertPkgLower ||
                  (d.displayName && d.displayName.toLowerCase() === alertPkgLower)
              );
              if (matchedDep) {
                const alreadyAdded = matchedDep.vulnerabilities.some((v) => v.id === alert.cve_id);
                if (!alreadyAdded) {
                  const fallbackDate = alert.firstDetectedAt
                    ? new Date(alert.firstDetectedAt * 1000).toISOString().slice(0, 10)
                    : new Date().toISOString().slice(0, 10);
                  matchedDep.vulnerabilities.push({
                    id: alert.cve_id,
                    title: alert.title,
                    severity: alert.severity,
                    cvss: alert.cvss,
                    packageName: alert.packageName,
                    affectedVersion: `< ${alert.fixedVersion}`,
                    fixedVersion: alert.fixedVersion,
                    detectedAt: alert.publishedAt || fallbackDate,
                    description: alert.description
                  });
                }
              }
            });

            // Sort each dependency's vulnerabilities by CVSS descending so primary CVE is highest risk
            parsedDeps.forEach((d) => {
              if (d.vulnerabilities.length > 1) {
                d.vulnerabilities.sort((a, b) => (b.cvss || 0) - (a.cvss || 0));
              }
            });
          }

          const sortedDeps = sortDependenciesByRisk(parsedDeps);
          const allVulns = sortedDeps.flatMap((d) => d.vulnerabilities || []);
          const hasVuln = allVulns.length > 0;
          const maxDays = calculateMaxDaysUnresolved(sortedDeps, 0);
          const resolvedWeather: WeatherStatus =
            result.weather || calculateWeatherStatus(allVulns, maxDays);

          setCurrentFileName(fileName);
          setLastInspectedCount(sortedDeps.length);
          setScanStage('idle');
          onFileParsed(fileName, sortedDeps, hasVuln, resolvedWeather, ecosystem);
          return true;
        }
      } catch (apiErr) {
        console.warn('Backend sync API failed or offline, falling back to local simulation:', apiErr);
      }

      // Offline fallback detection for PHP 8.2 series
      setScanStage('generating');
      let foundVuln = false;
      parsedDeps.forEach((dep) => {
        if (dep.name === 'php' || dep.name.includes('php')) {
          if (dep.version.startsWith('8.2.29')) {
            foundVuln = true;
            dep.vulnerabilities.push(
              {
                id: 'CVE-2025-14179',
                title: 'PHP 8.2 < 8.2.31 Critical Vulnerability in PDOPgSql / Standard Extension',
                severity: 'CRITICAL',
                cvss: 9.8,
                packageName: dep.name,
                affectedVersion: '< 8.2.31',
                fixedVersion: '8.2.31',
                detectedAt: '2026-05-10',
                description:
                  'In PHP 8.2.* before 8.2.31, critical memory corruption vulnerability published on 2026-05-10.'
              },
              {
                id: 'CVE-2025-14177',
                title: 'PHP 8.2 < 8.2.30 Heap Information Disclosure in getimagesize()',
                severity: 'HIGH',
                cvss: 7.5,
                packageName: dep.name,
                affectedVersion: '< 8.2.30',
                fixedVersion: '8.2.30',
                detectedAt: '2025-12-27',
                description:
                  'In PHP 8.2.* before 8.2.30, getimagesize() may leak uninitialized heap memory into APPn segments.'
              },
              {
                id: 'CVE-2026-6722',
                title: 'PHP 8.2 < 8.2.31 PDO quoting integer overflow vulnerability',
                severity: 'MEDIUM',
                cvss: 6.5,
                packageName: dep.name,
                affectedVersion: '< 8.2.31',
                fixedVersion: '8.2.31',
                detectedAt: '2026-05-10',
                description:
                  'In PHP 8.2.* before 8.2.31, improper boundary handling in PDO parameter quoting may lead to memory corruption.'
              }
            );
          } else if (dep.version.startsWith('8.2')) {
            foundVuln = true;
            dep.vulnerabilities.push({
              id: 'CVE-2026-109618',
              title: t('mock.vulnPhpTitle'),
              severity: 'CRITICAL',
              cvss: 9.2,
              packageName: dep.name,
              affectedVersion: '< 8.2.25',
              fixedVersion: '8.2.25 / 8.3.13',
              detectedAt: '2026-10-21 23:05',
              description: t('mock.vulnPhpDesc')
            });
          }
        }
      });

      const sortedDeps = sortDependenciesByRisk(parsedDeps);
      const fallbackAllVulns = sortedDeps.flatMap((d) => d.vulnerabilities || []);
      const fallbackMaxDays = calculateMaxDaysUnresolved(sortedDeps, 0);
      const fallbackWeather = calculateWeatherStatus(fallbackAllVulns, fallbackMaxDays);
      setCurrentFileName(fileName);
      setLastInspectedCount(sortedDeps.length);
      setScanStage('idle');
      onFileParsed(fileName, sortedDeps, foundVuln, fallbackWeather, ecosystem);
      return true;
    } catch (err: any) {
      setScanStage('idle');
      setParseError(err.message || t('dropzone.jsonParseError'));
      return false;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processFileContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processFileContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleRunWpSiteDiagnosis = async () => {
    setWpModalError(null);
    const trimmed = wpInfoText.trim();
    if (!trimmed) {
      setWpModalError(t('dropzone.wpEmptyError'));
      return;
    }
    if (!isWpSiteHealthText(trimmed)) {
      setWpModalError(t('dropzone.wpInvalidFormatError'));
      return;
    }

    const ok = await processFileContent(trimmed, t('dropzone.wpSiteHealthParsedName'));
    if (ok) {
      setIsWpModalOpen(false);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Instant sample loading for testing
  const loadSample = (type: 'php_vulnerable' | 'clean_npm' | 'cyclonedx') => {
    if (type === 'php_vulnerable') {
      const sampleComposer = JSON.stringify({
        packages: [
          { name: 'php', version: '8.2.14' },
          { name: 'laravel/framework', version: '10.35.0' },
          { name: 'monolog/monolog', version: '3.5.0' },
          { name: 'guzzlehttp/guzzle', version: '7.8.1' }
        ]
      });
      processFileContent(sampleComposer, t('dropzone.phpVulnerableSampleName'));
    } else if (type === 'clean_npm') {
      const sampleNpm = JSON.stringify({
        packages: {
          '': {},
          'node_modules/vite': { version: '5.4.10' },
          'node_modules/react': { version: '18.3.1' },
          'node_modules/tailwindcss': { version: '3.4.14' }
        }
      });
      processFileContent(sampleNpm, t('dropzone.cleanNpmSampleName'));
    } else {
      const sampleCdx = JSON.stringify({
        bomFormat: 'CycloneDX',
        specVersion: '1.5',
        metadata: {
          component: {
            type: 'application',
            name: 'cyclonedx-demo-site'
          }
        },
        components: [
          {
            'bom-ref': 'pkg:generic/php@8.2.14',
            type: 'platform',
            name: 'php',
            version: '8.2.14',
            purl: 'pkg:generic/php@8.2.14'
          },
          {
            'bom-ref': 'pkg:composer/laravel/framework@10.35.0',
            type: 'library',
            name: 'laravel/framework',
            version: '10.35.0',
            purl: 'pkg:composer/laravel/framework@10.35.0'
          },
          {
            'bom-ref': 'pkg:composer/monolog/monolog@3.5.0',
            type: 'library',
            name: 'monolog/monolog',
            version: '3.5.0',
            purl: 'pkg:composer/monolog/monolog@3.5.0'
          }
        ]
      });
      processFileContent(sampleCdx, t('dropzone.cycloneDxSampleName'));
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            <span>{t('dropzone.title')}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('dropzone.subtitle')}</p>
        </div>

        {/* WordPress Site Info Diagnosis button & Demo buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setWpModalError(null);
              setIsWpModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>{t('dropzone.wpSiteInfoBtn')}</span>
          </button>

          <span className="text-xs text-slate-400 hidden sm:inline">|</span>
          <span className="text-xs text-slate-500">{t('dropzone.trySample')}</span>
          <button
            type="button"
            onClick={() => loadSample('php_vulnerable')}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 transition-all font-medium cursor-pointer shadow-2xs"
          >
            {t('dropzone.phpSample')}
          </button>
          <button
            type="button"
            onClick={() => loadSample('clean_npm')}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 transition-all font-medium cursor-pointer shadow-2xs"
          >
            {t('dropzone.npmSample')}
          </button>
          <button
            type="button"
            onClick={() => loadSample('cyclonedx')}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300/80 transition-all font-medium cursor-pointer shadow-2xs"
          >
            {t('dropzone.cycloneDxSample')}
          </button>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/40 hover:bg-slate-50/80'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".json,.lock,.cdx,.txt"
          onChange={handleFileInput}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 mb-3 shadow-xs group-hover:scale-105 transition-transform">
            <FileCode className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">{t('dropzone.dropInstruction')}</p>
          <p className="text-xs text-slate-500 mt-1">{t('dropzone.dropInstructionOr')}</p>
          <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
            <p>{t('dropzone.scopeDisclaimerLine1')}</p>
            <p>{t('dropzone.scopeDisclaimerLine2')}</p>
          </div>
        </label>
      </div>

      {/* On-demand Scanning Progress Indicator */}
      {scanStage !== 'idle' && (
        <div className="mt-3 flex items-center gap-3 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium">
          <Loader2 className="w-4 h-4 flex-shrink-0 text-indigo-600 animate-spin" />
          <div className="flex-1">
            {scanStage === 'parsing' && (
              <span>{t('dropzone.scanningStep1', { count: detectedPkgCount })}</span>
            )}
            {scanStage === 'matching' && <span>{t('dropzone.scanningStep2')}</span>}
            {scanStage === 'generating' && <span>{t('dropzone.scanningStep3')}</span>}
          </div>
        </div>
      )}

      {parseError && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{parseError}</span>
        </div>
      )}

      {currentFileName && !parseError && scanStage === 'idle' && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>
            {t('dropzone.analysisComplete', {
              fileName: currentFileName,
              count: lastInspectedCount
            })}
          </span>
        </div>
      )}

      {/* WordPress Site Health Info Paste Modal */}
      {isWpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <ClipboardPaste className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {t('dropzone.wpModalTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t('dropzone.wpModalSubtitle')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWpModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Step-by-step instructions */}
              <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-4 space-y-2">
                <h4 className="text-xs font-bold text-indigo-950">{t('dropzone.wpHowToTitle')}</h4>
                <ol className="text-xs text-indigo-900 space-y-1 leading-relaxed list-none pl-0">
                  <li>{t('dropzone.wpStep1')}</li>
                  <li>{t('dropzone.wpStep2')}</li>
                  <li>{t('dropzone.wpStep3')}</li>
                  <li>{t('dropzone.wpStep4')}</li>
                </ol>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-indigo-100/80 space-y-1">
                  <p>{t('dropzone.wpPrivacyNote')}</p>
                  <div className="text-indigo-900/80 font-medium pt-0.5">
                    <p>{t('dropzone.scopeDisclaimerLine1')}</p>
                    <p>{t('dropzone.scopeDisclaimerLine2')}</p>
                  </div>
                </div>
              </div>

              {/* Paste Textarea */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <label
                    htmlFor="wp-site-health-textarea"
                    className="text-xs font-bold text-slate-800"
                  >
                    {t('dropzone.wpPasteLabel')}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWpInfoText(t('dropzone.wpSampleText'));
                        setWpModalError(null);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>{t('dropzone.wpFillLocalSampleBtn')}</span>
                    </button>
                    {wpInfoText && (
                      <button
                        type="button"
                        onClick={() => {
                          setWpInfoText('');
                          setWpModalError(null);
                        }}
                        className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors cursor-pointer"
                      >
                        {t('dropzone.wpClearBtn')}
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  id="wp-site-health-textarea"
                  rows={10}
                  value={wpInfoText}
                  onChange={(e) => {
                    setWpInfoText(e.target.value);
                    if (wpModalError) setWpModalError(null);
                  }}
                  placeholder={t('dropzone.wpPastePlaceholder')}
                  className="w-full rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 text-xs font-mono text-slate-800 bg-slate-50/50 outline-none transition-all resize-y"
                />
              </div>

              {/* Error inside Modal */}
              {wpModalError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{wpModalError}</span>
                </div>
              )}

              {/* Scanning Progress inside Modal */}
              {scanStage !== 'idle' && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium">
                  <Loader2 className="w-4 h-4 flex-shrink-0 text-indigo-600 animate-spin" />
                  <span>
                    {scanStage === 'parsing'
                      ? t('dropzone.scanningStep1', { count: detectedPkgCount })
                      : scanStage === 'matching'
                      ? t('dropzone.scanningStep2')
                      : t('dropzone.scanningStep3')}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsWpModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={scanStage !== 'idle'}
                onClick={handleRunWpSiteDiagnosis}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{t('dropzone.wpRunDiagnosisBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
