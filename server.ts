/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { AsyncLocalStorage } from 'async_hooks';

// Load environment variables
dotenv.config();

// Define AsyncLocalStorage to store the scoped GoogleGenAI instance for the current request
export const aiStorage = new AsyncLocalStorage<GoogleGenAI>();

// Ensure the Gemini API Key is available
const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('⚠️ GEMINI_API_KEY is not defined in environment variables.');
}

function stripComments(jsonStr: string): string {
  // Matches either a double-quoted string (to keep it as is) or single-line/multi-line comments to remove them.
  return jsonStr.replace(/("(?:[^"\\]|\\.)*")|(?:\/\/[^\r\n]*|\/\*[\s\S]*?\*\/)/g, (match, stringGroup) => {
    if (stringGroup) {
      return stringGroup;
    }
    return '';
  });
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Logger that suppresses output in production (Requirement 13)
const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(...args);
    }
  }
};

// Internal task queue for sequencing requests (Requirement 2)
class TaskQueue {
  private queue: (() => Promise<void>)[] = [];
  private running = false;

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const res = await task();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      });
      this.runNext();
    });
  }

  private async runNext() {
    if (this.running) return;
    const task = this.queue.shift();
    if (!task) return;

    this.running = true;
    try {
      await task();
    } finally {
      this.running = false;
      this.runNext();
    }
  }
}

const poemGenerationQueue = new TaskQueue();

// 24-Hour Cache implementation (Requirement 18)
interface CacheEntry {
  response: any;
  timestamp: number;
}
const apiCache = new Map<string, CacheEntry>();

function getCachedResponse(key: string): any | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  if (age < ONE_DAY_MS) {
    logger.log(`[Cache Hit] Returning cached response for key: ${key}`);
    return entry.response;
  }
  apiCache.delete(key);
  return null;
}

function setCachedResponse(key: string, response: any) {
  apiCache.set(key, {
    response,
    timestamp: Date.now()
  });
}

// Active user session tracking to prevent concurrent requests (Requirement 1)
const activeUsers = new Set<string>();

function isRetryableError(error: any): boolean {
  const msg = String(error?.message || error || "").toLowerCase();
  const status = error?.status || "";
  const code = error?.code || 0;
  return (
    msg.includes("quota") || 
    msg.includes("429") || 
    msg.includes("exhausted") || 
    msg.includes("rate limit") ||
    msg.includes("503") ||
    msg.includes("unavailable") ||
    String(status).toLowerCase().includes("unavailable") ||
    String(status).toLowerCase().includes("resource_exhausted") ||
    code === 429 ||
    code === 503
  );
}

function escapeLiteralNewlinesInStrings(str: string): string {
  let result = '';
  let inQuote = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      result += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      result += char;
      escape = true;
      continue;
    }
    if (char === '"') {
      inQuote = !inQuote;
      result += char;
      continue;
    }
    if (inQuote) {
      if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  return result;
}

function autoCloseJson(str: string): string {
  let openBraces = 0;
  let openBrackets = 0;
  let inQuote = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (!inQuote) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
    }
  }

  let closed = str;
  if (inQuote) {
    closed += '"';
  }

  while (/[,\s:+]$/.test(closed)) {
    closed = closed.slice(0, -1);
  }

  while (openBrackets > 0) {
    closed += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    closed += '}';
    openBraces--;
  }

  return closed;
}

