import React, { useState } from 'react';
import { Globe, Plus, ShieldCheck, AlertCircle, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProjectSite } from '../types';

interface SiteManagementProps {
  sites: ProjectSite[];
  onAddSite: (site: Partial<ProjectSite>) => void;
}

export const SiteManagement: React.FC<SiteManagementProps> = ({ sites, onAddSite }) => {
  const { t } = useTranslation();
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
      lastScannedAt: t('dashboard.unscanned'),
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
    <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{t('sites.title')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('sites.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('sites.addNewSite')}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 p-5 rounded-xl bg-slate-50 border border-indigo-200 text-sm">
          <h4 className="font-bold text-slate-900 mb-3">{t('sites.registerNewSite')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('sites.siteNameLabel')}</label>
              <input
                type="text"
                placeholder={t('sites.siteNamePlaceholder')}
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('sites.siteUrlLabel')}</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('sites.envTypeLabel')}</label>
              <select
                value={ecosystem}
                onChange={(e: any) => setEcosystem(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="wordpress">{t('sites.envWp')}</option>
                <option value="composer">{t('sites.envComposer')}</option>
                <option value="npm">{t('sites.envNpm')}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              {t('sites.submitRegister')}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {sites.map((site) => {
          const displayName = site.nameKey ? t(site.nameKey as any) : site.name;
          return (
            <div key={site.id} className="p-4 rounded-xl bg-white border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{displayName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono uppercase">
                      {site.ecosystem}
                    </span>
                    {site.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {t('sites.ownershipVerified')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        {t('sites.ownershipRequired')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{site.url}</div>
                </div>
              </div>

              {/* Ownership verification code block */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-mono max-w-xs truncate" title={`<meta name="sbom-weather-verification" content="${site.verificationToken}">`}>
                  {`<meta name="sbom-weather-verification" content="${site.verificationToken}">`}
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `<meta name="sbom-weather-verification" content="${site.verificationToken}">`,
                      site.id
                    )
                  }
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 shadow-2xs cursor-pointer"
                  title={t('sites.copyMetaTagTitle')}
                >
                  {copiedId === site.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedId === site.id ? t('common.copied') : t('common.copy')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
