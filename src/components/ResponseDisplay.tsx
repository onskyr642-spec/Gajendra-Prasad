import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Bookmark,
  Sparkles,
  Minimize2,
  Languages,
  RotateCcw,
  CheckCircle2,
  Share2,
  FileDown,
  Loader2,
  Clock,
  MessageSquare,
  Send,
} from 'lucide-react';
import { ModuleId, LanguageCode, SavedItem } from '../types';
import { UI_TEXT } from '../data/translations';
import { playTextAudio } from '../utils/speech';
import { InteractivePlanner } from './InteractivePlanner';
import { VoiceInputButton } from './VoiceInputButton';

interface ResponseDisplayProps {
  content: string;
  query: string;
  module: ModuleId;
  language: LanguageCode;
  isStreaming?: boolean;
  onSaveToNotebook: (item: Omit<SavedItem, 'id' | 'createdAt'>) => void;
  onTransformContent: (action: 'simplify' | 'shorten' | 'to_hindi' | 'to_english') => void;
  isTransforming?: boolean;
  onFollowUpSubmit?: (prompt: string) => void;
  isGenerating?: boolean;
}

interface FollowUpChip {
  id: string;
  labelEn: string;
  labelHi: string;
  promptEn: string;
  promptHi: string;
}

// Generate contextually relevant quick follow-up chips based on module & response
function getSuggestedFollowUps(module: ModuleId): FollowUpChip[] {
  const universalChips: FollowUpChip[] = [
    {
      id: 'summarize',
      labelEn: 'Summarize',
      labelHi: 'मुख्य बिंदु संक्षेप में',
      promptEn: 'Please summarize the main key takeaways in 3 clear bullet points.',
      promptHi: 'कृपया इस उत्तर के मुख्य बिंदु 3 स्पष्ट बिंदुओं में संक्षेप में बताएं।',
    },
    {
      id: 'shorter',
      labelEn: 'Make it shorter',
      labelHi: 'और छोटा करें',
      promptEn: 'Make this response much shorter, punchy, and direct to the point.',
      promptHi: 'इस उत्तर को काफी छोटा, सीधा और संक्षिप्त बनाकर दें।',
    },
    {
      id: 'more_details',
      labelEn: 'Ask more details',
      labelHi: 'विस्तार से बताएं',
      promptEn: 'Could you explain this in deeper detail with extra context and practical background?',
      promptHi: 'कृपया इसे थोड़ा और विस्तार और व्यावहारिक उदाहरण के साथ समझाएं।',
    },
  ];

  let moduleChips: FollowUpChip[] = [];

  switch (module) {
    case 'qa':
      moduleChips = [
        {
          id: 'eli10',
          labelEn: "Explain like I'm 10",
          labelHi: 'सरल उदाहरण से समझाएं',
          promptEn: 'Can you explain this again using a very simple everyday real-life analogy?',
          promptHi: 'क्या आप इसे किसी बहुत आसान रोज़मर्रा के उदाहरण से समझा सकते हैं?',
        },
        {
          id: 'mistakes',
          labelEn: 'Mistakes to avoid',
          labelHi: 'किन गलतियों से बचें?',
          promptEn: 'What are the top common mistakes or scams people should avoid regarding this?',
          promptHi: 'इस संबंध में लोगों से आमतौर पर कौन सी गलतियां हो जाती हैं और उनसे कैसे बचें?',
        },
      ];
      break;

    case 'writing':
      moduleChips = [
        {
          id: 'polite',
          labelEn: 'Make it more polite',
          labelHi: 'और विनम्र बनाएं',
          promptEn: 'Please rewrite this to sound extra respectful, warm, and humble.',
          promptHi: 'कृपया इसे और अधिक विनम्र, शिष्ट और आदरपूर्वक बनाकर लिखें।',
        },
        {
          id: 'whatsapp_version',
          labelEn: 'Draft WhatsApp version',
          labelHi: 'WhatsApp मेसेज बनाएं',
          promptEn: 'Convert this into a short, polite 2-sentence WhatsApp message.',
          promptHi: 'इसे WhatsApp पर भेजने योग्य 2 लाइनों का छोटा और विनम्र संदेश बना दें।',
        },
        {
          id: 'followup_note',
          labelEn: 'Draft a follow-up reminder',
          labelHi: 'फॉलो-अप रिमाइंडर लिखें',
          promptEn: 'Draft a short, gentle follow-up note to send if there is no reply in 3 days.',
          promptHi: 'अगर 3 दिन तक जवाब न आए तो भेजने के लिए एक छोटा और विनम्र रिमाइंडर लिखें।',
        },
      ];
      break;

    case 'planner':
      moduleChips = [
        {
          id: 'add_breaks',
          labelEn: 'Add more breaks',
          labelHi: 'आराम का समय जोड़ें',
          promptEn: 'Please adjust this plan to include realistic 15-minute breaks and breathing room.',
          promptHi: 'कृपया इस योजना में हर काम के बीच 15 मिनट का आराम और चाय/पानी का समय जोड़ें।',
        },
        {
          id: 'top_priorities',
          labelEn: 'Top 2 must-dos',
          labelHi: '2 सबसे ज़रूरी काम बताएं',
          promptEn: 'If I can only finish 2 things from this list today, which two should I prioritize?',
          promptHi: 'अगर मैं आज इस सूची में से सिर्फ 2 काम ही कर पाऊं, तो कौन से 2 सबसे ज़रूरी होंगे?',
        },
      ];
      break;

    case 'explainer':
      moduleChips = [
        {
          id: 'documents',
          labelEn: 'Required documents',
          labelHi: 'दस्तावेजों की सूची',
          promptEn: 'What exact documents, IDs, or items do I need to keep ready before doing this?',
          promptHi: 'यह काम शुरू करने से पहले मुझे कौन-कौन से ज़रूरी दस्तावेज़ पास रखने होंगे?',
        },
        {
          id: 'if_fails',
          labelEn: 'What if it fails?',
          labelHi: 'काम न बने तो क्या करें?',
          promptEn: 'What should I do if this process gets stuck or fails? What is the backup option?',
          promptHi: 'अगर यह प्रक्रिया बीच में अटक जाए या काम न बने, तो मुझे आगे क्या करना चाहिए?',
        },
      ];
      break;

    case 'decision':
      moduleChips = [
        {
          id: 'worst_case',
          labelEn: 'Worst-case scenario',
          labelHi: 'सबसे बुरा क्या हो सकता है?',
          promptEn: 'What is the absolute worst-case scenario for both options, and how could I handle it?',
          promptHi: 'दोनों विकल्पों में सबसे खराब क्या हो सकता है, और मैं उससे कैसे निपट सकता हूँ?',
        },
        {
          id: 'today_step',
          labelEn: '1 action for today',
          labelHi: 'आज के लिए 1 आसान कदम',
          promptEn: 'What is just 1 small, low-stress step I can take today to move closer to a decision?',
          promptHi: 'फैसला लेने की दिशा में आज मैं कौन सा 1 छोटा और आसान कदम उठा सकता हूँ?',
        },
      ];
      break;
  }

  return [...universalChips, ...moduleChips];
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({
  content,
  query,
  module,
  language,
  isStreaming = false,
  onSaveToNotebook,
  onTransformContent,
  isTransforming = false,
  onFollowUpSubmit,
  isGenerating = false,
}) => {
  const ui = language === 'hi' ? UI_TEXT.hi : UI_TEXT.en;
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSaved, setPdfSaved] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [stopAudioFn, setStopAudioFn] = useState<(() => void) | null>(null);
  const [followUpText, setFollowUpText] = useState('');

  const contentContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const suggestedChips = getSuggestedFollowUps(module);

  // Track reading scroll progress through the response
  useEffect(() => {
    const calculateProgress = () => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const cardHeight = rect.height;

      if (cardHeight <= windowHeight * 0.7) {
        setScrollProgress(100);
        return;
      }

      const headerOffset = 70;
      const scrolledPastTop = headerOffset - rect.top;
      const totalScrollDistance = cardHeight - (windowHeight - headerOffset);

      if (totalScrollDistance <= 0) {
        setScrollProgress(100);
        return;
      }

      const progress = (scrolledPastTop / totalScrollDistance) * 100;
      const clamped = Math.min(100, Math.max(0, Math.round(progress)));
      setScrollProgress(clamped);
    };

    window.addEventListener('scroll', calculateProgress, { passive: true });
    window.addEventListener('resize', calculateProgress, { passive: true });
    calculateProgress();

    return () => {
      window.removeEventListener('scroll', calculateProgress);
      window.removeEventListener('resize', calculateProgress);
    };
  }, [content, isStreaming]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  const handleShare = async () => {
    const shareTitle = query ? `Sahay AI: ${query.slice(0, 50)}` : 'Sahay AI Answer';
    const shareData = {
      title: shareTitle,
      text: content,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
        console.warn('Web Share failed, falling back to clipboard copy:', err);
      }
    }

    try {
      await navigator.clipboard.writeText(content);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const handleSave = () => {
    onSaveToNotebook({
      title: query.slice(0, 50) || 'Saved Sahay Answer',
      content,
      mode: module,
      language,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExportPdf = async () => {
    if (!contentContainerRef.current || isExportingPdf) return;

    setIsExportingPdf(true);

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const safeName = (query || 'Sahay_Response')
        .replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 30);
      const filename = `${safeName || 'Sahay_Export'}.pdf`;

      const printContainer = document.createElement('div');
      printContainer.style.width = '700px';
      printContainer.style.padding = '28px 32px';
      printContainer.style.backgroundColor = '#ffffff';
      printContainer.style.color = '#1c1917';
      printContainer.style.fontFamily = "'Plus Jakarta Sans', 'Noto Sans Devanagari', -apple-system, sans-serif";
      printContainer.style.lineHeight = '1.6';

      const dateStr = new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const contentHtml = contentContainerRef.current.innerHTML;

      printContainer.innerHTML = `
        <div style="border-bottom: 2px solid #d97706; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 20px; font-weight: 800; color: #1c1917; margin: 0; display: flex; align-items: center; gap: 6px;">
              Sahay AI <span style="color: #d97706; font-size: 16px;">(सहायक)</span>
            </div>
            <div style="font-size: 11px; color: #78716c; margin-top: 3px; font-weight: 500;">
              ${ui.modules[module]?.title || 'Everyday Helper'} • Everyday Companion
            </div>
          </div>
          <div style="font-size: 11px; color: #78716c; font-weight: 500;">
            ${dateStr}
          </div>
        </div>

        ${
          query
            ? `<div style="background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; font-size: 12px; font-weight: 600; color: #292524;">
                <span style="color: #d97706; margin-right: 6px;">●</span>${query}
              </div>`
            : ''
        }

        <div style="font-size: 13px; color: #1c1917; line-height: 1.7;">
          ${contentHtml}
        </div>

        <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #e7e5e4; font-size: 10px; color: #a8a29e; text-align: center;">
          Generated with Sahay AI • Simple answers, letters, daily plans & step-by-step guidance
        </div>
      `;

      printContainer.querySelectorAll('p').forEach((el: any) => {
        el.style.color = '#1c1917';
        el.style.margin = '8px 0';
      });
      printContainer.querySelectorAll('h2, h3, h4').forEach((el: any) => {
        el.style.color = '#1c1917';
      });
      printContainer.querySelectorAll('strong').forEach((el: any) => {
        el.style.color = '#0c0a09';
      });

      const opt = {
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          backgroundColor: '#ffffff',
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await (html2pdf as any)().set(opt).from(printContainer).save();
      setPdfSaved(true);
      setTimeout(() => setPdfSaved(false), 2500);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Could not export PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleToggleAudio = async () => {
    if (isPlayingAudio && stopAudioFn) {
      stopAudioFn();
      setIsPlayingAudio(false);
      setStopAudioFn(null);
      return;
    }

    const cancel = await playTextAudio(
      content,
      language,
      () => setIsPlayingAudio(true),
      () => {
        setIsPlayingAudio(false);
        setStopAudioFn(null);
      },
      (err) => {
        console.warn('Audio playback error:', err);
        setIsPlayingAudio(false);
        setStopAudioFn(null);
      }
    );

    setStopAudioFn(() => cancel);
  };

  const calculateReadingTime = (text: string, lang: LanguageCode): string => {
    if (!text || !text.trim()) return '';
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 180));

    if (lang === 'hi') {
      return `${minutes} मिनट में पढ़ें`;
    }
    return `${minutes} min read`;
  };

  const handleChipClick = (promptText: string) => {
    setFollowUpText(promptText);
    onFollowUpSubmit?.(promptText);
  };

  const handleFollowUpFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isGenerating) return;
    onFollowUpSubmit?.(followUpText.trim());
    setFollowUpText('');
  };

  const handleVoiceTranscript = (dictated: string) => {
    setFollowUpText((prev) => {
      const clean = prev.trim();
      if (!clean) return dictated;
      if (clean.endsWith(dictated)) return clean;
      return `${clean} ${dictated}`;
    });
  };

  // Render markdown with nice typography and highlighted placeholders
  const renderFormattedContent = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-stone-900 dark:text-stone-100 text-base sm:text-lg mt-4 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-extrabold text-stone-900 dark:text-stone-100 text-lg sm:text-xl mt-5 mb-2.5 border-b border-amber-200/60 dark:border-stone-800 pb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="font-extrabold text-stone-900 dark:text-stone-100 text-xl sm:text-2xl mt-6 mb-3">
            {line.replace('# ', '')}
          </h2>
        );
      }

      const stepMatch = line.match(/^(\*{0,2}(?:Step|चरण)\s*\d+[:.]?\*{0,2})(.*)$/i);
      if (stepMatch) {
        return (
          <div key={idx} className="my-2 p-3 rounded-xl bg-amber-50 dark:bg-stone-850 border border-amber-200/90 dark:border-stone-750 text-stone-900 dark:text-stone-200 font-medium">
            <span className="inline-block px-2 py-0.5 rounded-md bg-amber-600 text-white font-bold text-xs mr-2">
              {stepMatch[1].replace(/\*/g, '').trim()}
            </span>
            <span>{renderInlineText(stepMatch[2])}</span>
          </div>
        );
      }

      if (/^[\s*-]*\[[ xX]\]/.test(line)) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-stone-800 dark:text-stone-200">
            <span className="text-amber-600 dark:text-amber-400 mt-1">▫️</span>
            <span>{renderInlineText(line.replace(/^[\s*-]*\[[ xX]\]/, '').trim())}</span>
          </div>
        );
      }

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1.5 pl-2 text-stone-800 dark:text-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
            <span className="text-sm sm:text-base leading-relaxed">{renderInlineText(line.replace(/^[\s*-]+/, ''))}</span>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-2"></div>;
      }

      return (
        <p key={idx} className="text-stone-800 dark:text-stone-200 text-sm sm:text-base leading-relaxed my-1.5">
          {renderInlineText(line)}
        </p>
      );
    });
  };

  const renderInlineText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\[.*?\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-stone-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('[') && part.endsWith(']') && part.length < 40 && !part.includes('http')) {
        return (
          <span
            key={i}
            className="inline-block px-2 py-0.5 mx-1 rounded-md bg-orange-100 dark:bg-orange-950/80 text-orange-900 dark:text-orange-300 font-semibold text-xs border border-orange-300 dark:border-orange-800"
            title="Fill this in with your details"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div
      ref={cardRef}
      className="w-full rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-md p-5 sm:p-7 relative transition-all overflow-hidden"
    >
      {/* Horizontal Reading Progress Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-stone-100 dark:bg-stone-800/80 z-20"
        title={`Reading progress: ${scrollProgress}%`}
      >
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {ui.modules[module]?.title || 'Sahay Answer'}
            </span>
          </div>

          {/* Estimated Reading Time Badge */}
          {content && (
            <div
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-stone-800 text-[11px] font-semibold text-stone-600 dark:text-stone-300 border border-amber-200/70 dark:border-stone-700 shadow-2xs"
              title={language === 'hi' ? 'अनुमानित पठन समय' : 'Estimated reading time'}
            >
              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>{calculateReadingTime(content, language)}</span>
            </div>
          )}

          {isStreaming && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium animate-pulse">
              (Typing...)
            </span>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Audio TTS Button */}
          <button
            onClick={handleToggleAudio}
            disabled={isStreaming}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isPlayingAudio
                ? 'bg-amber-600 text-white border-amber-600 animate-pulse'
                : 'bg-stone-50 dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-500'
            }`}
            title="Listen to this explanation"
          >
            {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            <span>{isPlayingAudio ? ui.common.playingAudio : ui.common.listen}</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 transition-colors cursor-pointer"
            title="Copy answer to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">{ui.common.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span>{ui.common.copy}</span>
              </>
            )}
          </button>

          {/* Share Button (Web Share API with Clipboard Fallback) */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 transition-colors cursor-pointer"
            title="Share or copy response"
          >
            {shared ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">{ui.common.shared}</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{ui.common.share}</span>
              </>
            )}
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf || isStreaming}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Export as formatted PDF file"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span>{ui.common.exportingPdf}</span>
              </>
            ) : pdfSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">{ui.common.exportedPdf}</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{ui.common.exportPdf}</span>
              </>
            )}
          </button>

          {/* Save to Notebook */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 transition-colors cursor-pointer"
            title="Save for later"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{ui.common.saved}</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{ui.common.save}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Query repetition header */}
      {query && (
        <div className="mb-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium">
          <span className="font-bold text-stone-900 dark:text-stone-100 mr-1.5">
            {language === 'hi' ? 'आपका सवाल:' : 'Your prompt:'}
          </span>
          <span>{query}</span>
        </div>
      )}

      {/* Main Content Body */}
      <div ref={contentContainerRef} className="prose prose-stone dark:prose-invert max-w-none">
        {renderFormattedContent(content)}
      </div>

      {/* Interactive Planner Checklist (if in planner mode or checklist items detected) */}
      {(module === 'planner' || content.includes('[ ]')) && !isStreaming && (
        <InteractivePlanner rawContent={content} language={language} />
      )}

      {/* Quick Transform Shortcuts Toolbar (Simplify, Shorten, Translate) */}
      {!isStreaming && (
        <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{language === 'hi' ? 'तुरंत सुधारें:' : 'Quick refinements:'}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onTransformContent('simplify')}
              disabled={isTransforming}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>{ui.common.simplify}</span>
            </button>

            <button
              onClick={() => onTransformContent('shorten')}
              disabled={isTransforming}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3 h-3 text-stone-600 dark:text-stone-400" />
              <span>{ui.common.shorten}</span>
            </button>

            {language === 'hi' ? (
              <button
                onClick={() => onTransformContent('to_english')}
                disabled={isTransforming}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <Languages className="w-3 h-3 text-stone-600 dark:text-stone-400" />
                <span>{ui.common.translateToEnglish}</span>
              </button>
            ) : (
              <button
                onClick={() => onTransformContent('to_hindi')}
                disabled={isTransforming}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <Languages className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>{ui.common.translateToHindi}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Suggested Follow-up Chips & Follow-up Input Bar */}
      {!isStreaming && onFollowUpSubmit && (
        <div className="mt-6 pt-5 border-t border-stone-200/90 dark:border-stone-800 space-y-3.5">
          {/* Row of Suggested Follow-up Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{ui.common.suggestedFollowUps}</span>
              </span>
              <span className="text-[11px] text-stone-400 dark:text-stone-500 font-normal hidden sm:inline">
                {language === 'hi' ? '1-क्लिक में पूछें' : 'Click to send instantly'}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {suggestedChips.map((chip) => {
                const label = language === 'hi' ? chip.labelHi : chip.labelEn;
                const prompt = language === 'hi' ? chip.promptHi : chip.promptEn;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleChipClick(prompt)}
                    disabled={isGenerating}
                    className="text-xs px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border border-amber-200/90 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-500 transition-colors whitespace-nowrap text-left shrink-0 shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="text-amber-600 dark:text-amber-400">✦</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Follow-up Input Form */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{ui.common.followUpPrompt}</span>
            </div>

            <form onSubmit={handleFollowUpFormSubmit} className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  placeholder={
                    language === 'hi'
                      ? 'जैसे: इसे थोड़ा और विनम्र बनाएं, या 3 दिन के बजाय 5 दिन का करें...'
                      : 'e.g. Make it a bit more polite, change duration to 5 days, or ask more details...'
                  }
                  className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-hidden focus:border-amber-500 dark:focus:border-amber-400 bg-stone-50/50 dark:bg-stone-800"
                />
                {followUpText && (
                  <button
                    type="button"
                    onClick={() => setFollowUpText('')}
                    className="absolute right-2.5 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 text-xs p-1 cursor-pointer"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>
              <VoiceInputButton
                language={language}
                onTranscript={handleVoiceTranscript}
                size="sm"
              />
              <button
                type="submit"
                disabled={!followUpText.trim() || isGenerating}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>{language === 'hi' ? 'पूछें' : 'Send'}</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
