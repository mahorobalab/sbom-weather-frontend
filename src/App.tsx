import { useState } from 'react';
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
  const [sites, setSites] = useState<ProjectSite[]>(INITIAL_PROJECTS);
  const [currentSiteId, setCurrentSiteId] = useState<string>(INITIAL_PROJECTS[0].id);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'sites' | 'users'>('dashboard');
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const currentSite = sites.find((s) => s.id === currentSiteId) || sites[0];

  // ドラッグ＆ドロップでファイルがパースされたときの処理
  const handleFileParsed = (_fileName: string, parsedDeps: Dependency[], isVulnerable: boolean) => {
    const newWeather: WeatherStatus = isVulnerable ? 'thunderstorm' : 'sunny';
    const updatedForecast = currentSite.forecast.map((f, idx) => {
      if (idx === currentSite.forecast.length - 1) {
        return {
          ...f,
          weather: newWeather,
          summary: isVulnerable ? 'アップロード解析により緊急脆弱性を検知！' : 'アップロード解析：異常なし（安全）',
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
              lastScannedAt: 'たった今 (手動アップロード)',
              dependencies: parsedDeps,
              forecast: updatedForecast
            }
          : s
      )
    );
  };

  // 手動で再スキャンをシミュレーション
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

  // サイト追加
  const handleAddSite = (newSiteData: Partial<ProjectSite>) => {
    const newSite: ProjectSite = {
      id: `proj-${Date.now()}`,
      name: newSiteData.name || '新規サイト',
      url: newSiteData.url || 'https://example.com',
      ecosystem: newSiteData.ecosystem || 'wordpress',
      syncMethod: newSiteData.syncMethod || 'wp_plugin',
      isVerified: false,
      verificationToken: newSiteData.verificationToken || 'ninja-site-verification=abc',
      currentWeather: 'sunny',
      lastScannedAt: '未スキャン',
      daysUnresolved: 0,
      dependencies: [],
      forecast: [
        { date: '10/16', dayLabel: '木', weather: 'sunny', summary: '快晴', vulnerabilityCount: 0 },
        { date: '10/17', dayLabel: '金', weather: 'sunny', summary: '快晴', vulnerabilityCount: 0 },
        { date: '10/18', dayLabel: '土', weather: 'sunny', summary: '快晴', vulnerabilityCount: 0 },
        { date: '10/19', dayLabel: '日', weather: 'sunny', summary: '快晴', vulnerabilityCount: 0 },
        { date: '10/20', dayLabel: '月', weather: 'sunny', summary: '快晴', vulnerabilityCount: 0 },
        { date: '10/21', dayLabel: '火', weather: 'sunny', summary: '快晴', vulnerabilityCount: 0 },
        { date: '10/22', dayLabel: '今日', weather: 'sunny', summary: '登録完了：快晴', vulnerabilityCount: 0 }
      ]
    };
    setSites([newSite, ...sites]);
    setCurrentSiteId(newSite.id);
  };

  // メンバー追加・削除
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
                    {currentSite.name}
                  </h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-medium border border-slate-200 uppercase">
                    {currentSite.ecosystem}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-1">
                  <span>{currentSite.url}</span>
                  <span>•</span>
                  <span>連携方式: {currentSite.syncMethod}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefreshScan}
                  disabled={isScanning}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? '脆弱性DB照合中...' : '今すぐ最新DBと照合'}</span>
                </button>
              </div>
            </div>

            {/* 1. Main Weather Banner (お天気メタファー) */}
            <WeatherBanner
              project={currentSite}
              onOpenPdfReport={() => setIsPdfModalOpen(true)}
            />

            {/* 2. Weekly Security Forecast (直近7日間の推移) */}
            <WeeklyForecast forecast={currentSite.forecast} />

            {/* 3. Drag & Drop Lockfile Analysis */}
            <DropZone onFileParsed={handleFileParsed} />

            {/* 4. Detected Packages & CVEs Table */}
            <DependencyTable dependencies={currentSite.dependencies} />
          </>
        )}

        {currentTab === 'sites' && (
          <SiteManagement sites={sites} onAddSite={handleAddSite} />
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
            <span className="font-bold text-slate-800">SBOM Weather</span>
            <span>— ソフトウェア脆弱性お天気予報</span>
          </div>
          <div className="text-slate-500">
            Cloudflare Workers & D1 & KV Powered • 高速エッジ照合
          </div>
        </div>
      </footer>
    </div>
  );
}