function robustParseJson(text: string | null | undefined): any {
  if (!text) return {};
  let cleaned = text.trim();

  // 1. Remove markdown backticks if present
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?([\s\S]*?)```/);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }

  // 2. Extract outermost JSON structure
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf(']');
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  // Strip JavaScript-style inline/block comments
  cleaned = stripComments(cleaned);

  // Escape literal raw newlines inside strings
  cleaned = escapeLiteralNewlinesInStrings(cleaned);

  // Replace trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // Replace any accidental Arabic commas '،' outside of quotes
  let inString = false;
  let escape = false;
  let charArray = Array.from(cleaned);
  for (let i = 0; i < charArray.length; i++) {
    const char = charArray[i];
    if (char === '"' && !escape) {
      inString = !inString;
    }
    if (char === '\\' && !escape) {
      escape = true;
    } else {
      escape = false;
    }
    if (!inString && char === '،') {
      charArray[i] = ',';
    }
  }
  cleaned = charArray.join('');

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.warn("[JSON PARSE] Standard parse failed, trying cutoff auto-closing recovery...", err.message);
    try {
      const closedCleaned = autoCloseJson(cleaned);
      return JSON.parse(closedCleaned);
    } catch (err2: any) {
      console.error("[JSON PARSE] Cutoff recovery failed. Raw text:", text);
      throw new Error(`فشل في تحليل استجابة JSON: ${err2.message}`);
    }
  }
}

function cleanAndParseJson(text: string | null | undefined): any {
  return robustParseJson(text);
}

interface DevLog {
  timestamp: string;
  tool: string;
  rawResponse: string | null;
  errorReason: string;
}

const devLogs: DevLog[] = [];

function addDevLog(tool: string, rawResponse: string | null, errorReason: string) {
  const log: DevLog = {
    timestamp: new Date().toISOString(),
    tool,
    rawResponse,
    errorReason,
  };
  devLogs.push(log);
  if (devLogs.length > 50) {
    devLogs.shift();
  }
  console.error(`[DEV_LOG] Tool: ${tool} | Error: ${errorReason}`);
}

interface GeminiCallParams {
  toolName: string;
  model?: string;
  contents: string | any[];
  config?: any;
  ai?: GoogleGenAI;
}

async function callGeminiWithJsonParsing(params: GeminiCallParams): Promise<any> {
  const { toolName, model = 'gemini-3.5-flash', contents, config = {}, ai: passedAi } = params;
  
  const storeAi = aiStorage.getStore();
  const aiInstance = passedAi || storeAi || ai;
  if (!aiInstance) {
    const errMsg = 'لم يتم العثور على مفتاح API الخاص بـ Gemini. يرجى تهيئة المفتاح في صفحة الإعدادات.';
    addDevLog(toolName, null, errMsg);
    throw new Error(errMsg);
  }

  const retryDelays = [2000, 5000, 10000, 20000];
  const maxAttempts = 1 + retryDelays.length; // 5 attempts total (Initial + 4 retries)
  const maxParsingCorrectionAttempts = 2; 
  
  let lastError: any = null;
  let rawResponseText: string | null = null;
  let modifiedContents = contents;
  
  for (let parseAttempt = 0; parseAttempt < maxParsingCorrectionAttempts; parseAttempt++) {
    let apiAttempt = 0;
    rawResponseText = null;
    
    while (apiAttempt < maxAttempts) {
      try {
        // Debounce of 1500ms before any model invocation (Requirement 3)
        logger.log(`[Debounce] Waiting 1500ms before model invocation for ${toolName}...`);
        await sleep(1500);

        logger.log(`[Gemini API Call] [${toolName}] Attempt ${apiAttempt + 1}/${maxAttempts}...`);
        
        const result = await aiInstance.models.generateContent({
          model: 'gemini-3.5-flash', // Requirement 17: default stable model
          contents: modifiedContents,
          config,
        });
        
        rawResponseText = result.text;
        if (!rawResponseText) {
          throw new Error('أعاد النموذج استجابة فارغة.');
        }
        
        break;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || String(error);
        logger.error(`[Gemini API Error] [${toolName}] API call failed: ${errorMsg}`);
        addDevLog(toolName, null, `API Error on attempt ${apiAttempt + 1}: ${errorMsg}`);
        
        apiAttempt++;
        if (apiAttempt < maxAttempts) {
          const isRetryable = isRetryableError(error);
          const delayTime = isRetryable ? retryDelays[apiAttempt - 1] : 1000;
          logger.log(`[Gemini API Retry] Waiting ${delayTime}ms before retrying due to ${isRetryable ? 'Quota/Unavailability' : 'General Error'}...`);
          await sleep(delayTime);
        }
      }
    }
    
    if (!rawResponseText) {
      const errorMsg = lastError?.message || 'فشل الاتصال بخدمة الذكاء الاصطناعي.';
      const localizedError = isRetryableError(lastError)
        ? 'الخادم مشغول حالياً نتيجة كثرة الطلبات، جارٍ إعادة المحاولة تلقائياً. إن استمرت المشكلة يرجى المحاولة بعد دقائق.'
        : `عذراً، فشل الاتصال بخدمة توليد النصوص الذكية: ${errorMsg}. يرجى التحقق من اتصالك والمحاولة مجدداً.`;
      
      addDevLog(toolName, null, `API completely failed after ${maxAttempts} attempts. Last error: ${errorMsg}`);
      throw new Error(localizedError);
    }
    
    try {
      const parsed = robustParseJson(rawResponseText);
      return parsed; 
    } catch (parseError: any) {
      logger.warn(`[JSON Parse Fail] [${toolName}] Parse attempt ${parseAttempt + 1} failed: ${parseError.message}`);
      addDevLog(toolName, rawResponseText, `Parsing error: ${parseError.message}`);
      
      if (parseAttempt + 1 < maxParsingCorrectionAttempts) {
        logger.log(`[Self-Correction] Requesting Gemini to correct JSON structure for ${toolName}...`);
        const correctionInstructions = `
تنبيه هام جداً: الاستجابة السابقة التي قدمتها لم تكن بتنسيق JSON صالح ومكتمل وتسببت في خطأ بالتحليل.
الخطأ الناتج كان: ${parseError.message}

الرجاء إعادة توليد النتيجة السابقة بتنسيق JSON سليم مائة بالمائة وبشكل كامل دون أي كسر في الأقواس أو علامات التنصيص ودون وضع أي تعليقات مثل // داخل الكود.
تأكد من إغلاق كافة الأقواس بشكل صحيح ومطابقة الهيكل المطلوب تماماً.
`;
        if (typeof modifiedContents === 'string') {
          modifiedContents = [
            { role: 'user', parts: [{ text: modifiedContents }] },
            { role: 'model', parts: [{ text: rawResponseText }] },
            { role: 'user', parts: [{ text: correctionInstructions }] }
          ];
        } else if (Array.isArray(modifiedContents)) {
          modifiedContents = [
            ...modifiedContents,
            { role: 'model', parts: [{ text: rawResponseText }] },
            { role: 'user', parts: [{ text: correctionInstructions }] }
          ];
        }
      } else {
        const localizedError = `فشل النظام في تحليل النتيجة المستلمة بتنسيق JSON سليم، يرجى المحاولة مرة أخرى أو اختصار حجم الطلب.`;
        throw new Error(localizedError);
      }
    }
  }
}

function getAiClient(req: express.Request): GoogleGenAI {
  const finalKey = process.env.GEMINI_API_KEY;
  if (!finalKey || finalKey.trim() === '') {
    throw new Error('CONFIG_ERROR');
  }
  return new GoogleGenAI({
    apiKey: finalKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function runStartupTest() {
  console.log('==================================================');
  console.log('[Startup-Test] Running automatic startup test...');
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '') {
    console.warn('❌ [SUPERVISOR ALERT] CRITICAL: GEMINI_API_KEY is missing from environment variables!');
    console.warn('❌ [SUPERVISOR ALERT] Users will not be able to generate poems or use literary tools.');
    console.log('==================================================');
    return;
  }

  console.log(`[Startup-Test] ✓ GEMINI_API_KEY is loaded in environment. Length: ${key.trim().length}`);
  console.log('==================================================');
}

const app = express();
const PORT = 3000;

// Trust proxy for secure cookies over HTTPS behind proxy layers
app.set('trust proxy', 1);

// Middleware for body parsing
app.use(express.json({ limit: '10mb' }));

// Netlify Functions transparent internal router rewrite
app.use((req, res, next) => {
  if (req.path === '/.netlify/functions/generate') {
    const action = req.query.action || req.body?.action;
    if (action === 'health') {
      req.url = '/api/health';
    } else if (action === 'dev-logs') {
      req.url = '/api/dev-logs';
    } else if (action === 'generate-poem') {
      req.url = '/api/generate-poem';
    } else if (action === 'literary-tool') {
      req.url = '/api/literary-tool';
    }
  }
  next();
});

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

const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute
const SPAM_WINDOW_MS = 2000; // 2 seconds
const MAX_REQUESTS_SPAM = 3; // Max 3 requests in 2 seconds

function rateLimiterAndSpamProtection(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown-ip';
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

// API Routes
app.get('/api/dev-logs', (req, res) => {
  res.json(devLogs);
});

// Diagnostic health endpoint
app.get('/api/health', async (req, res) => {
  const serverKey = process.env.GEMINI_API_KEY;
  let geminiStatus = 'disconnected';
  
  if (serverKey && serverKey.trim() !== '') {
    geminiStatus = 'connected';
  } else {
    console.warn('❌ [SUPERVISOR ALERT] CRITICAL: GEMINI_API_KEY is missing from environment variables!');
  }

  res.json({
    status: 'ok',
    gemini: geminiStatus
  });
});


  app.post('/api/generate-poem', async (req, res) => {
    const {
      meterName,
      purpose,
      customPurpose,
      isOpposition,
      oppositionPoem,
      isSimulatingPoet,
      poetName,
      description,
      versesCount,
      rhymeSystem,
      customRhymeLetter,
      clientId: bodyClientId
    } = req.body;

    // 1. Get Client ID (Requirement 1)
    const clientId = String(bodyClientId || req.headers['x-client-id'] || 'global-client');

    // 2. Prevent sending more than one request at the same time for the same user (Requirement 1 & 7)
    if (activeUsers.has(clientId)) {
      return res.status(429).json({
        error: 'لديك عملية توليد جارية حالياً. يرجى الانتظار حتى اكتمالها.'
      });
    }

    let aiInstance: GoogleGenAI;
    try {
      aiInstance = getAiClient(req);
    } catch (err: any) {
      if (err.message === 'CONFIG_ERROR') {
        console.error('❌ [SUPERVISOR ALERT] CRITICAL: GEMINI_API_KEY is missing from environment variables! Please set GEMINI_API_KEY in Netlify settings.');
        return res.status(503).json({ error: 'عذراً، لم يتم تهيئة مفتاح توليد القصائد (GEMINI_API_KEY) في إعدادات بيئة Netlify. يرجى تهيئته لبدء نظم الشعر.' });
      }
      return res.status(500).json({ error: 'حدث خطأ فني غير متوقع.' });
    }

    try {
      // 3. Prevent sending empty or incomplete requests (Requirement 6)
      if (!meterName || !purpose || !description || !versesCount) {
        return res.status(400).json({
          error: 'الرجاء توفير جميع الحقول الأساسية المطلوبة لتوليد القصيدة.',
        });
      }

      if (typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({
          error: 'وصف موضوع القصيدة لا يمكن أن يكون فارغاً.',
        });
      }

      const parsedVersesCount = parseInt(versesCount, 10);
      if (isNaN(parsedVersesCount) || parsedVersesCount < 1 || parsedVersesCount > 30) {
        return res.status(400).json({
          error: 'عدد الأبيات يجب أن يكون رقماً صحيحاً بين 1 و 30.',
        });
      }

      // Convert rhyme system code to descriptive Arabic text for the prompt
      let rhymeSystemText = '';
      switch (rhymeSystem) {
        case 'unified':
          rhymeSystemText = 'قافية موحدة في نهاية عجز كل بيت على نفس حرف الروي.';
          break;
        case 'strophic':
          rhymeSystemText = 'قافية لكل مقطوعة (تغيير القافية كل بيتين أو ثلاثة مع المحافظة على الجرس).';
          break;
        case 'tasri':
          rhymeSystemText = 'قافية موحدة مع إبراز التصريع في المطلع فقط (توافق نهاية الصدر والعجز في البيت الأول).';
          break;
        case 'internal':
          rhymeSystemText = 'قافية داخلية بين شطري كل بيت من الأبيات (تصريع داخلي مستمر).';
          break;
        case 'custom':
          rhymeSystemText = `قافية موحدة ملتزمة بحرف روي محدد يدوياً وهو: (${customRhymeLetter || 'تلقائي'}).`;
          break;
        default:
          rhymeSystemText = 'قافية موحدة كلاسيكية.';
      }

      const finalPurpose = purpose === 'غير ذلك' ? customPurpose || 'عام' : purpose;

      // 4. Smart Cache check (Requirement 18)
      const normalizedDesc = description.trim().replace(/\s+/g, ' ');
      const cacheKey = `poem:${meterName}:${purpose}:${customPurpose || ''}:${isOpposition}:${oppositionPoem || ''}:${isSimulatingPoet}:${poetName || ''}:${parsedVersesCount}:${rhymeSystem}:${customRhymeLetter || ''}:${normalizedDesc}`;
      
      const cachedResponse = getCachedResponse(cacheKey);
      if (cachedResponse) {
        logger.log(`[Cache Hit] Returning cached poem for client ${clientId}`);
        return res.json(cachedResponse);
      }

      // Add user to active session tracking BEFORE putting in queue
      activeUsers.add(clientId);

      // 5. Enqueue request inside sequential task queue (Requirement 2)
      const finalPoem = await poemGenerationQueue.enqueue(async () => {
        if (!ai) {
          throw new Error('لم يتم العثور على مفتاح API الخاص بـ Gemini.');
        }

        const prompt = `
أنت الآن "لجنة كبار شعراء ونقاد ديوان العرب وبيت الحكمة". مهمتكم المشتركة هي صياغة قصيدة عربية فصحى فائقة الجمال وبلاغية النظم وموزونة عروضياً بدقة تامة على البحر الشعري المطلوب، ثم تقديم شرح وافٍ وتقييم صارم لها، كل ذلك في استجابة واحدة بتنسيق JSON.

المدخلات الأساسية للنظم:
- البحر الشعري المطلوب الالتزام به: البحر (${meterName})
- غرض القصيدة الشعري: (${finalPurpose})
- هل هي معارضة شعرية لقصيدة أخرى؟ (${isOpposition ? 'نعم' : 'لا'})
  ${isOpposition && oppositionPoem ? `القصيدة المراد معارضتها ومحاكاتها:\n"""\n${oppositionPoem}\n"""\n(قم بتحليل البحر والقافية والمعجم اللغوي لهذه القصيدة، وانظم المعارضة على نفس الروي والوزن وبأسلوب يتفوق بلاغة وجزالة)` : ''}
- هل يراد محاكاة أسلوب شاعر معين؟ (${isSimulatingPoet ? 'نعم' : 'لا'})
  ${isSimulatingPoet && poetName ? `اسم الشاعر المطلوب محاكاته: (${poetName})\n(تقمص روح وفلسفة وألفاظ وميزات هذا الشاعر الفنية دون نسخ مباشر)` : ''}
- وصف موضوع القصيدة نثراً (الأفكار المطلوب تضمينها):
  """
  ${description}
  """
- عدد الأبيات المطلوب توليدها: (${parsedVersesCount}) بيتاً شعرياً بالضبط.
- نظام القافية المتبع: (${rhymeSystemText})
  ${customRhymeLetter ? `حرف الروي المحدد للقصيدة: (${customRhymeLetter})` : ''}

خطوات العمل المتبعة في هذه الجلسة المشتركة:
1. صياغة الأبيات (دور الشاعر): نسج الأبيات برقي بلاغي ووزني فائق مع تجنب الخطابة المباشرة أو الأسلوب الركيك النثري. قدم المعاني والعمق الفكري عبر الاستعارات والكنايات البديعة.
2. التدقيق العروضي (دور العروضي): فحص بحر الأبيات بدقة والتأكد من تفعيلاتها وسلامة التفاعيل والزحافات والعلل السليمة، وتصحيح أي كسر عروضي أو عيب وزني.
3. التقييم والتحكيم البلاغي والنقدي (دور الناقد): مراجعة الصور الفنية والمجازية، وتوليد شرح مبسط وممتاز لمعاني الأبيات والمفردات والتصوير الجمالي فيها.

يجب أن تكون الاستجابة حصراً ككائن JSON صالح ومكتمل ومطابق للهيكل التالي تماماً دون أي نص خارجي أو علامات markdown إضافية:
{
  "title": "عنوان القصيدة المبتكر والمناسب",
  "verses": [
    {
      "shatr1": "الصدر (الشطر الأول من البيت الأول)",
      "shatr2": "العجز (الشطر الثاني من البيت الأول)",
      "index": 1
    }
  ],
  "feetUsed": "تفعيلات البحر المعتمد الفعلية التي جرى النظم عليها بالتفصيل العروضي",
  "explanation": "شرح أدبي وبلاغي مفصل ومبسط لمعاني القصيدة والصور الجمالية المبتكرة فيها والمفردات الصعبة بأسلوب فخم وجميل",
  "weightSafetyPercentage": 100,
  "rhymeSafetyPercentage": 100,
  "overallScore": 95
}

تنبيهات صارمة:
- التزم بعدد الأبيات المطلوب (${parsedVersesCount}) بيتاً بالضبط دون زيادة أو نقصان.
- تجنب تماماً أي كسر عروضي أو خلل في القافية.
- لا تضع أي تعليقات مثل // داخل كود JSON.
`;

        const responseJson = await callGeminiWithJsonParsing({
          toolName: 'generate-poem (Unified Single Pass)',
          model: 'gemini-3.5-flash',
          contents: prompt,
          ai: aiInstance,
          config: {
            systemInstruction: 'أنت لجنة من كبار شعراء ونقاد العرب المتخصصين في نظم وتدقيق عروض الشعر العربي الكلاسيكي.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                verses: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      shatr1: { type: Type.STRING },
                      shatr2: { type: Type.STRING },
                      index: { type: Type.INTEGER }
                    },
                    required: ['shatr1', 'shatr2', 'index']
                  }
                },
                feetUsed: { type: Type.STRING },
                explanation: { type: Type.STRING },
                weightSafetyPercentage: { type: Type.INTEGER },
                rhymeSafetyPercentage: { type: Type.INTEGER },
                overallScore: { type: Type.INTEGER }
              },
              required: ['title', 'verses', 'feetUsed', 'explanation', 'weightSafetyPercentage', 'rhymeSafetyPercentage', 'overallScore']
            }
          }
        });

        const outputPoem = {
          id: Math.random().toString(36).substring(2, 11),
          title: responseJson.title,
          verses: responseJson.verses,
          meterName: meterName,
          feet: responseJson.feetUsed || "تفعيلات البحر المعتمد",
          rhymeLetter: customRhymeLetter || responseJson.rhymeLetter || 'مطلقة',
          purpose: finalPurpose,
          poetSimulated: isSimulatingPoet ? poetName : undefined,
          isOpposition: isOpposition,
          explanation: responseJson.explanation,
          weightSafetyPercentage: responseJson.weightSafetyPercentage || 100,
          rhymeSafetyPercentage: responseJson.rhymeSafetyPercentage || 100,
          createdAt: new Date().toISOString()
        };

        // Cache the successful result (Requirement 18)
        setCachedResponse(cacheKey, outputPoem);

        return outputPoem;
      });

      return res.json(finalPoem);
    } catch (error: any) {
      logger.error('Poem Generation Error:', error);
      res.status(500).json({
        error: error.message || 'حدث خطأ غير متوقع أثناء توليد القصيدة وتدقيقها. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      activeUsers.delete(clientId);
    }
  });

  // endpoint للتحكم في الأدوات الأدبية والبلاغية المتقدمة
  app.post('/api/literary-tool', async (req, res) => {
    try {
      const { toolAction, payload } = req.body;
      let aiInstance: GoogleGenAI;
      try {
        aiInstance = getAiClient(req);
      } catch (err: any) {
        if (err.message === 'CONFIG_ERROR') {
          console.error('❌ [SUPERVISOR ALERT] CRITICAL: GEMINI_API_KEY is missing from environment variables! Please set GEMINI_API_KEY in Netlify settings.');
          return res.status(503).json({ error: 'عذراً، لم يتم تهيئة مفتاح الأدوات الأدبية (GEMINI_API_KEY) في إعدادات بيئة Netlify. يرجى تهيئته لتفعيل هذه الأداة.' });
        }
        return res.status(500).json({ error: 'حدث خطأ فني غير متوقع.' });
      }

      if (!toolAction) {
        return res.status(400).json({ error: 'حقل الإجراء (toolAction) مطلوب.' });
      }

      return await aiStorage.run(aiInstance, async () => {
        if (toolAction === 'generate-rhymes') {
        const { letter } = payload;
        const prompt = `
أنت الآن "معجم القوافي اللغوي الفصيح". يرجى توليد قائمة بـ 15 كلمة عربية تراثية فخمة تنتهي بالقوافي التي تتبع حرف الروي (${letter}) أو تنتهي بجرس موسيقي عذب متناسق معها.
يرجى تصنيف الكلمات، وشرح معنى كل كلمة تراثية، وإسناد بيت شعر عربي قديم كشاهد لكل قافية إن أمكن.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "letter": "${letter}",
  "rhymes": [
    {
      "word": "الكلمة",
      "meaning": "الشرح اللغوي التراثي للكلمة",
      "verseExample": "بيت شعر مأثور يُستشهد به بها إن وجد"
    }
  ]
}
`;
        const result = await callGeminiWithJsonParsing({
          toolName: 'generate-rhymes',
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'أنت لغوي فصيح وعالم قوافي خبير بأشعار العرب.',
            responseMimeType: 'application/json',
          },
        });
        return res.json(result);
      }

      if (toolAction === 'suggest-meters-and-purposes') {
        const { topic } = payload;
        const prompt = `
