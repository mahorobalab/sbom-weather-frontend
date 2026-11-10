import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Download,
  Eye,
  Search,
  ExternalLink,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Dependency, ProjectSite, Vulnerability } from '../types';
import { downloadCycloneDXFile } from '../lib/cyclonedx';

interface DependencyTableProps {
  dependencies: Dependency[];
  project?: ProjectSite;
  isDemoMode?: boolean;
  isInstantMode?: boolean;
}

/**
 * Compares two version strings numerically segment by segment (e.g. "8.2.31" > "8.2.30")
 */
function compareVersionStrings(a: string, b: string): number {
  const cleanA = String(a || '').replace(/^[^0-9]*/, '');
  const cleanB = String(b || '').replace(/^[^0-9]*/, '');
  const partsA = cleanA.split(/[.-]/).map((n) => parseInt(n, 10));
  const partsB = cleanB.split(/[.-]/).map((n) => parseInt(n, 10));
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const valA = Number.isNaN(partsA[i]) ? 0 : partsA[i];
    const valB = Number.isNaN(partsB[i]) ? 0 : partsB[i];
    if (valA !== valB) return valA - valB;
  }
  return 0;
}

/**
 * Returns the highest fixedVersion required to resolve all vulnerabilities for a package
 */
function getHighestFixedVersion(vulns: Vulnerability[]): string {
  if (!vulns || vulns.length === 0) return '';
  let best = vulns[0].fixedVersion || '';
  for (let i = 1; i < vulns.length; i++) {
    const candidate = vulns[i].fixedVersion || '';
    if (!candidate) continue;
    if (!best || compareVersionStrings(candidate, best) > 0) {
      best = candidate;
    }
  }
  return best;
}

