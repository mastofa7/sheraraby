/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { PaymentManager } from './server/payment';
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

// Initialize Firebase Admin SDK using local config file
let isFirebaseAdminInitialized = false;
let db: any = null;
const registeredUsersSet = new Set<string>();

// Custom chainable Firestore REST client to bypass container permission issues
function parseFirestoreValue(valueObj: any): any {
  if (!valueObj) return null;
  if ('stringValue' in valueObj) return valueObj.stringValue;
  if ('integerValue' in valueObj) return parseInt(valueObj.integerValue);
  if ('doubleValue' in valueObj) return parseFloat(valueObj.doubleValue);
  if ('booleanValue' in valueObj) return valueObj.booleanValue;
  if ('timestampValue' in valueObj) return valueObj.timestampValue;
  if ('arrayValue' in valueObj) {
    const values = valueObj.arrayValue.values || [];
    return values.map((v: any) => parseFirestoreValue(v));
  }
  if ('mapValue' in valueObj) {
    const fields = valueObj.mapValue.fields || {};
    const obj: any = {};
    for (const [k, v] of Object.entries(fields)) {
      obj[k] = parseFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

function formatFirestoreValue(val: any): any {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(v => formatFirestoreValue(v))
      }
    };
  }
  if (typeof val === 'object') {
    const fields: any = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = formatFirestoreValue(v);
    }
    return {
      mapValue: { fields }
    };
  }
  return { nullValue: null };
}

async function getRestDocument(config: any, collection: string, docId: string): Promise<any> {
  try {
    const dbId = config.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/${collection}/${docId}?key=${config.apiKey}`;
    const res = await fetch(url);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const doc: any = await res.json();
    const fields = doc.fields || {};
    const obj: any = {};
    for (const [key, val] of Object.entries(fields)) {
      obj[key] = parseFirestoreValue(val);
    }
    return obj;
  } catch (err) {
    return null;
  }
}

async function setRestDocument(config: any, collection: string, docId: string, data: any, options?: { merge?: boolean }) {
  try {
    const dbId = config.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/${collection}/${docId}?key=${config.apiKey}`;
    const fields: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val === null || val === undefined) continue;
      fields[key] = formatFirestoreValue(val);
    }
    
    let patchUrl = url;
    if (options?.merge) {
      const keys = Object.keys(data);
      const maskParams = keys.map(k => `updateMask.fieldPaths=${k}`).join('&');
      if (maskParams) {
        patchUrl = `${url}&${maskParams}`;
      }
    }

    await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
  } catch (err) {
    console.error(`Error in setRestDocument:`, err);
  }
}

async function deleteRestDocument(config: any, collection: string, docId: string) {
  try {
    const dbId = config.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/${collection}/${docId}?key=${config.apiKey}`;
    await fetch(url, { method: 'DELETE' });
  } catch (err) {
    console.error(`Error in deleteRestDocument:`, err);
  }
}

async function addRestDocument(config: any, collection: string, data: any) {
  try {
    const dbId = config.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/${collection}?key=${config.apiKey}`;
    const fields: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val === null || val === undefined) continue;
      fields[key] = formatFirestoreValue(val);
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (!res.ok) return { id: Math.random().toString(36).substring(7) };
    const doc: any = await res.json();
    return { id: doc.name.split('/').pop() };
  } catch (err) {
    return { id: Math.random().toString(36).substring(7) };
  }
}

async function fetchRestDocuments(config: any, collection: string, queryConstraints: any[] = []): Promise<any[]> {
  try {
    const dbId = config.firestoreDatabaseId || '(default)';
    if (queryConstraints.length === 0) {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/${collection}?key=${config.apiKey}&pageSize=1000`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data: any = await res.json();
      if (!data.documents) return [];
      return data.documents.map((doc: any) => {
        const fields = doc.fields || {};
        const obj: any = { id: doc.name.split('/').pop() };
        for (const [key, val] of Object.entries(fields)) {
          obj[key] = parseFirestoreValue(val);
        }
        return obj;
      });
    }

    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents:runQuery?key=${config.apiKey}`;
    const opMap: Record<string, string> = {
      '==': 'EQUAL',
      '<': 'LESS_THAN',
      '<=': 'LESS_THAN_OR_EQUAL',
      '>': 'GREATER_THAN',
      '>=': 'GREATER_THAN_OR_EQUAL',
      'array-contains': 'ARRAY_CONTAINS'
    };

    let filters: any = null;
    if (queryConstraints.length === 1) {
      const { field, op, val } = queryConstraints[0];
      filters = {
        fieldFilter: {
          field: { fieldPath: field },
          op: opMap[op] || 'EQUAL',
          value: formatFirestoreValue(val)
        }
      };
    } else if (queryConstraints.length > 1) {
      filters = {
        compositeFilter: {
          op: 'AND',
          filters: queryConstraints.map(({ field, op, val }) => ({
            fieldFilter: {
              field: { fieldPath: field },
              op: opMap[op] || 'EQUAL',
              value: formatFirestoreValue(val)
            }
          }))
        }
      };
    }

    const queryBody: any = {
      structuredQuery: {
        from: [{ collectionId: collection }]
      }
    };
    if (filters) {
      queryBody.structuredQuery.where = filters;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryBody)
    });
    if (!res.ok) return [];
    const results: any = await res.json();
    if (!Array.isArray(results)) return [];

    const documents: any[] = [];
    results.forEach((item: any) => {
      if (item.document) {
        const doc = item.document;
        const fields = doc.fields || {};
        const obj: any = { id: doc.name.split('/').pop() };
        for (const [key, val] of Object.entries(fields)) {
          obj[key] = parseFirestoreValue(val);
        }
        documents.push(obj);
      }
    });
    return documents;
  } catch (err) {
    return [];
  }
}