أنت "الناقد الأدبي المستشار لبيت القصيد". بناءً على موضوع المستخدم التالي:
"""
${topic}
"""

اقترح 3 بحور شعرية مناسبة تماماً لجرس وعاطفة هذا الموضوع مع التعليل، واقترح 3 أغراض شعرية تلائم الأفكار المكتوبة.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "meters": [
    { "name": "البحر الشعري", "reason": "سبب ملاءمته لهذا الموضوع بالتفصيل عروضياً ونفسياً" }
  ],
  "purposes": [
    { "name": "الغرض الشعري", "reason": "سبب مواءمته للموضوع" }
  ]
}
`;
        const result = await callGeminiWithJsonParsing({
          toolName: 'suggest-meters-and-purposes',
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'أنت مستشار أدبي وناقد عروضي رفيع الشأن.',
            responseMimeType: 'application/json',
          },
        });
        return res.json(result);
      }

      if (toolAction === 'prose-to-poem') {
        const { proseText, meterName, rhymeLetter, versesCount, genre } = payload;
        const prompt = `
مهمتك هي "تحويل النثر العربي إلى قصيدة كلاسيكية فخمة وموزونة".
النثر المراد نظمه:
"""
${proseText}
"""
البحر المختار: (${meterName})
حرف الروي المفضل: (${rhymeLetter || 'تلقائي ملائم'})
النوع/الغرض: (${genre || 'عام'})
عدد الأبيات المطلوبة: (${versesCount || 5}) أبيات.

