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
      bgGradient: 'from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-500/30 text-emerald-400',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      headline: '本日は快晴！セキュリティに異常はありません',
      description: '検出された脆弱性は0件です。外部からの既知の脅威はなく、システムは安全稼働しています。',
      subText: `最終スキャン: ${lastScannedAt} (自動巡回済)`
    },
    cloudy: {
      label: '曇り（要注意）',
      icon: Cloud,
      bgGradient: 'from-slate-900 via-sky-950/40 to-slate-950 border-sky-500/30 text-sky-400',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      headline: 'うす曇り：軽微なアップデートが公開されています',
      description: '重大な脅威ではありませんが、マイナーなバグ修正や非クリティカルな更新が届いています。',
      subText: `最終スキャン: ${lastScannedAt}`
    },
    rain: {
      label: '雨（注意報）',
      icon: CloudRain,
      bgGradient: 'from-blue-950/60 via-indigo-950/40 to-slate-950 border-blue-500/40 text-blue-400',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      headline: '雨模様：中程度の脆弱性が検出されました',
      description: '条件付きで影響を受ける脆弱性が確認されています。次回の定期メンテでの対応を推奨します。',
      subText: `検出から ${daysUnresolved} 日経過`
    },
    thunderstorm: {
      label: '雷雨（緊急警報）',
      icon: CloudLightning,
      bgGradient: 'from-purple-950/80 via-rose-950/50 to-slate-950 border-purple-500/50 text-purple-300',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
      headline: '雷雨警報発令！極めて深刻な脆弱性を検知',
      description: '認証なしで外部攻撃が成立する重大な脆弱性（CVSS 9.0+）が含まれています。大至急パッチを適用してください！',
      subText: '2026/10/21 深夜公開の緊急パッチ対象'
    },
    typhoon: {
      label: '台風（放置危険）',
      icon: Tornado,
      bgGradient: 'from-rose-950/90 via-red-950/60 to-slate-950 border-red-500/60 text-rose-300',
      badgeColor: 'bg-red-600/30 text-red-200 border-red-500/60 animate-bounce',
      headline: '台風直撃！重大な脆弱性が長期間放置されています',
      description: `重大な脆弱性が未対応のまま ${daysUnresolved} 日以上経過しています。攻撃コードが出回っており、即座に相談先または保守ベンダーへ連絡してください。`,
      subText: '損害賠償・サービス停止の致命的リスクがあります'
    }
  }[currentWeather];

  const IconComponent = weatherConfig.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 bg-gradient-to-br ${weatherConfig.bgGradient} shadow-2xl transition-all duration-300`}>
      {/* Background decoration elements */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-18 h-18 md:w-20 md:h-20 rounded-2xl glass-card flex items-center justify-center p-4 border border-white/10 shadow-inner">
              <IconComponent className="w-full h-full" />
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
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${weatherConfig.badgeColor}`}>
                {weatherConfig.label}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {weatherConfig.subText}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1">
              {weatherConfig.headline}
            </h2>
            <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
              {weatherConfig.description}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3 flex-shrink-0">
          <button
            onClick={onOpenPdfReport}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg border border-slate-700/80 active:scale-95"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>相談用PDF診断書を出力</span>
          </button>
          
          {currentWeather !== 'sunny' && (
            <div className="flex items-center gap-2 text-xs text-amber-300/90 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
              <span>外注先・社内SEに見せるだけで相談可能</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
