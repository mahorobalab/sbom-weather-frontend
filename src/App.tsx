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
import {
  INITIAL_PROJECTS,
  INITIAL_MEMBERS,
  applyDynamic7DayDates,
  build7DayForecastFromDependencies,
  calculateWeatherStatus,
  calculateMaxDaysUnresolved
} from './mockData';
import { useAuth } from './contexts/AuthContext';
import type { ProjectSite, TeamMember, Dependency, WeatherStatus, PlanTier, DayForecast } from './types';
import { RefreshCw, Eye, Globe, Plus } from 'lucide-react';

const STORAGE_KEY_SITES = 'sbom_weather_user_sites_v2';
const STORAGE_KEY_CURRENT_SITE = 'sbom_weather_user_current_site_id_v2';
const STORAGE_KEY_PLAN = 'sbom_weather_plan_v1';
const API_BASE_URL = 'http://localhost:8787';
const DEMO_SITE_IDS = new Set(INITIAL_PROJECTS.map((p) => p.id));

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

const loadUserSitesFromStorage = (uid?: string): ProjectSite[] => {
  if (typeof window === 'undefined' || !uid) return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_SITES}_${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((site: ProjectSite) => site && site.id && !DEMO_SITE_IDS.has(site.id))
          .map((site: ProjectSite) => {
            const deps = Array.isArray(site.dependencies) ? site.dependencies : [];
            const allVulns = deps.flatMap((d) => d.vulnerabilities || []);
            const daysUnresolved = calculateMaxDaysUnresolved(deps, site.daysUnresolved ?? 0);
            const currentWeather =
              allVulns.length > 0
                ? calculateWeatherStatus(allVulns, daysUnresolved)
                : site.currentWeather || 'sunny';
            return {
              ...site,
              daysUnresolved,
              currentWeather,
              forecast: build7DayForecastFromDependencies(
                deps,
                currentWeather,
                daysUnresolved
              )
            };
          });
      }
    }
  } catch {
    // ignore storage read error
  }
  return [];
};

