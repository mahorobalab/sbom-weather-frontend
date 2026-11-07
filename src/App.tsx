import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from './components/Navbar';
import { WeatherBanner } from './components/WeatherBanner';
import { WeeklyForecast } from './components/WeeklyForecast';
import { DropZone } from './components/DropZone';
import { DependencyTable } from './components/DependencyTable';
import { SettingsLayout, type SettingsTab } from './components/SettingsLayout';
import { PdfReportModal } from './components/PdfReportModal';
import { PricingModal } from './components/PricingModal';
import { LoginModal, GoogleIcon, MicrosoftIcon } from './components/LoginModal';
import { INITIAL_PROJECTS, INITIAL_MEMBERS, applyDynamic7DayDates } from './mockData';
import { useAuth } from './contexts/AuthContext';
import type { ProjectSite, TeamMember, Dependency, WeatherStatus, PlanTier, DayForecast } from './types';
import { RefreshCw, Eye } from 'lucide-react';

const STORAGE_KEY_SITES = 'sbom_weather_sites_v1';
const STORAGE_KEY_CURRENT_SITE = 'sbom_weather_current_site_id_v1';
const STORAGE_KEY_PLAN = 'sbom_weather_plan_v1';
const API_BASE_URL = 'http://localhost:8787';

const buildDefaultForecast = (weather: WeatherStatus = 'sunny', vulnCount: number = 0): DayForecast[] =>
  applyDynamic7DayDates([
    { date: '', dayLabel: '', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
    { date: '', dayLabel: '', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
    { date: '', dayLabel: '', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
    { date: '', dayLabel: '', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
    { date: '', dayLabel: '', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
    { date: '', dayLabel: '', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
    {
      date: '',
      dayLabel: '',
      weather,
      summary: vulnCount > 0 ? 'Vulnerability detected' : 'Registration complete: Clear skies',
      summaryKey: vulnCount > 0 ? 'forecast.summaries.stormAlert' : 'forecast.summaries.registered',
      vulnerabilityCount: vulnCount
    }
  ]);

const loadInitialSites = (): ProjectSite[] => {
  if (typeof window === 'undefined') return INITIAL_PROJECTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SITES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((site: ProjectSite) => ({
          ...site,
          forecast: applyDynamic7DayDates(
            site.forecast?.length ? site.forecast : buildDefaultForecast(site.currentWeather, 0)
          )
        }));
      }
    }
  } catch {
    // ignore storage read error
  }
  return INITIAL_PROJECTS;
};

const loadInitialSiteId = (initialSites: ProjectSite[]): string => {
  if (typeof window === 'undefined') return initialSites[0].id;
  try {
    const savedId = window.localStorage.getItem(STORAGE_KEY_CURRENT_SITE);
    if (savedId && initialSites.some((s) => s.id === savedId)) {
      return savedId;
    }
  } catch {
    // ignore storage read error
  }
  return initialSites[0].id;
};

// Parse URL path for initial view and settings subtab
const parseUrlPath = (): { view: 'dashboard' | 'settings'; tab: SettingsTab } => {
  if (typeof window === 'undefined') {
    return { view: 'dashboard', tab: 'sites' };
  }
  const path = window.location.pathname;
  if (path.startsWith('/config') || path.startsWith('/settings')) {
    if (path.includes('/users') || path.includes('/team')) return { view: 'settings', tab: 'users' };
    if (path.includes('/billing') || path.includes('/plan')) return { view: 'settings', tab: 'billing' };
    if (path.includes('/integrations')) return { view: 'settings', tab: 'integrations' };
    return { view: 'settings', tab: 'sites' };
  }
  return { view: 'dashboard', tab: 'sites' };
};

export default function App() {
  const { t } = useTranslation();
  const { currentUser, signInWithGoogle, signInWithMicrosoft } = useAuth();
  const isDemoMode = !currentUser;

  // Authenticated user's sites and selected site ID
  const [userSites, setUserSites] = useState<ProjectSite[]>(loadInitialSites);
  const [userSiteId, setUserSiteId] = useState<string>(() => loadInitialSiteId(loadInitialSites()));

  // Logged-out interactive Demo sites and selected demo site ID
  const [demoSites, setDemoSites] = useState<ProjectSite[]>(() =>
    INITIAL_PROJECTS.map((s) => ({
      ...s,
      forecast: applyDynamic7DayDates(s.forecast)
    }))
  );
  const [demoSiteId, setDemoSiteId] = useState<string>(INITIAL_PROJECTS[0].id);

  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>(() => parseUrlPath().view);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(() => parseUrlPath().tab);
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalErrorCode, setLoginModalErrorCode] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<PlanTier>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_KEY_PLAN) as PlanTier | null;
      if (saved === 'free' || saved === 'basic' || saved === 'pro') return saved;
    }
    return 'free';
  });
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [upgradeReason, setUpgradeReason] = useState<'site_limit' | 'feature_locked' | null>(null);

  const buildUserHeaders = useCallback((): Record<string, string> => {
    if (!currentUser) return {};
    const primaryEmail = currentUser.email || currentUser.providerData?.[0]?.email || '';
    const primaryName = currentUser.displayName || currentUser.providerData?.[0]?.displayName || '';
    const primaryPhoto = currentUser.photoURL || currentUser.providerData?.[0]?.photoURL || '';
    return {
      'X-User-Uid': currentUser.uid,
      'X-User-Email': primaryEmail,
      'X-User-Name': encodeURIComponent(primaryName),
      'X-User-Photo': primaryPhoto
    };
  }, [currentUser]);

  // When user logs out, automatically return to the landing demo dashboard view
  useEffect(() => {
    if (!currentUser && currentView === 'settings') {
      setCurrentView('dashboard');
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.history.pushState({ view: 'dashboard', tab: settingsTab }, '', '/');
      }
    }
  }, [currentUser, currentView, settingsTab]);

  // Persist userSites to localStorage whenever updated
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_SITES, JSON.stringify(userSites));
    } catch {
      // ignore storage write error
    }
  }, [userSites]);

  // Persist selected userSiteId to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_CURRENT_SITE, userSiteId);
    } catch {
      // ignore storage write error
    }
  }, [userSiteId]);

  // Fetch & merge persisted sites and team members from Cloudflare D1 (APP_DB) when logged in
  const syncSitesFromBackend = useCallback(async () => {
    if (!currentUser) return;
    const authHeaders = buildUserHeaders();

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sites`, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sites) && data.sites.length > 0) {
          setUserSites((prevSites) => {
            const merged = [...prevSites];
            for (const remoteSite of data.sites) {
              const vulnCount = (remoteSite.dependencies || []).reduce(
                (sum: number, d: Dependency) => sum + (d.vulnerabilities?.length || 0),
                0
              );
              const idx = merged.findIndex((s) => s.id === remoteSite.id);
              if (idx !== -1) {
                const existing = merged[idx];
                const hasRemoteDeps = Array.isArray(remoteSite.dependencies) && remoteSite.dependencies.length > 0;
                const weather = (remoteSite.currentWeather || existing.currentWeather) as WeatherStatus;
                const updatedForecast = applyDynamic7DayDates(
                  existing.forecast?.length ? existing.forecast : buildDefaultForecast(weather, vulnCount)
                ).map((f, fIdx, arr) =>
                  fIdx === arr.length - 1
                    ? {
                        ...f,
                        weather,
                        vulnerabilityCount: vulnCount,
                        summaryKey: vulnCount > 0 ? 'forecast.summaries.stormAlert' : 'forecast.summaries.cleanSystem'
                      }
                    : f
                );

                merged[idx] = {
                  ...existing,
                  currentWeather: weather,
                  lastScannedAt: hasRemoteDeps ? remoteSite.lastScannedAt : existing.lastScannedAt,
                  daysUnresolved: remoteSite.daysUnresolved ?? existing.daysUnresolved,
                  dependencies: hasRemoteDeps ? remoteSite.dependencies : existing.dependencies,
                  forecast: updatedForecast
                };
              } else {
                const weather = (remoteSite.currentWeather || 'sunny') as WeatherStatus;
                merged.unshift({
                  id: remoteSite.id,
                  name: remoteSite.name || remoteSite.id,
                  url: remoteSite.url || 'http://localhost',
                  ecosystem: remoteSite.ecosystem || 'wordpress',
                  syncMethod: remoteSite.syncMethod || 'wp_plugin',
                  isVerified: Boolean(remoteSite.isVerified),
                  verificationToken: remoteSite.verificationToken || `sbw_live_${remoteSite.id}`,
                  currentWeather: weather,
                  lastScannedAt: remoteSite.lastScannedAt || t('dashboard.unscanned'),
                  daysUnresolved: remoteSite.daysUnresolved || 0,
                  dependencies: remoteSite.dependencies || [],
                  forecast: buildDefaultForecast(weather, vulnCount)
                });
              }
            }
            return merged;
          });
        }
      }

      // Fetch team members for this logged-in user
      const teamRes = await fetch(`${API_BASE_URL}/api/v1/team`, {
        headers: authHeaders
      });
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (teamData.success && Array.isArray(teamData.members) && teamData.members.length > 0) {
          setMembers(teamData.members);
        }
      }
    } catch {
      // Backend might be offline; keep localStorage sites intact
    }
  }, [currentUser, buildUserHeaders, t]);

  useEffect(() => {
    syncSitesFromBackend();
  }, [syncSitesFromBackend]);

  // Sync state on browser back / forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrlPath();
      setCurrentView(parsed.view);
      setSettingsTab(parsed.tab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: 'dashboard' | 'settings', tab: SettingsTab = settingsTab) => {
    if (view === 'settings' && !currentUser) {
      setIsLoginModalOpen(true);
      return;
    }
    setCurrentView(view);
    setSettingsTab(tab);
    const targetUrl = view === 'settings' ? `/config/${tab}` : '/';
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ view, tab }, '', targetUrl);
    }
  };

  const handleQuickProviderSignIn = async (provider: 'google' | 'microsoft') => {
    try {
      setLoginModalErrorCode(null);
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithMicrosoft();
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      setLoginModalErrorCode(code || 'unknown');
      setIsLoginModalOpen(true);
    }
  };

  const handleOpenUpgradeModal = (reason: 'site_limit' | 'feature_locked' | null = null) => {
    setUpgradeReason(reason);
    setIsPricingModalOpen(true);
  };

  const handleSelectPlan = (tier: PlanTier) => {
    setCurrentPlan(tier);
    try {
      window.localStorage.setItem(STORAGE_KEY_PLAN, tier);
    } catch {
      // ignore
    }
  };

  // Active sites & selected site depend on whether user is logged in or viewing Demo mode
  const activeSites = isDemoMode ? demoSites : userSites;
  const activeSiteId = isDemoMode ? demoSiteId : userSiteId;
  const setActiveSiteId = isDemoMode ? setDemoSiteId : setUserSiteId;
  const currentSite = activeSites.find((s) => s.id === activeSiteId) || activeSites[0];

  // Handler invoked when a file is parsed through the drag-and-drop zone
  const handleFileParsed = (_fileName: string, parsedDeps: Dependency[], isVulnerable: boolean) => {
    const newWeather: WeatherStatus = isVulnerable ? 'thunderstorm' : 'sunny';
    const updatedForecast = currentSite.forecast.map((f, idx) => {
      if (idx === currentSite.forecast.length - 1) {
        return {
          ...f,
          weather: newWeather,
          summary: isVulnerable ? 'Upload analysis: Emergency vulnerability detected!' : 'Upload analysis: No anomalies (safe)',
          summaryKey: isVulnerable ? 'forecast.summaries.uploadVulnerable' : 'forecast.summaries.uploadSafe',
          vulnerabilityCount: isVulnerable ? 1 : 0
        };
      }
      return f;
    });

    const updater = (prev: ProjectSite[]) =>
      prev.map((s) =>
        s.id === currentSite.id
          ? {
              ...s,
              currentWeather: newWeather,
              lastScannedAt: t('dashboard.lastScannedJustNow'),
              dependencies: parsedDeps,
              forecast: updatedForecast
            }
          : s
      );

    if (isDemoMode) {
      setDemoSites(updater);
    } else {
      setUserSites(updater);
    }
  };

  // Refresh scan from backend D1 database
  const handleRefreshScan = async () => {
    setIsScanning(true);
    await syncSitesFromBackend();
    setTimeout(() => {
      setIsScanning(false);
    }, 500);
  };

  // Add new monitored site and persist to localStorage + Cloudflare D1 (with owner_uid)
  const handleAddSite = (newSiteData: Partial<ProjectSite>) => {
    let generatedId = `site_${Date.now()}`;
    if (newSiteData.url) {
      try {
        const host = new URL(newSiteData.url).hostname.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '');
        if (host) generatedId = `site_${host}`;
      } catch {
        // fallback to timestamp id
      }
    }
    const newSite: ProjectSite = {
      id: newSiteData.id || generatedId,
      name: newSiteData.name || t('sites.defaultNewSiteName'),
      url: newSiteData.url || 'https://example.com',
      ecosystem: newSiteData.ecosystem || 'wordpress',
      syncMethod: newSiteData.syncMethod || 'wp_plugin',
      isVerified: false,
      verificationToken: newSiteData.verificationToken || `sbw_live_${Math.random().toString(36).substring(2, 14)}`,
      currentWeather: 'sunny',
      lastScannedAt: t('dashboard.unscanned'),
      daysUnresolved: 0,
      dependencies: [],
      forecast: buildDefaultForecast('sunny', 0)
    };

    setUserSites((prev) => {
      const filtered = prev.filter((s) => s.id !== newSite.id);
      return [newSite, ...filtered];
    });
    setUserSiteId(newSite.id);

    // Persist to Cloudflare D1 APP_DB with user headers
    fetch(`${API_BASE_URL}/api/v1/sites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildUserHeaders()
      },
      body: JSON.stringify(newSite)
    }).catch(() => null);
  };

  // Verify site ownership
  const handleVerifySite = (siteId: string) => {
    setUserSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          const updated = { ...s, isVerified: true };
          fetch(`${API_BASE_URL}/api/v1/sites`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...buildUserHeaders()
            },
            body: JSON.stringify(updated)
          }).catch(() => null);
          return updated;
        }
        return s;
      })
    );
  };

  // Add / remove team members (persisted to D1 /api/v1/team)
  const handleAddMember = (m: Partial<TeamMember>) => {
    const newMember: TeamMember = {
      id: `m-${Date.now()}`,
      name: m.name || '',
      email: m.email || '',
      role: m.role || 'viewer',
      addedAt: m.addedAt || new Date().toISOString().split('T')[0]
    };
    setMembers((prev) => [...prev, newMember]);

    fetch(`${API_BASE_URL}/api/v1/team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildUserHeaders()
      },
      body: JSON.stringify(newMember)
    }).catch(() => null);
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));

    fetch(`${API_BASE_URL}/api/v1/team?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: buildUserHeaders()
    }).catch(() => null);
  };

  const siteDisplayName = currentSite.nameKey ? String(t(currentSite.nameKey as any)) : currentSite.name;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        sites={activeSites}
        currentSite={currentSite}
        onSelectSite={(s) => setActiveSiteId(s.id)}
        currentView={currentView}
        onSelectView={(v) => navigateTo(v, settingsTab)}
        currentPlan={currentPlan}
        onOpenPricingModal={() => handleOpenUpgradeModal(null)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {currentView === 'dashboard' ? (
          <>
            {/* Logged-out Demo Mode Banner */}
            {isDemoMode && (
              <div className="rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/70 to-indigo-50/60 border border-amber-200/90 p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0 mt-0.5">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-extrabold tracking-wider uppercase">
                        {t('demo.badge')}
                      </span>
                      <h2 className="text-sm font-bold text-slate-900">
                        {t('demo.bannerTitle')}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {t('demo.bannerDesc')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                  <button
                    onClick={() => handleQuickProviderSignIn('google')}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 text-xs font-bold shadow-2xs transition-all active:scale-98 cursor-pointer whitespace-nowrap"
                  >
                    <GoogleIcon className="w-4 h-4" />
                    <span>{t('demo.loginWithGoogle')}</span>
                  </button>
                  <button
                    onClick={() => handleQuickProviderSignIn('microsoft')}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all active:scale-98 cursor-pointer whitespace-nowrap"
                  >
                    <MicrosoftIcon className="w-4 h-4" />
                    <span>{t('demo.loginWithMicrosoft')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Top Bar for Project Context */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 m-0">
                    {siteDisplayName}
                  </h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-medium border border-slate-200 uppercase">
                    {currentSite.ecosystem}
                  </span>
                  {isDemoMode && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-300 uppercase">
                      <Eye className="w-3 h-3 text-amber-600" />
                      <span>{t('demo.badge')}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-1">
                  <span>{currentSite.url}</span>
                  <span>•</span>
                  <span>{String(t('dashboard.syncMethod', { method: currentSite.syncMethod }))}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefreshScan}
                  disabled={isScanning}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? t('dashboard.scanning') : t('dashboard.refreshScan')}</span>
                </button>
              </div>
            </div>

            {/* 1. Main Weather Banner (Weather Metaphor) */}
            <WeatherBanner
              project={currentSite}
              onOpenPdfReport={() => setIsPdfModalOpen(true)}
            />

            {/* 2. Security Weather Trend (7-Day Trend) */}
            <WeeklyForecast forecast={currentSite.forecast} />

            {/* 3. Detected Packages & CVEs Table */}
            <DependencyTable
              dependencies={currentSite.dependencies}
              project={currentSite}
              isDemoMode={isDemoMode}
            />

            {/* 4. Drag & Drop Lockfile Analysis (Moved to the bottom) */}
            <DropZone onFileParsed={handleFileParsed} />
          </>
        ) : (
          <SettingsLayout
            currentSite={currentSite}
            sites={activeSites}
            members={members}
            currentPlan={currentPlan}
            activeTab={settingsTab}
            onSelectTab={(tab) => navigateTo('settings', tab)}
            onBackToDashboard={() => navigateTo('dashboard')}
            onAddSite={handleAddSite}
            onVerifySite={handleVerifySite}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onOpenUpgradeModal={handleOpenUpgradeModal}
          />
        )}
      </main>

      {/* Login Provider Selection Modal */}
      {isLoginModalOpen && (
        <LoginModal
          initialErrorCode={loginModalErrorCode}
          onClose={() => {
            setIsLoginModalOpen(false);
            setLoginModalErrorCode(null);
          }}
        />
      )}

      {/* Freemium Pricing & Upgrade Modal */}
      {isPricingModalOpen && (
        <PricingModal
          currentPlan={currentPlan}
          currentSiteCount={activeSites.length}
          onSelectPlan={handleSelectPlan}
          onClose={() => setIsPricingModalOpen(false)}
          upgradeReason={upgradeReason}
        />
      )}

      {/* A4 PDF Report Preview Modal */}
      {isPdfModalOpen && (
        <PdfReportModal
          project={currentSite}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{t('common.appName')}</span>
            <span>{t('footer.tagline')}</span>
          </div>
          <div className="text-slate-500">
            {t('footer.poweredBy')}
          </div>
        </div>
      </footer>
    </div>
  );
}
