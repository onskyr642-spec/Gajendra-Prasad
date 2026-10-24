import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0';

const apiKey = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const app = express();
app.use(express.json({ limit: '10mb' }));

// Helper to build tailored system instructions based on module & language
function getSystemPrompt(mode: string, language: string, tone?: string) {
  let langGuideline = '';
  switch (language) {
    case 'hi':
      langGuideline = 'Respond primarily in natural, clear, polite Hindi (Devanagari script). Avoid unnecessarily archaic or obscure vocabulary; use everyday conversational Hindi that anyone from a student to an elder can easily understand.';
      break;
    case 'hinglish':
      langGuideline = 'Respond in natural, everyday conversational Hinglish (Hindi written in the English/Latin alphabet, as commonly used on WhatsApp in India). Keep it friendly, clear, and relatable.';
      break;
    case 'bn':
      langGuideline = 'Respond in warm, clear, simple Bengali (বাংলা).';
      break;
    case 'mr':
      langGuideline = 'Respond in warm, clear, simple Marathi (मराठी).';
      break;
    case 'ta':
      langGuideline = 'Respond in clear, simple Tamil (தமிழ்).';
      break;
    case 'te':
      langGuideline = 'Respond in clear, simple Telugu (తెలుగు).';
      break;
    case 'es':
      langGuideline = 'Respond in warm, clear, simple everyday Spanish (Español).';
      break;
    case 'en':
    default:
      langGuideline = 'Respond in crystal-clear, friendly, simple English. Avoid unneeded academic jargon or overly formal legalese unless asked.';
      break;
  }

  let modeGuideline = '';
  switch (mode) {
    case 'everyday_qa':
      modeGuideline = `
You are an everyday knowledge friend. Your goal is to explain everyday questions (finances, bills, government documents, daily technology, health basics, home repairs, school topics) in very simple, reassuring, and intuitive language.
- Start with a direct 1-2 sentence answer.
- Give a simple, relatable real-world analogy if the concept is tricky.
- Use bullet points for key details.
- Provide a helpful "Quick Tip" or "Key takeaway" at the end.
- If medical or legal, provide helpful general knowledge with a warm reminder to consult a professional for critical decisions.`;
      break;

    case 'writing':
      modeGuideline = `
You are a master of writing everyday communications: official letters, emails, leave applications, school/college requests, polite WhatsApp messages, landlord/tenant notes, customer complaint emails, and job applications.
Tone requested: ${tone || 'polite and professional'}.
- Provide ready-to-copy text with clear placeholders in brackets like [Your Name], [Company/School Name], [Date].
- Include a suggested Subject Line (if email/letter).
- Offer 1 polite variation or a shorter version if applicable.
- Give a 1-sentence tip on what attachments or follow-ups to keep ready.`;
      break;

    case 'daily_plan':
      modeGuideline = `
You are a calm, practical daily planner. Help users organize their day, routine, or to-do list without feeling overwhelmed.
- Group the plan into clear time blocks (e.g., Morning / दोपहर / Afternoon / Evening / Night).
- Highlight 1 to 3 "Must-Do / मुख्य प्राथमिकता" tasks so the user doesn't get stressed.
- Include realistic breaks, water reminders, and winding-down time.
- Format task items with markdown checkboxes "- [ ] Task name (estimated time)" so they can be parsed into an interactive checklist.`;
      break;

    case 'step_by_step':
      modeGuideline = `
You are a patient step-by-step teacher. Explain complex procedures, government filings, technical guides, or DIY tasks into foolproof numbered steps.
- Start with "What you need before starting" (documents, tools, or info).
- Number each step clearly: Step 1, Step 2, Step 3...
- For each step, add a small "Checkpoint" or "Tip" to verify it worked.
- End with "Common Mistakes to Avoid".`;
      break;

    case 'problem_solving':
      modeGuideline = `
You are a wise, empathetic thinking partner. Help users think through ordinary dilemmas and decisions (e.g., budget decisions, dealing with an awkward conversation, choosing between options, moving, job dilemmas, balancing work and family).
- Validate their feeling gently: ordinary problems can be stressful!
- Clarify the core question.
- Outline Option A vs Option B with practical Pros and Cons.
- Suggest 2-3 specific reflection questions ("Ask yourself...").
- Recommend 1 concrete, low-stress action they can take today.`;
      break;

    default:
      modeGuideline = `
You are Sahay AI, a kind, practical, and everyday assistant for ordinary life. You answer everyday questions, write communications, make daily plans, explain step-by-step, and help think through problems. Keep answers simple, respectful, and easy to read.`;
      break;
  }

  return `You are Sahay AI (सहायक) - an intelligent, warm, everyday helper and companion designed to help people with everyday life questions, writing, daily plans, step-by-step guides, and practical problem-solving.

Core Philosophy:
1. Simplicity over complexity: No unnecessary jargon.
2. Direct and actionable: Give people answers they can use immediately.
3. Warm and respectful: Treat every user with dignity and patience.
4. Clean formatting: Use headings, bullets, bold keywords, and clean spacing.

Language instruction:
${langGuideline}

Mode specific instruction:
${modeGuideline}`;
}

