import { GoogleGenAI } from '@google/genai';
import {
  handleGeneratePoem,
  handleLiteraryTool,
  devLogs,
  addDevLog
} from '../../src/backend-logic';

interface KVNamespace {
  get(key: string, options?: any): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

const FIREBASE_CONFIG = {
  projectId: "sheraraby-d3aa5",
  apiKey: "AIzaSyAlYWPr6RBs6uuhjDRkeordRYTgJGO5Uh8",
  databaseId: "ai-studio-18396f4b-7e89-42f0-84f2-2863a3273d37"
};

const ADMIN_EMAILS = ['mw9392000@gmail.com'];

function decodeFirebaseToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64Url = payload.replace(/-/g, '+').replace(/_/g, '/');
    const base64 = base64Url.padEnd(base64Url.length + (4 - base64Url.length % 4) % 4, '=');
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
}

async function fetchFirestoreDocuments(collection: string): Promise<any[]> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${FIREBASE_CONFIG.databaseId}/documents/${collection}?key=${FIREBASE_CONFIG.apiKey}&pageSize=1000`;
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
  } catch (err) {
    console.error(`Error fetching firestore collection ${collection}:`, err);
    return [];
  }
}

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

async function addFirestoreDocument(collection: string, data: Record<string, any>) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${FIREBASE_CONFIG.databaseId}/documents/${collection}?key=${FIREBASE_CONFIG.apiKey}`;
    const fields: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val === null || val === undefined) continue;
      fields[key] = formatFirestoreValue(val);
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      console.error(`Failed to write to ${collection}:`, await res.text());
    }
  } catch (err) {
    console.error(`Error writing to ${collection}:`, err);
  }
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