القواعد:
- نظم الأبيات على بحر (${meterName}) بوزن سليم وقافية متسقة.
- الحفاظ على كامل المعاني والأفكار في النثر الأصلي مع صياغتها بألفاظ تراثية غاية في الجزالة والفخامة.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "title": "عنوان القصيدة المبتكر",
  "verses": [
    { "shatr1": "الصدر الموزون", "shatr2": "العجز الموزون", "index": 1 }
  ],
  "explanation": "شرح لعملية الصياغة وكيفية استخلاص النظم من النثر والصور البلاغية التي أضيفت"
}
`;
        const result = await callGeminiWithJsonParsing({
          toolName: 'prose-to-poem',
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'أنت ناظم محترف يحيل النثر العادي إلى درر شعرية موزونة وفخمة.',
            responseMimeType: 'application/json',
          },
        });
        return res.json(result);
      }

      if (toolAction === 'transmute-meter') {
        const { verses, currentMeter, targetMeter, rhymeLetter } = payload;
        const formattedVerses = verses.map((v: any) => `${v.shatr1} * ${v.shatr2}`).join('\n');
        const prompt = `
مهمتك كمحرك عروضي متقدم هي "تحويل البحر العروضي لقصيدة مع الحفاظ على ذات المعنى".
القصيدة الحالية (من بحر ${currentMeter}):
${formattedVerses}

