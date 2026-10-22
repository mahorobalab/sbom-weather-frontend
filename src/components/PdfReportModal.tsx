import React from 'react';
import { X, Printer, ShieldAlert, CheckCircle2, FileText } from 'lucide-react';
import type { ProjectSite } from '../types';

interface PdfReportModalProps {
  project: ProjectSite;
  onClose: () => void;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({ project, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const vulnerabilities = project.dependencies.flatMap((d) => d.vulnerabilities);
  const isDanger = vulnerabilities.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">相談用 A4 脆弱性診断報告書プレビュー</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>印刷 / PDFとして保存</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet (Simulating A4 Report) */}
        <div className="p-8 md:p-10 bg-white text-slate-900 print:p-0 print:m-0 font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                SBOM Ninja Security Assessment Report
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">ソフトウェア部品・脆弱性診断報告書</h1>
              <p className="text-xs text-slate-500 mt-0.5">※外部保守ベンダー・開発会社への改修相談・見積もり提示用資料</p>
            </div>
            <div className="text-right text-xs text-slate-600 font-mono">
              <div>診断発行日: {new Date().toLocaleDateString('ja-JP')}</div>
              <div>対象サイト: {project.name}</div>
              <div className="text-indigo-600 font-semibold">{project.url}</div>
            </div>
          </div>

          {/* Status Banner */}
          <div className={`p-4 rounded-xl border mb-6 ${
            isDanger ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-center gap-3">
              {isDanger ? (
                <ShieldAlert className="w-8 h-8 text-rose-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-base">
                  総合判定: {isDanger ? `要緊急対応（検出脆弱性 ${vulnerabilities.length} 件）` : '安全稼働（既知脆弱性 0件）'}
                </h4>
                <p className="text-xs mt-0.5 leading-relaxed">
                  {isDanger
                    ? '2026/10/21公開のPHP重大脆弱性等、早急なパッチ適用を要する脆弱性が検出されています。'
                    : '現時点で主要な既知の脆弱性は検知されていません。定期的な監視を継続してください。'}
                </p>
              </div>
            </div>
          </div>

          {/* Vulnerability Details */}
          {isDanger && (
            <div className="mb-6">
              <h4 className="text-sm font-bold border-b border-slate-200 pb-2 mb-3 text-slate-800">
                ■ 検出された重大脆弱性一覧
              </h4>
              <div className="space-y-3">
                {vulnerabilities.map((v) => (
                  <div key={v.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-rose-700 text-sm font-mono">{v.id}</span>
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold font-mono">
                        CVSS {v.cvss} ({v.severity})
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 mb-1">{v.title}</div>
                    <p className="text-slate-600 leading-relaxed mb-2">{v.description}</p>
                    <div className="flex flex-wrap gap-4 text-[11px] font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                      <div>対象パッケージ: <strong>{v.packageName}</strong></div>
                      <div>現在バージョン: <span className="text-rose-600">{v.affectedVersion}</span></div>
                      <div>推奨修正版: <strong className="text-indigo-600">{v.fixedVersion}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advice for Vendors */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-700 mb-6">
            <h5 className="font-bold text-slate-900 mb-1">■ 相談先・保守ベンダー様への依頼事項</h5>
            <p className="leading-relaxed">
              本報告書は、SBOM Ninja エッジ監視エンジンによって自動生成された一次診断結果です。
              上記パッケージの対象バージョンへのアップデート可否（デグレード・後方互換性テスト）の検証および、安全なパッチ適用作業のお見積もり・スケジュール調整をご依頼申し上げます。
            </p>
          </div>

          {/* Footer & Disclaimer */}
          <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-400 flex justify-between items-center">
            <div>Generated by SBOM Ninja (https://sbom-ninja.com)</div>
            <div>※本診断結果は公開脆弱性情報に基づくものであり、完全性を保証するものではありません。</div>
          </div>
        </div>
      </div>
    </div>
  );
};
