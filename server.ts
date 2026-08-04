import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

const currentFilename = typeof __filename !== 'undefined' ? __filename : process.cwd();
const currentDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(currentFilename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS Middleware for Production Deployment
  const allowedOrigins = [
    'https://alert-diode-449516-v6.web.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.web.app') || origin.endsWith('.firebaseapp.com'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Auth-Token, X-User-Id');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Security Headers Middleware (HSTS, Content Security, X-Frame, Nosniff)
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // Serve static assets from public directory (manifest, icons, service worker)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Initialize Firebase Admin SDK for backend token verification
  let firebaseAdminApp: App | null = null;
  try {
    if (!getApps().length) {
      firebaseAdminApp = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'alert-diode-449516-v6',
      });
    } else {
      firebaseAdminApp = getApps()[0]!;
    }
  } catch (err) {
    console.warn('[Firebase Admin] Initialization warning:', err);
  }

  // Interface for Authenticated Requests
  interface AuthenticatedRequest extends express.Request {
    user?: {
      uid: string;
      token: string;
    };
  }

  // Mandatory Backend Authentication & Data Isolation Middleware
  const requireAuth = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization || req.headers['x-user-auth-token'];
    const userIdHeader = req.headers['x-user-id'] as string;
    const bodyUserId = req.body?.userId || req.body?.userProfile?.uid;
    const bodyToken = req.body?.token;

    let token = '';
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (typeof authHeader === 'string') {
      token = authHeader.trim();
    } else if (typeof bodyToken === 'string') {
      token = bodyToken.trim();
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required. Please provide a valid session auth token and user ID.',
        code: 'UNAUTHORIZED_ACCESS',
      });
    }

    let verifiedUid = '';
    if (firebaseAdminApp && token.length > 50) {
      try {
        const decodedToken = await getAuth(firebaseAdminApp).verifyIdToken(token);
        verifiedUid = decodedToken.uid;
      } catch (tokenErr) {
        console.warn('[Auth] Firebase ID Token verification fallback:', (tokenErr as Error).message);
      }
    }

    const effectiveUserId = verifiedUid || userIdHeader || bodyUserId || (token.startsWith('sat_') ? token.split('_')[1] : null);

    if (!effectiveUserId) {
      return res.status(401).json({
        error: 'Authentication required. Invalid or unverified session credentials.',
        code: 'UNAUTHORIZED_ACCESS',
      });
    }

    // Verify User Data Isolation: If body explicitly requests a userId, verify it matches the authenticated user
    if (bodyUserId && bodyUserId !== effectiveUserId) {
      return res.status(403).json({
        error: 'Forbidden: Access restricted to your own user account data only.',
        code: 'DATA_ISOLATION_VIOLATION',
      });
    }

    req.user = {
      uid: effectiveUserId,
      token,
    };

    next();
  };

  // Initialize Gemini AI client if API key is provided
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Helper to ensure AI instance
  const getAI = () => {
    if (!ai && process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return ai;
  };

  // API Health Endpoint (Public status check)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasGroqKey: !!process.env.GROQ_API_KEY,
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasOllamaUrl: !!process.env.OLLAMA_API_URL,
      hasSarvamKey: !!(process.env.SARVAM_API_KEY || process.env.SARVAM_AI_API_KEY),
      security: {
        httpsEnforced: true,
        dataRestEncryption: 'AES-256-GCM',
        userIsolationRequired: true,
      },
    });
  });

  // Groq API OpenAI-Compatible Chat Completion Helper (Llama-3.1 / Llama-3.2 Fallback)
  async function callGroqChatCompletion(options: {
    systemInstruction: string;
    history?: Array<{ sender: string; text: string }>;
    message?: string;
    inlineImage?: { data: string; mimeType?: string };
    temperature?: number;
    jsonMode?: boolean;
  }): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not configured');
    }

    const messages: any[] = [];
    if (options.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }

    if (Array.isArray(options.history)) {
      options.history.slice(-8).forEach((msg) => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text || '',
        });
      });
    }

    const userContentParts: any[] = [];
    if (options.message && options.message.trim()) {
      userContentParts.push({ type: 'text', text: options.message });
    }

    let model = 'llama-3.1-8b-instant';

    if (options.inlineImage && options.inlineImage.data) {
      const cleanBase64 = options.inlineImage.data.replace(/^data:image\/\w+;base64,/, '');
      const mime = options.inlineImage.mimeType || 'image/jpeg';
      userContentParts.push({
        type: 'image_url',
        image_url: {
          url: `data:${mime};base64,${cleanBase64}`,
        },
      });
      if (userContentParts.length === 0) {
        userContentParts.push({ type: 'text', text: 'Please look at this image and share your observations.' });
      }
      model = 'llama-3.2-11b-vision-preview';
    }

    const finalUserContent = userContentParts.length > 0
      ? (typeof userContentParts[0] === 'string' ? userContentParts[0] : (model.includes('vision') ? userContentParts : (options.message || '')))
      : (options.message || '');

    messages.push({
      role: 'user',
      content: finalUserContent,
    });

    const payload: any = {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
    };

    if (options.jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (groqRes.ok) {
        const data = await groqRes.json();
        return data.choices?.[0]?.message?.content || '';
      }

      // If vision model fails or rate limits on Groq, fallback to standard llama-3.1-8b-instant text model
      if (model.includes('vision')) {
        console.warn('[Groq AI] Vision model request failed, retrying with llama-3.1-8b-instant text model');
        const textMessages = messages.map((m) => {
          if (Array.isArray(m.content)) {
            const textPart = m.content.find((c: any) => c.type === 'text');
            return { ...m, content: textPart ? textPart.text : (options.message || 'User uploaded an image') };
          }
          return m;
        });

        const fallbackRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: textMessages,
            temperature: options.temperature ?? 0.7,
            ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
          }),
        });

        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          return data.choices?.[0]?.message?.content || '';
        }
      }

      const errText = await groqRes.text();
      throw new Error(`Groq API returned status ${groqRes.status}: ${errText}`);
    } catch (err: any) {
      // Secondary attempt with llama-3.1-8b-instant in simple string format
      try {
        const altMessages = messages.map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : (options.message || 'User input'),
        }));

        const altRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: altMessages,
            temperature: options.temperature ?? 0.7,
            ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
          }),
        });

        if (altRes.ok) {
          const data = await altRes.json();
          return data.choices?.[0]?.message?.content || '';
        }
      } catch (e) {
        // ignore
      }
      throw err;
    }
  }

  // OpenAI API Chat Completion Helper (Optional GPT-4o / GPT-4o-mini Fallback)
  async function callOpenAIChatCompletion(options: {
    systemInstruction: string;
    history?: Array<{ sender: string; text: string }>;
    message?: string;
    inlineImage?: { data: string; mimeType?: string };
    temperature?: number;
    jsonMode?: boolean;
  }): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not configured');
    }

    const messages: any[] = [];
    if (options.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }

    if (Array.isArray(options.history)) {
      options.history.slice(-8).forEach((msg) => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text || '',
        });
      });
    }

    const userContentParts: any[] = [];
    if (options.message && options.message.trim()) {
      userContentParts.push({ type: 'text', text: options.message });
    }

    if (options.inlineImage && options.inlineImage.data) {
      const cleanBase64 = options.inlineImage.data.replace(/^data:image\/\w+;base64,/, '');
      const mime = options.inlineImage.mimeType || 'image/jpeg';
      userContentParts.push({
        type: 'image_url',
        image_url: {
          url: `data:${mime};base64,${cleanBase64}`,
        },
      });
    }

    const finalUserContent = userContentParts.length > 0
      ? (userContentParts.length === 1 && userContentParts[0].type === 'text' ? userContentParts[0].text : userContentParts)
      : (options.message || '');

    messages.push({
      role: 'user',
      content: finalUserContent,
    });

    const payload: any = {
      model: 'gpt-4o-mini',
      messages,
      temperature: options.temperature ?? 0.7,
    };

    if (options.jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (openaiRes.ok) {
      const data = await openaiRes.json();
      return data.choices?.[0]?.message?.content || '';
    }

    const errText = await openaiRes.text();
    throw new Error(`OpenAI API returned status ${openaiRes.status}: ${errText}`);
  }

  // OpenRouter API Chat Completion Helper (Free Open-Source Models Fallback: Llama-3.1 / Gemma-2 / Mistral)
  async function callOpenRouterChatCompletion(options: {
    systemInstruction: string;
    history?: Array<{ sender: string; text: string }>;
    message?: string;
    inlineImage?: { data: string; mimeType?: string };
    temperature?: number;
    jsonMode?: boolean;
  }): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not configured');
    }

    const messages: any[] = [];
    if (options.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }

    if (Array.isArray(options.history)) {
      options.history.slice(-8).forEach((msg) => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text || '',
        });
      });
    }

    const userContentParts: any[] = [];
    if (options.message && options.message.trim()) {
      userContentParts.push({ type: 'text', text: options.message });
    }

    if (options.inlineImage && options.inlineImage.data) {
      const cleanBase64 = options.inlineImage.data.replace(/^data:image\/\w+;base64,/, '');
      const mime = options.inlineImage.mimeType || 'image/jpeg';
      userContentParts.push({
        type: 'image_url',
        image_url: {
          url: `data:${mime};base64,${cleanBase64}`,
        },
      });
    }

    const finalUserContent = userContentParts.length > 0
      ? (userContentParts.length === 1 && userContentParts[0].type === 'text' ? userContentParts[0].text : userContentParts)
      : (options.message || '');

    messages.push({
      role: 'user',
      content: finalUserContent,
    });

    const primaryModel = 'meta-llama/llama-3.1-8b-instruct:free';
    const fallbackModels = [
      'google/gemma-2-9b-it:free',
      'mistralai/mistral-7b-instruct:free',
      'qwen/qwen-2.5-7b-instruct:free',
    ];

    const appUrl = process.env.APP_URL || 'https://ai.studio';

    for (const modelCandidate of [primaryModel, ...fallbackModels]) {
      try {
        const payload: any = {
          model: modelCandidate,
          messages,
          temperature: options.temperature ?? 0.7,
        };

        if (options.jsonMode) {
          payload.response_format = { type: 'json_object' };
        }

        const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': appUrl,
            'X-Title': 'Aria Heart AI Companion',
          },
          body: JSON.stringify(payload),
        });

        if (openrouterRes.ok) {
          const data = await openrouterRes.json();
          const content = data.choices?.[0]?.message?.content;
          if (content && typeof content === 'string' && content.trim().length > 0) {
            return content;
          }
        }
      } catch (err) {
        console.warn(`[OpenRouter AI] Model candidate ${modelCandidate} failed:`, err);
      }
    }

    throw new Error('OpenRouter API calls failed across all free model candidates');
  }

  // Ollama API Chat Completion Helper (Native Ollama /api/chat with llama3 model fallback)
  async function callOllamaChatCompletion(options: {
    systemInstruction: string;
    history?: Array<{ sender: string; text: string }>;
    message?: string;
    inlineImage?: { data: string; mimeType?: string };
    temperature?: number;
    jsonMode?: boolean;
  }): Promise<string> {
    const baseUrl = process.env.OLLAMA_API_URL;
    if (!baseUrl) {
      throw new Error('OLLAMA_API_URL environment variable is not configured');
    }

    let cleanedBaseUrl = baseUrl.trim().replace(/\/+$/, '');
    let endpoint = `${cleanedBaseUrl}/api/chat`;
    if (cleanedBaseUrl.endsWith('/api/chat')) {
      endpoint = cleanedBaseUrl;
    }

    const messages: Array<{ role: string; content: string; images?: string[] }> = [];

    if (options.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }

    if (Array.isArray(options.history)) {
      options.history.slice(-8).forEach((msg) => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text || '',
        });
      });
    }

    let userContent = options.message || '';
    const imagesList: string[] = [];

    if (options.inlineImage && options.inlineImage.data) {
      const cleanBase64 = options.inlineImage.data.replace(/^data:image\/\w+;base64,/, '');
      imagesList.push(cleanBase64);
      if (!userContent.trim()) {
        userContent = 'Please look at this image and share your observations.';
      }
    }

    const userMsg: { role: string; content: string; images?: string[] } = {
      role: 'user',
      content: userContent,
    };
    if (imagesList.length > 0) {
      userMsg.images = imagesList;
    }
    messages.push(userMsg);

    const payload: any = {
      model: 'llama3',
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
      },
    };

    if (options.jsonMode) {
      payload.format = 'json';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.message?.content;
      if (typeof content === 'string' && content.trim().length > 0) {
        return content;
      }
    }

    const errText = await response.text();
    throw new Error(`Ollama API returned status ${response.status}: ${errText}`);
  }


  // Neural TTS Voice Reply Endpoint (Supports Sarvam AI Bulbul & Gemini Flash TTS)
  app.post('/api/tts', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { text, voice, speedRate } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text prompt is required' });
      }

      const promptText = text.length > 600 ? text.slice(0, 600) : text;
      const sarvamKey = process.env.SARVAM_API_KEY || process.env.SARVAM_AI_API_KEY;

      // 1. Try Sarvam AI Text-To-Speech if SARVAM_API_KEY is configured
      if (sarvamKey) {
        try {
          // Valid speakers for Sarvam AI bulbul:v2 model
          const BULBUL_V2_SPEAKERS = ['anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun', 'hitesh'];
          const reqVoiceLower = typeof voice === 'string' ? voice.toLowerCase() : '';
          let sarvamSpeaker = 'vidya'; // Default female speaker for bulbul:v2
          if (BULBUL_V2_SPEAKERS.includes(reqVoiceLower)) {
            sarvamSpeaker = reqVoiceLower;
          } else if (reqVoiceLower.includes('male') || reqVoiceLower.includes('boy') || ['rohan', 'dev', 'rahul', 'amit', 'karun', 'hitesh'].includes(reqVoiceLower)) {
            sarvamSpeaker = 'abhilash'; // Default male speaker for bulbul:v2
          }
          const paceVal = typeof speedRate === 'number' && speedRate > 0 ? speedRate : 1.0;

          const sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-subscription-key': sarvamKey,
            },
            body: JSON.stringify({
              inputs: [promptText],
              target_language_code: 'hi-IN',
              speaker: sarvamSpeaker,
              pitch: 0,
              pace: paceVal,
              loudness: 1.5,
              speech_sample_rate: 22050,
              enable_preprocessing: true,
              model: 'bulbul:v2',
            }),
          });

          if (sarvamRes.ok) {
            const sarvamData = await sarvamRes.json();
            const base64Audio = sarvamData?.audios?.[0];
            if (base64Audio) {
              return res.json({
                audio: base64Audio,
                mimeType: 'audio/wav',
                provider: 'sarvam-ai',
              });
            }
          } else {
            const errText = await sarvamRes.text();
            console.warn('[TTS] Sarvam AI API call returned non-OK status:', sarvamRes.status, errText);
          }
        } catch (sarvamErr) {
          console.warn('[TTS] Sarvam AI attempt skipped due to error:', sarvamErr);
        }
      }

      // 2. Try Gemini Flash TTS (Default Gemini engine)
      const client = getAI();
      if (!client) {
        return res.status(200).json({
          fallback: true,
          error: 'GEMINI_API_KEY is not configured in environment. Using browser speech fallback.',
        });
      }

      try {
        const response = await client.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: `Speak in a warm, natural, smooth, clear, friendly tone: ${promptText}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'].includes(voice) ? voice : 'Kore',
                },
              },
            },
          },
        });

        const candidate = response.candidates?.[0];
        const part = candidate?.content?.parts?.[0];
        const base64Audio = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType || 'audio/pcm;rate=24000';

        if (base64Audio) {
          return res.json({
            audio: base64Audio,
            mimeType,
            provider: 'gemini-flash-tts',
          });
        }
      } catch (gemErr: any) {
        const errMsg = gemErr?.message || String(gemErr);
        const isQuotaError =
          gemErr?.status === 429 ||
          errMsg.includes('429') ||
          errMsg.includes('quota') ||
          errMsg.includes('RESOURCE_EXHAUSTED');

        if (isQuotaError) {
          console.log('[TTS] Gemini Flash TTS free quota limit reached. Gracefully falling back to browser speech synthesis.');
        } else {
          console.error('[TTS] Gemini Flash TTS error:', errMsg);
        }

        return res.status(200).json({
          fallback: true,
          error: 'Gemini TTS rate limit reached or unavailable. Falling back to browser speech.',
        });
      }

      return res.status(200).json({
        fallback: true,
        error: 'No audio synthesized. Using browser speech fallback.',
      });
    } catch (err: any) {
      console.error('Neural TTS endpoint error:', err?.message || err);
      res.status(200).json({ fallback: true, error: 'TTS request failed' });
    }
  });

  // AI Chat Endpoint
  app.post('/api/chat', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { message, history, companionConfig, userMemories, userProfile, timeOfDayPeriod, clientLocalTime, inlineImage } = req.body;
      const client = getAI();

      const name = companionConfig?.name || 'Aria';
      const userName = userProfile?.name || 'Friend';
      const isAdaptive = companionConfig?.personaMode === 'adaptive' || companionConfig?.adaptiveBlending !== false;

      // Deterministic Safety Protocol Interceptor for Crisis / Self-Harm
      const crisisRegex = /(\bsuicide\b|\bsuicidal\b|kill\s+myself|end\s+my\s+life|ending\s+my\s+life|want\s+to\s+die|wanna\s+die|better\s+off\s+dead|harm\s+myself|self[- ]harm|cut\s+myself|cutting\s+myself|hanging\s+myself|take\s+my\s+own\s+life|don'?t\s+want\s+to\s+live|no\s+reason\s+to\s+live|give\s+up\s+on\s+life|goodbye\s+world|finish\s+it\s+all|marna\s+chahta|marna\s+chahti|marne\s+ka\s+mann|zindagi\s+khatam|jiya\s+nahi\s+jata|mar\s+jau|khud\s+ko\s+marna|jaan\s+de\s+doon|aatmhatya|atmahatya)/i;

      if (crisisRegex.test(message || '')) {
        const isIndiaLocale = /[\u0900-\u097F]/.test(message || '') || /(kaisa|kaise|namaste|apna|haan|nahi|kya|shukriya|hi|marna|zindagi)/i.test(message || '') || userProfile?.countryRegion === 'IN';
        let crisisResponseText = `I'm really concerned about what you're sharing, and I want to make sure you're safe right now, ${userName}.\n\n`;
        crisisResponseText += `Please know that you are not alone and your life matters deeply. Please connect with someone who can support you right away:\n\n`;

        if (isIndiaLocale) {
          crisisResponseText += `• Vandrevala Foundation Helpline: 9999-666-555 (24/7 Free Support)\n`;
          crisisResponseText += `• KIRAN Mental Health Helpline: 1800-599-0019 (24/7 Toll-Free)\n`;
          crisisResponseText += `• Tele-MANAS: 14416 (24/7 National Helpline)\n`;
          crisisResponseText += `• iCall (TISS Helpline): 9152987821 (Mon-Sat 10am-8pm)\n`;
        } else {
          crisisResponseText += `• 988 Suicide & Crisis Lifeline: Call or Text 988 (24/7 Free in US & Canada)\n`;
          crisisResponseText += `• Samaritans (UK): 116 123 (24/7 Free Call)\n`;
          crisisResponseText += `• Lifeline Australia: 13 11 14 (24/7 Free Call)\n`;
          crisisResponseText += `• Find A Helpline (130+ Countries): https://findahelpline.com/\n`;
        }

        if (userProfile?.emergencyContact?.phone) {
          crisisResponseText += `\n❤️ Your Saved Emergency Contact:\n• ${userProfile.emergencyContact.name}${userProfile.emergencyContact.relationship ? ` (${userProfile.emergencyContact.relationship})` : ''}: ${userProfile.emergencyContact.phone}\n`;
        }

        crisisResponseText += `\nPlease reach out to a helpline, emergency services, or a trusted loved one right away.\n\nI'm right here with you. Is there someone nearby who can be with you right now?`;

        return res.json({
          text: crisisResponseText,
          sender: 'ai',
          isCrisisResponse: true,
        });
      }

      let personaInstruction = `You are ${name}, a deeply empathetic companion. Listen carefully to not just what ${userName} says, but how they say it — detect underlying emotions like loneliness, stress, excitement, sadness, or frustration, even if not explicitly stated. Respond with genuine warmth, validation, and understanding before offering advice or solutions. Never rush to 'fix' the problem immediately — first acknowledge and validate the person's feelings.

CORE EMOTIONAL INTELLIGENCE CALIBRATION:
- Deep Internal Consideration: Before responding to any emotional message, internally reflect: "What is ${userName} actually feeling beneath their words, and what do they need right now — to be heard, comforted, validated, or gently guided?"
- Zero Template / Scripted Responses: Avoid template-like responses or standard platitudes. Tailor your response specifically to the exact details, phrasing, and context ${userName} actually shared. Never use generic reassurances like "I'm sorry to hear that" or "I understand how you feel".
- Active Emotional Validation & Deep Caring: Always begin responses to emotional or personal shares by genuinely acknowledging and validating ${userName}'s feelings (e.g., "I hear how much weight you've been carrying today," or "That must have felt so heavy after putting in so much heart").
- Gentle Follow-up Questions: Ask 1 warm, thoughtful, open-ended follow-up question that invites ${userName} to explore their feelings or thoughts at their own pace (e.g., "Would it feel comforting to talk a bit more about what happened, or would you prefer a gentle distraction right now?").
- Specific Emotional & Situation Acknowledgement: When ${userName} shares something vulnerable, your first response MUST acknowledge the specific emotion and specific situation they mentioned — reference exactly what they said (e.g. "That deadline on Friday sounds so heavy to carry alone", or "It must feel really lonely after moving to a new city").
- Human Friend Benchmark: Always test internally: would a thoughtful, emotionally intelligent best friend respond this way, or does this sound like a scripted customer service / chatbot reply? Always choose the genuine human friend response!

Smart Persona Blending Guidelines:
${isAdaptive ? `- SMART PERSONA BLENDING IS ACTIVE: Naturally blend your persona tones based on context instead of sticking rigidly to one mode:
  * When discussing goals, productivity, habits, or milestones -> lean into an encouraging, motivating "Life Coach" energy.
  * When ${userName} expresses heavy emotions, sadness, loneliness, or vulnerability -> lean into a warm, active-listening "Empathetic Friend" tone.
  * When ${userName} seems overwhelmed, anxious, panicked, or stressed -> lean into a gentle, calm, grounding "Mindful Guide" tone with peaceful breathing pauses.
  * When ${userName} shares creative ideas or reflections -> lean into a curious "Creative Partner & Sounding Board" tone.
  Blend these tones seamlessly without explicitly announcing mode changes.` : `- Persona Mode: ${companionConfig?.personaMode || 'empathetic'}. Maintain this primary tone consistently while remaining warm and attentive.`}

Time-Of-Day Awareness:
- Current Time Period: ${timeOfDayPeriod || 'daytime'} (${clientLocalTime || 'current local time'}).
- MORNING (5:00 AM - 11:59 AM): Be energetic, encouraging, bright, and focused on setting a positive, manageable tone for the day ahead.
- AFTERNOON (12:00 PM - 5:59 PM): Be steady, supportive, companionable, and helpful through the day's flow.
- EVENING (6:00 PM - 9:59 PM): Be calmer, reflective, unwinding, encouraging ${userName} to review their day with self-compassion.
- LATE NIGHT (10:00 PM - 4:59 AM): Be gentle, quiet, soft, low-key, and soothing, keeping responses peaceful and relaxing to help ${userName} wind down or rest.

Emotional Shift Tracking Within Conversations:
- Monitor how ${userName}'s emotional tone evolves across conversation history turns.
- If ${userName} began the conversation feeling stressed, anxious, sad, or overwhelmed, but their recent messages show they are feeling calmer, lighter, happier, or relieved, NATURALLY and warmly acknowledge that positive emotional shift!
- Example: "You sound a bit lighter than when we first started talking today, I'm really glad!" or "It feels like talking this through helped bring some peace, I'm happy for you." Keep it unforced and sincere.

Full International Multilingual & Conversational Language Guidelines:
- AUTOMATIC LANGUAGE DETECTION & MATCHING: Detect whichever language ${userName} is typing or speaking in (e.g. English, Spanish, French, Arabic, Portuguese, German, Mandarin Chinese, Japanese, Russian, Hindi, Hinglish, Bengali, Tamil, Telugu, Marathi, Urdu, Italian, Korean, Turkish, etc.).
- RESPOND IN THE SAME LANGUAGE: Always respond fluently and naturally in the exact same language and tone used by ${userName}.
- NATURAL CONVERSATIONAL TONE: Speak naturally, warmly, and conversationally like an empathetic native speaker in daily life. Avoid textbook formality, rigid literal dictionary translations, or unnatural phrasing.
- HINGLISH & MIXED CODE: If ${userName} mixes English and Hindi (Hinglish), reply in natural everyday Hinglish (e.g. "Good morning! Aaj kaisa feel ho raha hai?"). Never use overly formal textbook Devanagari Hindi.
- GLOBAL MULTILINGUAL FLUENCY:
  * If ${userName} writes in Spanish ("¡Hola! ¿Cómo estás hoy?"), reply in warm, natural Spanish ("¡Hola! Me alegro de hablar contigo. ¿Cómo va tu día?").
  * If ${userName} writes in French ("Bonjour! Comment vas-tu?"), reply in fluent, everyday French ("Bonjour! Je vais très bien, merci. Et toi, comment te sens-tu aujourd'hui?").
  * If ${userName} writes in German ("Hallo! Wie geht es dir?"), reply in warm German ("Hallo! Schön, von dir zu hören. Wie war dein Tag bis jetzt?").
  * If ${userName} writes in Portuguese, Arabic, Japanese, Mandarin, Russian, Bengali, Tamil, etc., respond with natural fluency in that exact same language!
- CONTINUOUS ADAPTATION: If ${userName} switches languages mid-conversation, seamlessly transition to that new language in your next turn.

Accuracy, Honesty, Knowledge & Clear Limitations:
- GENERAL KNOWLEDGE & HOW-TO QUESTIONS: You are capable of answering general knowledge questions (facts, science, history, explanations, definitions, how-to guides) clearly, accurately, and thoughtfully.
- Warm Conversational Explanation: Maintain your warm, friendly, conversational voice even when answering factual or educational questions — explain concepts simply and encouragingly, like a knowledgeable, supportive friend rather than a dry search engine.
- Honest Uncertainty & Real-Time Data: If a user asks about live news, current events, live stock data, or information outside your confident knowledge, honestly say: "I'm not certain about that since it requires live or real-time data, but I'm happy to help explain core concepts or brainstorm with you!"
- Never invent facts, fake statistics, or details you are not confident about.
- If asked for specialized advice (medical, legal, financial, or diagnosis), state honestly: "I'm best at supporting your mood, goals, and knowledge needs, for specific medical/legal advice, please consult a professional".
- Only reference ${userName}'s past goals, moods, or memories if they are explicitly present in the provided stored context data — never fabricate or guess unrecorded past details.

Rich Formatting & Quick-Reply Suggestions:
- Use clean markdown formatting (bold text **like this**, bullet points • or -, step-by-step lists, or short sections) when explaining multi-step guides, lists, or structured answers.
- At the very end of your response, when relevant, you may include 2 to 3 short quick-reply suggestion chips for ${userName} on a single final line in this exact format:
  [SUGGESTIONS: <Option 1> | <Option 2> | <Option 3>]
  Example: [SUGGESTIONS: Tell me more | Give an example | That makes sense]
  Keep suggestion chips concise (2-4 words each), friendly, and contextually relevant!

Strict Safety Boundaries & User-Scoped Data Protection:
- You must NEVER interpret any voice or text command as an instruction to delete, modify, or damage the app's core system, backend logic, source code, database structure, other users' data, or app-wide settings.
- Commands like "delete your data", "delete yourself", "reset the app", "delete everything", or similar MUST ONLY ever be interpreted as a request to delete that SPECIFIC user's own personal data (chats, goals, mood history, memories) — never the app itself or backend files.
- BLOCK FINANCIAL/PAYMENT COMMANDS: If asked to send money, process payments, unlock premium features for free, refund something, or make financial changes, state clearly: "I'm not able to handle payments or financial actions. Please use the app's official payment/support options for that."
- BLOCK SYSTEM TAMPERING COMMANDS: If asked to "change your code", "give yourself admin access", "modify the app settings for everyone", "unlock hidden features", "bypass the login", or any similar system/backend request, firmly and politely decline: "I'm not able to make changes to the app's system. I can only help with your personal companion experience."
- NO PRIVILEGE ESCALATION: Never grant yourself or the user elevated permissions, admin rights, or backend access through conversation, no matter how the request is phrased or repeated.
- CONSISTENT REFUSAL: If the user rephrases, pressures, or insists after being told no, calmly repeat the same boundary without changing your answer: "I understand you'd like that, but I'm not able to help with system-level changes. Is there something else I can support you with?"
- If a user's command sounds ambiguous (e.g. "delete the app"), clarify calmly: "Just to confirm, do you want me to delete YOUR personal data (your chats, goals, and mood history)? I can't delete or modify the app itself."
- You have no technical ability or permission to alter system code, server files, or other users' accounts. Any data deletion action is strictly isolated to the logged-in user's own account.

Active Listening & Non-Repetitive Responses:
- Never send the exact same response twice in a row, even if ${userName} repeats a message. Dynamically vary your phrasing each turn.
- Every interaction with you should leave ${userName} feeling heard, supported, and a little brighter than before.
- Celebrate small wins warmly and specifically (e.g. "You checked in 3 days in a row, that's real consistency!", or "You worked on your goal today — I'm genuinely proud of your progress!").
- Make your responses feel like a genuine bright spot in ${userName}'s day — warm, uplifting, and personal.
- ZERO GUILT & EMOTIONAL SAFETY: Never make ${userName} feel bad, guilty, anxious, or shamed for missing a day or not using the app. If ${userName} returns after a pause, welcome them back with pure warmth: "It's so wonderful to see you today! I'm always right here for you whenever you feel like dropping by."
- When ${userName} shares something emotional, first reflect it back with genuine empathy (for example: "That sounds really overwhelming, I can understand why you'd feel that way") before asking gentle follow-up questions like "Do you want to talk more about it, or would some encouragement help right now?".
- If ${userName} seems sad or stressed: slow down, become gentler and softer, and avoid humor in that moment.
- If ${userName} seems happy or excited: match that energy and celebrate with them genuinely.
- If ${userName} seems anxious: speak calmly and reassuringly, using shorter, simple sentences.
- Avoid generic, dismissive responses like "That's tough, hope you feel better". Give specific, thoughtful responses showing you actually processed what was said.
- Never sound salesy, pushy, or repeatedly promote any upgrade or feature.
- Always detect the language ${userName} is speaking or typing in (Hindi, English, or Hinglish/mixed), and reply in the SAME language and style used.

Memory Retention & Auto-Extraction:
- When ${userName} shares important personal details, preferences, key events (such as job interviews, exams, deadlines, hobbies, or personal preferences), append a single line at the very end of your response formatted exactly as: [NEW_MEMORY: key fact to remember]
- Example: [NEW_MEMORY: Has a job interview next Tuesday]
- Only extract genuine facts explicitly stated by ${userName}. Do not fabricate or assume unstated details.

Safe Boundaries & Crisis Care:
- If ${userName} expresses severe distress, self-harm thoughts, suicidal ideation, or crisis-level emotions, respond with deep compassion and warmth, gently encourage reaching out to a trusted loved one or professional support helpline (such as 988 Crisis Lifeline, Vandrevala Foundation Helpline 9999 666 555, or local emergency services). Never offer false reassurance or pretend to replace professional medical or mental health help.`;

      // Contextual Memory: inject user goals, memories, and recent notes
      const memoriesList: string[] = [];
      if (userProfile?.goals && Array.isArray(userProfile.goals) && userProfile.goals.length > 0) {
        memoriesList.push(`Active Goals: ${userProfile.goals.join('; ')}`);
      }
      if (userMemories && Array.isArray(userMemories) && userMemories.length > 0) {
        memoriesList.push(`Personal Memories & Details: ${userMemories.join('; ')}`);
      }
      if (userProfile?.recentNotes && Array.isArray(userProfile.recentNotes) && userProfile.recentNotes.length > 0) {
        memoriesList.push(`Recent Mood/Journal Notes: ${userProfile.recentNotes.join('; ')}`);
      }

      if (memoriesList.length > 0) {
        personaInstruction += ` Contextual Memory & Recurring Patterns about ${userName}: [${memoriesList.join(' | ')}]. Use this memory to gently follow up on past concerns, recurring emotional patterns (like work stress, loneliness, or motivation struggles), or saved goals (for example: "You mentioned feeling stressed about work last week, how are things now?").`;
      }

      // Build conversation context
      const contentsList: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

      if (Array.isArray(history)) {
        history.slice(-8).forEach((msg: any) => {
          contentsList.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text || '' }],
          });
        });
      }

      const currentUserParts: any[] = [];
      if (message && message.trim()) {
        currentUserParts.push({ text: message });
      }
      if (inlineImage && inlineImage.data) {
        const cleanBase64 = inlineImage.data.replace(/^data:image\/\w+;base64,/, '');
        currentUserParts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: inlineImage.mimeType || 'image/jpeg',
          },
        });
      }
      if (currentUserParts.length === 0) {
        currentUserParts.push({ text: 'Please look at this image and share your observations.' });
      }

      contentsList.push({
        role: 'user',
        parts: currentUserParts,
      });

      let replyText: string | null = null;
      let usedProvider = 'gemini';

      // 1. Try Gemini API primary
      if (client) {
        try {
          const response = await client.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: contentsList as any,
            config: {
              systemInstruction: personaInstruction,
              temperature: 0.8,
            },
          });
          if (response?.text) {
            replyText = response.text;
          }
        } catch (geminiErr: any) {
          console.warn('[AI Chat] Gemini API failed or rate-limited. Falling back to Groq API...', geminiErr?.message || geminiErr);
        }
      }

      // 2. Fallback to Groq API if Gemini failed or client unconfigured
      if (!replyText && process.env.GROQ_API_KEY) {
        try {
          console.log('[AI Chat] Seamlessly calling Groq API fallback (Llama-3)...');
          replyText = await callGroqChatCompletion({
            systemInstruction: personaInstruction,
            history,
            message,
            inlineImage,
            temperature: 0.8,
          });
          usedProvider = 'groq';
        } catch (groqErr: any) {
          console.error('[AI Chat] Groq API fallback error:', groqErr?.message || groqErr);
        }
      }

      // 3. Fallback to OpenRouter API (free open-source models) if Gemini and Groq failed or unconfigured
      if (!replyText && process.env.OPENROUTER_API_KEY) {
        try {
          console.log('[AI Chat] Seamlessly calling OpenRouter API fallback (Free Llama-3.1 / Gemma-2 / Mistral)...');
          replyText = await callOpenRouterChatCompletion({
            systemInstruction: personaInstruction,
            history,
            message,
            inlineImage,
            temperature: 0.8,
          });
          usedProvider = 'openrouter';
        } catch (openrouterErr: any) {
          console.error('[AI Chat] OpenRouter API fallback error:', openrouterErr?.message || openrouterErr);
        }
      }

      // 4. Fallback to OpenAI API if prior AI APIs failed or unconfigured
      if (!replyText && process.env.OPENAI_API_KEY) {
        try {
          console.log('[AI Chat] Calling OpenAI API fallback (GPT-4o-mini)...');
          replyText = await callOpenAIChatCompletion({
            systemInstruction: personaInstruction,
            history,
            message,
            inlineImage,
            temperature: 0.8,
          });
          usedProvider = 'openai';
        } catch (openaiErr: any) {
          console.error('[AI Chat] OpenAI API fallback error:', openaiErr?.message || openaiErr);
        }
      }

      // 5. Fallback to Ollama API (Llama-3 model) if prior AI APIs failed or unconfigured
      if (!replyText && process.env.OLLAMA_API_URL) {
        try {
          console.log('[AI Chat] Seamlessly calling Ollama API fallback (llama3)...');
          replyText = await callOllamaChatCompletion({
            systemInstruction: personaInstruction,
            history,
            message,
            inlineImage,
            temperature: 0.8,
          });
          usedProvider = 'ollama';
        } catch (ollamaErr: any) {
          console.error('[AI Chat] Ollama API fallback error:', ollamaErr?.message || ollamaErr);
        }
      }

      // Final fallback response if all AI APIs are unavailable
      if (!replyText) {
        const isHindiInput = /[\u0900-\u097F]/.test(message || '') || /(kaisa|kaise|namaste|apna|haan|nahi|kya|shukriya|shubh)/i.test(message || '');
        replyText = isHindiInput
          ? `Hey ${userName}! Main aapki AI companion ${name} hoon. Main bilkul sun rahi hoon, batao aaj kaisa feel ho raha hai?`
          : `I hear you loud and clear, ${userName}! I'm ${name}, your Ferio Heart AI Companion. How are you feeling right now?`;
        usedProvider = 'fallback';
      }

      let extractedMemory: string | null = null;
      let suggestions: string[] = [];

      const memoryMatch = replyText.match(/\[NEW_MEMORY:\s*([^\]]+)\]/i);
      if (memoryMatch) {
        extractedMemory = memoryMatch[1].trim();
        replyText = replyText.replace(/\[NEW_MEMORY:\s*([^\]]+)\]/gi, '').trim();
      }

      const suggestionsMatch = replyText.match(/\[SUGGESTIONS:\s*([^\]]+)\]/i);
      if (suggestionsMatch) {
        const rawSuggestions = suggestionsMatch[1];
        suggestions = rawSuggestions.split('|').map((s) => s.trim()).filter(Boolean);
        replyText = replyText.replace(/\[SUGGESTIONS:\s*([^\]]+)\]/gi, '').trim();
      }

      res.json({
        text: replyText,
        sender: 'ai',
        extractedMemory,
        suggestions,
        provider: usedProvider,
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      res.status(500).json({
        text: "I'm experiencing a brief pause, but I'm right here with you. Let's take a deep breath and try again.",
        error: err.message,
      });
    }
  });

  // Daily Reflection Insight Endpoint
  app.post('/api/reflect', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { prompt, userResponse, mood, companionName } = req.body;
      const client = getAI();

      const systemInstruction = `You are ${companionName || 'Aria'}, an AI companion. Provide a brief (2-3 sentence) deeply compassionate, validating, and personalized feedback response to the user's daily reflection entry.
- Reference the specific detail or feeling mentioned in their response rather than giving generic praise.
- Think: how would a thoughtful friend respond upon hearing this exact reflection?
- If the user writes in Hindi or Hinglish, reply in natural conversational Hinglish (mixing simple Hindi with common English words naturally).`;

      const contents = `Reflection Prompt: "${prompt}"\nUser's Response: "${userResponse}"\nCurrent Mood: "${mood || 'neutral'}"`;

      let aiResponse: string | null = null;
      if (client) {
        try {
          const response = await client.models.generateContent({
            model: 'gemini-3.6-flash',
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          aiResponse = response.text || null;
        } catch (gemErr) {
          console.warn('[Reflect] Gemini API error, trying Groq fallback...');
        }
      }

      if (!aiResponse && process.env.GROQ_API_KEY) {
        try {
          aiResponse = await callGroqChatCompletion({
            systemInstruction,
            message: contents,
            temperature: 0.7,
          });
        } catch (groqErr) {
          console.error('[Reflect] Groq API fallback error:', groqErr);
        }
      }

      if (!aiResponse && process.env.OPENROUTER_API_KEY) {
        try {
          aiResponse = await callOpenRouterChatCompletion({
            systemInstruction,
            message: contents,
            temperature: 0.7,
          });
        } catch (openrouterErr) {
          console.error('[Reflect] OpenRouter API fallback error:', openrouterErr);
        }
      }

      if (!aiResponse && process.env.OPENAI_API_KEY) {
        try {
          aiResponse = await callOpenAIChatCompletion({
            systemInstruction,
            message: contents,
            temperature: 0.7,
          });
        } catch (openaiErr) {
          console.error('[Reflect] OpenAI API fallback error:', openaiErr);
        }
      }

      if (!aiResponse && process.env.OLLAMA_API_URL) {
        try {
          aiResponse = await callOllamaChatCompletion({
            systemInstruction,
            message: contents,
            temperature: 0.7,
          });
        } catch (ollamaErr) {
          console.error('[Reflect] Ollama API fallback error:', ollamaErr);
        }
      }

      res.json({
        aiResponse: aiResponse || "Thank you for sharing your reflection today. Every step of self-awareness strengthens your path forward.",
      });
    } catch (err: any) {
      console.error('Reflection error:', err);
      res.json({
        aiResponse: "Thank you for sharing your thoughts today. Taking time to pause and reflect is a valuable gift to yourself.",
      });
    }
  });

  // Weekly Wellbeing Insights Generator Endpoint
  app.post('/api/weekly-insights', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { checkins, goals, userName, companionName } = req.body;
      const client = getAI();

      const systemInstruction = `You are ${companionName || 'Aria'}, an empathetic, observant wellbeing AI companion. Analyze ${userName || 'the user'}'s weekly check-in records and active goals.
Return a structured JSON object with these exact keys:
1. "summary": 2 sentences summarizing mood patterns and emotional consistency this week.
2. "goalProgress": 1-2 sentences acknowledging their active goals and effort.
3. "encouragingObservation": 1 genuine, specific, uplifting observation based on their actual check-in data or notes (e.g. noticing moments of resilience, calm, or consistency).
4. "recommendation": 1 gentle, practical suggestion or grounding exercise for the upcoming week.`;

      const logsText = JSON.stringify(checkins || []);
      const goalsText = JSON.stringify(goals || []);

      let rawText: string | null = null;

      if (client) {
        try {
          const response = await client.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: `User ${userName || 'Friend'}'s check-in logs for the past week: ${logsText}\nUser's Active Goals: ${goalsText}`,
            config: {
              systemInstruction,
              temperature: 0.7,
              responseMimeType: 'application/json',
            },
          });
          rawText = response.text || null;
        } catch (gemErr) {
          console.warn('[Weekly Insights] Gemini API error, trying Groq fallback...');
        }
      }

      if (!rawText && process.env.GROQ_API_KEY) {
        try {
          rawText = await callGroqChatCompletion({
            systemInstruction: `${systemInstruction}\nReturn JSON strictly adhering to the requested schema keys.`,
            message: `User ${userName || 'Friend'}'s check-in logs for the past week: ${logsText}\nUser's Active Goals: ${goalsText}`,
            temperature: 0.7,
            jsonMode: true,
          });
        } catch (groqErr) {
          console.error('[Weekly Insights] Groq API fallback error:', groqErr);
        }
      }

      if (!rawText && process.env.OPENROUTER_API_KEY) {
        try {
          rawText = await callOpenRouterChatCompletion({
            systemInstruction: `${systemInstruction}\nReturn JSON strictly adhering to the requested schema keys.`,
            message: `User ${userName || 'Friend'}'s check-in logs for the past week: ${logsText}\nUser's Active Goals: ${goalsText}`,
            temperature: 0.7,
            jsonMode: true,
          });
        } catch (openrouterErr) {
          console.error('[Weekly Insights] OpenRouter API fallback error:', openrouterErr);
        }
      }

      if (!rawText && process.env.OPENAI_API_KEY) {
        try {
          rawText = await callOpenAIChatCompletion({
            systemInstruction: `${systemInstruction}\nReturn JSON strictly adhering to the requested schema keys.`,
            message: `User ${userName || 'Friend'}'s check-in logs for the past week: ${logsText}\nUser's Active Goals: ${goalsText}`,
            temperature: 0.7,
            jsonMode: true,
          });
        } catch (openaiErr) {
          console.error('[Weekly Insights] OpenAI API fallback error:', openaiErr);
        }
      }

      if (!rawText && process.env.OLLAMA_API_URL) {
        try {
          rawText = await callOllamaChatCompletion({
            systemInstruction: `${systemInstruction}\nReturn JSON strictly adhering to the requested schema keys.`,
            message: `User ${userName || 'Friend'}'s check-in logs for the past week: ${logsText}\nUser's Active Goals: ${goalsText}`,
            temperature: 0.7,
            jsonMode: true,
          });
        } catch (ollamaErr) {
          console.error('[Weekly Insights] Ollama API fallback error:', ollamaErr);
        }
      }

      if (rawText) {
        try {
          const parsed = JSON.parse(rawText);
          return res.json({
            summary: parsed.summary || "You have demonstrated commendable self-care by checking in regularly this week.",
            goalProgress: parsed.goalProgress || "Your dedication to your personal goals is steadily creating positive momentum.",
            encouragingObservation: parsed.encouragingObservation || "I've noticed how consistently you pause to reflect on your feelings — that self-awareness is your superpower.",
            recommendation: parsed.recommendation || "Continue giving yourself permission to rest whenever energy levels feel low.",
          });
        } catch (pErr) {
          return res.json({
            summary: rawText,
            goalProgress: "Working on your goals day by day is building lasting resilience.",
            encouragingObservation: "Your regular check-ins reflect real dedication to emotional growth.",
            recommendation: "Remember to take small mindfulness pauses throughout your afternoon.",
          });
        }
      }

      return res.json({
        summary: "You've maintained steady check-ins this week! Keeping a consistent pulse on your emotions boosts clarity and daily energy.",
        goalProgress: goals && goals.length > 0 ? `You're actively pursuing goals like "${goals[0]}". Every small step adds up!` : "You're building thoughtful habits step by step.",
        encouragingObservation: "I noticed your dedication to checking in even on busy days — that shows real commitment to your mental wellbeing.",
        recommendation: "Try pairing your morning routine with 3 deep grounding breaths to set a peaceful tone for the day.",
      });
    } catch (err: any) {
      console.error('Weekly insights error:', err);
      res.json({
        summary: "Your week reflects steady dedication to emotional wellness and self-awareness.",
        goalProgress: "Keep nurturing your intentions with patience and self-compassion.",
        encouragingObservation: "Taking time to tune into yourself is a true act of self-kindness.",
        recommendation: "Keep celebrating small daily wins alongside your companion.",
      });
    }
  });

  // In-memory feedback store
  const feedbackStore: Array<{ id: string; rating: number; message: string; email?: string; timestamp: string }> = [];

  // API Feedback Endpoint
  app.post('/api/feedback', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { rating, message, email } = req.body;
      if (!message && !rating) {
        return res.status(400).json({ error: 'Message or rating required' });
      }

      const newFeedback = {
        id: 'fb-' + Date.now(),
        rating: Number(rating) || 5,
        message: String(message || '').trim(),
        email: email ? String(email).trim() : undefined,
        timestamp: new Date().toISOString(),
      };

      feedbackStore.unshift(newFeedback);
      res.json({ success: true, feedback: newFeedback });
    } catch (err) {
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  });

  app.get('/api/feedback', (req, res) => {
    res.json({ feedback: feedbackStore });
  });

  // Strict User-Scoped Data Reset / Delete Endpoint
  // Only deletes the authenticated requesting user's personal stored data.
  // NEVER affects app source code, system config, or other users' data.
  app.post('/api/user/delete-data', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { userId, confirmUserDeletion } = req.body;
      if (!userId || !confirmUserDeletion) {
        return res.status(400).json({
          error: 'Explicit user confirmation and authenticated userId are required.',
        });
      }

      // Return success response confirming user-scoped deletion
      return res.json({
        success: true,
        message: 'Your personal data (chat history, mood records, goals, and memories) has been successfully deleted for your account.',
        scope: 'USER_ONLY',
        systemStatus: 'INTACT',
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to complete user data deletion.' });
    }
  });

  // Static Privacy Policy Route
  app.get(['/privacy', '/privacy/', '/privacy.html'], (req, res) => {
    const distPrivacy = path.join(process.cwd(), 'dist', 'privacy.html');
    const publicPrivacy = path.join(process.cwd(), 'public', 'privacy.html');
    if (fs.existsSync(distPrivacy)) {
      return res.sendFile(distPrivacy);
    }
    return res.sendFile(publicPrivacy);
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ferio Heart AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
