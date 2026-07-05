/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { 
  handleGeneratePoem, 
  handleLiteraryTool, 
  devLogs, 
  addDevLog 
} from './src/backend-logic';

// Load environment variables
dotenv.config();

const PORT = 3000;
const app = express();

// Trust proxy for secure cookies over HTTPS behind proxy layers
app.set('trust proxy', 1);

// Middleware for body parsing
app.use(express.json({ limit: '10mb' }));

// Professional Error Logger
function logError(context: string, error: any) {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';
  
  console.error(`[ERROR] [${timestamp}] [${context}]: ${errorMessage}`);
  if (errorStack) {
    console.error(`[STACK] [${timestamp}] [${context}]: ${errorStack}`);
  }
  addDevLog(context, null, `${errorMessage}\n${errorStack}`);
}

// In-Memory Rate Limiting and Spam Protection
interface RateLimitInfo {
  timestamps: number[];
  blockedUntil?: number;
}
const ipRequestHistory = new Map<string, RateLimitInfo>();

// In-Memory Daily IP limits for local simulator behavior
const localDailyLimits = new Map<string, number>();

function getLocalLimitKey(req: express.Request): string {
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  const today = new Date().toISOString().slice(0, 10);
  return `${ip}:${today}`;
}

const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute
const SPAM_WINDOW_MS = 2000; // 2 seconds
const MAX_REQUESTS_SPAM = 3; // Max 3 requests in 2 seconds

function rateLimiterAndSpamProtection(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown-ip';
  const now = Date.now();

  let info = ipRequestHistory.get(ip);
  if (!info) {
    info = { timestamps: [] };
    ipRequestHistory.set(ip, info);
  }

  // Check if IP is blocked
  if (info.blockedUntil && info.blockedUntil > now) {
    const remainingTime = Math.ceil((info.blockedUntil - now) / 1000);
    return res.status(429).json({
      error: `تم حظر طلباتك مؤقتاً لحماية النظام من الإغراق والـ Spam. يرجى الانتظار ${remainingTime} ثانية.`
    });
  }

  // Filter timestamps within current window
  info.timestamps = info.timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  // Check for Spam (too many requests in a short time)
  const spamRequests = info.timestamps.filter(ts => now - ts < SPAM_WINDOW_MS);
  if (spamRequests.length >= MAX_REQUESTS_SPAM) {
    info.blockedUntil = now + 30000; // Block for 30 seconds
    console.warn(`[Security-Spam] IP ${ip} detected spamming. Blocked for 30 seconds.`);
    return res.status(429).json({
      error: 'تم اكتشاف نشاط مريب (إرسال طلبات متكررة بسرعة فائقة). تم حظر الـ IP الخاص بك مؤقتاً لمدة 30 ثانية لحماية النظام.'
    });
  }

  // Check for Rate Limit
  if (info.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'لقد تجاوزت الحد الأقصى المسموح به من الطلبات (60 طلب في الدقيقة). يرجى المحاولة لاحقاً.'
    });
  }

  info.timestamps.push(now);
  next();
}

// Apply rate limiting & spam protection to all /api endpoints
app.use('/api/', rateLimiterAndSpamProtection);

// Helper to get GoogleGenAI client
function getAiClient(): GoogleGenAI {
  const finalKey = process.env.GEMINI_API_KEY;
  if (!finalKey || finalKey.trim() === '') {
    throw new Error('CONFIG_ERROR');
  }
  return new GoogleGenAI({
    apiKey: finalKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-local',
      },
    },
  });
}

// Helper to verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string | undefined, secretKey: string | undefined): Promise<boolean> {
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY is not configured in local environment. Bypassing Turnstile verification.');
    return true;
  }
  if (!token) {
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data: any = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('Error verifying Turnstile token:', err);
    return false;
  }
}

// Diagnostic health endpoint
app.get('/api/health', (req, res) => {
  const serverKey = process.env.GEMINI_API_KEY;
  let geminiStatus = 'disconnected';
  
  if (serverKey && serverKey.trim() !== '') {
    geminiStatus = 'connected';
  } else {
    console.warn('❌ [SUPERVISOR ALERT] CRITICAL: GEMINI_API_KEY is missing from environment variables!');
  }

  res.json({
    status: 'ok',
    gemini: geminiStatus,
    hasApiKey: !!serverKey
  });
});

// App configuration endpoint
app.get('/api/config', (req, res) => {
  const key = getLocalLimitKey(req);
  const currentCount = localDailyLimits.get(key) || 0;
  res.json({
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY || '',
    remainingDailyUses: Math.max(0, 10 - currentCount)
  });
});

// Developer logs endpoint
app.get('/api/dev-logs', (req, res) => {
  res.json(devLogs);
});

