import React, { useState } from 'react';
import { X, Shield, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const MicrosoftIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 23 23" aria-hidden="true">
    <path fill="#f35325" d="M1 1h10v10H1z" />
    <path fill="#81bc06" d="M12 1h10v10H12z" />
    <path fill="#05a6f0" d="M1 12h10v10H1z" />
    <path fill="#ffba08" d="M12 12h10v10H12z" />
  </svg>
);

interface LoginModalProps {
  onClose: () => void;
  initialErrorCode?: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, initialErrorCode }) => {
  const { t } = useTranslation();
  const { signInWithGoogle, signInWithMicrosoft } = useAuth();
  const [submittingProvider, setSubmittingProvider] = useState<'google' | 'microsoft' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (initialErrorCode === 'auth/account-exists-with-different-credential') {
      return t('auth.errorAccountExistsDifferentCredential');
    }
    if (initialErrorCode === 'auth/popup-blocked') {
      return t('auth.errorPopupBlocked');
    }
    if (initialErrorCode) {
      return t('auth.errorGeneric');
    }
    return null;
  });

  const handleProviderSignIn = async (provider: 'google' | 'microsoft') => {
    setErrorMessage(null);
    setSubmittingProvider(provider);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithMicrosoft();
      }
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setSubmittingProvider(null);
        return;
      }
      if (code === 'auth/account-exists-with-different-credential') {
        setErrorMessage(t('auth.errorAccountExistsDifferentCredential'));
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage(t('auth.errorPopupBlocked'));
      } else {
        setErrorMessage(err?.message || t('auth.errorGeneric'));
      }
      setSubmittingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 mx-auto mb-3.5">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {t('auth.modalTitle')}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {t('auth.modalSubtitle')}
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* OAuth Provider Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={submittingProvider !== null}
            onClick={() => handleProviderSignIn('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold border border-slate-200 hover:border-slate-300 shadow-xs transition-all active:scale-99 disabled:opacity-60 cursor-pointer"
          >
            {submittingProvider === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <GoogleIcon className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{t('auth.continueWithGoogle')}</span>
          </button>

          <button
            type="button"
            disabled={submittingProvider !== null}
            onClick={() => handleProviderSignIn('microsoft')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold border border-slate-200 hover:border-slate-300 shadow-xs transition-all active:scale-99 disabled:opacity-60 cursor-pointer"
          >
            {submittingProvider === 'microsoft' ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <MicrosoftIcon className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{t('auth.continueWithMicrosoft')}</span>
          </button>
        </div>

        {/* Benefits / Trust Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>{t('auth.benefitEnterpriseSso')}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>{t('auth.benefitFreeStart')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

