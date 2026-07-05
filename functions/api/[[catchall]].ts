import { GoogleGenAI } from '@google/genai';
import {
  handleGeneratePoem,
  handleLiteraryTool,
  devLogs,
  addDevLog
} from '../../src/backend-logic';

export async function onRequest(context: {
  request: Request;
  env: {
    GEMINI_API_KEY?: string;
    POEM_LIMITS: KVNamespace;
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

      const currentCount =
        Number(await env.POEM_LIMITS.get(limitKey)) || 0;

      const DAILY_LIMIT = 10;

      if (currentCount >= DAILY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: 'لقد وصلت إلى الحد اليومي المسموح به (10 قصائد يومياً). يرجى المحاولة غداً.'
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

      await env.POEM_LIMITS.put(
        limitKey,
        String(currentCount + 1),
        {
          expirationTtl: 60 * 60 * 24
        }
      );

      const body = await request.json();

      const result = await handleGeneratePoem(
        body,
        aiInstance
      );

      return new Response(
        JSON.stringify(result),
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

  const currentCount =
    Number(await env.POEM_LIMITS.get(limitKey)) || 0;

  const DAILY_LIMIT = 10;

  if (currentCount >= DAILY_LIMIT) {
    return new Response(
      JSON.stringify({
        error: 'لقد وصلت إلى الحد اليومي المسموح به (10 استخدامات يومياً). يرجى المحاولة غداً.'
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

  await env.POEM_LIMITS.put(
    limitKey,
    String(currentCount + 1),
    {
      expirationTtl: 60 * 60 * 24
    }
  );

  const body = await request.json();
  const { toolAction, payload } = body;

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

  return new Response(
    JSON.stringify(result),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}