المطلوب: إعادة صياغة ونظم هذه الأبيات تماماً لتصبح على بحر (${targetMeter}) بقافية تنتهي بحرف (${rhymeLetter || 'ملائم'}).
تنبيه: يجب الحفاظ التام على الأفكار والمعاني الأصلية وتأثيرها العاطفي والارتقاء بالألفاظ.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "title": "عنوان القصيدة",
  "verses": [
    { "shatr1": "الصدر الجديد الموزون على بحر ${targetMeter}", "shatr2": "العجز الجديد الموزون", "index": 1 }
  ],
  "explanation": "تفصيل النقل العروضي من بحر ${currentMeter} إلى بحر ${targetMeter} وبيان التغييرات التفعيلية"
}
`;
        const result = await callGeminiWithJsonParsing({
          toolName: 'transmute-meter',
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'أنت صانع موازين ومحور بحور خبير بالنقل العروضي الدقيق.',
            responseMimeType: 'application/json',
          },
        });
        return res.json(result);
      }

      if (toolAction === 'change-rhyme') {
        const { verses, currentRhyme, targetRhyme, meterName } = payload;
        const formattedVerses = verses.map((v: any) => `${v.shatr1} * ${v.shatr2}`).join('\n');
        const prompt = `
مهمتك هي "تعديل قافية وروي القصيدة تلقائياً".
القصيدة الحالية (على بحر ${meterName}):
${formattedVerses}

