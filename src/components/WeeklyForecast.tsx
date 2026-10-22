import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Tornado } from 'lucide-react';
import type { DayForecast, WeatherStatus } from '../types';

interface WeeklyForecastProps {
  forecast: DayForecast[];
}

export const WeeklyForecast: React.FC<WeeklyForecastProps> = ({ forecast }) => {
  const getWeatherIcon = (status: WeatherStatus) => {
    switch (status) {
      case 'sunny':
        return <Sun className="w-5 h-5 text-emerald-400" />;
      case 'cloudy':
        return <Cloud className="w-5 h-5 text-sky-400" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-blue-400" />;
      case 'thunderstorm':
        return <CloudLightning className="w-5 h-5 text-purple-400 animate-pulse" />;
      case 'typhoon':
        return <Tornado className="w-5 h-5 text-rose-400 animate-bounce" />;
    }
  };

  const getWeatherBorder = (status: WeatherStatus) => {
    switch (status) {
      case 'sunny':
        return 'border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40';
      case 'cloudy':
        return 'border-sky-500/20 bg-sky-950/10 hover:border-sky-500/40';
      case 'rain':
        return 'border-blue-500/30 bg-blue-950/20 hover:border-blue-500/50';
      case 'thunderstorm':
        return 'border-purple-500/40 bg-purple-950/30 hover:border-purple-500/60 ring-1 ring-purple-500/20';
      case 'typhoon':
        return 'border-rose-500/50 bg-rose-950/40 hover:border-rose-500/80 ring-1 ring-rose-500/30';
    }
  };

  return (
    <div className="rounded-2xl glass-panel p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span>週間セキュリティ予報（直近7日間の推移）</span>
        </h3>
        <span className="text-xs text-slate-500">
          ※ 放置期間が長引くと「雨」から「雷雨」「台風」へ悪化します
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
        {forecast.map((day, index) => {
          const isToday = index === forecast.length - 1;
          return (
            <div
              key={day.date}
              className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${getWeatherBorder(
                day.weather
              )} ${isToday ? 'bg-slate-800/60 shadow-lg' : ''}`}
            >
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs font-mono text-slate-400">{day.date}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isToday ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-500'}`}>
                  {day.dayLabel}
                </span>
              </div>

              <div className="my-1.5 p-2 rounded-lg bg-slate-900/60 border border-white/5">
                {getWeatherIcon(day.weather)}
              </div>

              <div className="mt-2 w-full">
                <div className="text-[11px] font-medium truncate text-slate-300" title={day.summary}>
                  {day.summary}
                </div>
                {day.vulnerabilityCount > 0 ? (
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                    CVE: {day.vulnerabilityCount}件
                  </span>
                ) : (
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    異常なし
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
