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
import { INITIAL_PROJECTS, INITIAL_MEMBERS, applyDynamic7DayDates } from './mockData';
import type { ProjectSite, TeamMember, Dependency, WeatherStatus, PlanTier, DayForecast } from './types';
import { RefreshCw } from 'lucide-react';

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
  const [sites, setSites] = useState<ProjectSite[]>(loadInitialSites);
  const [currentSiteId, setCurrentSiteId] = useState<string>(() => loadInitialSiteId(loadInitialSites()));
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>(() => parseUrlPath().view);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(() => parseUrlPath().tab);
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
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

  // Persist sites to localStorage whenever updated
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_SITES, JSON.stringify(sites));
    } catch {
      // ignore storage write error
    }
  }, [sites]);

  // Persist selected site ID to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_CURRENT_SITE, currentSiteId);
    } catch {
      // ignore storage write error
    }
  }, [currentSiteId]);

  // Fetch & merge persisted sites and scan results from Cloudflare D1 (APP_DB)
  const syncSitesFromBackend = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sites`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.sites) || data.sites.length === 0) return;

      setSites((prevSites) => {
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
    } catch {
      // Backend might be offline; keep localStorage sites intact
    }
  }, [t]);

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
    setCurrentView(view);
    setSettingsTab(tab);
    const targetUrl = view === 'settings' ? `/config/${tab}` : '/';
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ view, tab }, '', targetUrl);
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

  const currentSite = sites.find((s) => s.id === currentSiteId) || sites[0];

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

    setSites((prev) =>
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
      )
    );
  };

  // Refresh scan from backend D1 database
  const handleRefreshScan = async () => {
    setIsScanning(true);
    await syncSitesFromBackend();
    setTimeout(() => {
      setIsScanning(false);
    }, 500);
  };

  // Add new monitored site and persist to localStorage + Cloudflare D1
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

    setSites((prev) => {
      const filtered = prev.filter((s) => s.id !== newSite.id);
      return [newSite, ...filtered];
    });
    setCurrentSiteId(newSite.id);

    // Persist to Cloudflare D1 APP_DB
    fetch(`${API_BASE_URL}/api/v1/sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSite)
    }).catch(() => null);
  };

  // Verify site ownership
  const handleVerifySite = (siteId: string) => {
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          const updated = { ...s, isVerified: true };
          fetch(`${API_BASE_URL}/api/v1/sites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          }).catch(() => null);
          return updated;
        }
        return s;
      })
    );
  };

  // Add / remove team members
  const handleAddMember = (m: Partial<TeamMember>) => {
    const newMember: TeamMember = {
      id: `m-${Date.now()}`,
      name: m.name || '',
      email: m.email || '',
      role: m.role || 'viewer',
      addedAt: m.addedAt || new Date().toISOString().split('T')[0]
    };
    setMembers([...members, newMember]);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const siteDisplayName = currentSite.nameKey ? String(t(currentSite.nameKey as any)) : currentSite.name;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        sites={sites}
        currentSite={currentSite}
        onSelectSite={(s) => setCurrentSiteId(s.id)}
        currentView={currentView}
        onSelectView={(v) => navigateTo(v, settingsTab)}
        currentPlan={currentPlan}
        onOpenPricingModal={() => handleOpenUpgradeModal(null)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {currentView === 'dashboard' ? (
          <>
            {/* Top Bar for Project Context */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 m-0">
                    {siteDisplayName}
                  </h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-medium border border-slate-200 uppercase">
                    {currentSite.ecosystem}
                  </span>
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

            {/* 3. Drag & Drop Lockfile Analysis */}
            <DropZone onFileParsed={handleFileParsed} />

            {/* 4. Detected Packages & CVEs Table */}
            <DependencyTable dependencies={currentSite.dependencies} project={currentSite} />
          </>
        ) : (
          <SettingsLayout
            currentSite={currentSite}
            sites={sites}
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

      {/* Freemium Pricing & Upgrade Modal */}
      {isPricingModalOpen && (
        <PricingModal
          currentPlan={currentPlan}
          currentSiteCount={sites.length}
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
