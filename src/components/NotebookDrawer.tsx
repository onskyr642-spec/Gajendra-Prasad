import React, { useState } from 'react';
import { X, BookOpen, Trash2, Copy, Download, Check, Calendar } from 'lucide-react';
import { SavedItem, LanguageCode } from '../types';
import { UI_TEXT } from '../data/translations';

interface NotebookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: SavedItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  language: LanguageCode;
}

export const NotebookDrawer: React.FC<NotebookDrawerProps> = ({
  isOpen,
  onClose,
  savedItems,
  onDeleteItem,
  onClearAll,
  language,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<string>('all');
  const ui = language === 'hi' ? UI_TEXT.hi : UI_TEXT.en;

  if (!isOpen) return null;

  const filtered = filterModule === 'all'
    ? savedItems
    : savedItems.filter((item) => item.mode === filterModule);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  const handleDownload = (item: SavedItem) => {
    const blob = new Blob([`${item.title}\n\n${item.content}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_').slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md sm:max-w-lg bg-amber-50 dark:bg-stone-900 h-full flex flex-col shadow-2xl border-l border-amber-200 dark:border-stone-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-200/80 dark:border-stone-800 bg-white dark:bg-stone-850 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-extrabold text-base sm:text-lg">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>{ui.common.savedItems}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-stone-700 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-stone-600">
              {savedItems.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {savedItems.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 px-2 py-1 rounded transition-colors cursor-pointer"
                title="Clear all"
              >
                {language === 'hi' ? 'सब हटाएं' : 'Clear all'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-amber-200/50 dark:border-stone-800 bg-amber-50/50 dark:bg-stone-900/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {['all', 'qa', 'writing', 'planner', 'explainer', 'decision'].map((mod) => (
            <button
              key={mod}
              onClick={() => setFilterModule(mod)}
              className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                filterModule === mod
                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-500/50'
              }`}
            >
              {mod === 'all'
                ? language === 'hi'
                  ? 'सभी'
                  : 'All'
                : ui.modules[mod as keyof typeof ui.modules]?.title || mod}
            </button>
          ))}
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <BookOpen className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">{ui.common.noSavedItems}</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-750 shadow-2xs hover:border-amber-300 dark:hover:border-amber-500/50 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopy(item.id, item.content)}
                      className="p-1.5 rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-750 cursor-pointer"
                      title="Copy"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(item)}
                      className="p-1.5 rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-750 cursor-pointer"
                      title="Download as .txt"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-md text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-750 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-stone-600 dark:text-stone-300 line-clamp-4 font-normal bg-stone-50 dark:bg-stone-800/90 p-2.5 rounded-lg whitespace-pre-wrap">
                  {item.content}
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 pt-1">
                  <span className="capitalize px-2 py-0.5 rounded-md bg-amber-50 dark:bg-stone-800 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200/60 dark:border-stone-700">
                    {ui.modules[item.mode]?.title || item.mode}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
