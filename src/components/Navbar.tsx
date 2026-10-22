import React from 'react';
import { Shield, ChevronDown, LayoutDashboard, Globe, Users } from 'lucide-react';
import type { ProjectSite } from '../types';

interface NavbarProps {
  sites: ProjectSite[];
  currentSite: ProjectSite;
  onSelectSite: (site: ProjectSite) => void;
  currentTab: 'dashboard' | 'sites' | 'users';
  onSelectTab: (tab: 'dashboard' | 'sites' | 'users') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sites,
  currentSite,
  onSelectSite,
  currentTab,
  onSelectTab
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>SBOM Weather</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 font-mono font-medium">
                  BETA
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-sans -mt-0.5">
                脆弱性セキュリティお天気予報
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>お天気予報</span>
            </button>
            <button
              onClick={() => onSelectTab('sites')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                currentTab === 'sites'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>サイト管理</span>
            </button>
            <button
              onClick={() => onSelectTab('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                currentTab === 'users'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>チーム権限</span>
            </button>
          </nav>
        </div>

        {/* Site Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Site Selector Dropdown */}
          <div className="relative">
            <select
              value={currentSite.id}
              onChange={(e) => {
                const selected = sites.find((s) => s.id === e.target.value);
                if (selected) onSelectSite(selected);
              }}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-xs hover:border-slate-300 transition-colors"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.currentWeather === 'sunny' ? '☀️' : s.currentWeather === 'thunderstorm' ? '⚡' : s.currentWeather === 'typhoon' ? '🌀' : '🌧️'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              前
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800">前田 慎吾</div>
              <div className="text-[10px] text-slate-500">Pro プラン</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
