import React, { useState } from 'react';
import { Send, CornerDownLeft, Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { ModuleId, LanguageCode } from '../types';
import { MODULE_PRESETS } from '../data/presets';
import { UI_TEXT } from '../data/translations';
import { VoiceInputButton } from './VoiceInputButton';

interface PromptComposerProps {
  module: ModuleId;
  language: LanguageCode;
  tone: string;
  onToneChange: (tone: string) => void;
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export const PromptComposer: React.FC<PromptComposerProps> = ({
  module,
  language,
  tone,
  onToneChange,
  onSubmit,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const ui = language === 'hi' ? UI_TEXT.hi : UI_TEXT.en;
  const moduleInfo = ui.modules[module];
  const presets = MODULE_PRESETS[module] || [];

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const applyPreset = (presetPrompt: string) => {
    setInput(presetPrompt);
  };

  const handleVoiceTranscript = (dictatedText: string) => {
    setInput((prev) => {
      const cleanPrev = prev.trim();
      if (!cleanPrev) return dictatedText;
      if (cleanPrev.endsWith(dictatedText)) return cleanPrev;
      return `${cleanPrev} ${dictatedText}`;
    });
  };

  return (
    <div className="w-full space-y-3">
      {/* Example Prompt Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{ui.common.tryThese}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {presets.map((preset) => {
            const label = language === 'hi' ? preset.titleHi : preset.title;
            const fullPrompt = language === 'hi' ? preset.promptHi : preset.prompt;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(fullPrompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-amber-100/60 dark:bg-stone-850 hover:bg-amber-200/80 dark:hover:bg-stone-800 border border-amber-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 transition-colors whitespace-nowrap text-left shrink-0 shadow-2xs cursor-pointer"
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Box */}
      <div className="relative rounded-2xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-750 focus-within:border-amber-500 dark:focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-400/20 shadow-md transition-all">
        {/* Module Extra Options (e.g. Tone for Writing mode) */}
        {module === 'writing' && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850 rounded-t-2xl text-xs text-stone-600 dark:text-stone-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 shrink-0" />
            <span className="font-semibold text-stone-700 dark:text-stone-200">{ui.common.tone}</span>
            <div className="flex flex-wrap gap-1">
              {(['polite', 'warm', 'short', 'formal'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onToneChange(t)}
                  className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                    tone === t
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-400 dark:hover:border-amber-500'
                  }`}
                >
                  {ui.common.tones[t]}
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={moduleInfo.placeholder}
          rows={3}
          className="w-full px-4 pt-3 pb-2 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 text-sm sm:text-base resize-none focus:outline-hidden rounded-2xl bg-transparent"
        />

        {/* Bottom toolbar inside input box */}
        <div className="flex items-center justify-between px-3 pb-2 pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* Voice-to-Text Input Button */}
            <VoiceInputButton
              language={language}
              onTranscript={handleVoiceTranscript}
              showLabel={true}
              size="md"
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="px-2.5 py-1.5 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                {language === 'hi' ? 'साफ करें' : 'Clear'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-400 dark:text-stone-500 hidden sm:inline-flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" />
              <span>Enter to send</span>
            </span>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{ui.common.generating}</span>
                </>
              ) : (
                <>
                  <span>{ui.common.send}</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