المطلوب: الحفاظ على الوزن العروضي السليم لبحر (${meterName})، وإعادة صياغة نهايات الأعجاز (وربما الصدور) لتلتزم بالقافية الجديدة وحرف الروي المختار (${targetRhyme}) بدلاً من (${currentRhyme || 'القديم'}).
يجب أن تظل الأبيات بليغة متماسكة دون كسر أو ضعف.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "title": "عنوان القصيدة",
  "verses": [
    { "shatr1": "الصدر السليم الموزون", "shatr2": "العجز السليم الملتزم بحرف الروي ${targetRhyme}", "index": 1 }
  ],
  "explanation": "شرح للتعديل الذي طرأ على الكلمات لتتوافق مع الروي الجديد والجمال اللفظي المحقق"
}
`;
        const result = await callGeminiWithJsonParsing({
          toolName: 'change-rhyme',
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'أنت عالم قوافي وصائغ روي بارع يضمن الوزن ويسلس القافية.',
            responseMimeType: 'application/json',
          },
        });
        return res.json(result);
      }

      if (toolAction === 'explain-and-extract-rhetoric') {
        const { verses, meterName } = payload;
        const formattedVerses = verses.map((v: any) => `البيت ${v.index}: ${v.shatr1} * ${v.shatr2}`).join('\n');
        const prompt = `
بصفتك "الناقد والمفسر البلاغي الأكبر في ديوان العرب"، قم بإعداد دراسة تخصصية مفصلة للأبيات التالية:
${formattedVerses}
البحر: ${meterName}

المطلوب بدقة:
1. شرح القصيدة بيتاً بيتاً بأسلوب أدبي رفيع يوضح المعاني المخبوءة.
2. استخراج جميع الصور البلاغية بالتفصيل (استعارات بليغة، تشبيهات، كنايات) وتحديد مواضعها من الأبيات.
3. استخراج جميع المحسنات البديعية اللفظية والمعنوية (جناس، طباق، مقابلة، حسن تقسيم، رد العجز على الصدر) وتبيان مواضعها وأثرها الموسيقي والجمالي.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "lineByLine": [
    { "index": 1, "explanation": "الشرح الأدبي المفصل لهذا البيت بياناً ومعنى" }
  ],
  "rhetoricalImages": [
    { "type": "استعارة مكنية / تشبيه بليغ / كناية...", "verseIndex": 1, "phrase": "العبارة البلاغية", "analysis": "تحليل أبعاد الصورة ووجه الشبه والأثر الفني" }
  ],
  "embellishments": [
    { "type": "جناس / طباق / مقابلة...", "verseIndex": 1, "phrase": "العبارة", "analysis": "بيان موضع المحسن وبديعه في ترسيخ الفكرة" }
  ]
}
`;
        const result = await callGeminiWithJsonParsing({
          toolName: 'explain-and-extract-rhetoric',
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'أنت بروفيسور البلاغة والأدب العربي الفصيح ومفسر دواوين الفحول.',
            responseMimeType: 'application/json',
          },
        });
        return res.json(result);
      }

      if (toolAction === 'analyze-style') {
        const { text } = payload;
        const prompt = `
قم بتحليل أسلوبي لغوي ونقدي متكامل للنص الشعري المرفق:
"""
${text}
"""

المطلوب:
1. تحديد بحر القصيدة المحتمل، الروي، وعصرها الأدبي المتوقع (جاهلي، إسلامي، عباسي، أندلسي، حديث).
2. تشريح الخصائص الأسلوبية (قوة المعجم، جزالة الألفاظ، الخيال البياني، العاطفة والجو النفسي).
3. تقييم دقيق لنقاط القوة والضعف اللغوي والنحوي والعروضي.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "estimatedMeter": "البحر المتوقع",
  "estimatedEra": "العصر الأدبي المتوقع",
  "rhymeLetter": "حرف الروي",
  "styleCritique": "تحليل أسلوبي لغوي معمق يصف جزالة الألفاظ والمعجم اللغوي والتراكيب",
  "imageryRating": "درجة الخيال الفني والصور البيانية (من 10)",
  "positives": ["نقطة قوة أولى", "نقطة قوة ثانية"],
  "negatives": ["ملاحظة نقدية أولى أو اقتراح للتحسين"]
}
`;
        const result = await callGeminiWithJsonParsing({
          toolName: 'analyze-style',
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'أنت ناقد أدبي ومؤرخ شعر عربي ذو مهارة عالية في تحليل الأساليب والمدارس.',
            responseMimeType: 'application/json',
          },
        });
        return res.json(result);
      }

      if (toolAction === 'compare-poems') {
        const { poem1, poem2 } = payload;
        const prompt = `
أنت الآن "رئيس لجنة التحكيم في عكاظ الرقمية". قم بعمل مقارنة بلاغية ونقدية وعروضية مجهرية صارمة بين قصيدتين:

