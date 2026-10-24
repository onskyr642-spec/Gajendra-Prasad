// Helper for browser Speech Recognition & Text-to-Speech

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export interface SpeechRecognizerOptions {
  lang: string;
  onInterim?: (text: string) => void;
  onResult: (finalText: string) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onEnd: () => void;
}

export function createSpeechRecognizer(options: SpeechRecognizerOptions) {
  if (!isSpeechRecognitionSupported()) {
    options.onError('Speech recognition is not supported in this browser.');
    return null;
  }

  const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechClass();

  // Language mapping
  let recognitionLang = 'en-IN';
  if (options.lang === 'hi') recognitionLang = 'hi-IN';
  else if (options.lang === 'hinglish') recognitionLang = 'hi-IN';
  else if (options.lang === 'bn') recognitionLang = 'bn-IN';
  else if (options.lang === 'mr') recognitionLang = 'mr-IN';
  else if (options.lang === 'ta') recognitionLang = 'ta-IN';
  else if (options.lang === 'te') recognitionLang = 'te-IN';
  else if (options.lang === 'es') recognitionLang = 'es-ES';
  else recognitionLang = 'en-US';

  recognition.lang = recognitionLang;
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  let finalTranscript = '';

  recognition.onstart = () => {
    options.onStart?.();
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcriptPiece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += (finalTranscript ? ' ' : '') + transcriptPiece.trim();
        options.onResult(finalTranscript);
      } else {
        interimTranscript += transcriptPiece;
        options.onInterim?.(interimTranscript);
      }
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      options.onError('Microphone permission was denied. Please allow microphone access in your browser.');
    } else if (event.error === 'no-speech') {
      // Normal timeout when no speech is detected
      options.onError('No speech detected. Please try speaking closer to your mic.');
    } else if (event.error === 'network') {
      options.onError('Speech network connection error.');
    } else {
      options.onError(`Voice error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    options.onEnd();
  };

  return recognition;
}

// Play audio via server TTS or browser SpeechSynthesis fallback
export async function playTextAudio(
  text: string,
  lang: string,
  onStart: () => void,
  onEnd: () => void,
  onError: (err: any) => void
): Promise<() => void> {
  onStart();

  // Attempt server-side high-quality TTS first
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: lang }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(data.audio);
        audio.onended = () => onEnd();
        audio.onerror = () => {
          fallbackBrowserSpeech(text, lang, onEnd, onError);
        };
        audio.play().catch(() => {
          fallbackBrowserSpeech(text, lang, onEnd, onError);
        });
        return () => {
          audio.pause();
          audio.currentTime = 0;
          onEnd();
        };
      }
    }
  } catch (err) {
    console.warn('Server TTS unavailable, using browser speech:', err);
  }

  // Fallback to Web Speech Synthesis
  return fallbackBrowserSpeech(text, lang, onEnd, onError);
}

function fallbackBrowserSpeech(
  text: string,
  lang: string,
  onEnd: () => void,
  onError: (err: any) => void
): () => void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onError('Speech synthesis not supported');
    onEnd();
    return () => {};
  }

  window.speechSynthesis.cancel();

  // Clean markdown syntax for speech
  const speechText = text
    .replace(/[#*`_\[\]()>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);

  const utterance = new SpeechSynthesisUtterance(speechText);
  if (lang === 'hi' || lang === 'hinglish') {
    utterance.lang = 'hi-IN';
  } else if (lang === 'bn') {
    utterance.lang = 'bn-IN';
  } else if (lang === 'mr') {
    utterance.lang = 'mr-IN';
  } else if (lang === 'es') {
    utterance.lang = 'es-ES';
  } else {
    utterance.lang = 'en-US';
  }

  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  utterance.onend = () => onEnd();
  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    onError(e);
    onEnd();
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
    onEnd();
  };
}