const loadUserSiteIdFromStorage = (uid: string | undefined, sites: ProjectSite[]): string => {
  if (typeof window === 'undefined' || !uid || sites.length === 0) return sites[0]?.id || '';
  try {
    const savedId = window.localStorage.getItem(`${STORAGE_KEY_CURRENT_SITE}_${uid}`);
    if (savedId && sites.some((s) => s.id === savedId)) {
      return savedId;
    }
  } catch {
    // ignore storage read error
  }
  return sites[0]?.id || '';
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

  // Authenticated user's sites and selected site ID (strictly isolated per UID, never mixed with Demo sites)
  const [userSites, setUserSites] = useState<ProjectSite[]>([]);
  const [userSiteId, setUserSiteId] = useState<string>('');

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

  // Load cached user sites when currentUser changes, or reset on logout
  useEffect(() => {
    if (!currentUser) {
      setUserSites([]);
      setUserSiteId('');
      setMembers(INITIAL_MEMBERS);
      if (currentView === 'settings') {
        setCurrentView('dashboard');
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.history.pushState({ view: 'dashboard', tab: settingsTab }, '', '/');
        }
      }
      return;
    }

    const cachedSites = loadUserSitesFromStorage(currentUser.uid);
    setUserSites(cachedSites);
    setUserSiteId(loadUserSiteIdFromStorage(currentUser.uid, cachedSites));
  }, [currentUser, currentView, settingsTab]);

  // Persist userSites to user-scoped localStorage whenever updated
  useEffect(() => {
    if (!currentUser?.uid) return;
    try {
      window.localStorage.setItem(`${STORAGE_KEY_SITES}_${currentUser.uid}`, JSON.stringify(userSites));
    } catch {
      // ignore storage write error
    }
  }, [currentUser?.uid, userSites]);

  // Persist selected userSiteId to user-scoped localStorage
  useEffect(() => {
    if (!currentUser?.uid || !userSiteId) return;
    try {
      window.localStorage.setItem(`${STORAGE_KEY_CURRENT_SITE}_${currentUser.uid}`, userSiteId);
    } catch {
      // ignore storage write error
    }
  }, [currentUser?.uid, userSiteId]);

  // Fetch & sync persisted sites and team members owned by this user from Cloudflare D1 (APP_DB)
  const syncSitesFromBackend = useCallback(async () => {
    if (!currentUser) return;
    const authHeaders = buildUserHeaders();

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sites`, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sites)) {
          setUserSites((prevSites) => {
            const remoteSites: ProjectSite[] = data.sites
              .filter((remoteSite: any) => remoteSite && remoteSite.id && !DEMO_SITE_IDS.has(remoteSite.id))
              .map((remoteSite: any) => {
                const existing = prevSites.find((s) => s.id === remoteSite.id);
                const hasRemoteDeps = Array.isArray(remoteSite.dependencies) && remoteSite.dependencies.length > 0;
                const deps: Dependency[] = hasRemoteDeps
                  ? remoteSite.dependencies
                  : existing?.dependencies || [];
                const allVulns = deps.flatMap((d) => d.vulnerabilities || []);
                const daysUnresolved = calculateMaxDaysUnresolved(
                  deps,
                  remoteSite.daysUnresolved ?? existing?.daysUnresolved ?? 0
                );
                const weather: WeatherStatus =
                  allVulns.length > 0
                    ? calculateWeatherStatus(allVulns, daysUnresolved)
                    : ((remoteSite.currentWeather || existing?.currentWeather || 'sunny') as WeatherStatus);
                const updatedForecast = build7DayForecastFromDependencies(
                  deps,
                  weather,
                  daysUnresolved
                );

                return {
                  id: remoteSite.id,
                  name: remoteSite.name || existing?.name || remoteSite.id,
                  url: remoteSite.url || existing?.url || 'http://localhost',
                  ecosystem: remoteSite.ecosystem || existing?.ecosystem || 'wordpress',
                  syncMethod: remoteSite.syncMethod || existing?.syncMethod || 'wp_plugin',
                  isVerified: Boolean(remoteSite.isVerified ?? existing?.isVerified ?? true),
                  verificationToken:
                    remoteSite.verificationToken || existing?.verificationToken || `sbw_live_${remoteSite.id}`,
                  currentWeather: weather,
                  lastScannedAt: hasRemoteDeps
                    ? remoteSite.lastScannedAt
                    : existing?.lastScannedAt || remoteSite.lastScannedAt || t('dashboard.unscanned'),
                  daysUnresolved,
                  createdAt: remoteSite.createdAt ?? existing?.createdAt ?? null,
                  expiresAt: remoteSite.expiresAt ?? existing?.expiresAt ?? null,
                  dependencies: deps,
                  forecast: updatedForecast
                };
              });

            return remoteSites;
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
      // Backend might be offline; keep user-scoped localStorage sites intact
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
  const currentSite: ProjectSite | undefined =
    activeSites.find((s) => s.id === activeSiteId) || activeSites[0];

  // Handler invoked when a file or WP Site Health text is parsed through the drag-and-drop zone
  const handleFileParsed = (
    fileName: string,
    parsedDeps: Dependency[],
    isVulnerable: boolean,
    weatherOverride?: WeatherStatus,
    ecosystemOverride?: 'composer' | 'npm' | 'wordpress'
  ) => {
    const allVulns = parsedDeps.flatMap((d) => d.vulnerabilities || []);
    const resolvedDays = calculateMaxDaysUnresolved(parsedDeps, 0);
    const computedWeather =
      allVulns.length > 0
        ? calculateWeatherStatus(allVulns, resolvedDays)
        : isVulnerable
        ? 'rain'
        : 'sunny';
    const newWeather: WeatherStatus =
      allVulns.length > 0 ? computedWeather : weatherOverride || computedWeather;
    const resolvedEco: 'composer' | 'npm' | 'wordpress' =
      ecosystemOverride || parsedDeps[0]?.ecosystem || 'composer';
    const updatedForecast = build7DayForecastFromDependencies(
      parsedDeps,
      newWeather,
      resolvedDays
    );

    if (!currentSite) {
      const uploadedSite: ProjectSite = {
        id: 'site_manual_upload',
        name: fileName,
        url: 'http://localhost',
        ecosystem: resolvedEco,
        syncMethod: 'actions',
        isVerified: true,
        verificationToken: 'sbw_live_manual_upload',
        currentWeather: newWeather,
        lastScannedAt: t('dashboard.lastScannedJustNow'),
        daysUnresolved: resolvedDays,
        dependencies: parsedDeps,
        forecast: updatedForecast
      };
      setUserSites([uploadedSite]);
      setUserSiteId(uploadedSite.id);
      return;
    }

    const updater = (prev: ProjectSite[]) =>
      prev.map((s) =>
        s.id === currentSite.id
          ? {
              ...s,
              ecosystem: resolvedEco,
              currentWeather: newWeather,
              daysUnresolved: resolvedDays,
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
    await fetch(`${API_BASE_URL}/api/v1/cron/run`, {
      method: 'POST',
      headers: buildUserHeaders()
    }).catch(() => null);
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
      createdAt: Math.floor(Date.now() / 1000),
      expiresAt: null,
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

  // Rename site display name (URL and Site ID remain locked)
  const handleRenameSite = (siteId: string, newName: string) => {
    setUserSites((prev) =>
      prev.map((s) => (s.id === siteId ? { ...s, name: newName, nameKey: undefined } : s))
    );

    fetch(`${API_BASE_URL}/api/v1/sites`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...buildUserHeaders()
      },
      body: JSON.stringify({ id: siteId, name: newName })
    }).catch(() => null);
  };

  // Delete a monitored site and remove from D1 APP_DB
  const handleDeleteSite = (siteId: string) => {
    setUserSites((prev) => {
      const remaining = prev.filter((s) => s.id !== siteId);
      if (userSiteId === siteId) {
        setUserSiteId(remaining[0]?.id || '');
      }
      return remaining;
    });

    fetch(`${API_BASE_URL}/api/v1/sites?id=${encodeURIComponent(siteId)}`, {
      method: 'DELETE',
      headers: buildUserHeaders()
    }).catch(() => null);
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

  const siteDisplayName = currentSite
    ? currentSite.nameKey
      ? String(t(currentSite.nameKey as any))
      : currentSite.name
    : '';

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

            {currentSite ? (
              <>
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
              </>
            ) : (
              /* Logged-in user with 0 sites registered */
              <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-3.5">
                  <Globe className="w-6 h-6" />
                </div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {t('sites.emptyTitle')}
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                  {t('sites.emptyDesc')}
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    onClick={() => navigateTo('settings', 'sites')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('sites.addNewSite')}</span>
                  </button>
                  <button
                    onClick={handleRefreshScan}
                    disabled={isScanning}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{t('dashboard.refreshScan')}</span>
                  </button>
                </div>
              </div>
            )}

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
            onRenameSite={handleRenameSite}
            onDeleteSite={handleDeleteSite}
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
      {isPdfModalOpen && currentSite && (
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
