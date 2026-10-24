export type ModuleId = 'qa' | 'writing' | 'planner' | 'explainer' | 'decision';

export type LanguageCode = 'en' | 'hi' | 'hinglish' | 'bn' | 'mr' | 'ta' | 'te' | 'es';

export type ThemeMode = 'light' | 'dark';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mode?: ModuleId;
  language?: LanguageCode;
  isStreaming?: boolean;
}

export interface SavedItem {
  id: string;
  title: string;
  content: string;
  mode: ModuleId;
  language: LanguageCode;
  createdAt: number;
  tags?: string[];
}

export interface PromptPreset {
  id: string;
  title: string;
  titleHi: string;
  prompt: string;
  promptHi: string;
  category?: string;
  description?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  timeSlot?: string;
  completed: boolean;
  priority?: 'must' | 'normal' | 'optional';
}
