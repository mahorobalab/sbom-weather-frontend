import React from 'react';
import { useTranslation } from 'react-i18next';
import { History, Sparkles, CheckCircle2 } from 'lucide-react';
import type { ProjectSite } from '../types';

interface PluginHistoryManagementProps {
  site: ProjectSite;
}

export const PluginHistoryManagement: React.FC<PluginHistoryManagementProps> = ({ site }) => {
  const { t } = useTranslation();
  const siteDisplayName = site.nameKey ? t(site.nameKey as any) : site.name;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            {siteDisplayName}
          </span>
          <span className="text-xs text-slate-400 font-mono">{site.url}</span>
        </div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          <span>{t('pluginHistory.title')}</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          {t('pluginHistory.description')}
        </p>
      </div>

      {/* Coming Soon / Roadmap Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <Sparkles className="w-7 h-7 text-indigo-500" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-3">
          {t('pluginHistory.underDevelopmentBadge')}
        </span>

        <h4 className="text-base font-extrabold text-slate-900 mb-2">
          {t('pluginHistory.roadmapTitle')}
        </h4>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed mb-6">
          {t('pluginHistory.roadmapDesc')}
        </p>

        <div className="max-w-md mx-auto text-left space-y-2 bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('pluginHistory.featSnapshot')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('pluginHistory.featDiffTracking')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('pluginHistory.featWeatherCorrelation')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