export const DependencyTable: React.FC<DependencyTableProps> = ({
  dependencies,
  project,
  isDemoMode = false,
  isInstantMode = false
}) => {
  const { t } = useTranslation();
  const [showCveHelp, setShowCveHelp] = useState(false);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});
  const helpBtnRef = useRef<HTMLButtonElement>(null);

  const toggleExpandPackage = (pkgKey: string) => {
    setExpandedPackages((prev) => ({
      ...prev,
      [pkgKey]: !prev[pkgKey]
    }));
  };

  const handleToggleCveHelp = () => {
    if (!showCveHelp && helpBtnRef.current) {
      const rect = helpBtnRef.current.getBoundingClientRect();
      const popupWidth = 340;
      const clampedLeft = Math.max(16, Math.min(rect.left - 120, window.innerWidth - popupWidth - 16));
      setPopupPos({
        top: rect.bottom + 8,
        left: clampedLeft
      });
    }
    setShowCveHelp((prev) => !prev);
  };

  const handleExport = () => {
    const targetProject: ProjectSite = project || {
      id: 'current-site',
      name: 'Site-Dependencies',
      url: 'https://example.com',
      ecosystem: dependencies[0]?.ecosystem || 'composer',
      syncMethod: 'actions',
      isVerified: true,
      verificationToken: '',
      currentWeather: 'sunny',
      lastScannedAt: new Date().toISOString(),
      daysUnresolved: 0,
      dependencies,
      forecast: []
    };
    downloadCycloneDXFile(targetProject);
  };

  return (
    <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900">{t('table.title')}</h3>
            {isInstantMode ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-300 text-[10px] font-bold tracking-wide uppercase">
                <Zap className="w-3 h-3 text-indigo-600" />
                <span>{t('demo.instantTableBadge')}</span>
              </span>
            ) : (
              isDemoMode && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold tracking-wide uppercase">
                  <Eye className="w-3 h-3 text-amber-600" />
                  <span>{t('demo.tableBadge')}</span>
                </span>
              )
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{t('table.detectedCount', { count: dependencies.length })}</p>
        </div>

        <button
          onClick={handleExport}
          title={t('table.exportCycloneDxTooltip')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-all active:scale-98 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" />
          <span>{t('table.exportCycloneDx')}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/60">
              <th className="py-3 px-4 rounded-l-lg">{t('table.packageName')}</th>
              <th className="py-3 px-4">{t('table.currentVersion')}</th>
              <th className="py-3 px-4">{t('table.status')}</th>
              <th className="py-3 px-4">
                <div className="inline-flex items-center gap-1.5">
                  <span>{t('table.cveIdentifier')}</span>
                  <button
                    ref={helpBtnRef}
                    type="button"
                    onClick={handleToggleCveHelp}
                    title={t('table.cveHelpTooltip')}
                    aria-label={t('table.cveHelpTooltip')}
                    className={`inline-flex items-center justify-center w-4 h-4 rounded-full transition-colors cursor-pointer ${
                      showCveHelp
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>
              <th className="py-3 px-4 rounded-r-lg">{t('table.recommendation')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {dependencies.map((dep, idx) => {
              const rowKey = `${dep.name}-${idx}`;
              const sortedVulns =
                dep.vulnerabilities.length > 1
                  ? [...dep.vulnerabilities].sort((a, b) => (b.cvss || 0) - (a.cvss || 0))
                  : dep.vulnerabilities;
              const hasVuln = sortedVulns.length > 0;
              const vuln = sortedVulns[0];
              const extraVulns = sortedVulns.slice(1);
              const isExpanded = !!expandedPackages[rowKey];
              const vulnTitle = vuln ? (vuln.titleKey ? t(vuln.titleKey as any) : vuln.title) : '';
              const recommendedFixedVer = hasVuln ? getHighestFixedVersion(sortedVulns) : '';
              const showDisplayName =
                dep.displayName && dep.displayName.toLowerCase() !== dep.name.toLowerCase();

              return (
                <tr key={rowKey} className="hover:bg-slate-50/80 transition-colors align-top">
                  <td className="py-3.5 px-4 text-slate-900 font-medium">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80 uppercase font-mono">
                        {dep.ecosystem}
                      </span>
                      <span className="font-semibold text-slate-800">{dep.name}</span>
                      {dep.active === false && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 font-sans">
                          {t('table.inactiveBadge')}
                        </span>
                      )}
                    </div>
                    {showDisplayName && (
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5 truncate max-w-xs">
                        {dep.displayName}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{dep.version}</td>
                  <td className="py-3.5 px-4 font-sans">
                    {hasVuln ? (
                      vuln.severity === 'CRITICAL' || vuln.severity === 'HIGH' || (vuln.cvss ?? 0) >= 7.0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{t('table.statusDanger', { severity: vuln.severity })}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t('table.statusWarning', { severity: vuln.severity })}</span>
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t('table.statusSafe')}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {hasVuln ? (
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-rose-600 font-bold">{vuln.id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
                            CVSS {vuln.cvss}
                          </span>
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(vuln.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t('table.searchCveTooltip', { id: vuln.id })}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 text-[10px] font-sans font-semibold shadow-2xs transition-colors"
                          >
                            <Search className="w-3 h-3" />
                            <span>{t('table.searchCve')}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </a>
                          {extraVulns.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleExpandPackage(rowKey)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-sans font-bold transition-colors cursor-pointer"
                            >
                              <span>
                                {isExpanded
                                  ? t('table.hideMoreCves')
                                  : t('table.moreCvesBadge', { count: extraVulns.length })}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-sans mt-0.5 max-w-xs truncate" title={vulnTitle}>
                          {vulnTitle}
                        </p>

                        {/* Expanded list of additional CVEs for this package */}
                        {isExpanded && extraVulns.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-2">
                            {extraVulns.map((extra) => {
                              const extraTitle = extra.titleKey ? t(extra.titleKey as any) : extra.title;
                              return (
                                <div
                                  key={extra.id}
                                  className="pl-2.5 border-l-2 border-rose-200 py-0.5"
                                >
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-rose-600 font-bold text-[11px]">{extra.id}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                                      CVSS {extra.cvss}
                                    </span>
                                    {extra.fixedVersion && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                        {`< ${extra.fixedVersion}`}
                                      </span>
                                    )}
                                    <a
                                      href={`https://www.google.com/search?q=${encodeURIComponent(extra.id)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={t('table.searchCveTooltip', { id: extra.id })}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 text-[10px] font-sans font-semibold transition-colors"
                                    >
                                      <Search className="w-2.5 h-2.5" />
                                      <span>{t('table.searchCve')}</span>
                                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                    </a>
                                  </div>
                                  <p
                                    className="text-[11px] text-slate-500 font-sans mt-0.5 max-w-xs truncate"
                                    title={extraTitle}
                                  >
                                    {extraTitle}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-sans">{t('table.noVulnDash')}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-xs">
                    {hasVuln ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-medium">
                          {t('table.updateTo', { version: recommendedFixedVer || vuln.fixedVersion })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-600 font-medium">{t('table.upToDate')}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCveHelp && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowCveHelp(false)}
          />
          <div
            style={{ top: `${popupPos.top}px`, left: `${popupPos.left}px` }}
            className="fixed z-50 w-85 max-w-[calc(100vw-2rem)] rounded-xl bg-white border border-slate-200 shadow-xl p-4 text-left font-sans animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{t('table.cveHelpTitle')}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCveHelp(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <p className="font-bold text-rose-700 mb-0.5">{t('table.cveHelpCveTitle')}</p>
                <p className="text-slate-600">{t('table.cveHelpCveDesc')}</p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-800 mb-0.5">{t('table.cveHelpCvssTitle')}</p>
                <p className="text-slate-600">{t('table.cveHelpCvssDesc')}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
