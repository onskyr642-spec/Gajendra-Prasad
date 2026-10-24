/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  HelpCircle,
  Mail,
  CalendarCheck,
  ListOrdered,
  Compass,
  ShieldCheck,
  Languages,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

import { ModuleId, LanguageCode, SavedItem, ChatMessage, ThemeMode } from './types';
import { UI_TEXT } from './data/translations';
import { Header } from './components/Header';
import { ModuleNav } from './components/ModuleNav';
import { PromptComposer } from './components/PromptComposer';
import { ResponseDisplay } from './components/ResponseDisplay';
import { NotebookDrawer } from './components/NotebookDrawer';

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('sahay_lang');
    return (saved as LanguageCode) || 'en';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('sahay_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [activeModule, setActiveModule] = useState<ModuleId>('qa');
  const [writingTone, setWritingTone] = useState<string>('polite');

  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isTransforming, setIsTransforming] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Chat conversation history for follow-ups
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Notebook saved items
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    try {
      const stored = localStorage.getItem('sahay_saved_notebook');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const responseEndRef = useRef<HTMLDivElement>(null);

  // Sync theme with DOM documentElement class and storage
  useEffect(() => {
    localStorage.setItem('sahay_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Persist language
  useEffect(() => {
    localStorage.setItem('sahay_lang', currentLanguage);
  }, [currentLanguage]);

  // Persist saved items
  useEffect(() => {
    try {
      localStorage.setItem('sahay_saved_notebook', JSON.stringify(savedItems));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [savedItems]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const ui = currentLanguage === 'hi' ? UI_TEXT.hi : UI_TEXT.en;
  const currentModuleInfo = ui.modules[activeModule];

  // Submit main prompt
  const handleGenerate = async (promptText: string, isFollowUp: boolean = false) => {
    if (!promptText.trim() || isGenerating) return;

    setErrorMessage(null);
    setIsGenerating(true);
    setIsStreaming(true);

    if (!isFollowUp) {
      setCurrentQuery(promptText);
      setCurrentResponse('');
      setChatHistory([]);
    } else {
      setChatHistory((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', content: promptText, timestamp: Date.now() },
      ]);
    }

    try {
      const historyPayload = chatHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      if (isFollowUp && currentResponse) {
        historyPayload.push({ role: 'model', content: currentResponse });
      }

      const response = await fetch('/api/assist/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          mode: activeModule,
          language: currentLanguage,
          tone: writingTone,
          history: historyPayload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setCurrentResponse(accumulated);
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // Ignore chunk boundary parsing
              }
            }
          }
        }
      }

      setIsStreaming(false);

      if (isFollowUp) {
        setChatHistory((prev) => [
          ...prev,
          { id: `m-${Date.now()}`, role: 'model', content: accumulated, timestamp: Date.now() },
        ]);
      }

      responseEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error generating assist response:', err);
      setErrorMessage(
        err?.message ||
          (currentLanguage === 'hi'
            ? 'क्षमा करें, उत्तर प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें।'
            : 'Sorry, there was an issue generating your response. Please try again.')
      );
      setIsStreaming(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Content transformations (Simplify, Shorten, Translate)
  const handleTransform = async (action: 'simplify' | 'shorten' | 'to_hindi' | 'to_english') => {
    if (!currentResponse || isTransforming) return;

    setIsTransforming(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/assist/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: currentResponse,
          action,
          targetLanguage: currentLanguage,
        }),
      });

      if (!res.ok) throw new Error('Transform request failed');
      const data = await res.json();
      if (data.text) {
        setCurrentResponse(data.text);
        if (action === 'to_hindi') setCurrentLanguage('hi');
        if (action === 'to_english') setCurrentLanguage('en');
      }
    } catch (err: any) {
      console.warn('Transform error:', err);
      setErrorMessage(err?.message || 'Could not transform response.');
    } finally {
      setIsTransforming(false);
    }
  };

  // Notebook handlers
  const handleSaveToNotebook = (item: Omit<SavedItem, 'id' | 'createdAt'>) => {
    const newItem: SavedItem = {
      ...item,
      id: `saved-${Date.now()}`,
      createdAt: Date.now(),
    };
    setSavedItems((prev) => [newItem, ...prev]);
  };

  const handleDeleteSavedItem = (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearNotebook = () => {
    if (window.confirm(currentLanguage === 'hi' ? 'क्या आप सभी सुरक्षित नोट हटाना चाहते हैं?' : 'Clear all saved items?')) {
      setSavedItems([]);
    }
  };

  const handleReset = () => {
    setCurrentQuery('');
    setCurrentResponse('');
    setChatHistory([]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        savedCount={savedItems.length}
        onOpenNotebook={() => setIsNotebookOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* 5 Core Feature Modules Navigation */}
      <ModuleNav
        activeModule={activeModule}
        onSelectModule={(mod) => {
          setActiveModule(mod);
        }}
        language={currentLanguage}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Module Banner / Quick Intro Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-100/70 via-orange-50/60 to-amber-50/70 dark:from-stone-900 dark:via-stone-850 dark:to-stone-900 border border-amber-200/70 dark:border-stone-800 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-200/70 dark:bg-amber-950/80 px-2 py-0.5 rounded-md">
                {currentModuleInfo.title}
              </span>
              <span className="text-stone-500 dark:text-stone-400 text-xs hidden sm:inline">•</span>
              <span className="text-xs font-medium text-stone-600 dark:text-stone-400 hidden sm:inline">
                {currentModuleInfo.subtitle}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium mt-1">
              {currentModuleInfo.description}
            </p>
          </div>

          {currentResponse && (
            <button
              onClick={handleReset}
              className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span>{ui.common.clearChat}</span>
            </button>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Prompt Input Composer */}
        <PromptComposer
          module={activeModule}
          language={currentLanguage}
          tone={writingTone}
          onToneChange={setWritingTone}
          onSubmit={(prompt) => handleGenerate(prompt, false)}
          isLoading={isGenerating}
        />

        {/* Response Display */}
        {currentResponse && (
          <div className="space-y-4 pt-2">
            <ResponseDisplay
              content={currentResponse}
              query={currentQuery}
              module={activeModule}
              language={currentLanguage}
              isStreaming={isStreaming}
              onSaveToNotebook={handleSaveToNotebook}
              onTransformContent={handleTransform}
              isTransforming={isTransforming}
              onFollowUpSubmit={(text) => handleGenerate(text, true)}
              isGenerating={isGenerating}
            />
          </div>
        )}

        <div ref={responseEndRef} />

        {/* Feature Highlights Footer Cards (Shown when no response is yet active) */}
        {!currentResponse && !isGenerating && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-1.5 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-stone-800 flex items-center justify-center text-amber-800 dark:text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm">
                {currentLanguage === 'hi' ? 'सरल व स्पष्ट भाषा' : 'Simple Language'}
              </h4>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
                {currentLanguage === 'hi'
                  ? 'बिना किसी कठिन शब्दों के, समझने में बिल्कुल आसान और रोज़मर्रा की ज़िंदगी के अनुकूल।'
                  : 'Plain answers with relatable analogies, free of jargon or convoluted explanations.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-1.5 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-stone-800 flex items-center justify-center text-orange-800 dark:text-orange-400">
                <Languages className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm">
                {currentLanguage === 'hi' ? 'हिन्दी व कई भाषाएं' : 'Hindi, English & More'}
              </h4>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
                {currentLanguage === 'hi'
                  ? 'हिन्दी, English, हिंग्लिश और क्षेत्रीय भाषाओं में पूर्ण समर्थन। बोलकर भी पूछ सकते हैं।'
                  : 'Full support for natural Hindi, English, Hinglish, Bengali, Marathi, Tamil, and more with voice input.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-1.5 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-stone-800 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm">
                {currentLanguage === 'hi' ? 'काम आने वाले परिणाम' : 'Ready to Send & Use'}
              </h4>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
                {currentLanguage === 'hi'
                  ? 'तैयार पत्र व आवेदन, इंटरैक्टिव दिनचर्या चेकलिस्ट और अपनी नोटबुक में सहेजने की सुविधा।'
                  : 'Copy-ready letter drafts with bracketed fill-ins, interactive to-do checklists, and saved notebook.'}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Notebook Slide-over Drawer */}
      <NotebookDrawer
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        savedItems={savedItems}
        onDeleteItem={handleDeleteSavedItem}
        onClearAll={handleClearNotebook}
        language={currentLanguage}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-amber-200/50 dark:border-stone-850 bg-white/60 dark:bg-stone-900/60 py-4 px-4 text-center text-xs text-stone-500 dark:text-stone-400 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sahay AI (सहायक) • Everyday questions, writing, daily plans & step-by-step guidance</span>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">Powered by Gemini 3.8 Flash</span>
        </div>
      </footer>
    </div>
  );
}
