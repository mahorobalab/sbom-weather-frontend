import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, ShieldAlert, ArrowRight, AlertCircle, Clock, Zap } from 'lucide-react';
import type { ProjectSite, SiteMonitorShare } from '../types';

interface SharePinLockScreenProps {
  share: SiteMonitorShare | null;
  site: ProjectSite | null;
  status: 'locked' | 'expired' | 'used' | 'not_found';
  onUnlock: (pin: string) => boolean;
  onGoHome: () => void;
}

export const SharePinLockScreen: React.FC<SharePinLockScreenProps> = ({
  share,
  site,
  status,
  onUnlock,
  onGoHome
}) => {
  const { t } = useTranslation();
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const siteName = site?.nameKey
    ? t(site.nameKey as any)
    : site?.name || share?.name || t('shareLock.defaultSiteName');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput) return;

    const success = onUnlock(pinInput);
    if (!success) {
      setErrorMessage(t('shareLock.errorInvalidPin'));
      setPinInput('');
    } else {
      setErrorMessage(null);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Status: Expired */}
        {status === 'expired' && (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Clock className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1.5">
              {t('shareLock.expiredTitle')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-6">
              {t('shareLock.expiredDesc')}
            </p>
            <button
              onClick={onGoHome}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              {t('shareLock.backToHome')}
            </button>
          </div>
        )}

        {/* Status: Used (One-Time) */}
        {status === 'used' && (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Zap className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1.5">
              {t('shareLock.usedTitle')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-6">
              {t('shareLock.usedDesc')}
            </p>
            <button
              onClick={onGoHome}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              {t('shareLock.backToHome')}
            </button>
          </div>
        )}

        {/* Status: Not Found */}
        {status === 'not_found' && (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <ShieldAlert className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1.5">
              {t('shareLock.notFoundTitle')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-6">
              {t('shareLock.notFoundDesc')}
            </p>
            <button
              onClick={onGoHome}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              {t('shareLock.backToHome')}
            </button>
          </div>
        )}

        {/* Status: Locked (PIN Input Screen) */}
        {status === 'locked' && (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Lock className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 mb-2">
              <span>{siteName}</span>
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {t('shareLock.title')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
              {t('shareLock.desc')}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  required
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPinInput(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••"
                  className="w-full max-w-[220px] mx-auto text-center font-mono text-3xl font-black tracking-[0.4em] px-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 rounded-2xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              {errorMessage && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-semibold animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={pinInput.length < 4}
                className="w-full max-w-[220px] mx-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{t('shareLock.unlockBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={onGoHome}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {t('shareLock.backToHome')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

