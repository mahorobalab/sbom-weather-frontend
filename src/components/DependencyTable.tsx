import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import type { Dependency } from '../types';

interface DependencyTableProps {
  dependencies: Dependency[];
}

export const DependencyTable: React.FC<DependencyTableProps> = ({ dependencies }) => {
  return (
    <div className="rounded-2xl glass-panel p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">構成パッケージ & 脆弱性診断結果</h3>
          <p className="text-xs text-slate-400">検出されたパッケージ数: {dependencies.length} 件</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-400">
              <th className="pb-3 font-medium">パッケージ名</th>
              <th className="pb-3 font-medium">現在バージョン</th>
              <th className="pb-3 font-medium">ステータス</th>
              <th className="pb-3 font-medium">CVE識別子 / CVSS</th>
              <th className="pb-3 font-medium">推奨対応・安全版</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {dependencies.map((dep, idx) => {
              const hasVuln = dep.vulnerabilities.length > 0;
              const vuln = dep.vulnerabilities[0];

              return (
                <tr key={`${dep.name}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 pr-4 text-white font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {dep.ecosystem}
                      </span>
                      <span>{dep.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-slate-300">{dep.version}</td>
                  <td className="py-3.5 pr-4">
                    {hasVuln ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>危険 ({vuln.severity})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>安全</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4">
                    {hasVuln ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-400 font-bold">{vuln.id}</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                            CVSS {vuln.cvss}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-xs truncate" title={vuln.title}>
                          {vuln.title}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs font-sans">—</span>
                    )}
                  </td>
                  <td className="py-3.5 text-xs font-sans">
                    {hasVuln ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                          {vuln.fixedVersion} へ更新
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-400">最新またはパッチ適用済</span>
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
