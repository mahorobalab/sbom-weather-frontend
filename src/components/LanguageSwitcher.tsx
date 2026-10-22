import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  type LanguageMode,
  getStoredLanguageMode,
  setLanguagePreference,
} from '../i18n';

export const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const [currentMode, setCurrentMode] = useState<LanguageMode>(() => getStoredLanguageMode());
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectMode = (mode: LanguageMode) => {
    setCurrentMode(mode);
    setLanguagePreference(mode);
    setIsOpen(false);
  };

  const options: { mode: LanguageMode; labelKey: 'common.auto' | 'common.english' | 'common.japanese'; display: string }[] = [
    { mode: 'auto', labelKey: 'common.auto', display: t('common.auto') },
    { mode: 'en', labelKey: 'common.english', display: t('common.english') },
    { mode: 'ja', labelKey: 'common.japanese', display: t('common.japanese') },
  ];

  const currentOption = options.find((opt) => opt.mode === currentMode) || options[0];

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={t('common.language')}
      >
        <Globe className="w-3.5 h-3.5 text-indigo-600" />
        <span className="font-semibold text-slate-800">{currentOption.display}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {t('common.language')}
          </div>
          {options.map((opt) => {
            const isSelected = opt.mode === currentMode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => handleSelectMode(opt.mode)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-indigo-50/80 text-indigo-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{opt.display}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
