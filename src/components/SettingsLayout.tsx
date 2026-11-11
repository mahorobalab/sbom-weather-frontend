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
  CheckCircle2,
  Share2,
  History,
  Bell
} from 'lucide-react';
import { PLAN_CONFIGS, type ProjectSite, type TeamMember, type PlanTier, type SiteMonitorShare } from '../types';
import { SiteManagement } from './SiteManagement';
import { UserManagement } from './UserManagement';
import { IntegrationGuideModal } from './IntegrationGuideModal';
import { SiteSharesManagement } from './SiteSharesManagement';
import { PluginHistoryManagement } from './PluginHistoryManagement';
import { SiteNotificationManagement } from './SiteNotificationManagement';

export type SettingsTab = 'sites' | 'users' | 'billing' | 'integrations';
export type SiteSubTab = 'shares' | 'notifications' | 'history';

interface SettingsLayoutProps {
  currentSite?: ProjectSite;
  sites: ProjectSite[];
  members: TeamMember[];
  currentPlan: PlanTier;
  activeTab?: SettingsTab;
  onSelectTab?: (tab: SettingsTab) => void;
  onBackToDashboard: () => void;
  onAddSite: (site: Partial<ProjectSite>) => void;
  onVerifySite: (siteId: string) => void;
  onRenameSite: (siteId: string, newName: string) => void;
  onDeleteSite: (siteId: string) => void;
  onAddMember: (member: Partial<TeamMember>) => void;
  onRemoveMember: (id: string) => void;
  onOpenUpgradeModal: (reason: 'site_limit' | 'feature_locked' | null) => void;
  // Site Monitor Shares
  shares?: SiteMonitorShare[];
  onAddShare?: (share: Omit<SiteMonitorShare, 'id' | 'createdAt' | 'viewCount'>) => void;
  onDeleteShare?: (shareId: string) => void;
  currentUserUid?: string;
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
  onRenameSite,
  onDeleteSite,
  onAddMember,
  onRemoveMember,
  onOpenUpgradeModal,
  shares = [],
  onAddShare,
  onDeleteShare,
  currentUserUid
}) => {
  const { t } = useTranslation();
  const [internalTab, setInternalTab] = useState<SettingsTab>('sites');
  const [configuredSiteId, setConfiguredSiteId] = useState<string | null>(null);
  const [siteSubTab, setSiteSubTab] = useState<SiteSubTab>('shares');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const activeTab = propActiveTab || internalTab;

  const handleSelectTab = (tab: SettingsTab) => {
    setInternalTab(tab);
    onSelectTab?.(tab);
  };

  const configuredSite = sites.find((s) => s.id === configuredSiteId) || null;

  const handleConfigureSite = (site: ProjectSite) => {
    setConfiguredSiteId(site.id);
    setSiteSubTab('shares');
    if (activeTab !== 'sites') {
      handleSelectTab('sites');
    }
  };

  const planConfig = PLAN_CONFIGS[currentPlan];
  const maxSites = planConfig.maxSites;
  const isSiteLimitReached = sites.length >= maxSites;

  // Filter shares for current configured site
  const currentSiteShares = shares.filter((sh) => sh.siteId === configuredSiteId);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Cloudflare / Vercel style left navigation sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
        {/* Back to dashboard link */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onBackToDashboard();
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-all cursor-pointer mb-2 no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('settings.backToDashboard')}</span>
        </a>

        <div className="px-3 pt-2 pb-2.5 border-t border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">{t('settings.title')}</h2>
          <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
            {configuredSite
              ? (configuredSite.nameKey ? t(configuredSite.nameKey as any) : configuredSite.name)
              : currentSite
              ? currentSite.name
              : t('sites.noSitesShort')}
          </p>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="space-y-1">
          {/* Site Management Parent Nav Item */}
          <div>
            <a
              href="/config/sites"
              onClick={(e) => {
                e.preventDefault();
                handleSelectTab('sites');
                if (configuredSite) {
                  // If already inside configured site, clicking parent returns to all sites list
                  setConfiguredSiteId(null);
                }
              }}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer no-underline ${
                activeTab === 'sites' && !configuredSite
                  ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-2xs border border-indigo-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Server
                  className={`w-4 h-4 ${
                    activeTab === 'sites' && !configuredSite ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span>{t('settings.navSites')}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-100">
                {sites.length}
              </span>
            </a>

            {/* Tree Branch when a site is selected for configuration */}
            {configuredSite && activeTab === 'sites' && (
              <div className="ml-3 pl-3 border-l-2 border-indigo-100 space-y-1 my-1.5 animate-in fade-in duration-150">
                {/* Selected Site Label */}
                <div className="px-2 py-1 text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                    <span className="truncate">
                      {configuredSite.nameKey ? t(configuredSite.nameKey as any) : configuredSite.name}
                    </span>
                  </div>
                </div>

                {/* Submenu 1: Monitor View Publishing */}
                <button
                  type="button"
                  onClick={() => setSiteSubTab('shares')}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer text-left ${
                    siteSubTab === 'shares'
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/70 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Share2 className={`w-3.5 h-3.5 ${siteSubTab === 'shares' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{t('shares.navItem')}</span>
                </button>

                {/* Submenu 2: Notification Settings */}
                <button
                  type="button"
                  onClick={() => setSiteSubTab('notifications')}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer text-left ${
                    siteSubTab === 'notifications'
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/70 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Bell className={`w-3.5 h-3.5 ${siteSubTab === 'notifications' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{t('notifications.navItem')}</span>
                </button>

                {/* Submenu 3: Plugin History */}
                <button
                  type="button"
                  onClick={() => setSiteSubTab('history')}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer text-left ${
                    siteSubTab === 'history'
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/70 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <History className={`w-3.5 h-3.5 ${siteSubTab === 'history' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{t('pluginHistory.navItem')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Team & Members */}
          <a
            href="/config/users"
            onClick={(e) => {
              e.preventDefault();
              handleSelectTab('users');
            }}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer no-underline ${
              activeTab === 'users'
                ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-2xs border border-indigo-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'users' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>{t('settings.navUsers')}</span>
          </a>

          {/* Billing & Plans */}
          <a
            href="/config/billing"
            onClick={(e) => {
              e.preventDefault();
              handleSelectTab('billing');
            }}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer no-underline ${
              activeTab === 'billing'
                ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-2xs border border-indigo-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CreditCard className={`w-4 h-4 ${activeTab === 'billing' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>{t('settings.navBilling')}</span>
          </a>

          {/* Integrations */}
          <a
            href="/config/integrations"
            onClick={(e) => {
              e.preventDefault();
              handleSelectTab('integrations');
            }}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer no-underline ${
              activeTab === 'integrations'
                ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-2xs border border-indigo-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Puzzle className={`w-4 h-4 ${activeTab === 'integrations' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>{t('settings.navIntegrations')}</span>
          </a>
        </nav>
      </aside>

      {/* Main content pane */}
      <div className="flex-1 w-full min-w-0">
        {activeTab === 'sites' && (
          configuredSite ? (
            siteSubTab === 'shares' ? (
              <SiteSharesManagement
                site={configuredSite}
                shares={currentSiteShares}
                onAddShare={onAddShare || (() => {})}
                onDeleteShare={onDeleteShare || (() => {})}
                currentUserUid={currentUserUid}
              />
            ) : siteSubTab === 'notifications' ? (
              <SiteNotificationManagement site={configuredSite} />
            ) : (
              <PluginHistoryManagement site={configuredSite} />
            )
          ) : (
            <SiteManagement
              sites={sites}
              onAddSite={onAddSite}
              onVerifySite={onVerifySite}
              onRenameSite={onRenameSite}
              onDeleteSite={onDeleteSite}
              onConfigureSite={handleConfigureSite}
              currentPlan={currentPlan}
              onOpenUpgradeModal={onOpenUpgradeModal}
            />
          )
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
          site={currentSite || null}
        />
      )}
    </div>
  );
};