القصيدة الأولى:
"""
${poem1}
"""

القصيدة الثانية:
"""
${poem2}
"""

المطلوب مقارنة دقيقة من حيث:
1. البنية العروضية والموسيقية (الوزن والقافية والروي وعيوب النظم).
2. المعجم اللغوي وجزالة الألفاظ (أيهما يتمتع بلغة تراثية أفخم).
3. الصور البلاغية والبيانية ومستوى الابتكار في الاستعارات والتشبيهات.
4. تماسك الأفكار والجو النفسي السائد.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "comparativeTable": {
    "poem1Meter": "بحر وروي الأولى",
    "poem2Meter": "بحر وروي الثانية",
    "poem1Vocabulary": "مستوى معجم الأولى",
    "poem2Vocabulary": "مستوى معجم الثانية"
  },
  "rhetoricalComparison": "مقارنة بلاغية تفصيلية بين الصورتين في القصيدتين",
  "metricalComparison": "مقارنة عروضية وافية توضح سلامة الوزن والقافية والجرَس",
  "verdict": "الحكم النقدي النهائي المرجح لأحد الأسلوبين مع تبيان المبررات الفنية والأدبية"
}
`;
        const result = await callGeminiWithJsonParsing({
          toolName: 'compare-poems',
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'أنت قاضي عكاظ النقدي، تقارن بين عيون الشعر بالدقة البلاغية التامة.',
            responseMimeType: 'application/json',
          },
        });
        return res.json(result);
      }

      if (toolAction === 'opposition-analyze') {
        const { poemText } = payload;
        const prompt = `
أنت الآن "كبير خبراء الدواوين والبحور لقصائد الشعر العربي".
قم بتحليل الأبيات التالية واستخراج كافة خصائصها البلاغية واللغوية والعروضية بدقة بالغة.
حاول التعرف على صاحب القصيدة الأصلي (من خلال مضاهاة الأبيات بأشهر دواوين الشعر القديمة مثل المتنبي، شوقي، امرؤ القيس، جرير، البحتري، إلخ).

القصيدة المطلوب تحليلها:
"""
${poemText}
"""

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً:
{
  "meter": "البحر الشعري المستخرج (مثل: الطويل، البسيط، الكامل، الخفيف، الوافر، إلخ)",
  "feet": "التفعيلات العروضية الممثلة للبحر",
  "rhyme": "القافية المستخرجة عروضياً (مثل: متواتر، متدارك، إلخ)",
  "rawiyy": "حرف الروي (مثل: ل، م، ر، د، إلخ)",
  "purpose": "الغرض الشعري المناسب للأبيات (مثل: الغزل، الحكمة، الفخر، إلخ)",
  "lexicon": "وصف مفصل للمعجم الشعري المستعمل وطبيعته",
  "images": "الصور البلاغية والبيانية السائدة في القصيدة",
  "languageLevel": "مستوى اللغة وجزالة المفردات",
  "style": "الأسلوب الأدبي العام للأبيات",
  "poet": "اسم الشاعر المتوقع للقصيدة الأصلية (إذا تعذر معرفته تماماً اترك هذا الحقل فارغاً أو اكتب 'غير معروف')"
}
`;
        const result = await callGeminiWithJsonParsing({
          toolName: 'opposition-analyze',
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'أنت ناقد عروضي وخبير بدواوين الشعر العربي والتعرف على قائلي الأبيات.',
            responseMimeType: 'application/json',
          },
        });
        return res.json(result);
      }

      if (toolAction === 'opposition-generate') {
        const { originalPoem, analysis, manualPoet, newMeanings, versesCount } = payload;
        const poetName = manualPoet || analysis.poet || "أحد فحول الشعراء";
        const prompt = `
مهمتك هي نظم قصيدة معارضة شعرية جديدة ومحكمة بالكامل لقصيدة الشاعر (${poetName}).
القصيدة الأصلية:
"""
${originalPoem}
"""

المعطيات التحليلية للقصيدة الأصلية:
- البحر: ${analysis.meter}
- القافية: ${analysis.rhyme}
- الروي: ${analysis.rawiyy}
- الغرض: ${analysis.purpose}
- مستوى اللغة: ${analysis.languageLevel}
- أسلوب الشاعر: ${analysis.style}

الأفكار والمعاني الجديدة المطلوبة نظمها في المعارضة:
"""
${newMeanings}
"""

عدد الأبيات المطلوب توليده: ${versesCount} بيتًا.

