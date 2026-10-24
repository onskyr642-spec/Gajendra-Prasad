import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Radio } from 'lucide-react';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';
import { LanguageCode } from '../types';

interface VoiceInputButtonProps {
  language: LanguageCode;
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  language,
  onTranscript,
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) {
      alert(
        language === 'hi'
          ? 'आपके ब्राउज़र में वॉइस-टू-टेक्स्ट उपलब्ध नहीं है। कृपया लिखकर बताएं।'
          : 'Voice-to-text is not supported in this browser. Please type your query.'
      );
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    setStatusNotice(null);

    const recognizer = createSpeechRecognizer({
      lang: language,
      onStart: () => {
        setIsListening(true);
      },
      onInterim: (interim) => {
        if (interim) {
          onTranscript(interim);
        }
      },
      onResult: (finalText) => {
        if (finalText) {
          onTranscript(finalText);
        }
      },
      onError: (errMsg) => {
        console.warn('Voice recognition notice:', errMsg);
        setStatusNotice(errMsg);
        stopListening();
        setTimeout(() => setStatusNotice(null), 4000);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (recognizer) {
      recognitionRef.current = recognizer;
      try {
        recognizer.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start recognition:', err);
        setIsListening(false);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  const isSmall = size === 'sm';

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        className={`relative flex items-center justify-center gap-1.5 rounded-xl border transition-all cursor-pointer ${
          isSmall ? 'p-2' : 'px-3 py-2'
        } ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-md shadow-red-500/30 ring-3 ring-red-400/40 animate-pulse'
            : 'bg-stone-100 dark:bg-stone-800 hover:bg-amber-100/60 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 hover:text-amber-900 dark:hover:text-amber-300 border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-500'
        } ${className}`}
        title={
          isListening
            ? language === 'hi'
              ? 'सुनना बंद करें (क्लिक करें)'
              : 'Stop listening (tap to stop)'
            : language === 'hi'
            ? 'बोलकर लिखें (माइक्रोफ़ोन)'
            : 'Dictate query with voice'
        }
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
      >
        {isListening ? (
          <>
            <MicOff className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white shrink-0`} />
            {showLabel && (
              <span className="text-xs font-bold text-white pr-0.5">
                {language === 'hi' ? 'सुन रहे हैं...' : 'Listening...'}
              </span>
            )}
          </>
        ) : (
          <>
            <Mic className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-amber-600 dark:text-amber-400 shrink-0`} />
            {showLabel && (
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 pr-0.5">
                {language === 'hi' ? 'बोलें' : 'Speak'}
              </span>
            )}
          </>
        )}

        {isListening && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
        )}
      </button>

      {/* Floating mini status tooltip if error occurs */}
      {statusNotice && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-56 p-2 rounded-lg bg-stone-900 text-white text-[11px] shadow-lg border border-stone-700">
          {statusNotice}
        </div>
      )}
    </div>
  );
};