// Poem generation endpoint
app.post('/api/generate-poem', async (req, res) => {
  try {
    const key = getLocalLimitKey(req);
    const currentCount = localDailyLimits.get(key) || 0;
    if (currentCount >= 10) {
      return res.status(429).json({
        error: 'لقد وصلت إلى الحد اليومي المسموح به (10 استخدامات يومياً). يرجى المحاولة غداً.',
        remainingDailyUses: 0
      });
    }

    const { turnstileToken } = req.body;
    const isVerified = await verifyTurnstileToken(turnstileToken, process.env.TURNSTILE_SECRET_KEY);
    if (!isVerified) {
      return res.status(403).json({
        error: 'فشل التحقق الأمني. يرجى إعادة المحاولة.'
      });
    }

    const aiInstance = getAiClient();
    const result = await handleGeneratePoem(req.body, aiInstance);

    // Increase limit count
    localDailyLimits.set(key, currentCount + 1);

    const responseData = typeof result === 'object' && result !== null
      ? { ...result, remainingDailyUses: Math.max(0, 10 - (currentCount + 1)) }
      : { result, remainingDailyUses: Math.max(0, 10 - (currentCount + 1)) };

    return res.json(responseData);
  } catch (err: any) {
    if (err.message === 'CONFIG_ERROR') {
      console.error('❌ [SUPERVISOR ALERT] CRITICAL: GEMINI_API_KEY is missing from environment variables!');
      return res.status(503).json({ 
        error: 'عذراً، لم يتم تهيئة مفتاح توليد القصائد (GEMINI_API_KEY) في إعدادات بيئة المشروع. يرجى تهيئته لبدء نظم الشعر.' 
      });
    }
    logError('generate-poem', err);
    return res.status(500).json({ error: err.message || 'حدث خطأ غير متوقع أثناء توليد القصيدة.' });
  }
});

// Literary tools endpoint
app.post('/api/literary-tool', async (req, res) => {
  try {
    const key = getLocalLimitKey(req);
    const currentCount = localDailyLimits.get(key) || 0;
    if (currentCount >= 10) {
      return res.status(429).json({
        error: 'لقد وصلت إلى الحد اليومي المسموح به (10 استخدامات يومياً). يرجى المحاولة غداً.',
        remainingDailyUses: 0
      });
    }

    const { toolAction, payload, turnstileToken } = req.body;
    if (!toolAction) {
      return res.status(400).json({ error: 'حقل الإجراء (toolAction) مطلوب.' });
    }

    const isVerified = await verifyTurnstileToken(turnstileToken, process.env.TURNSTILE_SECRET_KEY);
    if (!isVerified) {
      return res.status(403).json({
        error: 'فشل التحقق الأمني. يرجى إعادة المحاولة.'
      });
    }

    const aiInstance = getAiClient();
    const result = await handleLiteraryTool(toolAction, payload, aiInstance);

    // Increase limit count
    localDailyLimits.set(key, currentCount + 1);

    const responseData = typeof result === 'object' && result !== null
      ? { ...result, remainingDailyUses: Math.max(0, 10 - (currentCount + 1)) }
      : { result, remainingDailyUses: Math.max(0, 10 - (currentCount + 1)) };

    return res.json(responseData);
  } catch (err: any) {
    if (err.message === 'CONFIG_ERROR') {
      console.error('❌ [SUPERVISOR ALERT] CRITICAL: GEMINI_API_KEY is missing from environment variables!');
      return res.status(503).json({ 
        error: 'عذراً، لم يتم تهيئة مفتاح الأدوات الأدبية (GEMINI_API_KEY) في إعدادات بيئة المشروع. يرجى تهيئته لتفعيل هذه الأداة.' 
      });
    }
    logError('literary-tool', err);
    return res.status(500).json({ error: err.message || 'حدث خطأ فني أثناء معالجة الأداة الأدبية.' });
  }
});

// Setup Vite Dev Server / Static files serving
async function setupFrontend() {
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
}

// Start local development server
setupFrontend().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

// Run startup self-test for Gemini API Reachability
const key = process.env.GEMINI_API_KEY;
console.log('==================================================');
console.log('[Startup-Test] Running automatic startup test...');
if (!key || key.trim() === '') {
  console.warn('❌ [SUPERVISOR ALERT] CRITICAL: GEMINI_API_KEY is missing from environment variables!');
  console.warn('❌ [SUPERVISOR ALERT] Users will not be able to generate poems or use literary tools.');
} else {
  console.log(`[Startup-Test] ✓ GEMINI_API_KEY is loaded in environment. Length: ${key.trim().length}`);
}
console.log('==================================================');

export default app;
