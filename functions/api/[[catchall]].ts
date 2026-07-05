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
    'Access-Control-Allow-Headers': 'Content-Type, x-client-id, x-gemini-api-key',
  };

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

    if (path.endsWith('/generate-poem') && method === 'POST') {

      const currentCount = env.POEM_LIMITS
        ? (Number(await env.POEM_LIMITS.get(limitKey)) || 0)
        : 0;

      const DAILY_LIMIT = 10;

      if (currentCount >= DAILY_LIMIT) {
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

      const result = await handleGeneratePoem(
        body,
        aiInstance
      );

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

  const result = await handleLiteraryTool(
    toolAction,
    payload,
    aiInstance
  );

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