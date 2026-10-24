import React from 'react';
import { X, Check, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PLAN_CONFIGS, type PlanTier } from '../types';

interface PricingModalProps {
  currentPlan: PlanTier;
  currentSiteCount: number;
  onSelectPlan: (tier: PlanTier) => void;
  onClose: () => void;
  upgradeReason?: 'site_limit' | 'feature_locked' | null;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  currentPlan,
  currentSiteCount,
  onSelectPlan,
  onClose,
  upgradeReason
}) => {
  const { t } = useTranslation();
  const tiers: PlanTier[] = ['free', 'basic', 'pro'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('pricing.badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('pricing.modalTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            {t('pricing.modalSubtitle')}
          </p>
        </div>

        {/* Context Alert Banner (if opened due to limit) */}
        {upgradeReason === 'site_limit' && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">{t('pricing.siteLimitReachedTitle')}</div>
              <div className="text-amber-800 text-xs mt-0.5">
                {t('pricing.siteLimitReachedDesc', { count: currentSiteCount })}
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const config = PLAN_CONFIGS[tier];
            const isCurrent = currentPlan === tier;
            const isPopular = config.isPopular;

            return (
              <div
                key={tier}
                className={`relative flex flex-col justify-between rounded-2xl p-6 transition-all ${
                  isPopular
                    ? 'border-2 border-indigo-600 bg-white shadow-lg shadow-indigo-600/10'
                    : 'border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                {/* Popular Tag */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-xs">
                    {t('pricing.popularBadge')}
                  </div>
                )}

                <div>
                  {/* Plan Name & Tagline */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {t(config.nameKey as any)}
                    </h3>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                        {t('pricing.currentPlanBadge')}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">
                        {config.priceMonthly === 0 ? t('pricing.freePrice') : `¥${config.priceMonthly.toLocaleString()}`}
                      </span>
                      {config.priceMonthly > 0 && (
                        <span className="text-xs text-slate-500 font-medium">{t('pricing.perMonth')}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {t('pricing.maxSitesLabel', { max: config.maxSites })}
                    </div>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* Features List */}
                  <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                    {config.featuresKeys.map((fKey, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{t(fKey as any)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    onSelectPlan(tier);
                    onClose();
                  }}
                  disabled={isCurrent}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs active:scale-98'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 active:scale-98'
                  }`}
                >
                  {isCurrent
                    ? t('pricing.alreadyActive')
                    : tier === 'free'
                    ? t('pricing.selectFreePlan')
                    : t('pricing.upgradeToPlan', { name: t(config.nameKey as any) })}
                </button>
              </div>
            );
          })}
        </div>

        {/* Security & Peace of Mind Note */}
        <div className="mt-8 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>{t('pricing.guaranteeNote')}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {t('pricing.cancelAnytime')}
          </div>
        </div>
      </div>
    </div>
  );
};
