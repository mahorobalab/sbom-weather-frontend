import React, { useState } from 'react';
import { Shield, ChevronDown, LayoutDashboard, Globe, Users, LogOut } from 'lucide-react';
import type { ProjectSite } from '../types';
import { useAuth } from '../contexts/AuthContext';

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
  const { currentUser, signInWithGoogle, signOut } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleConfirmLogout = async () => {
    try {
      await signOut();
      setShowLogoutConfirm(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <>
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

            {/* User Auth Profile */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              {currentUser ? (
                <div className="flex items-center gap-2.5">
                  {currentUser.photoURL && !imageError ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'ユーザー'}
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                      className="w-8 h-8 rounded-full border border-slate-200 shadow-xs object-cover bg-slate-100"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      {(currentUser.displayName || currentUser.email || 'U').substring(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </div>
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="text-[10px] text-slate-400 hover:text-rose-600 font-medium transition-colors block cursor-pointer"
                    >
                      ログアウト
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
                >
                  <span>ログイン</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ログアウト確認ダイアログ */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <LogOut className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">ログアウトの確認</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              アカウント（{currentUser?.email || currentUser?.displayName}）からログアウトしますか？
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                ログアウトする
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
