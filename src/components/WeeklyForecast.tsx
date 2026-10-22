import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Tornado } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DayForecast, WeatherStatus } from '../types';

interface WeeklyForecastProps {
  forecast: DayForecast[];
}

export const WeeklyForecast: React.FC<WeeklyForecastProps> = ({ forecast }) => {
  const { t } = useTranslation();

  const getWeatherIcon = (status: WeatherStatus) => {
    switch (status) {
      case 'sunny':
        return <Sun className="w-5 h-5 text-amber-500 stroke-[2.2]" />;
      case 'cloudy':
        return <Cloud className="w-5 h-5 text-slate-400 stroke-[2.2]" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-blue-500 stroke-[2.2]" />;
      case 'thunderstorm':
        return <CloudLightning className="w-5 h-5 text-amber-500 stroke-[2.2] animate-pulse" />;
      case 'typhoon':
        return <Tornado className="w-5 h-5 text-rose-600 stroke-[2.2] animate-bounce" />;
    }
  };

  const getWeatherCardStyle = (status: WeatherStatus, isToday: boolean) => {
    if (isToday) {
      return 'bg-white ring-2 ring-indigo-600 border-indigo-200 shadow-md';
    }
    switch (status) {
      case 'sunny':
        return 'bg-white/90 border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/20';
      case 'cloudy':
        return 'bg-white/90 border-slate-200/90 hover:border-slate-300';
      case 'rain':
        return 'bg-white/90 border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/20';
      case 'thunderstorm':
        return 'bg-amber-50/40 border-amber-200/90 hover:border-amber-400';
      case 'typhoon':
        return 'bg-rose-50/50 border-rose-200/90 hover:border-rose-400';
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>{t('forecast.title')}</span>
        </h3>
        <span className="text-xs text-slate-500">
          {t('forecast.note')}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
        {forecast.map((day, index) => {
          const isToday = index === forecast.length - 1;
          const labelText = day.dayLabelKey ? t(day.dayLabelKey as any) : day.dayLabel;
          const summaryText = day.summaryKey ? t(day.summaryKey as any, day.summaryParams) : day.summary;

          return (
            <div
              key={day.date}
              className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${getWeatherCardStyle(
                day.weather,
                isToday
              )}`}
            >
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs font-mono font-medium text-slate-600">{day.date}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  isToday ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                }`}>
                  {labelText}
                </span>
              </div>

              <div className="my-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 shadow-2xs">
                {getWeatherIcon(day.weather)}
              </div>

              <div className="mt-2 w-full">
                <div className="text-[11px] font-medium truncate text-slate-700" title={summaryText}>
                  {summaryText}
                </div>
                {day.vulnerabilityCount > 0 ? (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono font-medium">
                    {t('forecast.cveCount', { count: day.vulnerabilityCount })}
                  </span>
                ) : (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-medium">
                    {t('forecast.clean')}
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
