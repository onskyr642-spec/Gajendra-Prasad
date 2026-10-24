import React from 'react';
import { Sparkles, Globe, BookOpen, Sun, Moon } from 'lucide-react';
import { LanguageCode, ThemeMode } from '../types';
import { SUPPORTED_LANGUAGES, UI_TEXT } from '../data/translations';

interface HeaderProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  savedCount: number;
  onOpenNotebook: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  savedCount,
  onOpenNotebook,
  theme,
  onToggleTheme,
}) => {
  const ui = currentLanguage === 'hi' ? UI_TEXT.hi : UI_TEXT.en;
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-30 bg-amber-50/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-amber-200/60 dark:border-stone-800 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-400/30">
            <Sparkles className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-stone-900 dark:text-stone-100">
                Sahay <span className="text-amber-600 dark:text-amber-400 font-bold">AI</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-medium hidden sm:inline-block border border-amber-200 dark:border-amber-800">
                सहायक • Everyday Companion
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-normal hidden md:block">
              {ui.tagline} • Simple answers, letters, daily routines & clear thinking
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Language switch buttons: EN / HI */}
          <div className="inline-flex rounded-lg p-0.5 bg-stone-200/80 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-semibold">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                currentLanguage === 'en'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
              title="English"
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                currentLanguage === 'hi'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
              title="हिन्दी (Hindi)"
            >
              हिन्दी
            </button>
          </div>

          {/* Full Language Dropdown */}
          <div className="relative flex items-center">
            <label htmlFor="lang-select" className="sr-only">
              {ui.common.languageSelectorLabel}
            </label>
            <div className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg border border-amber-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium text-stone-700 dark:text-stone-200 hover:border-amber-400 dark:hover:border-amber-500 transition-colors shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <select
                id="lang-select"
                value={currentLanguage}
                onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                className="bg-transparent text-xs font-medium text-stone-800 dark:text-stone-200 pr-1 py-0.5 focus:outline-hidden cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="dark:bg-stone-800 dark:text-stone-100">
                    {lang.nativeLabel} ({lang.label})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-500 transition-colors shadow-2xs cursor-pointer flex items-center justify-center"
            title={isDark ? ui.common.themeLight : ui.common.themeDark}
            aria-label={isDark ? ui.common.themeLight : ui.common.themeDark}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>

          {/* My Notebook / Saved Items Button */}
          <button
            onClick={onOpenNotebook}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300/80 dark:border-amber-800/80 bg-amber-100/70 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-amber-900 dark:text-amber-300 text-xs font-semibold transition-all shadow-2xs relative cursor-pointer"
            title={ui.common.savedItems}
          >
            <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="hidden sm:inline">{ui.common.savedItems}</span>
            {savedCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