async function verifyTurnstileToken(token: string | undefined, secretKey: string | undefined): Promise<boolean> {
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY is not configured. Bypassing Turnstile verification.');
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

export async function onRequest(context: {
  request: Request;
  env: {
    GEMINI_API_KEY?: string;
    POEM_LIMITS: KVNamespace;
    SITE_GLOBAL_LIMIT?: KVNamespace;
    TURNSTILE_SECRET_KEY?: string;
    TURNSTILE_SITE_KEY?: string;
  };
  params: any;
}): Promise<Response> {

  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-id, x-gemini-api-key',
  };

  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const decodedToken = token ? decodeFirebaseToken(token) : null;
  const userEmail = decodedToken?.email || '';
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  // If this is an administrative route, strictly require admin authorization with 403
  if (path.includes('/admin/')) {
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'عذراً، هذا الإجراء متاح فقط لمدير النظام.' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get visitor IP
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    'unknown';

  // Daily key
  const today = new Date().toISOString().slice(0, 10);
  const limitKey = `${ip}:${today}`;
  const globalLimitKey = `global:${today}`;

  // Get Gemini API Key from Env
  const apiKey = env.GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    if (path.endsWith('/health')) {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'Missing GEMINI_API_KEY in Cloudflare Pages environment variables.'
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'عذراً، لم يتم تهيئة مفتاح (GEMINI_API_KEY) في إعدادات بيئة Cloudflare Pages. يرجى تهيئته لبدء الاستخدام.'
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  const aiInstance = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-cloudflare-pages',
      },
    },
  });

  try {

    if (path.endsWith('/health')) {
      return new Response(
        JSON.stringify({
          status: 'ok',
          hasApiKey: true
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (path.endsWith('/config')) {
      let currentCount = 0;
      if (env.POEM_LIMITS) {
        try {
          currentCount = Number(await env.POEM_LIMITS.get(limitKey)) || 0;
        } catch (e) {
          console.error('Failed to load POEM_LIMITS count:', e);
        }
      }
      const remainingDailyUses = Math.max(0, 10 - currentCount);
      return new Response(
        JSON.stringify({
          TURNSTILE_SITE_KEY: env.TURNSTILE_SITE_KEY || '',
          remainingDailyUses
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (path.endsWith('/dev-logs')) {
      return new Response(
        JSON.stringify(devLogs),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (path.endsWith('/admin/stats')) {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'عذراً، غير مصرح لك بالوصول إلى هذه البيانات الإدارية الحساسة.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
          gemini: 'connected',
          firebase: 'connected',
          turnstile: env.TURNSTILE_SITE_KEY ? 'connected' : 'disconnected',
          kv: 'connected'
        }
      };

      try {
        const users = await fetchFirestoreDocuments('users');
        stats.registeredUsers = users.length;

        const logs = await fetchFirestoreDocuments('usage_logs');
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

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

        logs.forEach((data: any) => {
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
        console.error('Error computing cf admin stats:', err);
      }

      return new Response(
        JSON.stringify(stats),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.endsWith('/admin/subscription-stats')) {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'عذراً، غير مصرح لك بالوصول إلى هذه البيانات الإدارية الحساسة.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const realUsers = await fetchFirestoreDocuments('users');

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

        return new Response(
          JSON.stringify({
            totalSubscribers,
            proSubscribers,
            premiumSubscribers,
            monthlyRevenue,
            expiredSubscriptions,
            canceledSubscriptions,
            latestPayments: latestPayments.slice(0, 10),
            allUsers: realUsers
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message || 'حدث خطأ أثناء تحميل بيانات الاشتراكات.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path.endsWith('/admin/all-diwans')) {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'عذراً، غير مصرح لك بالوصول إلى هذه البيانات الإدارية الحساسة.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const poems = await fetchFirestoreDocuments('poems');
        poems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        return new Response(
          JSON.stringify(poems),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message || 'حدث خطأ أثناء تحميل الدواوين.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path.endsWith('/generate-poem') && method === 'POST') {

      const currentCount = env.POEM_LIMITS
        ? (Number(await env.POEM_LIMITS.get(limitKey)) || 0)
        : 0;

      const DAILY_LIMIT = 10;

      if (currentCount >= DAILY_LIMIT) {
        await addFirestoreDocument('usage_logs', {
          type: 'reject_daily',
          timestamp: new Date().toISOString(),
          userId: decodedToken?.uid || null,
          userEmail: decodedToken?.email || null,
          ip
        });

        return new Response(
          JSON.stringify({
            error: 'لقد وصلت إلى الحد اليومي المسموح به (10 استخدامات يومياً). يرجى المحاولة غداً.',
            remainingDailyUses: 0
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      /* --- بداية فحص العداد العالمي للموقع --- */
      if (env.SITE_GLOBAL_LIMIT) {
        const globalCount = Number(await env.SITE_GLOBAL_LIMIT.get(globalLimitKey)) || 0;
        if (globalCount >= 2000) {
          await addFirestoreDocument('usage_logs', {
            type: 'reject_global',
            timestamp: new Date().toISOString(),
            userId: decodedToken?.uid || null,
            userEmail: decodedToken?.email || null,
            ip
          });

          return new Response(
            JSON.stringify({
              error: 'تم استهلاك الحصة اليومية للموقع. يرجى المحاولة غداً.'
            }),
            {
              status: 429,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }
      /* --- نهاية فحص العداد العالمي للموقع --- */

      const body = await request.json();
      const turnstileToken = body.turnstileToken;

      const isVerified = await verifyTurnstileToken(turnstileToken, env.TURNSTILE_SECRET_KEY);
      if (!isVerified) {
        await addFirestoreDocument('usage_logs', {
          type: 'reject_turnstile',
          timestamp: new Date().toISOString(),
          userId: decodedToken?.uid || null,
          userEmail: decodedToken?.email || null,
          ip
        });

        return new Response(
          JSON.stringify({
            error: 'فشل التحقق الأمني. يرجى إعادة المحاولة.'
          }),
          {
            status: 403,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      const startTime = Date.now();
      const result = await handleGeneratePoem(
        body,
        aiInstance
      );
      const duration = Date.now() - startTime;

      // زيادة عداد الاستخدام اليومي للمستخدم عند نجاح استدعاء Gemini بالكامل
      if (env.POEM_LIMITS) {
        await env.POEM_LIMITS.put(
          limitKey,
          String(currentCount + 1),
          {
            expirationTtl: 60 * 60 * 24
          }
        );
      }

      /* --- زيادة العداد العالمي للموقع عند نجاح استدعاء Gemini بالكامل --- */
      if (env.SITE_GLOBAL_LIMIT) {
        try {
          const globalCount = Number(await env.SITE_GLOBAL_LIMIT.get(globalLimitKey)) || 0;
          await env.SITE_GLOBAL_LIMIT.put(
            globalLimitKey,
            String(globalCount + 1),
            {
              expirationTtl: 60 * 60 * 24
            }
          );
        } catch (kvErr) {
          console.error('Failed to increment SITE_GLOBAL_LIMIT:', kvErr);
        }
      }
      /* --- نهاية زيادة العداد العالمي --- */

      // سجل استخدام حقيقي في قاعدة البيانات
      await addFirestoreDocument('usage_logs', {
        type: 'success_poem',
        timestamp: new Date().toISOString(),
        userId: decodedToken?.uid || null,
        userEmail: decodedToken?.email || null,
        duration,
        ip
      });

      const responseData = typeof result === 'object' && result !== null
        ? { ...result, remainingDailyUses: Math.max(0, 10 - (currentCount + 1)) }
        : { result, remainingDailyUses: Math.max(0, 10 - (currentCount + 1)) };

      return new Response(
        JSON.stringify(responseData),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (path.endsWith('/literary-tool') && method === 'POST') {

      const currentCount = env.POEM_LIMITS
        ? (Number(await env.POEM_LIMITS.get(limitKey)) || 0)
        : 0;

      const DAILY_LIMIT = 10;

      if (currentCount >= DAILY_LIMIT) {
        await addFirestoreDocument('usage_logs', {
          type: 'reject_daily',
          timestamp: new Date().toISOString(),
          userId: decodedToken?.uid || null,
          userEmail: decodedToken?.email || null,
          ip
        });

        return new Response(
          JSON.stringify({
            error: 'لقد وصلت إلى الحد اليومي المسموح به (10 استخدامات يومياً). يرجى المحاولة غداً.',
            remainingDailyUses: 0
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      /* --- بداية فحص العداد العالمي للموقع --- */
      if (env.SITE_GLOBAL_LIMIT) {
        const globalCount = Number(await env.SITE_GLOBAL_LIMIT.get(globalLimitKey)) || 0;
        if (globalCount >= 2000) {
          await addFirestoreDocument('usage_logs', {
            type: 'reject_global',
            timestamp: new Date().toISOString(),
            userId: decodedToken?.uid || null,
            userEmail: decodedToken?.email || null,
            ip
          });

          return new Response(
            JSON.stringify({
              error: 'تم استهلاك الحصة اليومية للموقع. يرجى المحاولة غداً.'
            }),
            {
              status: 429,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }
      /* --- نهاية فحص العداد العالمي للموقع --- */

      const body = await request.json();
      const { toolAction, payload, turnstileToken } = body;

      const isVerified = await verifyTurnstileToken(turnstileToken, env.TURNSTILE_SECRET_KEY);
      if (!isVerified) {
        await addFirestoreDocument('usage_logs', {
          type: 'reject_turnstile',
          timestamp: new Date().toISOString(),
          userId: decodedToken?.uid || null,
          userEmail: decodedToken?.email || null,
          ip
        });

        return new Response(
          JSON.stringify({
            error: 'فشل التحقق الأمني. يرجى إعادة المحاولة.'
          }),
          {
            status: 403,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (!toolAction) {
        return new Response(
          JSON.stringify({
            error: 'حقل الإجراء (toolAction) مطلوب.'
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      const startTime = Date.now();
      const result = await handleLiteraryTool(
        toolAction,
        payload,
        aiInstance
      );
      const duration = Date.now() - startTime;

      // زيادة عداد الاستخدام اليومي للمستخدم عند نجاح استدعاء Gemini بالكامل
      if (env.POEM_LIMITS) {
        await env.POEM_LIMITS.put(
          limitKey,
          String(currentCount + 1),
          {
            expirationTtl: 60 * 60 * 24
          }
        );
      }

      /* --- زيادة العداد العالمي للموقع عند نجاح استدعاء Gemini بالكامل --- */
      if (env.SITE_GLOBAL_LIMIT) {
        try {
          const globalCount = Number(await env.SITE_GLOBAL_LIMIT.get(globalLimitKey)) || 0;
          await env.SITE_GLOBAL_LIMIT.put(
            globalLimitKey,
            String(globalCount + 1),
            {
              expirationTtl: 60 * 60 * 24
            }
          );
        } catch (kvErr) {
          console.error('Failed to increment SITE_GLOBAL_LIMIT:', kvErr);
        }
      }
      /* --- نهاية زيادة العداد العالمي --- */

      // سجل استخدام حقيقي في قاعدة البيانات
      await addFirestoreDocument('usage_logs', {
        type: 'success_tool',
        timestamp: new Date().toISOString(),
        userId: decodedToken?.uid || null,
        userEmail: decodedToken?.email || null,
        duration,
        toolAction,
        ip
      });

      const responseData = typeof result === 'object' && result !== null
        ? { ...result, remainingDailyUses: Math.max(0, 10 - (currentCount + 1)) }
        : { result, remainingDailyUses: Math.max(0, 10 - (currentCount + 1)) };

      return new Response(
        JSON.stringify(responseData),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'الرابط المطلوب غير موجود.' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Error handling API request:', err);
    addDevLog(path, null, err.message || String(err));
    return new Response(
      JSON.stringify({ error: err.message || 'حدث خطأ فني غير متوقع.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}