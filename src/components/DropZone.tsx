import React, { useState } from 'react';
import { UploadCloud, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Dependency } from '../types';
import { isCycloneDX, parseCycloneDX } from '../lib/cyclonedx';

interface DropZoneProps {
  onFileParsed: (fileName: string, dependencies: Dependency[], isVulnerable: boolean) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileParsed }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFileContent = async (content: string, fileName: string) => {
    try {
      setParseError(null);
      setCurrentFileName(fileName);
      const json = JSON.parse(content);

      let parsedDeps: Dependency[] = [];
      let ecosystem: 'composer' | 'npm' | 'wordpress' = 'composer';

      // Parse CycloneDX JSON format (v1.4, v1.5, v1.6)
      if (isCycloneDX(json)) {
        const cdx = parseCycloneDX(json);
        parsedDeps = cdx.dependencies;
        ecosystem = cdx.ecosystem;
      }
      // Parse Composer.lock format
      else if (json.packages || json['packages-dev']) {
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
      }
      // Parse package-lock.json format
      else if (json.packages || json.dependencies) {
        ecosystem = 'npm';
        const pkgs = json.packages || {};
        Object.entries(pkgs).forEach(([key, val]: [string, any]) => {
          if (!key || key === '') return;
          const cleanName = key.replace(/^node_modules\//, '');
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

      // Backend API sync request (/api/v1/sync)
      try {
        const response = await fetch('/api/v1/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packages: parsedDeps.map((d) => ({ name: d.name, version: d.version, ecosystem: d.ecosystem })),
            ecosystem
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.alerts && result.alerts.length > 0) {
            // Map returned alerts to matching packages
            result.alerts.forEach((alert: any) => {
              const matchedDep = parsedDeps.find((d) => d.name.toLowerCase() === alert.packageName.toLowerCase());
              if (matchedDep) {
                matchedDep.vulnerabilities.push({
                  id: alert.cve_id,
                  title: alert.title,
                  severity: alert.severity,
                  cvss: alert.cvss,
                  packageName: alert.packageName,
                  affectedVersion: `< ${alert.fixedVersion}`,
                  fixedVersion: alert.fixedVersion,
                  detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  description: alert.description
                });
              }
            });
            onFileParsed(fileName, parsedDeps, true);
            return;
          }
        }
      } catch (apiErr) {
        console.warn('Backend sync API failed or offline, falling back to local simulation:', apiErr);
      }

      // Fallback: simulated detection for PHP 8.2 series
      let foundVuln = false;
      parsedDeps.forEach((dep) => {
        if ((dep.name === 'php' || dep.name.includes('php')) && dep.version.startsWith('8.2')) {
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
      });

      onFileParsed(fileName, parsedDeps, foundVuln);
    } catch (err: any) {
      setParseError(err.message || t('dropzone.jsonParseError'));
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
            type: 'library',
            name: 'php',
            version: '8.2.14',
            purl: 'pkg:composer/php@8.2.14'
          },
          {
            type: 'library',
            name: 'laravel/framework',
            version: '10.35.0',
            purl: 'pkg:composer/laravel/framework@10.35.0'
          },
          {
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
          <p className="text-xs text-slate-500 mt-0.5">
            {t('dropzone.subtitle')}
          </p>
        </div>

        {/* Demo buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">{t('dropzone.trySample')}</span>
          <button
            onClick={() => loadSample('php_vulnerable')}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 transition-all font-medium cursor-pointer shadow-2xs"
          >
            {t('dropzone.phpSample')}
          </button>
          <button
            onClick={() => loadSample('clean_npm')}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 transition-all font-medium cursor-pointer shadow-2xs"
          >
            {t('dropzone.npmSample')}
          </button>
          <button
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
          accept=".json,.lock,.cdx"
          onChange={handleFileInput}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 mb-3 shadow-xs group-hover:scale-105 transition-transform">
            <FileCode className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            {t('dropzone.dropInstruction')}
          </p>
          <p className="text-xs text-slate-500 mt-1">{t('dropzone.dropInstructionOr')}</p>
        </label>
      </div>

      {parseError && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{parseError}</span>
        </div>
      )}

      {currentFileName && !parseError && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{t('dropzone.analysisComplete', { fileName: currentFileName })}</span>
        </div>
      )}
    </div>
  );
};