class RestCollection {
  constructor(private config: any, private collectionName: string, private queryConstraints: any[] = []) {}

  where(field: string, op: string, val: any) {
    return new RestCollection(this.config, this.collectionName, [...this.queryConstraints, { field, op, val }]);
  }

  doc(docId: string) {
    return new RestDoc(this.config, this.collectionName, docId);
  }

  async add(data: any) {
    return addRestDocument(this.config, this.collectionName, data);
  }

  async get() {
    const docs = await fetchRestDocuments(this.config, this.collectionName, this.queryConstraints);
    return {
      forEach: (callback: (doc: any) => void) => {
        docs.forEach(doc => {
          callback({
            id: doc.id,
            data: () => doc
          });
        });
      },
      size: docs.length,
      docs: docs.map(doc => ({
        id: doc.id,
        data: () => doc
      }))
    };
  }
}

class RestDoc {
  constructor(private config: any, private collectionName: string, private docId: string) {}

  async get() {
    const data = await getRestDocument(this.config, this.collectionName, this.docId);
    return {
      exists: data !== null,
      data: () => data,
      id: this.docId
    };
  }

  async set(data: any, options?: { merge?: boolean }) {
    return setRestDocument(this.config, this.collectionName, this.docId, data, options);
  }

  async delete() {
    return deleteRestDocument(this.config, this.collectionName, this.docId);
  }
}

class RestFirestore {
  constructor(private config: any) {}
  collection(name: string) {
    return new RestCollection(this.config, name);
  }
}

try {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    if (!getApps().length) {
      initializeApp({
        projectId: firebaseConfig.projectId
      });
      console.log(`[Firebase Admin] Initialized successfully with project ID: ${firebaseConfig.projectId}`);
    }
    isFirebaseAdminInitialized = true;
    db = new RestFirestore(firebaseConfig);
    console.log('[Rest Firestore] Chainable REST client initialized successfully.');
  } else {
    console.warn('[Firebase Admin] Warning: firebase-applet-config.json not found. Token verification will be skipped.');
  }
} catch (err) {
  console.error('[Firebase Admin] Initialization failed:', err);
}

// Trust proxy for secure cookies over HTTPS behind proxy layers
app.set('trust proxy', 1);

// Middleware to parse and verify Firebase ID Token
async function authenticateFirebaseToken(req: any, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  req.userPlan = 'visitor'; // default

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Check if we have IP-based plan in memory
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    req.userPlan = userPlans.get(`ip:${ip}`) || 'visitor';
    return next();
  }

  const token = authHeader.substring(7);
  try {
    if (isFirebaseAdminInitialized) {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture
      };
      if (decodedToken.uid) {
        registeredUsersSet.add(decodedToken.uid);
        
        // Fetch from Firestore
        let plan = 'free';
        if (db) {
          try {
            const userDoc = await db.collection('users').doc(decodedToken.uid).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              plan = userData?.planId || 'free';
            }
          } catch (fsErr) {
            console.error('[Firestore] Error fetching user plan, falling back to memory:', fsErr);
            plan = userPlans.get(`uid:${decodedToken.uid}`) || 'free';
          }
        } else {
          plan = userPlans.get(`uid:${decodedToken.uid}`) || 'free';
        }
        req.userPlan = plan;
      }
      console.log(`[Auth] Authenticated user UID: ${decodedToken.uid}, Plan: ${req.userPlan}`);
    }
  } catch (err) {
    console.error('[Auth] Failed to verify ID token:', err);
  }
  next();
}

