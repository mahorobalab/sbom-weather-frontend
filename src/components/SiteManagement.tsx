import React, { useState } from 'react';
import { Globe, Plus, ShieldCheck, AlertCircle, Copy, Check } from 'lucide-react';
import type { ProjectSite } from '../types';

interface SiteManagementProps {
  sites: ProjectSite[];
  onAddSite: (site: Partial<ProjectSite>) => void;
}

export const SiteManagement: React.FC<SiteManagementProps> = ({ sites, onAddSite }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [ecosystem, setEcosystem] = useState<'composer' | 'npm' | 'wordpress'>('wordpress');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || !siteUrl) return;

    const token = `ninja-site-verification=${Math.random().toString(36).substring(2, 14)}`;
    onAddSite({
      name: siteName,
      url: siteUrl,
      ecosystem,
      syncMethod: ecosystem === 'wordpress' ? 'wp_plugin' : 'actions',
      isVerified: false,
      verificationToken: token,
      currentWeather: 'sunny',
      lastScannedAt: '未スキャン',
      daysUnresolved: 0,
      dependencies: [],
      forecast: []
    });

    setSiteName('');
    setSiteUrl('');
    setIsAdding(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-2xl glass-panel p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">監視対象サイト管理</h3>
          <p className="text-xs text-slate-400">現在登録中のサイト一覧およびサーバー所有権の確認状態</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>新しいサイトを追加</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 text-sm">
          <h4 className="font-semibold text-white mb-3">新しい監視対象サイトの登録</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">サイト表示名</label>
              <input
                type="text"
                placeholder="例: コーポレートサイト"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">サイトURL</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">技術環境 / 連携種別</label>
              <select
                value={ecosystem}
                onChange={(e: any) => setEcosystem(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="wordpress">WordPress (専用プラグイン / 外部スキャン)</option>
                <option value="composer">PHP (Composer / GitHub Actions)</option>
                <option value="npm">Node.js (npm / GitHub Actions)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
            >
              登録して認証タグを発行
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {sites.map((site) => (
          <div key={site.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-sm">{site.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                    {site.ecosystem}
                  </span>
                  {site.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      所有権確認済
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      所有権の確認が必要
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{site.url}</div>
              </div>
            </div>

            {/* 所有権確認用コード */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono max-w-xs truncate">
                {`<meta name="sbom-ninja-verification" content="${site.verificationToken}">`}
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    `<meta name="sbom-ninja-verification" content="${site.verificationToken}">`,
                    site.id
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
                title="所有権確認用タグをコピー"
              >
                {copiedId === site.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>コピー</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
