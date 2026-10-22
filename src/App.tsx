import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from './components/Navbar';
import { WeatherBanner } from './components/WeatherBanner';
import { WeeklyForecast } from './components/WeeklyForecast';
import { DropZone } from './components/DropZone';
import { DependencyTable } from './components/DependencyTable';
import { SiteManagement } from './components/SiteManagement';
import { UserManagement } from './components/UserManagement';
import { PdfReportModal } from './components/PdfReportModal';
import { INITIAL_PROJECTS, INITIAL_MEMBERS } from './mockData';
import type { ProjectSite, TeamMember, Dependency, WeatherStatus } from './types';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const { t } = useTranslation();
  const [sites, setSites] = useState<ProjectSite[]>(INITIAL_PROJECTS);
  const [currentSiteId, setCurrentSiteId] = useState<string>(INITIAL_PROJECTS[0].id);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'sites' | 'users'>('dashboard');
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

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

  // Simulate manual verification scan
  const handleRefreshScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setSites((prev) =>
        prev.map((s) =>
          s.id === currentSite.id
            ? { ...s, lastScannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            : s
        )
      );
    }, 800);
  };

  // Add new monitored site
  const handleAddSite = (newSiteData: Partial<ProjectSite>) => {
    const newSite: ProjectSite = {
      id: `proj-${Date.now()}`,
      name: newSiteData.name || t('sites.defaultNewSiteName'),
      url: newSiteData.url || 'https://example.com',
      ecosystem: newSiteData.ecosystem || 'wordpress',
      syncMethod: newSiteData.syncMethod || 'wp_plugin',
      isVerified: false,
      verificationToken: newSiteData.verificationToken || `token_${Math.random().toString(36).substring(2, 14)}`,
      currentWeather: 'sunny',
      lastScannedAt: t('dashboard.unscanned'),
      daysUnresolved: 0,
      dependencies: [],
      forecast: [
        { date: '10/16', dayLabel: 'Thu', dayLabelKey: 'forecast.days.thu', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
        { date: '10/17', dayLabel: 'Fri', dayLabelKey: 'forecast.days.fri', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
        { date: '10/18', dayLabel: 'Sat', dayLabelKey: 'forecast.days.sat', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
        { date: '10/19', dayLabel: 'Sun', dayLabelKey: 'forecast.days.sun', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
        { date: '10/20', dayLabel: 'Mon', dayLabelKey: 'forecast.days.mon', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
        { date: '10/21', dayLabel: 'Tue', dayLabelKey: 'forecast.days.tue', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
        { date: '10/22', dayLabel: 'Today', dayLabelKey: 'forecast.days.today', weather: 'sunny', summary: 'Registration complete: Clear skies', summaryKey: 'forecast.summaries.registered', vulnerabilityCount: 0 }
      ]
    };
    setSites([newSite, ...sites]);
    setCurrentSiteId(newSite.id);
  };

  // Verify site ownership
  const handleVerifySite = (siteId: string) => {
    setSites((prev) =>
      prev.map((s) => (s.id === siteId ? { ...s, isVerified: true } : s))
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
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {currentTab === 'dashboard' && (
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

            {/* 2. Weekly Security Forecast (7-Day Trend) */}
            <WeeklyForecast forecast={currentSite.forecast} />

            {/* 3. Drag & Drop Lockfile Analysis */}
            <DropZone onFileParsed={handleFileParsed} />

            {/* 4. Detected Packages & CVEs Table */}
            <DependencyTable dependencies={currentSite.dependencies} />
          </>
        )}

        {currentTab === 'sites' && (
          <SiteManagement
            sites={sites}
            onAddSite={handleAddSite}
            onVerifySite={handleVerifySite}
          />
        )}

        {currentTab === 'users' && (
          <UserManagement
            members={members}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
          />
        )}
      </main>

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
