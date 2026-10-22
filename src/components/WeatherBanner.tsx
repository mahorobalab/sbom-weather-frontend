import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Tornado, AlertTriangle, FileText } from 'lucide-react';
import type { ProjectSite } from '../types';

interface WeatherBannerProps {
  project: ProjectSite;
  onOpenPdfReport: () => void;
}

export const WeatherBanner: React.FC<WeatherBannerProps> = ({ project, onOpenPdfReport }) => {
  const { currentWeather, daysUnresolved, lastScannedAt } = project;

  const weatherConfig = {
    sunny: {
      label: '快晴（安全）',
      icon: Sun,
      iconColor: 'text-amber-500',
      bgGradient: 'from-emerald-50 via-sky-50/30 to-teal-50/40 border-emerald-200/90',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium',
      headline: '本日は快晴！セキュリティに異常はありません',
      description: '検出された脆弱性は0件です。外部からの既知の脅威はなく、システムは安全稼働しています。',
      subText: `最終スキャン: ${lastScannedAt} (自動巡回済)`
    },
    cloudy: {
      label: '曇り（要注意）',
      icon: Cloud,
      iconColor: 'text-slate-500',
      bgGradient: 'from-slate-100 via-sky-50/20 to-gray-50 border-slate-300',
      badgeColor: 'bg-slate-200 text-slate-800 border-slate-300 font-medium',
      headline: 'うす曇り：軽微なアップデートが公開されています',
      description: '重大な脅威ではありませんが、マイナーなバグ修正や非クリティカルな更新が届いています。',
      subText: `最終スキャン: ${lastScannedAt}`
    },
    rain: {
      label: '雨（注意報）',
      icon: CloudRain,
      iconColor: 'text-blue-500',
      bgGradient: 'from-blue-50 via-sky-50/40 to-indigo-50/30 border-blue-200',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300 font-medium',
      headline: '雨模様：中程度の脆弱性が検出されました',
      description: '条件付きで影響を受ける脆弱性が確認されています。次回の定期メンテナンスでの対応を推奨します。',
      subText: `検出から ${daysUnresolved} 日経過`
    },
    thunderstorm: {
      label: '雷雨（緊急警報）',
      icon: CloudLightning,
      iconColor: 'text-amber-500',
      bgGradient: 'from-amber-50/90 via-rose-50/40 to-orange-50/50 border-amber-300',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold animate-pulse',
      headline: '雷雨警報発令！極めて深刻な脆弱性を検知',
      description: '認証なしで外部攻撃が成立する重大な脆弱性（CVSS 9.0+）が含まれています。大至急パッチを適用してください！',
      subText: '2026/10/21 深夜公開の緊急パッチ対象'
    },
    typhoon: {
      label: '台風（放置警戒）',
      icon: Tornado,
      iconColor: 'text-rose-600',
      bgGradient: 'from-rose-100/80 via-red-50 to-orange-50 border-rose-300',
      badgeColor: 'bg-red-600 text-white font-bold animate-bounce',
      headline: '台風直撃！重大な脆弱性が長期間放置されています',
      description: `重大な脆弱性が未対応のまま ${daysUnresolved} 日以上経過しています。攻撃コードが出回っており、即座に相談先または保守ベンダーへ連絡してください。`,
      subText: '損害賠償・サービス停止の致命的リスクがあります'
    }
  }[currentWeather];

  const IconComponent = weatherConfig.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 bg-gradient-to-r ${weatherConfig.bgGradient} shadow-sm transition-all duration-300`}>
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className={`w-18 h-18 md:w-20 md:h-20 rounded-2xl bg-white flex items-center justify-center p-4 border border-slate-200/80 shadow-sm ${weatherConfig.iconColor}`}>
              <IconComponent className="w-full h-full stroke-[1.8]" />
            </div>
            {currentWeather === 'thunderstorm' && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs border shadow-2xs ${weatherConfig.badgeColor}`}>
                {weatherConfig.label}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {weatherConfig.subText}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mb-1.5">
              {weatherConfig.headline}
            </h2>
            <p className="text-sm md:text-base text-slate-600 max-w-2xl leading-relaxed">
              {weatherConfig.description}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 flex-shrink-0">
          <button
            onClick={onOpenPdfReport}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-xs hover:shadow-md active:scale-98 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>相談用PDF診断書を出力</span>
          </button>
          
          {currentWeather !== 'sunny' && (
            <div className="flex items-center gap-2 text-xs text-amber-900 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200/90 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
              <span>外注先・社内SEに見せるだけで相談可能</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