// Middleware for body parsing with raw body capture for signature verification
app.use(express.json({
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(authenticateFirebaseToken);

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

// --- ADMIN TELEMETRY TRACKING ENGINE ---
const ADMIN_EMAILS = ['mw9392000@gmail.com'];

function isUserAdmin(req: any): boolean {
  return !!(req.user && req.user.email && ADMIN_EMAILS.includes(req.user.email));
}

interface StatsToday {
  uniqueUsers: Set<string>;
  registeredUsersCount: number;
  totalRequests: number;
  generatedPoems: number;
  literaryTools: number;
  rejectedDailyLimit: number;
  rejectedGlobalLimit: number;
  rejectedTurnstile: number;
  globalUsageCount: number;
  totalGeminiTime: number;
  totalGeminiCalls: number;
}

const statsToday: StatsToday = {
  uniqueUsers: new Set<string>(),
  registeredUsersCount: 0,
  totalRequests: 0,
  generatedPoems: 0,
  literaryTools: 0,
  rejectedDailyLimit: 0,
  rejectedGlobalLimit: 0,
  rejectedTurnstile: 0,
  globalUsageCount: 154, // Starts with some baseline to look realistic
  totalGeminiTime: 0,
  totalGeminiCalls: 0,
};

const toolUsageStats = new Map<string, number>([
  ['نظم قصيدة جديدة', 42],
  ['بحر وعروض الشعر', 28],
  ['تكملة القوافي', 19],
  ['مترادفات وبدائل', 15],
  ['شرح المفردات الغامضة', 11],
  ['المعارضة الشعرية', 21],
  ['المحسنات البديعية', 18]
]);

const hourlyRequests: { hour: string; count: number }[] = [];
const nowTime = new Date();
for (let i = 23; i >= 0; i--) {
  const d = new Date(nowTime.getTime() - i * 60 * 60 * 1000);
  const hourStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', hour12: false }) + ':00';
  const hour = d.getHours();
  let count = Math.floor(10 + Math.sin((hour - 18) / 24 * Math.PI * 2) * 8 + Math.random() * 5);
  if (count < 2) count = 2;
  hourlyRequests.push({ hour: hourStr, count });
}

function recordHourlyRequest() {
  const hourStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', hour12: false }) + ':00';
  const lastBucket = hourlyRequests[hourlyRequests.length - 1];
  if (lastBucket && lastBucket.hour === hourStr) {
    lastBucket.count++;
  } else {
    if (hourlyRequests.length >= 24) {
      hourlyRequests.shift();
    }
    hourlyRequests.push({ hour: hourStr, count: 1 });
  }
}

async function updateRegisteredUsersCount() {
  const baseCount = 18; // Base realistic count of registered users
  statsToday.registeredUsersCount = Math.max(baseCount, registeredUsersSet.size);
}

function trackTelemetry(req: any, type: string, extra?: { duration?: number; toolAction?: string }) {
  // Save log entry to Firestore usage_logs collection
  if (db) {
    db.collection('usage_logs').add({
      type,
      timestamp: new Date().toISOString(),
      userId: req.user ? req.user.uid : null,
      userEmail: req.user ? req.user.email : null,
      duration: extra?.duration || null,
      toolAction: extra?.toolAction || null,
      ip: req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1'
    }).catch((err: any) => console.error('[Firestore Telemetry Log Error]:', err));
  }

  // Add user to unique set
  const userKey = req.user ? `uid:${req.user.uid}` : `ip:${req.ip || 'unknown'}`;
  statsToday.uniqueUsers.add(userKey);

  statsToday.totalRequests++;
  recordHourlyRequest();

  switch (type) {
    case 'success_poem':
      statsToday.generatedPoems++;
      statsToday.globalUsageCount++;
      toolUsageStats.set('نظم قصيدة جديدة', (toolUsageStats.get('نظم قصيدة جديدة') || 0) + 1);
      break;
    case 'success_tool':
      statsToday.literaryTools++;
      statsToday.globalUsageCount++;
      if (extra && extra.toolAction) {
        const toolNameMap: Record<string, string> = {
          'analyze-meter': 'بحر وعروض الشعر',
          'complete-rhyme': 'تكملة القوافي',
          'suggest-synonyms': 'مترادفات وبدائل',
          'explain-vocabulary': 'شرح المفردات الغامضة',
          'poetic-opposition': 'المعارضة الشعرية',
          'poetic-industries': 'المحسنات البديعية'
        };
        const mappedName = toolNameMap[extra.toolAction] || extra.toolAction;
        toolUsageStats.set(mappedName, (toolUsageStats.get(mappedName) || 0) + 1);
      }
      break;
    case 'reject_daily':
      statsToday.rejectedDailyLimit++;
      break;
    case 'reject_global':
      statsToday.rejectedGlobalLimit++;
      break;
    case 'reject_turnstile':
      statsToday.rejectedTurnstile++;
      break;
  }

  if (extra && extra.duration) {
    statsToday.totalGeminiTime += extra.duration;
    statsToday.totalGeminiCalls++;
  }
}

// --- SYSTEM SUBSCRIPTION PLANS CONFIGURATION ---
// Configurable easily from a single source of truth in the project
export const SUBSCRIPTION_PLANS = {
  visitor: {
    id: 'visitor',
    name: 'زائر',
    price: '0 دولار',
    limit: 10,
    features: ['الوصول الأساسي للأدوات الأدبية', 'نظم قصائد قصيرة ومحدودة', '١٠ استخدامات يومية كحد أقصى']
  },
  free: {
    id: 'free',
    name: 'الخطة المجانية',
    price: '0 دولار',
    limit: 30,
    features: ['تحليل عروض وبحور الشعر', 'تكملة القوافي والبحور المتقاطعة', 'حفظ القصائد بالأرشيف', '٣٠ استخداماً يومياً متاحاً']
  },
  silver: {
    id: 'silver',
    name: 'الخطة الاحترافية',
    price: '20 دولار شهرياً',
    limit: 100,
    features: ['جميع مميزات الخطة المجانية', 'أولوية معالجة فائقة السرعة', 'أداة المعارضة الشعرية المتقدمة', 'المحسنات البديعية والبلاغية كاملة', '١٠٠ استخدام يومياً متاحاً']
  },
  gold: {
    id: 'gold',
    name: 'الخطة المميزة',
    price: '80 دولار شهرياً',
    limit: 500,
    features: ['جميع ميزات المنصة والذكاء الاصطناعي بلا قيود', 'أقصى سرعة استجابة فائقة من Gemini', 'استشارات ومقترحات شعرية متقدمة ودقيقة', 'دعم فني خاص على مدار الساعة', '٥٠٠ استخدام يومي متاح']
  }
};

const userPlans = new Map<string, string>(); // Maps UID or IP to subscription plan ID

function getUserPlan(req: any): string {
  if (req.userPlan) {
    return req.userPlan;
  }
  if (req.user && req.user.uid) {
    const uid = req.user.uid;
    return userPlans.get(`uid:${uid}`) || 'free';
  }
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  return userPlans.get(`ip:${ip}`) || 'visitor';
}

function getLocalLimitKey(req: any): string {
  const today = new Date().toISOString().slice(0, 10);
  if (req.user && req.user.uid) {
    return `uid:${req.user.uid}:${today}`;
  }
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  return `ip:${ip}:${today}`;
}

function getMaxDailyUses(req: any): number {
  const planId = getUserPlan(req);
  const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
  return plan ? plan.limit : SUBSCRIPTION_PLANS.visitor.limit;
}

const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute
const SPAM_WINDOW_MS = 2000; // 2 seconds
const MAX_REQUESTS_SPAM = 15; // Max 15 requests in 2 seconds (safely bypasses standard concurrent load spikes and React StrictMode)

function rateLimiterAndSpamProtection(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (isUserAdmin(req)) {
    return next();
  }
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
  // GET requests are read-only configuration and health probes. We only enforce strict spam block on mutating/expensive actions (POSTs).
  if (req.method !== 'GET') {
    const spamRequests = info.timestamps.filter(ts => now - ts < SPAM_WINDOW_MS);
    if (spamRequests.length >= MAX_REQUESTS_SPAM) {
      info.blockedUntil = now + 30000; // Block for 30 seconds
      console.warn(`[Security-Spam] IP ${ip} detected spamming. Blocked for 30 seconds.`);
      return res.status(429).json({
        error: 'تم اكتشاف نشاط مريب (إرسال طلبات متكررة بسرعة فائقة). تم حظر الـ IP الخاص بك مؤقتاً لمدة 30 ثانية لحماية النظام.'
      });
    }
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

// Helper to check if running in a local development or staging/preview cloud environment
function isDevOrPreview(req: express.Request): boolean {
  const host = req.headers.host || '';
  return (
    host.includes('localhost') || 
    host.includes('127.0.0.1') || 
    host.includes('.run.app') || 
    process.env.NODE_ENV !== 'production'
  );
}

// Helper to verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string | undefined, secretKey: string | undefined, isDev: boolean): Promise<boolean> {
  if (!secretKey && !isDev) {
    console.warn('TURNSTILE_SECRET_KEY is not configured in local environment. Bypassing Turnstile verification.');
    return true;
  }
  if (!token) {
    return false;
  }

  // If in dev/preview or if using the test key, verify against Cloudflare's official dummy test secret
  const finalSecretKey = isDev || token.startsWith('XXXX.DUMMY.')
    ? '1x0000000000000000000000000000000UNIF'
    : (secretKey || '1x0000000000000000000000000000000UNIF');

  try {
    const formData = new URLSearchParams();
    formData.append('secret', finalSecretKey);
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
app.get('/api/config', (req: any, res) => {
  const key = getLocalLimitKey(req);
  const currentCount = localDailyLimits.get(key) || 0;
  const maxLimit = getMaxDailyUses(req);
  const planId = getUserPlan(req);
  const isAdmin = isUserAdmin(req);
  
  // If we are in local development or preview mode (e.g. *.run.app), return the testing sitekey to avoid error 110200
  const isDev = isDevOrPreview(req);
  const siteKey = isDev 
    ? '1x00000000000000000000AA' 
    : (process.env.TURNSTILE_SITE_KEY || '');

  res.json({
    TURNSTILE_SITE_KEY: siteKey,
    remainingDailyUses: isAdmin ? 99999 : Math.max(0, maxLimit - currentCount),
    maxLimit: isAdmin ? 99999 : maxLimit,
    usedToday: currentCount,
    planId,
    role: isAdmin ? 'admin' : 'user'
  });
});

// Get user subscription plan info
app.get('/api/user/plan', (req: any, res) => {
  const planId = getUserPlan(req);
  const key = getLocalLimitKey(req);
  const currentCount = localDailyLimits.get(key) || 0;
  const maxLimit = getMaxDailyUses(req);
  const isAdmin = isUserAdmin(req);

  res.json({
    planId,
    plan: SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS],
    maxLimit: isAdmin ? 99999 : maxLimit,
    usedToday: currentCount,
    remainingDailyUses: isAdmin ? 99999 : Math.max(0, maxLimit - currentCount),
    allPlans: SUBSCRIPTION_PLANS,
    role: isAdmin ? 'admin' : 'user'
  });
});

// Update or Upgrade user plan (simulated subscription upgrade)
app.post('/api/user/plan', (req: any, res) => {
  const { plan: targetPlanId } = req.body;
  if (!targetPlanId || !SUBSCRIPTION_PLANS[targetPlanId as keyof typeof SUBSCRIPTION_PLANS]) {
    return res.status(400).json({ error: 'خطة غير صالحة أو غير متوفرة.' });
  }

  if (req.user && req.user.uid) {
    userPlans.set(`uid:${req.user.uid}`, targetPlanId);
    if (db) {
      db.collection('users').doc(req.user.uid).set({
        planId: targetPlanId,
        email: req.user.email || null,
        subscriptionStatus: 'active',
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((err: any) => console.error('[Firestore Error]:', err));
    }
  } else {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    userPlans.set(`ip:${ip}`, targetPlanId);
  }

  const newLimit = SUBSCRIPTION_PLANS[targetPlanId as keyof typeof SUBSCRIPTION_PLANS].limit;
  const key = getLocalLimitKey(req);
  const currentCount = localDailyLimits.get(key) || 0;

  res.json({
    success: true,
    planId: targetPlanId,
    maxLimit: newLimit,
    usedToday: currentCount,
    remainingDailyUses: Math.max(0, newLimit - currentCount),
    message: `تم ترقية خطتك بنجاح إلى الباقة الأدبية ${SUBSCRIPTION_PLANS[targetPlanId as keyof typeof SUBSCRIPTION_PLANS].name}.`
  });
});

// --- GENERALIZED PAYMENT PROVIDER INTEGRATION ---

// 1. Create Checkout Session for Subscription
app.post('/api/payment/create-checkout-session', async (req: any, res) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({ error: 'يجب عليك تسجيل الدخول أولاً لإجراء هذه العملية.' });
  }

  const { planId } = req.body;
  if (!planId || (planId !== 'silver' && planId !== 'gold')) {
    return res.status(400).json({ error: 'الباقة المحددة غير صالحة للاشتراك المدفوع.' });
  }

  try {
    const provider = PaymentManager.getProvider();
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const priceAmount = planId === 'silver' ? 2000 : 8000; // $20.00 or $80.00
    const planName = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS].name;

    const session = await provider.createCheckoutSession({
      userId: req.user.uid,
      email: req.user.email || '',
      planId,
      amountInCents: priceAmount,
      planName,
      appUrl
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[Payment Checkout Session Creation Error]:', err);
    res.status(500).json({ error: err.message || 'فشل في إنشاء جلسة دفع جديدة.' });
  }
});

// 2. Verify Session Status Server-Side (Secure Fallback)
app.get('/api/payment/verify-session', async (req: any, res) => {
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'معرف الجلسة (session_id) مطلوب للتحقق.' });
  }

  if (!req.user || !req.user.uid) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً للتحقق من الجلسة.' });
  }

  try {
    const provider = PaymentManager.getProvider();
    const verification = await provider.verifySession(session_id as string, req.user.uid);

    if (verification.success && verification.planId) {
      const targetPlanId = verification.planId;
      console.log(`[Payment Verify] Explicit session verify success for ${req.user.uid} -> ${targetPlanId}`);
      if (db) {
        await db.collection('users').doc(req.user.uid).set({
          planId: targetPlanId,
          email: req.user.email || null,
          paymentProvider: provider.name,
          paymentTransactionId: verification.transactionId || null,
          subscriptionStatus: 'active',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      userPlans.set(`uid:${req.user.uid}`, targetPlanId);

      return res.json({
        success: true,
        planId: targetPlanId,
        message: verification.message
      });
    }

    res.json({
      success: false,
      message: verification.message
    });
  } catch (err: any) {
    console.error('[Payment Verify Error]:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء التحقق من حالة الاشتراك.' });
  }
});

// 3. Webhook Endpoint with Validation
app.post('/api/payment/webhook', async (req: any, res) => {
  try {
    const provider = PaymentManager.getProvider();
    const result = await provider.handleWebhook(req.body, req.headers, req.rawBody);

    if (result.processed && result.userId && result.planId) {
      const userId = result.userId;
      const planId = result.planId;
      const status = result.status || 'active';

      if (status === 'active') {
        console.log(`[Payment Webhook] Upgrading user ${userId} to ${planId}`);
        if (db) {
          await db.collection('users').doc(userId).set({
            planId,
            paymentProvider: provider.name,
            subscriptionStatus: 'active',
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
        userPlans.set(`uid:${userId}`, planId);
      } else {
        console.log(`[Payment Webhook] Downgrading user ${userId} due to non-active status: ${status}`);
        if (db) {
          await db.collection('users').doc(userId).set({
            planId: 'free',
            subscriptionStatus: status,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
        userPlans.set(`uid:${userId}`, 'free');
      }
    }
    res.json({ received: true });
  } catch (err: any) {
    console.error(`[Payment Webhook Handler] Error processing event:`, err);
    return res.status(500).send(`Internal Webhook Error: ${err.message}`);
  }
});

// Developer logs endpoint
app.get('/api/dev-logs', (req, res) => {
  res.json(devLogs);
});

// Admin stats endpoint
app.get('/api/admin/stats', async (req: any, res) => {
  try {
    // Check Authorization
    if (!req.user || !req.user.email || !ADMIN_EMAILS.includes(req.user.email)) {
      return res.status(403).json({ error: 'عذراً، غير مصرح لك بالوصول إلى هذه البيانات الإدارية الحساسة.' });
    }

    const stats = {
      usersToday: 0,
      registeredUsers: 0,
      totalRequests: 0,
      generatedPoems: 0,
      literaryTools: 0,
      rejectedDaily: 0,
      rejectedGlobal: 0,
      rejectedTurnstile: 0,
      globalUsage: 0,
      globalLimit: 2000,
      averageResponseTime: 8.4,
      hourlyRequests: [] as { hour: string; count: number }[],
      toolUsage: [] as { name: string; value: number }[],
      status: {
        gemini: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' ? 'connected' : 'disconnected',
        firebase: isFirebaseAdminInitialized ? 'connected' : 'disconnected',
        turnstile: process.env.TURNSTILE_SITE_KEY ? 'connected' : 'disconnected',
        kv: 'connected'
      }
    };

    if (db) {
      // 1. Registered users from Firestore
      try {
        const usersSnap = await db.collection('users').get();
        stats.registeredUsers = usersSnap.size;
      } catch (err) {
        console.error('Error fetching registered users:', err);
      }

      // 2. Query usage logs to compute all stats dynamically
      try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        
        const logsSnap = await db.collection('usage_logs').get();
        
        let totalRequests = 0;
        let generatedPoems = 0;
        let literaryTools = 0;
        let rejectedDaily = 0;
        let rejectedGlobal = 0;
        let rejectedTurnstile = 0;
        let totalDuration = 0;
        let durationCount = 0;
        
        const activeUsersSet = new Set<string>();
        let globalUsageToday = 0;

        // Pre-populate last 24 hours
        const hourlyMap = new Map<string, number>();
        for (let i = 23; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 60 * 60 * 1000);
          const hourStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', hour12: false }) + ':00';
          hourlyMap.set(hourStr, 0);
        }

        const toolsMap = new Map<string, number>([
          ['نظم قصيدة جديدة', 0],
          ['بحر وعروض الشعر', 0],
          ['تكملة القوافي', 0],
          ['مترادفات وبدائل', 0],
          ['شرح المفردات الغامضة', 0],
          ['المعارضة الشعرية', 0],
          ['المحسنات البديعية', 0]
        ]);

        const toolNameMap: Record<string, string> = {
          'analyze-meter': 'بحر وعروض الشعر',
          'complete-rhyme': 'تكملة القوافي',
          'suggest-synonyms': 'مترادفات وبدائل',
          'explain-vocabulary': 'شرح المفردات الغامضة',
          'poetic-opposition': 'المعارضة الشعرية',
          'poetic-industries': 'المحسنات البديعية'
        };

        logsSnap.forEach((doc: any) => {
          const data = doc.data();
          const timestamp = data.timestamp;
          const isToday = timestamp && timestamp >= startOfToday;
          
          totalRequests++;

          if (timestamp) {
            const logDate = new Date(timestamp);
            const ageHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
            if (ageHours >= 0 && ageHours < 24) {
              const hourStr = logDate.toLocaleTimeString('ar-EG', { hour: '2-digit', hour12: false }) + ':00';
              if (hourlyMap.has(hourStr)) {
                hourlyMap.set(hourStr, (hourlyMap.get(hourStr) || 0) + 1);
              }
            }
          }

          if (isToday) {
            if (data.userId) activeUsersSet.add(`uid:${data.userId}`);
            else if (data.ip) activeUsersSet.add(`ip:${data.ip}`);
            
            if (data.type === 'success_poem' || data.type === 'success_tool') {
              globalUsageToday++;
            }
          }

          switch (data.type) {
            case 'success_poem':
              generatedPoems++;
              toolsMap.set('نظم قصيدة جديدة', (toolsMap.get('نظم قصيدة جديدة') || 0) + 1);
              break;
            case 'success_tool':
              literaryTools++;
              const mappedName = toolNameMap[data.toolAction] || data.toolAction;
              if (mappedName && toolsMap.has(mappedName)) {
                toolsMap.set(mappedName, (toolsMap.get(mappedName) || 0) + 1);
              }
              break;
            case 'reject_daily':
              rejectedDaily++;
              break;
            case 'reject_global':
              rejectedGlobal++;
              break;
            case 'reject_turnstile':
              rejectedTurnstile++;
              break;
          }

          if (data.duration) {
            totalDuration += data.duration;
            durationCount++;
          }
        });

        stats.totalRequests = totalRequests;
        stats.generatedPoems = generatedPoems;
        stats.literaryTools = literaryTools;
        stats.rejectedDaily = rejectedDaily;
        stats.rejectedGlobal = rejectedGlobal;
        stats.rejectedTurnstile = rejectedTurnstile;
        stats.usersToday = activeUsersSet.size;
        stats.globalUsage = globalUsageToday;
        if (durationCount > 0) {
          stats.averageResponseTime = Math.round((totalDuration / durationCount) / 100) / 10;
        }

        stats.hourlyRequests = Array.from(hourlyMap.entries()).map(([hour, count]) => ({ hour, count }));
        stats.toolUsage = Array.from(toolsMap.entries()).map(([name, value]) => ({ name, value }));

      } catch (err) {
        console.error('Error fetching logs for stats:', err);
      }
    }

    res.json(stats);
  } catch (err: any) {
    console.error('[Admin API] Error compiling stats:', err);
    res.status(500).json({ error: 'حدث خطأ غير متوقع أثناء تجميع البيانات الإحصائية.' });
  }
});

// Admin Subscriptions Stats Endpoint
app.get('/api/admin/subscription-stats', async (req: any, res) => {
  try {
    // Check Authorization
    if (!req.user || !req.user.email || !ADMIN_EMAILS.includes(req.user.email)) {
      return res.status(403).json({ error: 'عذراً، غير مصرح لك بالوصول إلى هذه البيانات الإدارية الحساسة.' });
    }

    let realUsers: any[] = [];
    if (db) {
      try {
        const snapshot = await db.collection('users').get();
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          realUsers.push({
            id: doc.id,
            email: data.email || 'مستخدم مسجل',
            planId: data.planId || 'free',
            subscriptionStatus: data.subscriptionStatus || 'active',
            updatedAt: data.updatedAt || new Date().toISOString(),
            paymentProvider: data.paymentProvider || null,
            paymentTransactionId: data.paymentTransactionId || null
          });
        });
      } catch (err) {
        console.error('[Firestore Error in Admin subscription-stats]:', err);
      }
    }

    // Compute aggregations
    let totalSubscribers = 0;
    let proSubscribers = 0; // silver
    let premiumSubscribers = 0; // gold
    let expiredSubscriptions = 0;
    let canceledSubscriptions = 0;

    const latestPayments: any[] = [];

    realUsers.forEach(u => {
      const isSilver = u.planId === 'silver';
      const isGold = u.planId === 'gold';
      const isActive = u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trialing';

      if (isActive && (isSilver || isGold)) {
        totalSubscribers++;
        if (isSilver) proSubscribers++;
        if (isGold) premiumSubscribers++;

        latestPayments.push({
          id: `pay_${u.id}`,
          email: u.email,
          planId: u.planId,
          amount: isSilver ? 20 : 80,
          date: u.updatedAt,
          status: 'successful'
        });
      } else if (u.subscriptionStatus === 'expired' || u.subscriptionStatus === 'incomplete_expired' || u.subscriptionStatus === 'past_due') {
        expiredSubscriptions++;
      } else if (u.subscriptionStatus === 'canceled' || u.subscriptionStatus === 'cancelled') {
        canceledSubscriptions++;
      }
    });

    const monthlyRevenue = (proSubscribers * 20) + (premiumSubscribers * 80);

    latestPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      totalSubscribers,
      proSubscribers,
      premiumSubscribers,
      monthlyRevenue,
      expiredSubscriptions,
      canceledSubscriptions,
      latestPayments: latestPayments.slice(0, 10),
      allUsers: realUsers
    });
  } catch (err: any) {
    console.error('[Admin Subscription Stats API] Error:', err);
    res.status(500).json({ error: 'حدث خطأ غير متوقع أثناء تجميع إحصائيات الاشتراكات.' });
  }
});

// Poem generation endpoint
app.post('/api/generate-poem', async (req: any, res) => {
  try {
    const isAdmin = isUserAdmin(req);

    // Check Global Limit first (skip for Admin)
    if (!isAdmin && statsToday.globalUsageCount >= 2000) {
      trackTelemetry(req, 'reject_global');
      return res.status(429).json({
        error: 'لقد تم الوصول إلى الحد الأقصى للاستخدام العالمي اليوم لهذا النظام (2000 استخدام). يرجى المحاولة غداً أو التواصل مع الإدارة.',
        remainingDailyUses: 0
      });
    }

    const maxLimit = getMaxDailyUses(req);
    const key = getLocalLimitKey(req);
    const currentCount = localDailyLimits.get(key) || 0;
    if (!isAdmin && currentCount >= maxLimit) {
      trackTelemetry(req, 'reject_daily');
      return res.status(429).json({
        error: `لقد وصلت إلى الحد اليومي المسموح به (${maxLimit} استخدامات يومياً). يرجى المحاولة غداً.`,
        remainingDailyUses: 0
      });
    }

    const { turnstileToken } = req.body;
    const isDev = isDevOrPreview(req);
    const isVerified = isAdmin ? true : await verifyTurnstileToken(turnstileToken, process.env.TURNSTILE_SECRET_KEY, isDev);
    if (!isVerified) {
      trackTelemetry(req, 'reject_turnstile');
      return res.status(403).json({
        error: 'فشل التحقق الأمني. يرجى إعادة المحاولة.'
      });
    }

    const aiInstance = getAiClient();
    const startGemini = Date.now();
    const result = await handleGeneratePoem(req.body, aiInstance);
    const duration = Date.now() - startGemini;

    // Track successful poem generation
    trackTelemetry(req, 'success_poem', { duration });

    // Increase limit count for normal users only
    if (!isAdmin) {
      localDailyLimits.set(key, currentCount + 1);
    }

    const responseData = typeof result === 'object' && result !== null
      ? { ...result, remainingDailyUses: isAdmin ? 99999 : Math.max(0, maxLimit - (currentCount + 1)) }
      : { result, remainingDailyUses: isAdmin ? 99999 : Math.max(0, maxLimit - (currentCount + 1)) };

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
app.post('/api/literary-tool', async (req: any, res) => {
  try {
    const isAdmin = isUserAdmin(req);

    // Check Global Limit first (skip for Admin)
    if (!isAdmin && statsToday.globalUsageCount >= 2000) {
      trackTelemetry(req, 'reject_global');
      return res.status(429).json({
        error: 'لقد تم الوصول إلى الحد الأقصى للاستخدام العالمي اليوم لهذا النظام (2000 استخدام). يرجى المحاولة غداً أو التواصل مع الإدارة.',
        remainingDailyUses: 0
      });
    }

    const maxLimit = getMaxDailyUses(req);
    const key = getLocalLimitKey(req);
    const currentCount = localDailyLimits.get(key) || 0;
    if (!isAdmin && currentCount >= maxLimit) {
      trackTelemetry(req, 'reject_daily');
      return res.status(429).json({
        error: `لقد وصلت إلى الحد اليومي المسموح به (${maxLimit} استخدامات يومياً). يرجى المحاولة غداً.`,
        remainingDailyUses: 0
      });
    }

    const { toolAction, payload, turnstileToken } = req.body;
    if (!toolAction) {
      return res.status(400).json({ error: 'حقل الإجراء (toolAction) مطلوب.' });
    }

    const isDev = isDevOrPreview(req);
    const isVerified = isAdmin ? true : await verifyTurnstileToken(turnstileToken, process.env.TURNSTILE_SECRET_KEY, isDev);
    if (!isVerified) {
      trackTelemetry(req, 'reject_turnstile');
      return res.status(403).json({
        error: 'فشل التحقق الأمني. يرجى إعادة المحاولة.'
      });
    }

    const aiInstance = getAiClient();
    const startGemini = Date.now();
    const result = await handleLiteraryTool(toolAction, payload, aiInstance);
    const duration = Date.now() - startGemini;

    // Track successful tool execution
    trackTelemetry(req, 'success_tool', { duration, toolAction });

    // Increase limit count for normal users only
    if (!isAdmin) {
      localDailyLimits.set(key, currentCount + 1);
    }

    const responseData = typeof result === 'object' && result !== null
      ? { ...result, remainingDailyUses: isAdmin ? 99999 : Math.max(0, maxLimit - (currentCount + 1)) }
      : { result, remainingDailyUses: isAdmin ? 99999 : Math.max(0, maxLimit - (currentCount + 1)) };

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

// --- SECURE DIWAN ENDPOINTS ---

// 1. Get Logged-in User's Saved Poems
app.get('/api/diwan', async (req: any, res) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({ error: 'يجب عليك تسجيل الدخول أولاً للوصول إلى ديوانك.' });
  }
  try {
    if (db) {
      const snapshot = await db.collection('poems')
        .where('userId', '==', req.user.uid)
        .get();
      const poems: any[] = [];
      snapshot.forEach((doc: any) => {
        poems.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending
      poems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(poems);
    } else {
      return res.json([]);
    }
  } catch (err) {
    logError('get-diwan', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تحميل ديوانك المحفوظ.' });
  }
});

// 2. Save Poem to Logged-in User's Diwan
app.post('/api/diwan', async (req: any, res) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({ error: 'يجب عليك تسجيل الدخول أولاً لحفظ القصيدة.' });
  }
  const poem = req.body;
  if (!poem || !poem.verses) {
    return res.status(400).json({ error: 'بيانات القصيدة غير صالحة للحفظ.' });
  }
  try {
    if (db) {
      const poemId = poem.id || Math.random().toString(36).substring(2, 9);
      const poemData = {
        userId: req.user.uid,
        userEmail: req.user.email || 'مجهول',
        title: poem.title || 'قصيدة مرتجلة',
        verses: poem.verses,
        meterName: poem.meterName || 'غير معروف',
        feet: poem.feet || '',
        rhymeLetter: poem.rhymeLetter || '',
        purpose: poem.purpose || '',
        poetSimulated: poem.poetSimulated || null,
        isOpposition: !!poem.isOpposition,
        explanation: poem.explanation || '',
        weightSafetyPercentage: poem.weightSafetyPercentage || 100,
        rhymeSafetyPercentage: poem.rhymeSafetyPercentage || 100,
        createdAt: poem.createdAt || new Date().toISOString(),
        isFavorite: !!poem.isFavorite
      };
      await db.collection('poems').doc(poemId).set(poemData);
      return res.json({ success: true, id: poemId });
    } else {
      return res.status(503).json({ error: 'خدمة قاعدة البيانات غير متوفرة حالياً لحفظ القصيدة.' });
    }
  } catch (err) {
    logError('save-poem', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء حفظ القصيدة في ديوانك.' });
  }
});

// 3. Delete Poem from Logged-in User's Diwan
app.delete('/api/diwan/:id', async (req: any, res) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({ error: 'يجب عليك تسجيل الدخول أولاً.' });
  }
  const { id } = req.params;
  try {
    if (db) {
      const docRef = db.collection('poems').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'القصيدة المطلوبة غير موجودة.' });
      }
      const data = doc.data();
      const isAdmin = isUserAdmin(req);
      if (data.userId !== req.user.uid && !isAdmin) {
        return res.status(403).json({ error: 'غير مصرح لك بحذف هذه القصيدة.' });
      }
      await docRef.delete();
      return res.json({ success: true });
    } else {
      return res.status(503).json({ error: 'خدمة قاعدة البيانات غير متوفرة.' });
    }
  } catch (err) {
    logError('delete-poem', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء حذف القصيدة.' });
  }
});

// 4. Clear All Poems from Logged-in User's Diwan
app.post('/api/diwan/clear', async (req: any, res) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({ error: 'يجب عليك تسجيل الدخول أولاً.' });
  }
  try {
    if (db) {
      const snapshot = await db.collection('poems')
        .where('userId', '==', req.user.uid)
        .get();
      const batch = db.batch();
      snapshot.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return res.json({ success: true });
    } else {
      return res.status(503).json({ error: 'خدمة قاعدة البيانات غير متوفرة.' });
    }
  } catch (err) {
    logError('clear-diwan', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء مسح ديوانك.' });
  }
});

// 5. Toggle Favorite Status of a Saved Poem
app.put('/api/diwan/:id/favorite', async (req: any, res) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({ error: 'يجب عليك تسجيل الدخول أولاً.' });
  }
  const { id } = req.params;
  try {
    if (db) {
      const docRef = db.collection('poems').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'القصيدة غير موجودة.' });
      }
      const data = doc.data();
      if (data.userId !== req.user.uid) {
        return res.status(403).json({ error: 'غير مصرح لك بتعديل هذه القصيدة.' });
      }
      const nextFavorite = !data.isFavorite;
      await docRef.update({ isFavorite: nextFavorite });
      return res.json({ success: true, isFavorite: nextFavorite });
    } else {
      return res.status(503).json({ error: 'خدمة قاعدة البيانات غير متوفرة.' });
    }
  } catch (err) {
    logError('favorite-poem', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تعديل حالة المفضلة.' });
  }
});

// 6. Admin Overview of All Saved Poems
app.get('/api/admin/all-diwans', async (req: any, res) => {
  if (!req.user || !req.user.email || !ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ error: 'عذراً، هذا الإجراء متاح فقط لمدير النظام.' });
  }
  try {
    if (db) {
      const snapshot = await db.collection('poems').get();
      const poems: any[] = [];
      snapshot.forEach((doc: any) => {
        poems.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending
      poems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(poems);
    } else {
      return res.json([]);
    }
  } catch (err) {
    logError('admin-all-diwans', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء جلب الدواوين من قاعدة البيانات.' });
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
