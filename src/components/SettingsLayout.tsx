import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Server,
  Users,
  CreditCard,
  Puzzle,
  Sparkles,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { PLAN_CONFIGS, type ProjectSite, type TeamMember, type PlanTier } from '../types';
import { SiteManagement } from './SiteManagement';
import { UserManagement } from './UserManagement';
import { IntegrationGuideModal } from './IntegrationGuideModal';

export type SettingsTab = 'sites' | 'users' | 'billing' | 'integrations';

interface SettingsLayoutProps {
  currentSite: ProjectSite;
  sites: ProjectSite[];
  members: TeamMember[];
  currentPlan: PlanTier;
  activeTab?: SettingsTab;
  onSelectTab?: (tab: SettingsTab) => void;
  onBackToDashboard: () => void;
  onAddSite: (site: Partial<ProjectSite>) => void;
  onVerifySite: (siteId: string) => void;
  onAddMember: (member: Partial<TeamMember>) => void;
  onRemoveMember: (id: string) => void;
  onOpenUpgradeModal: (reason: 'site_limit' | 'feature_locked' | null) => void;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  currentSite,
  sites,
  members,
  currentPlan,
  activeTab: propActiveTab,
  onSelectTab,
  onBackToDashboard,
  onAddSite,
  onVerifySite,
  onAddMember,
  onRemoveMember,
  onOpenUpgradeModal
}) => {
  const { t } = useTranslation();
  const [internalTab, setInternalTab] = useState<SettingsTab>('sites');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const activeTab = propActiveTab || internalTab;

  const handleSelectTab = (tab: SettingsTab) => {
    setInternalTab(tab);
    onSelectTab?.(tab);
  };

  const planConfig = PLAN_CONFIGS[currentPlan];
  const maxSites = planConfig.maxSites;
  const isSiteLimitReached = sites.length >= maxSites;

  const navItems = [
    { id: 'sites' as SettingsTab, label: t('settings.navSites'), icon: Server },
    { id: 'users' as SettingsTab, label: t('settings.navUsers'), icon: Users },
    { id: 'billing' as SettingsTab, label: t('settings.navBilling'), icon: CreditCard },
    { id: 'integrations' as SettingsTab, label: t('settings.navIntegrations'), icon: Puzzle }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Cloudflare / Vercel style left navigation sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
        {/* Back to dashboard button */}
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-all cursor-pointer mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('settings.backToDashboard')}</span>
        </button>

        <div className="px-3 pt-2 pb-2.5 border-t border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">{t('settings.title')}</h2>
          <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{currentSite.name}</p>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-2xs border border-indigo-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content pane */}
      <div className="flex-1 w-full min-w-0">
        {activeTab === 'sites' && (
          <SiteManagement
            sites={sites}
            onAddSite={onAddSite}
            onVerifySite={onVerifySite}
            currentPlan={currentPlan}
            onOpenUpgradeModal={onOpenUpgradeModal}
          />
        )}

        {activeTab === 'users' && (
          <UserManagement
            members={members}
            onAddMember={onAddMember}
            onRemoveMember={onRemoveMember}
          />
        )}

        {activeTab === 'billing' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">{t('settings.billing.title')}</h3>
              <p className="text-xs text-slate-500 mt-1">{t('settings.billing.description')}</p>
            </div>

            {/* Plan Tier Status Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 p-5 bg-gradient-to-br from-slate-50 to-white flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {t('settings.billing.currentPlan')}
                  </div>
                  <div className="flex items-center gap-2.5 mt-2">
                    <span className="text-2xl font-black text-slate-900">
                      {t(planConfig.nameKey as any)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                      {planConfig.priceMonthly === 0 ? 'Free' : `¥${planConfig.priceMonthly.toLocaleString()}/mo`}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => onOpenUpgradeModal(null)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('settings.billing.changePlan')}</span>
                  </button>
                </div>
              </div>

              {/* Site Quota Progress Card */}
              <div className="rounded-xl border border-slate-200 p-5 bg-white flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {t('settings.billing.siteQuota')}
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {t('settings.billing.siteQuotaDetail', { used: sites.length, max: maxSites })}
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isSiteLimitReached ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, (sites.length / maxSites) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 text-[11px] text-slate-500">
                  {isSiteLimitReached
                    ? t('pricing.siteLimitReachedDesc', { count: maxSites })
                    : t('pricing.guaranteeNote')}
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                {t('settings.billing.featuresIncluded', { plan: t(planConfig.nameKey as any) })}
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {planConfig.featuresKeys.map((k: string) => (
                  <li key={k} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{t(k as any)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">{t('settings.integrations.title')}</h3>
              <p className="text-xs text-slate-500 mt-1">{t('settings.integrations.description')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* GitHub Actions Card */}
              <div className="rounded-xl border border-slate-200 p-5 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-900">{t('settings.integrations.githubTitle')}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-medium border border-emerald-200">
                      {t('settings.integrations.statusConnected')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('settings.integrations.githubDesc')}
                  </p>
                </div>
                <div className="mt-5">
                  <button
                    onClick={() => setIsGuideOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{t('settings.integrations.openGuide')}</span>
                  </button>
                </div>
              </div>

              {/* WordPress Plugin Card */}
              <div className="rounded-xl border border-slate-200 p-5 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-900">{t('settings.integrations.wpTitle')}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-medium border border-emerald-200">
                      {t('settings.integrations.statusConnected')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('settings.integrations.wpDesc')}
                  </p>
                </div>
                <div className="mt-5">
                  <button
                    onClick={() => setIsGuideOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{t('settings.integrations.openGuide')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integration Guide Modal */}
      {isGuideOpen && (
        <IntegrationGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          site={currentSite}
        />
      )}
    </div>
  );
};