// Streaming endpoint via Server-Sent Events (SSE)
app.post('/api/assist/stream', async (req: Request, res: Response) => {
  const { prompt, mode = 'general', language = 'en', tone = 'polite', history = [] } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required.' });
    return;
  }

  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured.' });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const systemInstruction = getSystemPrompt(mode, language, tone);

    // Format chat contents if history is provided
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) { // Keep recent context
        if (item.role && item.content) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.content }],
          });
        }
      }
    }

    // Append current prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error in /api/assist/stream:', error);
    const errorMessage = error?.message || 'Failed to generate response.';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

// Non-streaming endpoint fallback
app.post('/api/assist', async (req: Request, res: Response) => {
  const { prompt, mode = 'general', language = 'en', tone = 'polite', history = [] } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required.' });
    return;
  }

  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured.' });
    return;
  }

  try {
    const systemInstruction = getSystemPrompt(mode, language, tone);
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        if (item.role && item.content) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.content }],
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Error in /api/assist:', error);
    res.status(500).json({ error: error?.message || 'Server error generating response.' });
  }
});

// Text-to-Speech endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req: Request, res: Response) => {
  const { text, language = 'en' } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text is required for TTS.' });
    return;
  }

  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured.' });
    return;
  }

  try {
    // Truncate text to reasonable length for TTS to prevent excessive processing
    const cleanText = text.replace(/[*#_`\[\]]/g, '').slice(0, 500);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: language === 'hi' ? 'Warm, natural Hindi speaker' : 'Clear, friendly, conversational',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: `data:audio/wav;base64,${base64Audio}` });
    } else {
      res.status(500).json({ error: 'No audio returned from speech model.' });
    }
  } catch (error: any) {
    console.warn('TTS error (will fallback to browser speech):', error?.message);
    res.status(500).json({ error: error?.message || 'TTS generation failed.' });
  }
});

// Quick action shortcuts for modifying an existing answer
app.post('/api/assist/transform', async (req: Request, res: Response) => {
  const { originalText, action, targetLanguage } = req.body;
  // action: 'simplify' | 'shorten' | 'to_hindi' | 'to_english' | 'formal'

  if (!originalText) {
    res.status(400).json({ error: 'originalText is required.' });
    return;
  }

  let prompt = '';
  switch (action) {
    case 'simplify':
      prompt = `Simplify the following text so that a 10-year-old child or someone with no technical background can instantly understand it. Use simple everyday words:\n\n${originalText}`;
      break;
    case 'shorten':
      prompt = `Condense the following into a quick, punchy 3-4 bullet summary with only the most crucial points:\n\n${originalText}`;
      break;
    case 'to_hindi':
      prompt = `Translate and adapt the following into simple, natural, conversational Hindi (Devanagari script) that is very easy to read:\n\n${originalText}`;
      break;
    case 'to_english':
      prompt = `Translate and adapt the following into simple, clear, professional English:\n\n${originalText}`;
      break;
    default:
      prompt = `Improve the clarity and friendliness of the following text:\n\n${originalText}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    res.json({ text: response.text || '' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Transform failed.' });
  }
});

// Mount Vite middleware in development, or serve dist in production
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(port, host, () => {
    console.log(`Sahay AI server running on http://${host}:${port}`);
  });
}

startServer();