القواعد الفنية والوزنية الصارمة:
1. يجب أن تكون الأبيات الجديدة على البحر نفسه (${analysis.meter}) وقافيتها على نفس حرف الروي (${analysis.rawiyy}) بدقة عروضية متناهية.
2. يجب الالتزام بالمستوى اللغوي والمعجم اللغوي والأخيلة البلاغية الملتحمة بروح وأسلوب الشاعر (${poetName}).
3. يمنع منعاً باتاً الاقتباس المباشر أو سرقة أشطر أو أبيات من القصيدة الأصلية؛ يجب أن تكون معارضة جديدة أصيلة مبدعة بالكامل (معارضة حقيقية تحاكي الوزن والقافية والأسلوب وتأتي بمعانٍ جديدة).
4. مرر الأبيات آلياً لتقييم الوزن العروضي والروي وتصحيح أي كسر عروضي قبل تقديم النتيجة.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً (ملاحظة: لا تضع أي تعليقات مثل // داخل الـ JSON الناتج):
{
  "title": "عنوان المعارضة الشعرية الجديدة",
  "verses": [
    { "shatr1": "الصدر السليم تماماً", "shatr2": "العجز السليم تماماً", "index": 1 }
  ],
  "meterName": "${analysis.meter}",
  "rhymeLetter": "${analysis.rawiyy}",
  "poetSimulated": "${poetName}",
  "styleSimilarity": 95,
  "weightSafetyPercentage": 100,
  "rhymeSafetyPercentage": 100,
  "explanation": "شرح بلاغي وأدبي واف يعرض فكرة المعارضة، تفاصيل الأخيلة والصور المبتكرة المستعملة، وتفصيل عروضي يؤكد سلامة الوزن على بحر القصيدة."
}

حيث:
- styleSimilarity: قيمة عددية بين 0 و100 تمثل مدى التشابه والتقارب الأسلوبي والروح الفنية مع الشاعر.
- weightSafetyPercentage: قيمة عددية بين 0 و100 تمثل سلامة وزن الأبيات عروضياً.
- rhymeSafetyPercentage: قيمة عددية بين 0 و100 تمثل نسبة الالتزام بالقوافي والروي.
`;
        const result = await callGeminiWithJsonParsing({
          toolName: 'opposition-generate',
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'أنت أستاذ المعارضة الشعرية الأكبر والمدقق العروضي الصارم والملهم لصياغة روائع عيون الشعر العربي.',
            responseMimeType: 'application/json',
          },
        });
        return res.json(result);
      }

      if (toolAction === 'industries-generate') {
        const { industryType, originalPoem } = payload;
        const prompt = `
أنت الآن "شيخ الصناعات الشعرية وعالم النظم البديع". مهمتك هي تنفيذ عملية (${industryType}) بدقة عروضية وبلاغية فائقة موازية لكبار شعراء العربية.

نوع الصناعة المطلوبة: ${industryType} (تخميس، تسبيع، أو تشطير)

القصيدة الأصلية المراد تطبيق الصناعة عليها:
"""
${originalPoem}
"""

التعليمات الفنية حسب نوع الصناعة:
1. التخميس (takhmees):
   لكل بيت من أبيات القصيدة الأصلية، يجب صياغة 3 أشطر جديدة تسبق البيت الأصلي مباشرة. 
   الأشطر الثلاثة المضافة يجب أن تلتزم تماماً بالبحر والوزن الأصليين، وتأخذ قافية متحدة تتلائم مع صدر البيت الأصلي، بينما يحافظ العجز الأصلي على قافية وروي القصيدة الأم.
   في التخميس، تخرج الأبيات المفرزة كأبيات مخمسة من 5 أشطر.
   
2. التسبيع (tasbeeq):
   لكل بيت من أبيات القصيدة الأصلية، صغ 5 أشطر جديدة تسبق البيت الأصلي مباشرة.
   الأشطر الخمسة يجب أن تلتزم التزاماً كاملاً بوزن البحر وقواعد التدوير والقافية المتلائمة مع الصدر، لتخرج كل مقطوعة مكونة من 7 أشطر.

3. التشطير (tashteer):
   لكل بيت أصلي، صغ شطراً جديداً لكل شطر من شطري البيت.
   أي أنك تصنع شطراً جديداً يسبق الصدر الأصلي، وشطراً جديداً يسبق العجز الأصلي.
   بحيث تصبح بنية البيت كالتالي:
   شطر جديد 1
   الصدر الأصلي
   شطر جديد 2
   العجز الأصلي
   الالتزام التام بالبحر والوزن والروي.

القواعد الصارمة:
- التدقيق العروضي التلقائي لكل الأبيات المصوغة واحتساب نسب السلامة بدقة.
- إصلاح أي كسر عروضي تلقائياً قبل تسليم النتيجة.
- دعم القصائد الطويلة.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً (ملاحظة: لا تضع أي تعليقات مثل // داخل الـ JSON الناتج):
{
  "meterName": "البحر الشعري المستخرج والمطابق",
  "rhymeLetter": "حرف الروي الأصلي",
  "weightSafetyPercentage": 100,
  "rhymeSafetyPercentage": 100,
  "versesCount": 1,
  "addedHemistichsCount": 3,
  "stanzas": [
    {
      "index": 1,
      "originalSadr": "الصدر الأصلي للبيت الأول",
      "originalAjuz": "العجز الأصلي للبيت الأول",
      "added": ["شطر مضاف 1", "شطر مضاف 2", "شطر مضاف 3"],
      "addedSadr": "الشطر المضاف الذي يسبق الصدر الأصلي في التشطير فقط",
      "addedAjuz": "الشطر المضاف الذي يسبق العجز الأصلي في التشطير فقط"
    }
  ],
  "explanation": "شرح أدبي ونقدي مفصل يبين كيف التحمت الصناعة الشعرية بالأبيات الأصلية وصورها البيانية ومعجمها."
}

حيث:
- weightSafetyPercentage: قيمة عددية بين 0 و100 تمثل نسبة سلامة الوزن عروضياً بعد التدقيق.
- rhymeSafetyPercentage: قيمة عددية بين 0 و100 تمثل نسبة الالتزام بالقوافي والروي.
- versesCount: عدد الأبيات الأصلية المعالجة.
- addedHemistichsCount: إجمالي عدد الأشطر المضافة للقصيدة كاملة.
- added: مصفوفة للأشطر المضافة في حالتي التخميس (3 أشطر) والتسبيع (5 أشطر).
`;
        const result = await callGeminiWithJsonParsing({
          toolName: 'industries-generate',
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'أنت صانع الصناعات الشعرية الماهر بالكامل عروضياً وبلاغياً والمثبت لقوافي العرب.',
            responseMimeType: 'application/json',
          },
        });
        return res.json(result);
      }

        return res.status(400).json({ error: 'الإجراء المطلوب غير معروف.' });
      });
    } catch (error: any) {
      console.error('Literary Tool Error:', error);
      res.status(500).json({ error: error.message || 'حدث خطأ أثناء معالجة الأداة الأدبية.' });
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

  // Self-test and local start
  if (!process.env.VERCEL) {
    setupFrontend().then(() => {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    });
  }

  // Run startup self-test for Gemini API Reachability
  runStartupTest();

  export default app;
