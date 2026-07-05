/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';

export interface GeminiCallParams {
  toolName: string;
  model?: string;
  contents: string | any[];
  config?: any;
  ai: GoogleGenAI;
}

// Logger that suppresses output in production
export const logger = {
  log: (...args: any[]) => {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      console.error(...args);
    }
  }
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function stripComments(jsonStr: string): string {
  return jsonStr.replace(/("(?:[^"\\]|\\.)*")|(?:\/\/[^\r\n]*|\/\*[\s\S]*?\*\/)/g, (match, stringGroup) => {
    if (stringGroup) {
      return stringGroup;
    }
    return '';
  });
}

// Task Queue for sequencing requests
export class TaskQueue {
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

export const poemGenerationQueue = new TaskQueue();

// 24-Hour Cache implementation
export interface CacheEntry {
  response: any;
  timestamp: number;
}
export const apiCache = new Map<string, CacheEntry>();

export function getCachedResponse(key: string): any | null {
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

export function setCachedResponse(key: string, response: any) {
  apiCache.set(key, {
    response,
    timestamp: Date.now()
  });
}

// Active user session tracking
export const activeUsers = new Set<string>();

export function isRetryableError(error: any): boolean {
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

export function escapeLiteralNewlinesInStrings(str: string): string {
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

export function autoCloseJson(str: string): string {
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

export function robustParseJson(text: string | null | undefined): any {
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

export function cleanAndParseJson(text: string | null | undefined): any {
  return robustParseJson(text);
}

export interface DevLog {
  timestamp: string;
  tool: string;
  rawResponse: string | null;
  errorReason: string;
}

export const devLogs: DevLog[] = [];

export function addDevLog(tool: string, rawResponse: string | null, errorReason: string) {
  const log: DevLog = {
    timestamp: new Date().toISOString(),
    tool,
    rawResponse,
    errorReason
  };
  devLogs.unshift(log);
  if (devLogs.length > 50) {
    devLogs.pop();
  }
}

export async function callGeminiWithJsonParsing(params: GeminiCallParams): Promise<any> {
  const { toolName, model = 'gemini-3.5-flash', contents, config = {}, ai: aiInstance } = params;
  
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
        // Debounce of 1500ms before any model invocation
        logger.log(`[Debounce] Waiting 1500ms before model invocation for ${toolName}...`);
        await sleep(1500);

        logger.log(`[Gemini API Call] [${toolName}] Attempt ${apiAttempt + 1}/${maxAttempts}...`);
        
        const result = await aiInstance.models.generateContent({
          model: 'gemini-3.5-flash',
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

// -------------------------------------------------------------
// Poem Generator Execution Wrapper
// -------------------------------------------------------------
export async function handleGeneratePoem(body: any, aiInstance: GoogleGenAI): Promise<any> {
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
    clientId = 'global-client'
  } = body;

  if (activeUsers.has(clientId)) {
    throw new Error('لديك عملية توليد جارية حالياً. يرجى الانتظار حتى اكتمالها.');
  }

  if (!meterName || !purpose || !description || !versesCount) {
    throw new Error('الرجاء توفير جميع الحقول الأساسية المطلوبة لتوليد القصيدة.');
  }

  if (typeof description !== 'string' || description.trim() === '') {
    throw new Error('وصف موضوع القصيدة لا يمكن أن يكون فارغاً.');
  }

  const parsedVersesCount = parseInt(versesCount, 10);
  if (isNaN(parsedVersesCount) || parsedVersesCount < 1 || parsedVersesCount > 30) {
    throw new Error('عدد الأبيات يجب أن يكون رقماً صحيحاً بين 1 و 30.');
  }

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

  // Cache Check
  const normalizedDesc = description.trim().replace(/\s+/g, ' ');
  const cacheKey = `poem:${meterName}:${purpose}:${customPurpose || ''}:${isOpposition}:${oppositionPoem || ''}:${isSimulatingPoet}:${poetName || ''}:${parsedVersesCount}:${rhymeSystem}:${customRhymeLetter || ''}:${normalizedDesc}`;
  
  const cachedResponse = getCachedResponse(cacheKey);
  if (cachedResponse) {
    logger.log(`[Cache Hit] Returning cached poem for client ${clientId}`);
    return cachedResponse;
  }

  activeUsers.add(clientId);

  try {
    const finalPoem = await poemGenerationQueue.enqueue(async () => {
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

      setCachedResponse(cacheKey, outputPoem);
      return outputPoem;
    });

    return finalPoem;
  } finally {
    activeUsers.delete(clientId);
  }
}

// -------------------------------------------------------------
// Advanced Literary Tool Wrapper
// -------------------------------------------------------------
export async function handleLiteraryTool(toolAction: string, payload: any, aiInstance: GoogleGenAI): Promise<any> {
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
    return await callGeminiWithJsonParsing({
      toolName: 'generate-rhymes',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت لغوي فصيح وعالم قوافي خبير بأشعار العرب.',
        responseMimeType: 'application/json',
      },
    });
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
    return await callGeminiWithJsonParsing({
      toolName: 'suggest-meters-and-purposes',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت مستشار أدبي وناقد عروضي رفيع الشأن.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'prose-to-poem') {
    const { proseText, meterName, rhymeLetter, versesCount, genre } = payload;
    const prompt = `
مهمتك هي "تحويل النثر العربي إلى قصيدة كلاسيكية فخمة وموزونة".
النثر المراد نظمه:
"""
${proseText}
"""
بحر المختار: (${meterName})
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
    return await callGeminiWithJsonParsing({
      toolName: 'prose-to-poem',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ناظم محترف يحيل النثر العادي إلى درر شعرية موزونة وفخمة.',
        responseMimeType: 'application/json',
      },
    });
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
    return await callGeminiWithJsonParsing({
      toolName: 'transmute-meter',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت صانع موازين ومحور بحور خبير بالنقل العروضي الدقيق.',
        responseMimeType: 'application/json',
      },
    });
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
    return await callGeminiWithJsonParsing({
      toolName: 'change-rhyme',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت عالم قوافي وصائغ روي بارع يضمن الوزن ويسلس القافية.',
        responseMimeType: 'application/json',
      },
    });
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
    return await callGeminiWithJsonParsing({
      toolName: 'explain-and-extract-rhetoric',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت بروفيسور البلاغة والأدب العربي الفصيح ومفسر دواوين الفحول.',
        responseMimeType: 'application/json',
      },
    });
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
    return await callGeminiWithJsonParsing({
      toolName: 'analyze-style',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ناقد أدبي ومؤرخ شعر عربي ذو مهارة عالية في تحليل الأساليب والمدارس.',
        responseMimeType: 'application/json',
      },
    });
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
    return await callGeminiWithJsonParsing({
      toolName: 'compare-poems',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت قاضي عكاظ النقدي، تقارن بين عيون الشعر بالدقة البلاغية التامة.',
        responseMimeType: 'application/json',
      },
    });
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
    return await callGeminiWithJsonParsing({
      toolName: 'opposition-analyze',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ناقد عروضي وخبير بدواوين الشعر العربي والتعرف على قائلي الأبيات.',
        responseMimeType: 'application/json',
      },
    });
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
    return await callGeminiWithJsonParsing({
      toolName: 'opposition-generate',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت أستاذ المعارضة الشعرية الأكبر والمدقق العروضي الصارم والملهم لصياغة روائع عيون الشعر العربي.',
        responseMimeType: 'application/json',
      },
    });
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
`;
    return await callGeminiWithJsonParsing({
      toolName: 'industries-generate',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت شيخ الصناعات الشعرية وعالم النظم البديع العارف بفنون التخميس والتسبيع والتشطير.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'analyze-prosody') {
    const { verseText } = payload;
    const prompt = `
أنت الآن "كبير علماء العروض والقوافي ومفتش بحور ديوان العرب". قم بإجراء تحليل عروضي فائق الدقة والمجهرية للأبيات الشعرية التالية:
"""
${verseText}
"""

المطلوب بدقة عروضية تامة:
1. الكشف عن البحر الشعري بدقة وعرض تفعيلاته المثالية.
2. الكشف عن أي كسر عروضي، خلل وزني، زحاف رديء، علة مستهجنة، أو عدم اتساق إيقاعي في كل بيت.
3. كتابة تفعيلات الصدر وتفعيلات العجز بالتفصيل وبيان مواضع أي خلل بدقة.
4. إذا وجد أي خلل، اقترح 3 بدائل تصحيحية عروضية ممتازة لكل بيت به خلل، مع الحفاظ التام على نفس المعنى والجو النفسي والسياق والجزالة اللفظية.
5. لكل بديل مقترح: بيّن تفعيلاته السليمة وعلل لماذا هذا البديل سليم إيقاعياً وبلاغياً.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً (ملاحظة: لا تضع أي تعليقات مثل // داخل الـ JSON الناتج):
{
  "detectedMeter": "اسم البحر المكتشف",
  "feetTemplate": "التفعيلات المثالية الكاملة للبحر",
  "issues": [
    {
      "verseIndex": 1,
      "verseText": "البيت المدروس",
      "hasViolation": true,
      "violationDetails": "تفاصيل الكسر العروضي أو الخلل الوزني أو عدم الاتساق، والسبب بالتفصيل اللغوي",
      "sadrFeet": "تفعيلات الصدر الحالية ومواضع الخلل بالتحديد",
      "ajuzFeet": "تفعيلات العجز الحالية ومواضع الخلل بالتحديد",
      "corrections": [
        {
          "correctedSadr": "الصدر المصحح المقترح الأول",
          "correctedAjuz": "العجز المصحح المقترح الأول",
          "feet": "تفعيلات الصياغة المصححة",
          "reasoning": "سبب سلامة هذا الخيار وكيف أصلح الخلل مع الحفاظ على الموسيقى"
        }
      ]
    }
  ]
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'analyze-prosody',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت المدقق العروضي الأكبر لقصائد ديوان العرب وفحول الشعراء.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'style-analyze-transform') {
    const { poemText, targetStyle } = payload;
    const prompt = `
أنت الآن "بروفيسور الأسلوبية اللغوية والمحور الفني لدواوين الشعر".
القصيدة الحالية للمستخدم:
"""
${poemText}
"""
النمط الأدبي المستهدف للتحويل إليه: (${targetStyle})

المطلوب بدقة متناهية:
1. تحليل أسلوبي عميق لقصيدة المستخدم الحالية من حيث: كثافة المفردات (vocabulary density)، درجة الكلاسيكية وجزالة اللفظ، التراكيب النحوية والإنشائية، أنماط الخيال والبيان، النزعات البلاغية والجمالية، والحقول الدلالية المسيطرة.
2. صياغة القصيدة وتحويل أسلوبها بالكامل ليتلائم مع النمط المستهدف (مثل: جزالة وفحولة العصر الجاهلي وصحرائه وألفاظه، أو فخامة وعمق العصر العباسي، أو رقة وعذوبة وأزهار العصر الأندلسي، أو بساطة وعاطفة وصور العصر الحديث)، مع الحفاظ الصارم التام على المعاني والأفكار الأصلية، ومراعاة وزن البحر العروضي الأصلي للقصيدة لمنع الكسور.
3. شرح أدبي ونقدي يعقد مقارنة أسلوبية دقيقة بين النصين ويوضح التغييرات اللفظية والجمالية التي طرأت ومبرراتها الأسلوبية بمثابة استشارة بلاغية تخصصية.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً (ملاحظة: لا تضع أي تعليقات مثل // داخل الـ JSON الناتج):
{
  "styleAnalysis": {
    "vocabularyDensity": "تحليل كثافة وثراء المفردات المستعملة حالياً",
    "classicalityLevel": "نسبة الكلاسيكية والجزالة الحالية",
    "lexicalSophistication": "مستوى النضوج والتعقيد المعجمي",
    "sentenceStructure": "طبيعة التراكيب اللفظية والربط",
    "imageryPatterns": "خصائص الخيال والتشبيه المستعمل",
    "rhetoricalTendencies": "النزعات البلاغية السائدة",
    "semanticFields": "الحقول الدلالية المسيطرة"
  },
  "transformedTitle": "عنوان القصيدة المحولة أسلوبياً",
  "transformedVerses": [
    { "shatr1": "الصدر الجديد الموزون والملائم للأسلوب", "shatr2": "العجز الجديد الموزون والملائم للأسلوب", "index": 1 }
  ],
  "comparisonExplanation": "شرح وتحليل أدبي ونقدي مقارن يوضح الفروق الأسلوبية اللفظية والجمالية والتعبيرية بمثابة استشارة لغوية تخصصية وافية."
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'style-analyze-transform',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت لغوي أسلوبي وعالم بلاغة خبير بتحوير صياغات الشعر العربي وتحويله بين المدارس الفنية.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'originality-analyze') {
    const { poemText } = payload;
    const prompt = `
أنت الآن "الناقد الأدبي الصارم وحارس فرادة الشعر العربي". قم بإجراء تحليل نقدي مجهري لقياس أصالة النص الشعري التالي وتحديد مواضع التكرار والأنماط المستهلكة:
"""
${poemText}
"""

المطلوب:
1. فحص الكلمات والعبارات المكررة داخلياً (الترديد، التكرير، أو الحشو اللفظي غير البلاغي).
2. تحديد التراكيب والمجازات والصور البيانية المستهلكة أو المبتذلة (Clichés) التي كثر دورانها في تاريخ الشعر العربي دون ابتكار.
3. دراسة البناء التركيبي ومدى تميز الصياغة وأصالتها.
4. تقديم تقرير تخصصي يبين مواطن القوة الإبداعية، ومخاطر الرتابة والتقليد، وتوصيات تفصيلية بالبدائل اللفظية المبتكرة والصور البكر لتوليد تمايز حقيقي.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً (ملاحظة: لا تضع أي تعليقات مثل // داخل الـ JSON الناتج):
{
  "score": 85,
  "internalRepetitions": [
    { "phrase": "اللفظ أو العبارة المكررة", "verseIndex": 1, "issue": "شرح أثر التكرار وهل هو حشو أم لغرض بلاغي كالتأكيد والترديد" }
  ],
  "clichésAndOverused": [
    { "phrase": "الصورة أو التركيب المستهلك", "verseIndex": 1, "comment": "لماذا تعد هذه الصورة مستهلكة وكيف يمكن صقلها لتصبح بكراً مبتكرة" }
  ],
  "originalityReport": "تحليل نقدي وأدبي مفصل حول أصالة البناء اللفظي والخيال البياني في القصيدة وتماسكها مع تراث دواوين العرب",
  "recommendations": ["توصية تخصصية أولى للابتكار والفرادة اللفظية والبيانية", "توصية ثانية لترقية التميز والعمق الفكري"]
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'originality-analyze',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ناقد أدبي رصين يحلل الابتكار والفرادة اللفظية والتصويرية في الشعر العربي الفصيح.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'inspiration-generate') {
    const { topic } = payload;
    const prompt = `
أنت الآن "الملهم ومستودع الأخيلة وباعث قريحة النظم". قم بتوليد لوحة إلهام فنية تخصصية متكاملة حول الموضوع التالي لإثارة قريحة الشاعر ومساعدته على النظم بنفسه:
الموضوع: (${topic})

المطلوب توليد عناصر إبداعية أصيلة ومتميزة:
1. صور وخيالات تراثية وبيانات مبتكرة (موصوفة نثراً ومقترنة باستعارات رائعة تساعد الشاعر على تخيلها ونظمها).
2. رموز أدبية وشخصيات تاريخية أو مشاهد رمزية غنية بالدلالات تناسب هذا الباب وتثري الأبيات.
3. معجم الألفاظ الكلاسيكية الفخمة: قائمة بـ 10 مفردات تراثية جزلة ونادرة تناسب الموضوع مع شرحها اللغوي الدقيق.
4. أفكار ومناحي فلسفية وأبعاد عاطفية يمكن التدرج عبرها لبناء هيكل القصيدة وتدفق معانيها.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً (ملاحظة: لا تضع أي تعليقات مثل // داخل الـ JSON الناتج):
{
  "themeName": "عنوان لوحة الإلهام",
  "imageryAndScenes": [
    { "title": "الصورة المقترحة", "description": "وصف الصورة الخيالية والبيانية بدقة وشاعرية فائقة لتسهيل سبكها شعرياً" }
  ],
  "symbolsAndHistory": [
    { "symbol": "الرمز أو المشهد التراثي", "meaning": "أبعاده النفسية والفنية وكيفية توظيفه في النظم" }
  ],
  "classicalVocabulary": [
    { "word": "المفردة التراثية الجزلة", "meaning": "شرحها اللغوي وكيفية تضمينها في الأبيات" }
  ],
  "philosophicalThemes": [
    "فكرة أو زاوية عاطفية فلسفية يمكن النظم حولها لتوسيع آفاق القصيدة"
  ]
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'inspiration-generate',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ملهم أدبي يثير قرائح الشعراء بالصور والمعاجم التراثية الفخمة.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'verse-ai-modify') {
    const { shatr1, shatr2, instruction, meterName, rhymeLetter } = payload;
    const prompt = `
أنت الآن "مستشار الصياغة والمصحح اللغوي والعروضي الملازم للشاعر".
البيت الحالي المطلوب صقله وتعديله:
الصدر: (${shatr1})
العجز: (${rhymeLetter === '❋' || !shatr2 ? 'غير متوفر أو شطر فردي' : shatr2})

توجيه المستخدم لتعديل وصقل البيت: (${instruction})
البحر الشعري الحاكم للقصيدة: (${meterName})
حرف الروي الملتزم به في نهايات الأبيات: (${rhymeLetter})

الشروط الصارمة:
1. قم بإعادة صياغة هذا البيت وتعديله وتلبيته للتوجيه المطلوب (مثلاً: استبدال كلمة بروادفها الأفخم، تقوية الاستعارة والصورة البيانية، إصلاح الوزن العروضي إن كان مكسوراً، زيادة البلاغة والجزالة، إلخ).
2. يجب الالتزام التام بوزن بحر القصيدة (${meterName}) وقافيته ورويه على حرف (${rhymeLetter}) دون أي كسر عروضي أو كسر في القافية.
3. عدل هذا البيت وحده فقط، وقدم النتيجة بدقة وبلاغة لغوية ممتازة.
4. اذكر شرحاً بلاغياً وعروضياً وجيزاً للتعديل الذي قمت به لتبيان الأثر الفني والوزني.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً (ملاحظة: لا تضع أي تعليقات مثل // داخل الـ JSON الناتج):
{
  "shatr1": "الصدر الجديد المصحح والمعدل",
  "shatr2": "العجز الجديد المصحح والمعدل",
  "explanation": "شرح بلاغي وعروضي مقتضب للتعديل الذي طرأ وكيف لبى رغبة الشاعر مع الحفاظ على متانة الوزن والروي"
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'verse-ai-modify',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت صائغ شعر خبير وعالم عروض وبلاغة يساعد الشاعر على تهذيب أبياته وصقلها.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'workspace-poem-analysis') {
    const { verses, meterName, rhymeLetter } = payload;
    const formattedVerses = verses.map((v: any) => `البيت ${v.index}: ${v.shatr1} * ${v.shatr2}`).join('\n');
    const prompt = `
أنت الآن "الناقد الأدبي المستشار لبيت الحكمة وديوان العرب". قم بإعداد مراجعة أكاديمية تخصصية مفصلة للغاية للقصيدة التالية:
البحر العروضي: ${meterName}
حرف الروي: ${rhymeLetter}
الأبيات المدروسة:
${formattedVerses}

المطلوب تقديم تقرير دراسة متكامل ونقدي موضوعي رصين يشتمل على:
1. التقييم العروضي والوزني (Metrical Assessment): فحص وزن الأبيات على بحر ${meterName}، وهل تخللتها زحافات رديئة أو كسر في مواضع محددة.
2. التقييم القافي والروي (Rhyme Assessment): تقييم سلامة القوافي، التزام الروي، والتأكد من خلوه من عيوب القافية (كالإقواء والإكفاء والسناد والإيطاء).
3. التقييم اللغوي والمعجمي (Linguistic Assessment): جودة المفردات وجزالتها وقوتها النحوية والتركيبية وملاءمتها لقوام الشعر الكلاسيكي الفصيح.
4. التقييم الأسلوبي والبياني (Stylistic Assessment): طبيعة الصياغة والتراكيب وسلاسة التدفق الفني والموسيقي والجو النفسي.
5. التقييم البلاغي والخيال (Rhetorical Assessment): غنى الصور الخيالية والبيانية والمحسنات البديعية وتناغمها لخدمة المعاني.
6. جوانب القوة والجمال اللفظي والمعنوي في الأبيات بالتفصيل.
7. جوانب الضعف والمآخذ النقدية أو الركاكة التي ينبغي صقلها.
8. توصيات وإرشادات المراجعة والتطوير المحددة والمفصلة لترقية جودة القصيدة.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً (ملاحظة: لا تضع أي تعليقات مثل // داخل الـ JSON الناتج):
{
  "metricalAssessment": "التقرير العروضي والوزني المفصل بدقة أكاديمية رصينة",
  "rhymeAssessment": "التقرير القافي وسلامة الروي وحركاته المتزنة",
  "linguisticAssessment": "التقرير اللغوي والنحوي وبناء الجملة ومستوى الجزالة",
  "stylisticAssessment": "التقرير الأسلوبي والتدفق الفني للقصيدة والمدرسة الأدبية",
  "rhetoricalAssessment": "التقرير البلاغي والصور المجازية الفنية والبيان",
  "strengths": ["موطن قوة أول في الصياغة أو الصورة أو الوزن", "موطن قوة ثانٍ متميز"],
  "weaknesses": ["مأخذ نقدي أول أو موضع ركاكة يحتاج صقلاً", "مأخذ نقدي ثانٍ"],
  "recommendations": ["توصية تفصيلية أولى للمراجعة والصقل والتطوير", "توصية تفصيلية ثانية"]
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'workspace-poem-analysis',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ناقد ومستشار بلاغي وأكاديمي خبير بتحكيم القصائد وتقييمها موضوعياً دون مجاملة.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'rhetorical-analyze') {
    const { poemText } = payload;
    const prompt = `
أنت الآن "بروفيسور علم البلاغة والبيان والبدائع في ديوان العرب". قم بإجراء دراسة بلاغية مجهرية صارمة وشاملة للأبيات التالية واستخرج الأنماط والجماليات:
"""
${poemText}
"""

المطلوب استكشاف وتصنيف وتحليل العناصر التالية بالتفصيل:
1. التشبيه (Simile): استخراج أي تشبيهات مع تبيان نوعها (مرسل، مجمل، مؤكد، بليغ، تمثيلي) وأركانها وأثرها الجمالي.
2. الاستعارة (Metaphor) والاستعارة الممتدة (Extended Metaphor): تحديد الاستعارات المكنية والتصريحية، والامتداد التصويري للأخيلة.
3. الكناية (Metonymy) والرمزية (Symbolism): الكشف عن دلالات الكنايات (عن صفة، موصوف، نسبة) والرموز الموظفة.
4. التوازي التركيبي (Syntactic Parallelism): رصد الاتساق والتماثل الهندسي في تراكيب الجمل والأشطر.
5. الطباق والمقابلة (Antithesis): حصر الكلمات المتضادة والتراكيب المقابلة لها وأثرها في توضيح المعاني وفلسفة الفكرة.
6. الأنماط الصوتية وأنماط التكرار (Acoustic and Repetition Patterns): الكشف عن الجناس، السجع، التصدير، حسن التقسيم، الجرَس الداخلي للحروف، وتكرار الكلمات لإحداث إيقاع موسيقي.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً (ملاحظة: لا تضع أي تعليقات مثل // داخل الـ JSON الناتج):
{
  "similes": [
    { "phrase": "العبارة البلاغية", "type": "نوع التشبيه", "analysis": "تحليل أركان التشبيه وأثره الفني والجمالي" }
  ],
  "metaphors": [
    { "phrase": "العبارة البلاغية", "isExtended": false, "analysis": "تحليل الاستعارة ومكنونها الفني" }
  ],
  "metonymiesAndSymbols": [
    { "phrase": "العبارة أو الرمز", "type": "كناية أو رمز دلالي", "description": "الدلالة العميقة والخلفية التراثية" }
  ],
  "syntacticParallelism": [
    { "verses": "الأبيات التي تحوي توازياً", "comment": "شرح كيف أحدث التوازي التركيبي توازناً هندسياً وموسيقياً" }
  ],
  "antithesis": [
    { "word1": "الكلمة الأولى", "word2": "الكلمة المقابلة", "type": "طباق سلب/إيجاب أو مقابلة", "analysis": "أثرها في عمق الفكرة وتماسك المعنى" }
  ],
  "acousticAndRepetitions": [
    { "pattern": "النمط المكتشف (جناس/تكرار/تصدير)", "phrase": "الموضع من النص", "comment": "التأثير الموسيقي والجرَس الإيقاعي الباطني للنص" }
  ],
  "rhetoricalCritique": "دراسة نقدية بلاغية شاملة تحاكي تحليلات كبار فحول النقاد والأكاديميين لتقييم عمق الخيال البياني والتكامل الروحي الفني للنص المرفق."
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'rhetorical-analyze',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت حكيم البلاغة العربية والبيان المحلل لعيون الشعر والدواوين بالتفصيل الدقيق واللغة الأكاديمية الفخمة.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'poet-profile-analysis') {
    const { poems } = payload;
    const formattedPoems = poems.map((p: any, i: number) => `
القصيدة ${i + 1}:
العنوان: ${p.title}
البحر: ${p.meterName}
الروي: ${p.rhymeLetter}
الأبيات:
${p.verses?.map((v: any) => `- ${v.shatr1} * ${v.shatr2}`).join('\n')}
`).join('\n\n');

    const prompt = `
أنت الآن "المستشار الأكاديمي والناقد الموجه لمسيرة الشاعر الأدبية".
لقد جمعنا لك سجلاً من إنتاج الشاعر الشعري عبر الزمن لمراجعته وتحليله موضوعياً وبشكل تخصصي رصين.

سجل أعمال الشاعر:
"""
${formattedPoems}
"""

المطلوب صياغة "تقرير النقد والسمات الأسلوبية الشامل لمسيرة الشاعر" بأسلوب أدبي ونقدي فخم للغاية، خالٍ تماماً من الدرجات، التقاط، المستويات، الأوسمة، أو أي شكل من أشكال التلعيب (Gamification). ركز فقط على التحليل الأدبي الموضوعي الصرف:

1. تتبع البحور الأكثر استخداماً (Metrical Preferences): دراسة الأوزان التي يميل إليها الشاعر وتحليل العلاقة بين هذه البحور وطبيعته النفسية والوجدانية وعاطفة قصائده.
2. القوافي المفضلة والخصائص الصوتية (Acoustic and Rhyme Patterns): نقد اختياراته لحروف الروي وحركات القافية، وتأثير هذا التناغم الصوتي على الموسيقى الخارجية لقصائده.
3. ثراء المفردات والتطور المعجمي (Lexical Wealth and Growth): دراسة القاموس اللغوي للشاعر، وتتبع مدى جزالة ألفاظه أو ميله للمفردات العصرية أو كلاسيكيات اللغة الفخمة.
4. التنوع البلاغي وصياغة الخيال (Rhetorical and Imagery Profile): نقد طريقة توظيفه للتشبيه والاستعارة والرمز، وهل يبتكر صوراً بكراً أم يقع في أسر التقليد أحياناً.
5. السمات الأسلوبية والشخصية الأدبية (Stylistic Persona): تشخيص البصمة والروح الفريدة التي تسري في أبياته ومدرسته الفنية المتوقعة.
6. مواطن الضعف المتكررة وعيوب النظم الشائعة (Recurring Weaknesses and Pitfalls): تحديد أي ثغرات أو هنات عروضية أو لغوية أو ركاكة أسلوبية تكررت في أعماله، كاستخدام حشو للأوزان، أو رتابة القوافي، أو استسهال الاستعارات الشائعة.
7. الإرشادات التوجيهية لمستقبله الإبداعي (Scholarly Guidance): رسم خطة صقل حقيقية تعينه على الارتقاء بقاموسه النظمي والبياني.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً (ملاحظة: لا تضع أي تعليقات مثل // داخل الـ JSON الناتج):
{
  "metricalAnalysis": "دراسة أكاديمية معمقة للبحور المفضلة وعلاقتها بالحالة الإيقاعية والنفسية للشاعر",
  "acousticAnalysis": "تحليل الخصائص الصوتية وحروف الروي المفضلة وموسيقاها",
  "lexicalWealth": "دراسة ثراء القاموس اللغوي للشاعر وتطوره المعجمي وجزالة ألفاظه",
  "rhetoricalProfile": "تحليل الخصائص البلاغية وعناصر الخيال البياني وطرق صياغة الصور والأخيلة",
  "stylisticPersona": "تشخيص البصمة والروح الأسلوبية المتميزة لقصائده والمدرسة الأدبية التي ينتمي إليها",
  "recurringWeaknesses": "مراجعة نقدية صادقة وموضوعية لمواضع الضعف والركاكة أو الهنات المتكررة التي ينبغي صقلها وتجاوزها",
  "scholarlyGuidance": "إرشادات وتوجيهات عملية مرسومة بدقة أكاديمية لصقل أدوات الشاعر النظمية والبيانية واللغوية"
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'poet-profile-analysis',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ناقد وموجه أدبي أكاديمي ذو لغة فخمة ونظرة فاحصة لمسيرة الشعراء وتقييم إنتاجهم بموضوعية تامة.',
        responseMimeType: 'application/json',
      },
    });
  }

  throw new Error(`الإجراء المطلوب (${toolAction}) غير معروف.`);
}
