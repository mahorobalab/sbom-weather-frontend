import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Dependency } from '../types';

interface DependencyTableProps {
  dependencies: Dependency[];
}

export const DependencyTable: React.FC<DependencyTableProps> = ({ dependencies }) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">{t('table.title')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('table.detectedCount', { count: dependencies.length })}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/60">
              <th className="py-3 px-4 rounded-l-lg">{t('table.packageName')}</th>
              <th className="py-3 px-4">{t('table.currentVersion')}</th>
              <th className="py-3 px-4">{t('table.status')}</th>
              <th className="py-3 px-4">{t('table.cveIdentifier')}</th>
              <th className="py-3 px-4 rounded-r-lg">{t('table.recommendation')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {dependencies.map((dep, idx) => {
              const hasVuln = dep.vulnerabilities.length > 0;
              const vuln = dep.vulnerabilities[0];
              const vulnTitle = vuln ? (vuln.titleKey ? t(vuln.titleKey as any) : vuln.title) : '';

              return (
                <tr key={`${dep.name}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-slate-900 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80 uppercase font-mono">
                        {dep.ecosystem}
                      </span>
                      <span className="font-semibold text-slate-800">{dep.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{dep.version}</td>
                  <td className="py-3.5 px-4 font-sans">
                    {hasVuln ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{t('table.statusDanger', { severity: vuln.severity })}</span>
                      </span>
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
                        <div className="flex items-center gap-2">
                          <span className="text-rose-600 font-bold">{vuln.id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
                            CVSS {vuln.cvss}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-sans mt-0.5 max-w-xs truncate" title={vulnTitle}>
                          {vulnTitle}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-sans">{t('table.noVulnDash')}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-xs">
                    {hasVuln ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-medium">
                          {t('table.updateTo', { version: vuln.fixedVersion })}
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
    </div>
  );
};
