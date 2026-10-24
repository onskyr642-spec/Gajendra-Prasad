import React from 'react';
import { HelpCircle, Mail, CalendarCheck, ListOrdered, Compass } from 'lucide-react';
import { ModuleId, LanguageCode } from '../types';
import { UI_TEXT } from '../data/translations';

interface ModuleNavProps {
  activeModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
  language: LanguageCode;
}

export const ModuleNav: React.FC<ModuleNavProps> = ({
  activeModule,
  onSelectModule,
  language,
}) => {
  const ui = language === 'hi' ? UI_TEXT.hi : UI_TEXT.en;

  const modules: Array<{
    id: ModuleId;
    icon: React.ComponentType<{ className?: string }>;
    titleEn: string;
    titleHi: string;
    subEn: string;
    subHi: string;
    badge?: string;
  }> = [
    {
      id: 'qa',
      icon: HelpCircle,
      titleEn: 'Everyday Q&A',
      titleHi: 'सरल जवाब',
      subEn: 'Answers in simple words',
      subHi: 'रोज़ के सवालों के आसान उत्तर',
    },
    {
      id: 'writing',
      icon: Mail,
      titleEn: 'Write & Apply',
      titleHi: 'पत्र व संदेश',
      subEn: 'Emails, applications & notes',
      subHi: 'आवेदन, ईमेल व WhatsApp',
    },
    {
      id: 'planner',
      icon: CalendarCheck,
      titleEn: 'Daily Planner',
      titleHi: 'दैनिक योजना',
      subEn: 'Calm plans & to-do checklists',
      subHi: 'दिनचर्या व कार्य सूची',
    },
    {
      id: 'explainer',
      icon: ListOrdered,
      titleEn: 'Step-by-Step',
      titleHi: 'कदम दर कदम',
      subEn: 'Complex things made easy',
      subHi: 'प्रक्रियाएं चरणबद्ध समझें',
    },
    {
      id: 'decision',
      icon: Compass,
      titleEn: 'Think Through',
      titleHi: 'सोच-विचार',
      subEn: 'Everyday dilemma companion',
      subHi: 'उलझनों का शांत समाधान',
    },
  ];

  return (
    <div className="w-full bg-white/70 dark:bg-stone-900/80 backdrop-blur-xs border-b border-amber-200/50 dark:border-stone-800 py-2.5 px-3 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar py-1">
        {modules.map((m) => {
          const Icon = m.icon;
          const isActive = activeModule === m.id;
          const title = language === 'hi' ? m.titleHi : m.titleEn;
          const sub = language === 'hi' ? m.subHi : m.subEn;

          return (
            <button
              key={m.id}
              onClick={() => onSelectModule(m.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap text-left border cursor-pointer ${
                isActive
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20 ring-2 ring-amber-500/30'
                  : 'bg-white dark:bg-stone-800/90 hover:bg-amber-50/80 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-500/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-amber-700/60 text-white'
                    : 'bg-amber-100 dark:bg-stone-700 text-amber-700 dark:text-amber-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span className={isActive ? 'text-white' : 'text-stone-900 dark:text-stone-100'}>
                    {title}
                  </span>
                </div>
                <div
                  className={`text-[10px] leading-tight font-normal truncate max-w-[140px] sm:max-w-[170px] ${
                    isActive ? 'text-amber-100' : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
