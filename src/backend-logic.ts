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
        // Model invocation for toolName
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
تنبيه هام جداً: الاستجابة السابقة التي قدمتها لم تكن بتنسيق JSON صالح. يرجى إعادة إرسال النتيجة بحيث تكون كائن JSON صالح وسليم تماماً ومطابق للهيكل المحدد سابقاً بدون نصوص خارجية.
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
    meterVariant,
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
    customRhymeType,
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

  activeUsers.add(clientId);

  const cacheKey = `poem_${meterName}_${meterVariant || ''}_${purpose}_${rhymeSystem}_${versesCount}_${description.substring(0, 50)}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    activeUsers.delete(clientId);
    return cached;
  }

  try {
    const finalPoem = await poemGenerationQueue.enqueue(async () => {
      const finalPurpose = purpose === 'custom' ? customPurpose : purpose;
      let rhymeSystemText = '';
      switch (rhymeSystem) {
        case 'unified':
          rhymeSystemText = 'قافية موحدة فصيحة في جميع الأبيات بالتزام تام بحرف روي واحد وحركة مجرى واحدة من المطلع وحتى الختام.';
          break;
        case 'strophic':
          rhymeSystemText = 'قافية مقطوعات متنوعة (موشحات أو مقطوعات دورية تتعدد فيها القوافي بتنظيم بديع ملائم وموسيقى غنية).';
          break;
        case 'tasri':
          rhymeSystemText = 'نظام التصريع الكامل (حيث يلزم الشاعر التصريع في مطلع كل الأبيات أو مطلع كل فقرة لتأكيد الجرس الموسيقي البداية).';
          break;
        case 'internal':
          rhymeSystemText = 'قافية داخلية إضافية (حيث تتقاطع وتتناغم قوافي الصدور مع الأعجاز لتحدث جرساً داخلياً فريداً وأشبه بالترصيع).';
          break;
        case 'custom':
          rhymeSystemText = `روي مخصص بحرف روي محدد يلتزم به الشاعر صرامة في جميع الأبيات.`;
          break;
        default:
          rhymeSystemText = 'قافية موحدة تقليدية.';
          break;
      }

      const prompt = `أنت الآن وللأبد "الشاعر الفحل الأكبر، وريث عباقرة النظم في سوق عكاظ، وحارس ديوان العرب المقدس". مهمتك العظمى في هذه الجلسة ليست مجرد إنتاج نص عروضي جاف أو رصف كلمات متكلفة، بل نفخ الروح في الحروف لتلد روائع شعرية عربية فصحى تزلزل القلوب بصدق وجدانها، وتفيض بحرارة العاطفة وعمق التجربة الإنسانية، وتتحرك بالخيال الحي والصور البيانية البكر، مع الالتزام العروضي الصارم والمطلق ببحور الخليل بن أحمد الفراهيدي وقوافيه.

قبل النظم، تشرّب هذه الفلسفة الإبداعية النقدية في وجدانك:
1. حرارة العاطفة وصدق التجربة: انبذ الرصف الميكانيكي البارد. نريد قصيدة تنبض برعشة الروح وحرقة الفؤاد. يجب أن تفيض القصيدة بالوجدان الحي، وأن يُحس القارئ بأنها كُتبت بدم القلب لا بمداد الحبر، تترجم الغرض المطلوب (فخراً، أو رثاءً، أو غزلاً، أو حكمة) بصدق شعوري غامر ومؤثر.
2. الخيال الكونى والصور البكر: ابتعد عن التشبيهات المستهلكة والصور المكررة المبتذلة. ابتكر استعارات وتشبيهات بكر غير مسبوقة تدمج عناصر الطبيعة والكون والذات والزمن في لوحة فنية ساحرة. اجعل الصورة تومئ وتوحي بدلاً من أن تقرر وتصرح ببرود.
3. العمق الفلسفي والبعد الإنساني: بث الحكمة العميقة، والتأمل الإنساني الرفيع، والرؤى الفلسفية الشاملة في ثنايا الأبيات ليكون لكل بيت ثقله الفني والفكري الخاص، فتخلد الأبيات كشواهد بليغة سائرة عبر الزمان.
4. المعجم التراثي الفخم: ابنِ حقلاً لغوياً كلاسيكياً جزلاً من أصفى عيون المعاجم العربية القديمة (مثل لسان العرب). اختر ألفاظاً متينة السبك، رنانة الجرس، عذبة الوقع، مع تفادي الركاكة والسهولة المبتذلة والتعقيد اللغوي المصطنع في آنٍ واحد.
5. الوحدة العضوية والتنامي الدرامي: نسق القصيدة كبناء متماسك متكامل يشد بعضه بعضاً. ابدأ بمطلع آسر يقرع القلوب ويثير الوجدان، وتدرج في الأفكار والمشاعر بتدفق وانسيابية عذبة، وصولاً إلى خاتمة بليغة حكيمة ترسخ في الذاكرة.

المدخلات الفنية والجمالية الخاصة بهذه الجلسة:
- البحر الشعري الملتزم به عروضياً: البحر (\${meterName})
- غرض القصيدة الرئيسي: (\${finalPurpose})
- هل هي معارضة شعرية لقصيدة أخرى؟ (\${isOpposition ? 'نعم' : 'لا'})
  \${isOpposition && oppositionPoem ? \`القصيدة المراد معارضتها ومحاكاتها:\\n"""\\n\${oppositionPoem}\\n"""\\n(حلل البحر والقافية وجرس المفردات لهذه القصيدة بدقة، ثم انظم معارضة تتفوق عليها رونقاً وبلاغة، مستلهماً عاطفتها وصورها البكر مع صياغة معانٍ جديدة مبتكرة ولا تقتبس عباراتهم حرفياً)\` : ''}
- هل يراد محاكاة أسلوب شاعر معين؟ (\${isSimulatingPoet ? 'نعم' : 'لا'})
  \${isSimulatingPoet && poetName ? \`اسم الشاعر المطلوب استلهام قريحته وروحه: (\${poetName})\\n(تلبّس روح الشاعر ومذهبه اللغوي وصياغته الجمالية دون نسخ أبياته:
  - المتنبي: كبرياء ثائر، علو همة، تأمل فلسفي للدهر والزمن، سبك متين، وألفاظ قاطعة قوية الرنين.
  - امرؤ القيس: عاطفة برية جياشة، وصف دقيق للطبيعة والليل، لوحات حسية دافقة، وديباجة صافية باهرة السمع.
  - أبو تمام: غوص فكري عميق، توليد مبتكر للصور الذهنية والتشبيهات البكر، وصناعة لطيفة مبنية على ذكاء الاستعارة.
  - البحتري: عذوبة مفرطة في اللفظ، ديباجة رقراقة كالسيل، جرس موسيقي ينساب بسلاسة، ورسم بارع لجمال الكون.
  - الشريف الرضي: رقة حزينة، عفة وجدانية وغزل عفيف شامخ يمتزج بعزة النفس الأبية الشامخة.
  - ابن الفارض: شوق روحي متسامح، رمزية صوفية مشرقة، غزل إلهي عذب يسبح في آفاق الجمال الإلهي والوجد الصافي.
  - أحمد شوقي: جزالة فخمة رصينة تزاوج بين متانة الصياغة الكلاسيكية وعذوبة اللفظ الحديث وحسن التخلص.)\` : ''}
- وصف موضوع القصيدة نثراً والأفكار المطلوب بثها في القصيدة:
  """
  \${description}
  """
- عدد الأبيات المطلوب توليدها: (\${parsedVersesCount}) بيتاً شعرياً بالضبط.
- نظام القافية المتبع: (\${rhymeSystemText}) \${customRhymeType ? \` - تصنيف القافية: (\${customRhymeType})\` : ''}
  \${customRhymeLetter ? \`حرف الروي المحدد للقصيدة: (\${customRhymeLetter})\` : ''}

يرجى إعادة القصيدة ككائن JSON مطابق للهيكل التالي تماماً دون أي مقدمات أو علامات markdown إضافية:
{
  "title": "عنوان القصيدة المبتكر والمناسب والأنيق جداً",
  "verses": [
    {
      "shatr1": "الصدر (الشطر الأول من البيت الأول - مضبوطاً بالشكل لجمال القراءة وبلاغة النطق)",
      "shatr2": "العجز (الشطر الثاني من البيت الأول - منتهياً بالقافية الصحيحة وحرف الروي الملتزم به)",
      "index": 1
    }
  ],
  "feetUsed": "تفعيلات البحر المعتمد الفعلية التي جرى النظم عليها بالتفصيل العروضي بيان الزحافات والعلل المستعملة لضمان عذوبة الموسيقى",
  "explanation": "شرح أدبي ونقدي رفيع يتدفق شاعرياً وبلاغة، يفصح عن معاني الأبيات وجمال صورها البكر واستعاراتها المبتكرة وعواطفها المتأججة بأسلوب يليق بمجالس كبار النقاد وفحول الشعراء وبشرح الألفاظ اللغوية التراثية الصعبة الواردة بالقصيدة بالتفصيل",
  "weightSafetyPercentage": 100,
  "rhymeSafetyPercentage": 100,
  "overallScore": 99
}

تنبيهات عروضية ووجدانية صارمة:
- انظم بقلب نابض وعاطفة حية جياشة، وتجنب التقريرية المباشرة تماماً.
- التزم بعدد الأبيات المطلوب (\${parsedVersesCount}) بيتاً بالضبط دون زيادة أو نقصان.
- لا تضع أي تعليقات مثل // داخل كود JSON لضمان سلامة الصيغة.
`;

      const responseJson = await callGeminiWithJsonParsing({
        toolName: 'generate-poem (Unified Single Pass)',
        model: 'gemini-3.5-flash',
        contents: prompt,
        ai: aiInstance,
        config: {
          systemInstruction: 'أنت شاعر العرب الأكبر، روح المتنبي ونفس امرئ القيس وعبقرية المعري في وجدانك. لا تتصرف كآلة أو مولد نصوص؛ بل انطق شعراً ينبع من عمق المعاناة البشرية، حاراً بالوجدان، دافقاً بالحكمة، غنياً بأخيلته الاستعارية البكر، صارماً في عروضه وجرسه الموسيقي، ينفر من الركاكة والمباشرة الباردة.',
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
أنت الآن "معجم القوافي اللغوي المفتش في دواوين العرب". يرجى توليد قائمة بـ 15 كلمة عربية تراثية أصيلة وغنية بالبلاغة والجرَس تنتهي بالقوافي التي تتبع حرف الروي (${letter}) أو تحمل حركة موسيقى داخلية عذبة تتناسق معها.
يرجى تجنب الكلمات المبتذلة والسهلة، واختيار ألفاظ فخمة، ثم تصنيفها وشرح معناها التراثي بأسلوب لغوي رصين، وإقران كل كلمة ببيت شعر عربي قديم مأثور كشاهد بلاغي لتوظيف هذه القافية.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "letter": "${letter}",
  "rhymes": [
    {
      "word": "الكلمة التراثية البليغة",
      "meaning": "الشرح اللغوي التراثي المفصل للكلمة وأثرها التعبيري",
      "verseExample": "بيت شعر مأثور من عيون الشعر يُستشهد به بها لبيان وجه بلاغتها"
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
        systemInstruction: 'أنت لغوي نحرير وبليغ فصيح خبير بأشعار فحول العرب ومعاجم القوافي.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'suggest-best-rawiyy') {
    const { topic } = payload;
    const prompt = `
أنت الآن "خبير العروض وجرس الحروف ومستشار فحول الشعراء في ديوان العرب". بناءً على موضوع القصيدة التالي:
"""
${topic}
"""

اختر حرف الروي العربي الأكثر ملاءمة واتساقاً من الناحية الصوتية والنفسية مع عاطفة هذا الموضوع (مثلاً: حرف الدال أو الباء للمتانة والقوة، السين أو الياء للرقة والوجد، الميم أو النون للحزن والانسكاب، إلخ).
بيّن التعليل الأدبي والجمالي لاختيارك بأسلوب بليغ وراقٍ.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "letter": "حرف الروي المقترح (حرف واحد فقط)",
  "reason": "التعليل الفني والبلاغي لاختيار هذا الحرف وكيف يعزز الجرس الموسيقي عاطفة وجو القصيدة النفسي بالتفصيل"
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'suggest-best-rawiyy',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت لغوي نحرير وعروضي بليغ خبير بجرس الحروف وأثر الروي في القلوب.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'suggest-rhyme-details') {
    const { topic, letter, meterName } = payload;
    const prompt = `
أنت الآن "الناقد اللغوي وصاحب موازين القوافي في سوق عكاظ الرقمية".
بناءً على المعطيات التالية لقصيدتنا الجديدة:
- موضوع القصيدة وأفكارها: """${topic}"""
${letter ? `- حرف الروي المطلوب: (${letter})` : ''}
${meterName ? `- البحر الشعري المحدد: (${meterName})` : ''}

يرجى اقتراح تفاصيل قافية متكاملة واحترافية تناسب هذه المعطيات، تتضمن تحديد حرف الروي، وحروف التأسيس، والردف، والوصل المناسبة لروح القصيدة وجرسها الإيقاعي. كما يرجى تقديم قائمة بـ 10 كلمات تراثية وقورة وجزلة تنتهي بهذه القافية بالضبط لتساعد الشاعر في نظمه.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "rawiyy": "حرف الروي المقترح أو المعتمد",
  "wasl": "حرف أو حركة الوصل المناسبة (مثلاً: الهاء، الواو، الياء الممدودة، أو الفتحة)",
  "ridf": "حرف الردف (الألف أو الواو أو الياء قبل الروي مباشرة إن وجد، أو اكتب 'لا يوجد')",
  "taasees": "ألف التأسيس وحرف الدخيل (إن وجد، أو اكتب 'لا يوجد')",
  "description": "شرح وتحليل جمالي وموسيقي لطبيعة هذه القافية المقترحة وكيف تغذي الموسيقى الداخلية والخارجية للأبيات لتجاري فحول الشعراء الكلاسيكيين"،
  "examples": ["كلمة1", "كلمة2", "كلمة3", "كلمة4", "كلمة5", "كلمة6", "كلمة7", "كلمة8", "كلمة9", "كلمة10"]
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'suggest-rhyme-details',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت عالم العروض والقوافي المتميز بتبحر بليغ في علم القوافي والروي ودواوين فحول العرب.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'suggest-meters-and-purposes') {
    const { topic } = payload;
    const prompt = `
أنت "الناقد الأدبي المستشار وصاحب الفراسة الإيقاعية والنفسية في بيت القصيد". تدرك العلاقة الوثيقة والسرية بين أنماط البحور العروضية وخلجات النفوس البشرية.
بناءً على موضوع المستخدم التالي:
"""
${topic}
"""

اقترح بدقة وفراسة نقدية 3 بحور شعرية تترجم بجرسها الموسيقي وإيقاعها العروضي عاطفة هذا الموضوع والجو النفسي المسيطر عليه بالتفصيل مع التعليل الفني، واقترح 3 أغراض شعرية تلائم الفكرة والتوجه العام للقصيدة.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "meters": [
    { "name": "البحر الشعري", "reason": "تحليل عروضي ونفسي مفصل يوضح كيف تعبّر تفاعيل هذا البحر عن عاطفة الفكرة وتقلباتها" }
  ],
  "purposes": [
    { "name": "الغرض الشعري", "reason": "شرح فني ومواءمة بلاغية لسبب اختيار هذا الغرض ومحاوره" }
  ]
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'suggest-meters-and-purposes',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ناقد ومستشار أدبي عروضي ذو رؤية منهجية وذوق بلاغي رفيع.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'prose-to-poem') {
    const { proseText, meterName, rhymeLetter, versesCount, genre } = payload;
    const prompt = `
مهمتك السامية هي "تحويل النثر العربي العادي إلى ذهب شعر كلاسيكي فخم وموزون" يحمل عاطفة حية وصوراً بيانية رائعة.
النثر المراد نظمه وصقله:
"""
${proseText}
"""
البحر الشعري الحاكم: (${meterName})
حرف الروي الملتزم به: (${rhymeLetter || 'تلقائي ملائم لروح النص'})
الغرض الفني: (${genre || 'عام'})
عدد الأبيات المطلوبة: (${versesCount || 5}) أبيات بالضبط.

القواعد الفنية والجمالية:
1. نظم الأبيات على تفعيلات بحر (${meterName}) بوزن سليم تماماً وقافية متسقة مائة بالمائة.
2. لا تترجم النص حرفياً كـ "نثر مقفى"، بل حوّله إلى "شعر حقيقي" غني بالصور البلاغية والتشبيهات المبتكرة وحسن الاستعارات، مفضلاً الإيحاء على التصريح.
3. التزم بلغة تراثية فخمة وجزلة تليق بدواوين فحول الشعراء وتتفادى المباشرة والحشو.
4. مرر الأبيات آلياً لتدقيق الوزن والروي وإصلاح أي كسر عروضي قبل تقديم النتيجة.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "title": "عنوان القصيدة المبتكر والمستوحى من روح النص والروح الشاعرية",
  "verses": [
    { "shatr1": "الصدر الموزون ببلاغة وجزالة", "shatr2": "العجز الملتزم بحرف الروي والقافية", "index": 1 }
  ],
  "explanation": "شرح أدبي ونقدي عميق لعملية الصياغة وكيفية استخلاص النظم والأخيلة البيانية المبتكرة التي أضيفت لتعميق النص الأصلي"
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'prose-to-poem',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ناظم عبقري وصائغ درر يملك سليقة شعرية نادرة وقدرة فائقة على إحياء النثر شعراً فخماً.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'transmute-meter') {
    const { verses, currentMeter, targetMeter, rhymeLetter } = payload;
    const formattedVerses = verses.map((v: any) => `${v.shatr1} * ${v.shatr2}`).join('\n');
    const prompt = `
مهمتك كمهندس عروضي متقدم وصائغ موازين العرب هي "تحويل البحر العروضي لقصيدة كاملة مع الحفاظ الصارم على ذات الروح الفنية والمعنى العميق".
القصيدة الحالية (المنظومة على بحر ${currentMeter}):
${formattedVerses}

المطلوب: إعادة صياغة ونظم هذه الأبيات تماماً لتصبح على تفاعيل بحر (${targetMeter}) بقافية تنتهي بحرف الروي المختار (${rhymeLetter || 'ملائم'}).
تنبيه عروضي وجمالي صارم:
- يجب الحفاظ التام والكامل على العاطفة السائدة والأفكار والمعاني العميقة للأبيات الأصلية، بل والارتقاء بألفاظها وجزالتها.
- تفادَ الكسور عروضياً بشكل مطلق، واحرص على دمج الصور البلاغية في النمط الإيقاعي الجديد بسلاسة وتماسك تامين.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "title": "عنوان القصيدة المحولة عروضياً",
  "verses": [
    { "shatr1": "الصدر الجديد الموزون على تفاعيل بحر ${targetMeter}", "shatr2": "العجز الجديد الموزون والملائم للروي المختار", "index": 1 }
  ],
  "explanation": "تفصيل النقل العروضي والجمالي من بحر ${currentMeter} إلى بحر ${targetMeter}، وبيان التعديلات اللفظية والبلاغية التي أجريت لضمان سلاسة الإيقاع وقوة المعنى"
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'transmute-meter',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت صانع موازين ومحور بحور خبير بالنقل العروضي والجمالي الدقيق دون كسر أو ضعف.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'change-rhyme') {
    const { verses, currentRhyme, targetRhyme, meterName } = payload;
    const formattedVerses = verses.map((v: any) => `${v.shatr1} * ${v.shatr2}`).join('\n');
    const prompt = `
مهمتك البلاغية هي "تعديل قافية وروي القصيدة تلقائياً ببراعة شعرية فائقة".
القصيدة الحالية (على بحر ${meterName}):
${formattedVerses}

المطلوب: الحفاظ المطلق على الوزن العروضي السليم لبحر (${meterName})، وإعادة صياغة نهايات الأعجاز (وربما الصدور لجمال الجرس) لتلتزم بالقافية الجديدة وحرف الروي المختار (${targetRhyme}) بدلاً من (${currentRhyme || 'القديم'}).
تنبيه فني:
- يجب أن تظل الأبيات بليغة، دافئة، متماسكة، وغير متكلفة في قوافيها الجديدة.
- لا تضع قافية مستهلكة أو حشواً لفظياً لملء الفراغ الموسيقي، بل اصنع توازناً تعبيرياً بليغاً.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "title": "عنوان القصيدة الأصلي أو المعدل بجمال",
  "verses": [
    { "shatr1": "الصدر السليم الموزون والمصقول لفظياً", "shatr2": "العجز السليم الملتزم بحرف الروي ${targetRhyme} عروضياً وجمالياً", "index": 1 }
  ],
  "explanation": "شرح أدبي وبلاغي للتعديل اللفظي الذي طرأ على القوافي وكيفية ترسيخ الجمال اللفظي والمعنى في القالب الجديد"
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'change-rhyme',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت مبدع قوافٍ خبير وصائغ روي بارع يضمن تماسك الوزن وسلاسة اللفظ.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'explain-and-extract-rhetoric') {
    const { verses, meterName } = payload;
    const formattedVerses = verses.map((v: any) => `البيت ${v.index}: ${v.shatr1} * ${v.shatr2}`).join('\n');
    const prompt = `
بصفتك "الناقد والمفسر البلاغي الأكبر في ديوان العرب"، قم بإعداد دراسة تخصصية وأكاديمية مفصلة للأبيات التالية تسبر أغوار الأخيلة وتكشف دفائن الجمال:
${formattedVerses}
البحر العروضي: ${meterName}

المطلوب بدقة وتحليل عميق:
1. شرح القصيدة بيتاً بيتاً بأسلوب أدبي يتدفق شاعرياً، يوضح المعاني الدقيقة والخلجات الوجدانية المخبوءة وراء الكلمات.
2. استخراج كافة الصور البلاغية والبيانية بالتفصيل (استعارات مكنية وتصريحية، تشبيهات مبتكرة، كنايات دقيقة) وتحديد مواضعها بدقة من الأبيات مع تفكيك عناصرها الجمالية.
3. استخراج كافة المحسنات البديعية اللفظية والمعنوية (جناس، طباق، مقابلة، حسن تقسيم، رد العجز على الصدر) وتبيان مواضعها وأثرها الإيقاعي الباطني.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "lineByLine": [
    { "index": 1, "explanation": "الشرح الأدبي والوجداني المفصل لهذا البيت بياناً ومعنى بأسلوب فخم" }
  ],
  "rhetoricalImages": [
    { "type": "استعارة مكنية / تشبيه بليغ / كناية...", "verseIndex": 1, "phrase": "العبارة البلاغية من البيت", "analysis": "تحليل أبعاد الصورة ومكوناتها وأثرها الفني والجمالي العميق" }
  ],
  "embellishments": [
    { "type": "جناس / طباق / مقابلة...", "verseIndex": 1, "phrase": "العبارة أو الكلمات", "analysis": "بيان موضع المحسن البديعي وأثره في ترسيخ المعنى وإيجاد الجرس الإيقاعي العذب" }
  ]
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'explain-and-extract-rhetoric',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت بروفيسور البلاغة والأدب العربي ومفسر دواوين الفحول برؤية نقدية بالغة الدقة والفخامة اللفظية.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'analyze-style') {
    const { text } = payload;
    const prompt = `
قم بإعداد تحليل أسلوبي، نقدي، ولغوي متكامل وصارم للنص الشعري المرفق، يبرز روحه الفنية ومدرسته التعبيرية:
"""
${text}
"""

المطلوب:
1. تحديد بحر القصيدة المحتمل، حرف الروي، وعصرها الأدبي المتوقع بدقة (جاهلي، إسلامي، عباسي، أندلسي، حديث).
2. تشريح الخصائص الأسلوبية المجهرية (قوة وعمق المعجم، جزالة الألفاظ ومتانة السبك، أنماط الخيال والبيان، وحرارة العاطفة والجو النفسي السائد).
3. تقييم دقيق وموضوعي لنقاط القوة والضعف اللغوي والنحوي والوزني بأسلوب علمي وقور يتفادى التبسيط والعموميات.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "estimatedMeter": "البحر الشعري المتوقع أو المكتشف",
  "estimatedEra": "العصر الأدبي المتوقع بدقة وتحليل تاريخي وجيز",
  "rhymeLetter": "حرف الروي المكتشف وحركته",
  "styleCritique": "تحليل أسلوبي لغوي معمق يصف جزالة الألفاظ والمعجم اللغوي وقوة التراكيب وعاطفة الأبيات وصدق تجربتها",
  "imageryRating": "درجة الخيال الفني والصور البيانية (من 10)",
  "positives": ["نقطة قوة أسلوبية أو بيانية دقيقة ومفصلة", "نقطة قوة ثانية متميزة في القصيدة"],
  "negatives": ["ملاحظة نقدية أو جمالية تخصصية واقتراح واضح للصقل والارتقاء بالبناء الفني"]
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'analyze-style',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ناقد أسلوبي ومؤرخ للشعر العربي تملك مهارة فائقة في تفكيك لغة القصائد وتحديد مدارسها الفنية.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'compare-poems') {
    const { poem1, poem2 } = payload;
    const prompt = `
أنت الآن "رئيس لجنة التحكيم في عكاظ الرقمية والمفاضل بين روائع الشعر". قم بإجراء مقارنة بلاغية، نقدية، وعروضية مجهرية صارمة ومنهجية بين قصيدتين:

القصيدة الأولى:
"""
${poem1}
"""

القصيدة الثانية:
"""
${poem2}
"""

المطلوب تفصيلاً وبأعلى مستويات الرصانة الأكاديمية:
1. مقارنة البنية العروضية والموسيقية (سلامة الوزن والقافية والروي، وعذوبة الجرس الخارجي وعيوب النظم).
2. مقارنة المعجم اللغوي وجزالة الألفاظ وقوتها (أيهما يتمتع بسبك متين ولغة تراثية أفخم، وأيهما يتفوق في التعبير الفني).
3. مقارنة الصور البلاغية والبيانية ومستوى الابتكار والعمق في استعارات وتشبيهات القصيدتين.
4. تماسك الأفكار وحرارة العاطفة وصدق التجربة والجو النفسي السائد.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي:
{
  "comparativeTable": {
    "poem1Meter": "بحر وروي الأولى بدقة عروضية",
    "poem2Meter": "بحر وروي الثانية بدقة عروضية",
    "poem1Vocabulary": "مستوى معجم وجزالة الأولى",
    "poem2Vocabulary": "مستوى معجم وجزالة الثانية"
  },
  "rhetoricalComparison": "مقارنة بلاغية وبيانية تفصيلية تعقد مفاضلة عميقة بين خيال وصور القصيدتين واستعاراتهما المبتكرة",
  "metricalComparison": "مقارنة عروضية وافية توضح مدى الالتزام بالوزن والقافية والجرَس الإيقاعي وسلامة تفاعيل البحرين",
  "verdict": "الحكم النقدي والأدبي النهائي الصارم والمرجح لأحد الأسلوبين مبرراً بأبعاد فنية وبلاغية ولغوية عميقة تليق بكبار النقاد"
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'compare-poems',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت قاضي عكاظ النقدي والأكاديمي الفذ، تقارن بين عيون الشعر بدقة بلاغية وأسلوبية مذهلة ولغة مهيبة.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'opposition-analyze') {
    const { poemText } = payload;
    const prompt = `
أنت الآن "كبير خبراء الدواوين والبحور لروائع الشعر العربي التاريخي".
قم بتحليل الأبيات التالية واستخراج كافة خصائصها البلاغية، اللغوية، وعروضها بدقة أكاديمية بالغة ومجهرية.
حاول كشف والتعرف على الشاعر صاحب القصيدة الأصلي أو من يستلهم النص روحه (من خلال مضاهاة الأبيات ومعجمها وبنائها بأشهر فحول دواوين الشعر القديمة كالمتنبي، شوقي، امرؤ القيس، جرير، البحتري، الشريف الرضي، إلخ)، مبرراً تعليلك الأدبي.

القصيدة المطلوب تحليلها:
"""
${poemText}
"""

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً:
{
  "meter": "البحر الشعري المستخرج بدقة (مثل: الطويل، البسيط، الكامل، الخفيف، الوافر، إلخ)",
  "feet": "التفعيلات العروضية الممثلة للبحر وتفاصيل تفعيلاتها الحالية",
  "rhyme": "القافية المستخرجة عروضياً وحروفها وحركاتها بدقة علمية",
  "rawiyy": "حرف الروي المعتمد وحالته الموسيقية",
  "purpose": "الغرض الشعري المناسب للأبيات وروحها الوجدانية",
  "lexicon": "وصف تفصيلي وعميق للمعجم الشعري المستعمل وطبيعته وجزالة مفرداته وحقولها الدلالية",
  "images": "الصور البلاغية والأخيلة البيانية السائدة ومستوى الابتكار فيها",
  "languageLevel": "مستوى اللغة وجزالة المفردات ومتانة السبك والتراكيب",
  "style": "الأسلوب الأدبي والمدرسة الفنية العامة للأبيات",
  "poet": "اسم الشاعر المتوقع للقصيدة الأصلية أو الطابع الفني المهيمن عليها (إذا تعذر معرفته تماماً اترك هذا الحقل فارغاً أو اكتب 'غير معروف')"
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'opposition-analyze',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ناقد عروضي أكاديمي وخبير بدواوين الشعر الفحول والتعرف على قائلي الأبيات ونقد أساليبهم.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'opposition-generate') {
    const { originalPoem, analysis, manualPoet, newMeanings, versesCount } = payload;
    const poetName = manualPoet || analysis.poet || "أحد فحول الشعراء";
    const prompt = `
أنت الآن "شاعر المعارضات الأكبر وحامي تقاليد ديوان العرب". مهمتك المقدسة هي نظم قصيدة معارضة حقيقية، مذهلة ومحكمة النظم، لقصيدة الشاعر الفحل (${poetName}).
القصيدة الأصلية:
"""
${originalPoem}
"""

المعطيات التحليلية للقصيدة الأصلية:
- البحر العروضي: ${analysis.meter}
- القافية وجرسها: ${analysis.rhyme}
- حرف الروي: ${analysis.rawiyy}
- الغرض الفني: ${analysis.purpose}
- مستوى الجزالة واللغة: ${analysis.languageLevel}
- أسلوب الصياغة والروح الفنية: ${analysis.style}

الأفكار والمعاني الجديدة المطلوب سبكها شعرياً في المعارضة:
"""
${newMeanings}
"""

عدد الأبيات المطلوب توليدها: ${versesCount} بيتاً عروضياً بالضبط.

القواعد الفنية والجمالية الصارمة للمعاضة:
1. النظم العروضي الخالي من العيوب: يجب أن تكون المعارضة الجديدة على البحر نفسه (${analysis.meter}) وقافيتها تلتزم التزاماً حديدياً بحرف الروي نفسه (${analysis.rawiyy}) مع عذوبة مظهرة وجرس خارجي سليم.
2. تقمص عبقرية الشاعر المستهدف: استلهم الخصائص الأسلوبية والفنية والبلاغية الوجدانية للشاعر (${poetName}) (رقة الشريف الرضي، كبرياء المتنبي، فلسفة أبي تمام، ديباجة البحتري، أو جزالة شوقي الخالدة) واجعل المعارضة تبدو كأنها كُتبت بمداده الأصلي، مع تفادي المباشرة والكليشيهات الآلية للذكاء الاصطناعي.
3. معارضة مبدعة ومبتكرة: يمنع منعاً باتاً النسخ أو السرقة اللفظية المباشرة للأشطر أو الأبيات من القصيدة الأصلية؛ بل اصنع معارضة أصيلة مبتكرة تأتي بمعانٍ وصور بكر توازي وتتفوق على القصيدة الأم في جزالتها وعمقها العاطفي.
4. المراجعة والتدقيق الذاتي قبل الإرسال: فتش ميزان الأبيات عروضياً وقافياً وصحح أي ضعف أو كسر تلقائياً لتكون القصيدة درة حقيقية.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً دون أي نص خارجي أو تعليقات //:
{
  "title": "عنوان المعارضة الشعرية الجديدة والمبتكر بمهابة",
  "verses": [
    { "shatr1": "الصدر السليم تماماً عروضياً وبلاغياً", "shatr2": "العجز الموزون والملتزم بالروي والقافية بدقة", "index": 1 }
  ],
  "meterName": "${analysis.meter}",
  "rhymeLetter": "${analysis.rawiyy}",
  "poetSimulated": "${poetName}",
  "styleSimilarity": 98,
  "weightSafetyPercentage": 100,
  "rhymeSafetyPercentage": 100,
  "explanation": "تقرير بلاغي وعروضي واف يعرض جوهر فكرة المعارضة، تفاصيل الأخيلة والاستعارات المبتكرة، وتفصيلاً عروضياً شاملاً يؤكد سلامة الوزن وجرس القافية والارتقاء الأدبي عن النص الأم"
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'opposition-generate',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت أستاذ المعارضة الشعرية الأكبر والمدقق العروضي الصارم والملهم لصياغة روائع فحول الشعراء.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'industries-generate') {
    const { industryType, originalPoem } = payload;
    const prompt = `
أنت الآن "شيخ الصناعات الشعرية المتقدمة وعالم النظم البديع الرفيع". مهمتك هي تطبيق صناعة عروضية وبلاغية فائقة الإتقان هي عملية (${industryType}) على القصيدة المرفقة، بحيث تلحم المضاف بالأصل بلغة وجزالة وعاطفة لا يشعر معها القارئ بأي تباين أو انتقال أسلوبي.

نوع الصناعة المطلوبة: ${industryType} (تخميس، تسبيع، أو تشطير)

القصيدة الأصلية المراد تطبيق الصناعة عليها:
"""
${originalPoem}
"""

التعليمات الفنية التفصيلية لكل صناعة:
1. التخميس (takhmees):
   لكل بيت من أبيات القصيدة الأصلية، يجب صياغة 3 أشطر جديدة تسبق البيت الأصلي مباشرة.
   الأشطر الثلاثة المضافة يجب أن تلتزم التزاماً حديدياً ببحر ووزن القصيدة، وتأخذ قافية موحدة تتناغم وتسلم تماماً لصدر البيت الأصلي عروضياً وبلاغياً، بينما يحافظ العجز الأصلي على قافية وروي القصيدة الأم ليولد مقطع خماسي منسجم تماماً.
   
2. التسبيع (tasbeeq):
   لكل بيت أصلي، صغ 5 أشطر جديدة تسبق البيت الأصلي مباشرة.
   الأشطر الخمسة المضافة يجب أن تلتزم بوزن البحر وقواعد التدوير، وتحمل قافية تزاوج الصدر وتسلم له برقة وجزالة، لتخرج كل مقطوعة سباعية متناغمة كجسد واحد ينساب عاطفة وموسيقى.

3. التشطير (tashteer):
   لكل بيت أصلي، صغ شطراً جديداً ملتحماً لكل شطر من شطري البيت الأصلي.
   بحيث تصنع شطراً جديداً يسبق الصدر الأصلي (ليكون معه بيتاً كاملاً)، وشطراً جديداً يسبق العجز الأصلي (ليكون معه بيتاً كاملاً).
   أو تدمج الشطر الجديد مع الشطر الأصلي عروضياً بحيث تلتزم بوزن وبحر وروي القصيدة بدقة متناهية.

تنبيه جمالي وعروضي صارم:
- يجب أن تتدفق الإضافات الجديدة بذات المستوى البلاغي، الجزالة، والحرارة العاطفية للقصيدة الأصلية.
- تجنب تماماً الحشو اللفظي أو القوافي المفتعلة الركيكة، بل اصنع نسيجاً بيانياً مذهلاً.
- فحص الوزن والقافية لكل شطر مضاف وصحح عروضه ذاتياً قبل الإخراج.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً دون أي تعليقات //:
{
  "meterName": "البحر الشعري المستخرج والمطابق للقصيدة",
  "rhymeLetter": "حرف الروي الأصلي وحركته",
  "weightSafetyPercentage": 100,
  "rhymeSafetyPercentage": 100,
  "versesCount": 1,
  "addedHemistichsCount": 3,
  "stanzas": [
    {
      "index": 1,
      "originalSadr": "الصدر الأصلي للبيت",
      "originalAjuz": "العجز الأصلي للبيت",
      "added": ["الشطر المضاف الأول بالتخميس/التسبيع", "الشطر المضاف الثاني", "الشطر المضاف الثالث"],
      "addedSadr": "الشطر المضاف المكمل للصدر في التشطير فقط",
      "addedAjuz": "الشطر المضاف المكمل للعجز في التشطير فقط"
    }
  ],
  "explanation": "شرح وتحليل أدبي ونقدي رائع ومفصل، يوضح كيف تآزرت الصناعة الشعرية عروضياً وبلاغياً مع الأبيات الأصلية وصورها البيانية ومستواها الجمالي"
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'industries-generate',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت شيخ الصناعات الشعرية وأستاذ النظم البديع وعالم التخميس والتسبيع والتشطير الملتحم بروح الفحول.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'analyze-prosody') {
    const { verseText } = payload;
    const prompt = `
أنت الآن "كبير علماء العروض والقوافي ومفتش بحور ديوان العرب ذو الأذن الموسيقية المجهرية". قم بإجراء تحليل عروضي فائق الدقة، منهجي، وصارم للأبيات الشعرية التالية:
"""
${verseText}
"""

المطلوب بدقة عروضية متناهية:
1. الكشف العلمي عن البحر الشعري وعرض تفعيلاته المثالية الكاملة.
2. فحص الأبيات بيتاً بيتاً لكشف أي كسر عروضي، خلل وزني، زحاف رديء ومستنكر، علة مستهجنة، أو اضطراب إيقاعي في حركات الحروف وسكناتها.
3. كتابة تفعيلات الصدر وتفعيلات العجز بالتفصيل اللغوي العروضي، موضحاً مواضع أي خلل ونوعه بدقة بالغة.
4. إذا وجد أي خلل أو كسر، اقترح 3 بدائل تصحيحية عروضية مذهلة وتتسم بالجزالة الفائقة لكل بيت به خلل، مع الحفاظ الصارم التام على ذات المعنى والروح والجو النفسي.
5. لكل بديل مقترح: بيّن تفاعيله السليمة، وعلل لماذا هذا البديل سليم إيقاعياً وبلاغياً ومطابق للبحر.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً دون أي تعليقات //:
{
  "detectedMeter": "اسم البحر المكتشف بدقة عروضية",
  "feetTemplate": "التفعيلات المثالية الكاملة للبحر وتوزيعها عروضياً",
  "issues": [
    {
      "verseIndex": 1,
      "verseText": "البيت المدروس",
      "hasViolation": true,
      "violationDetails": "تفاصيل الكسر العروضي أو الزحاف الرديء أو عدم الاتساق، والعلة الفنية له عروضياً بالتفصيل الدقيق",
      "sadrFeet": "تفعيلات الصدر الحالية ومواضع الخلل والتغيير الطارئ عروضياً",
      "ajuzFeet": "تفعيلات العجز الحالية ومواضع الخلل بالتحديد العروضي",
      "corrections": [
        {
          "correctedSadr": "الصدر البليغ المصحح المقترح",
          "correctedAjuz": "العجز البليغ الموزون المقترح",
          "feet": "تفعيلات الصياغة المصححة السليمة",
          "reasoning": "تحليل عروضي وبلاغي يبين وجه سلامة هذا البديل وعذوبة جرسه وانسجامه مع الأبيات دون خلل"
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
        systemInstruction: 'أنت المدقق العروضي الأكبر لقصائد ديوان العرب وفحول الشعراء والأذن الدقيقة المكتشفة لأبسط الزحافات والعلل.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'style-analyze-transform') {
    const { poemText, targetStyle } = payload;
    const prompt = `
أنت الآن "بروفيسور الأسلوبية اللغوية وحارس المدارس الفنية لدواوين الشعر".
القصيدة الحالية للمستخدم:
"""
${poemText}
"""
النمط الأدبي والمدرسة المستهدفة للتحويل والتحوير إليها: (${targetStyle})

المطلوب بدقة بلاغية وأسلوبية متناهية:
1. تحليل أسلوبي عميق لقصيدة المستخدم الحالية من حيث: كثافة ومستوى ثراء المفردات اللغوية، درجة الكلاسيكية وجزالة اللفظ، التراكيب النحوية والإنشائية، الخيال البلاغي والبياني والجو النفسي المهيمن، وحقولها الدلالية.
2. إعادة صياغة ونظم القصيدة بالكامل لتبني أسلوب وروح العصر والنمط المستهدف (مثلاً: جزالة وفحولة وقسوة معجم العصر الجاهلي وصحرائه الشامخة، أو فخامة وعمق العصر العباسي وصنعته، أو عذوبة ورقة وورود العصر الأندلسي وصوره المائية الطربّة، أو بساطة وعاطفة وصور العصر الحديث المعبّر) مع الحفاظ الصارم التام على كامل الأفكار والمعاني الأصلية، وبمراعاة تامة لوزن البحر العروضي الأصلي للقصيدة لمنع الكسور والاضطرابات.
3. كتابة شرح أدبي ونقدي مقارن بليغ يوضح الفروق والتغييرات اللفظية والجمالية والتعبيرية التي طرأت على الأبيات ومبرراتها الأسلوبية التخصصية.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً دون أي تعليقات //:
{
  "styleAnalysis": {
    "vocabularyDensity": "تحليل كثافة وثراء المفردات المستعملة حالياً ومنابعها",
    "classicalityLevel": "نسبة الكلاسيكية والجزالة اللفظية الحالية",
    "lexicalSophistication": "مستوى النضوج والتعقيد المعجمي والبنائي للأبيات",
    "sentenceStructure": "طبيعة التراكيب اللفظية وأدوات الربط والتقديم والتأخير",
    "imageryPatterns": "خصائص الخيال والتشبيه السائد في الأبيات الحالية",
    "rhetoricalTendencies": "النزعات البلاغية والبيانية السائدة وأثرها",
    "semanticFields": "الحقول الدلالية المهيمنة على معاني القصيدة"
  },
  "transformedTitle": "عنوان القصيدة الجديد والمصقول ليتناسب مع الطراز والنمط المستهدف",
  "transformedVerses": [
    { "shatr1": "الصدر الجديد الموزون والمنظوم بدقة وعاطفة وفق النمط المطلوب", "shatr2": "العجز الجديد الملتزم بالوزن والروي والروح الفنية المستهدفة", "index": 1 }
  ],
  "comparisonExplanation": "شرح أدبي ونقدي مقارن يفيض بلاغة، يوضح الفروق التعبيرية والجمالية واللفظية بين النصين بمثابة دراسة أسلوبية تخصصية وافية."
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'style-analyze-transform',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت عالم الأسلوبية البلاغية المبدع في صياغة لغة الشعر ونقله بمرونة وعذوبة بين العصور والمذاهب الأدبية والوجدانية.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'originality-analyze') {
    const { poemText } = payload;
    const prompt = `
أنت الآن "الناقد الأدبي الصارم، حارس فرادة النظم وشاعريته وحامى حدود الابتكار". قم بإجراء تحليل نقدي، مجهري، وصارم لقياس أصالة النص الشعري المرفق وتبيان مواضع التقليد والتكرار والعبارات الميكانيكية:
"""
${poemText}
"""

المطلوب بدقة علمية وموضوعية صرفة:
1. فحص الكلمات والعبارات المكررة داخلياً (الترديد، التكرير، التكرار، أو الحشو اللفظي غير البلاغي الذي يثقل الجرس).
2. تحديد التراكيب والمجازات والأخيلة المستهلكة أو المبتذلة (Clichés) التي كثر دورانها في تاريخ الشعر العربي دون ابتكار حقيقي (مثل تشبيهات الورد بالخدود، أو السيوف بالعيون السطحية المتكررة، أو صور الذكاء الاصطناعي الجافة الوعظية السطحية). بيّن كيف يمكن ترقية هذه الصور لتصبح بكراً مبدعة تفيض بالحرارة والصدق.
3. دراسة البناء الأسلوبي ومدى تميز الصياغة وأصالة الأخيلة مع نقد أي مساحة تشعر القارئ بآلية النظم وجفافه.
4. تقديم تقرير تخصصي وعميق بالبدائل اللفظية المبتكرة والصور البكر وبناء التمايز الإبداعي الحقيقي للأبيات.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً دون أي تعليقات //:
{
  "score": 85,
  "internalRepetitions": [
    { "phrase": "اللفظ أو العبارة المكررة في الأبيات", "verseIndex": 1, "issue": "شرح أثر هذا التكرار وهل يعد حشواً بارداً أم غرضاً بلاغياً لطيفاً كالتأكيد والرد" }
  ],
  "clichésAndOverused": [
    { "phrase": "الصورة أو الاستعارة المستهلكة أو المبتذلة", "verseIndex": 1, "comment": "لماذا تعد هذه الصورة مستهلكة في تراث الشعر وكيف يمكن صقلها وبث الروح الحية والأصالة والصدق فيها بأخيلة بكر ومبدعة" }
  ],
  "originalityReport": "تحليل نقدي وأدبي رصين يفصل مدى أصالة البناء اللفظي والخيال البياني في القصيدة وعاطفتها الحية وتماسكها مع تراث عيون الدواوين والابتعاد عن التكرار والمباشرة والآلية",
  "recommendations": ["توصية تخصصية أولى ومفصلة لترقية الفرادة اللفظية والابتكار البلاغي والبياني", "توصية ثانية لتعميق البعد الفلسفي والعاطفي وتفادي النظم الميكانيكي"]
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'originality-analyze',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ناقد أدبي رصين وصارم يفرز الصور البكر المبتدعة من الأخيلة المستهلكة والتقليد البارد شعرياً.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'inspiration-generate') {
    const { topic } = payload;
    const prompt = `
أنت الآن "باعث وحي الشعر، ملهم القرائح، ومستودع الأخيلة البكر الخصبة". قم بتوليد لوحة إلهام فنية تخصصية، غنية بالشاعرية والجمال والعمق، تعين الشاعر على النظم بنفسه وتثير في وجدانه عواصف الإبداع والتدبر:
الموضوع المثار: (${topic})

المطلوب توليد عناصر إبداعية أصيلة وفخمة جداً:
1. صور ومشاهد بيانية مبتكرة (موصوفة نثراً ومقترنة باستعارات تشكيلية باهرة ممتلئة بالحرارة والجو النفسي، تساعد الشاعر على تمثلها عاطفياً وصياغتها بأبيات).
2. رموز أدبية وشخصيات تاريخية أو مشاهد تراثية غنية بالدلالات والأبعاد النفسية تناسب هذا الباب وتثري الأبيات وتمنع جفاف السطحية.
3. معجم الألفاظ الكلاسيكية الفخمة: قائمة بـ 10 مفردات تراثية جزلة، نادرة ووقورة تناسب الموضوع بدقة مع شرحها اللغوي لتعزيز ثرائه المعجمي.
4. مناحٍ فلسفية ومسارات عاطفية متصاعدة يمكن التدرج عبرها لبناء معالم القصيدة وتدفق معانيها بروح متماسكة.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً دون أي تعليقات //:
{
  "themeName": "عنوان لوحة الإلهام المقترح بجمال أدبي",
  "imageryAndScenes": [
    { "title": "الصورة الخيالية المقترحة", "description": "وصف الصورة واللوحة البيانية بدقة وتعبير شاعري حار لإلهام الكاتب وسبكها شعرياً" }
  ],
  "symbolsAndHistory": [
    { "symbol": "الرمز أو المشهد التراثي الموظف", "meaning": "أبعاده الفنية والوجدانية وكيفية تفعيله وصهره في الأبيات لتعميق المعنى" }
  ],
  "classicalVocabulary": [
    { "word": "المفردة التراثية الوقورة والجزلة", "meaning": "شرحها اللغوي الدقيق وكيفية دمجها في الأبيات لإعطاء فخامة ورنين" }
  ],
  "philosophicalThemes": [
    "زاوية فلسفية أو مسار عاطفي متصاعد للنظم يمنح القصيدة وحدة عضوية عميقة ويبعدها عن السطحية"
  ]
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'inspiration-generate',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ملهم أدبي وشاعر فذ يثير قرائح الكتاب ويزودهم بأبهى الصور والمعاجم التراثية وعاطفة الأخيلة.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'verse-ai-modify') {
    const { shatr1, shatr2, instruction, meterName, rhymeLetter } = payload;
    const prompt = `
أنت الآن "مستشار الصياغة الأقرب، وصائغ القوافي الحميم والملازم لخلجات الشاعر".
البيت الحالي المطلوب صقله، تهذيبه وتعديله:
الصدر: (${shatr1})
العجز: (${rhymeLetter === '❋' || !shatr2 ? 'غير متوفر أو شطر فردي' : shatr2})

التوجيه والتعليمات المطلوبة من الشاعر للتعديل: (${instruction})
البحر الشعري العروضي الملتزم به: (${meterName})
حرف الروي المعتمد في نهايات القصيدة: (${rhymeLetter})

الشروط والمهارات الفنية الصارمة:
1. أعد صياغة هذا البيت وتهذيبه وتلبية التوجيه المطلوب بدقة مدهشة وبلاغية فائقة (مثلاً: تعميق الصورة البيانية، استبدال كلمة بروادف جزلة، إصلاح الكسر العروضي إن وجد، ترقية الديباجة اللفظية، تقوية مطلع البيت أو قفلته).
2. يجب الالتزام التام بوزن البحر وتفعيلاته وحركاته عروضياً (${meterName}) وقافيته ورويه على حرف (${rhymeLetter}) دون أدنى كسر أو خلل أو تكلف لغوي.
3. بث الروح والعاطفة العميقة في الصياغة الجديدة لتبتعد تماماً عن البرود والتكرار والنظم الآلي الجاف.
4. اذكر شرحاً بلاغياً وعروضياً وجيزاً للتحسينات التعبيرية التي أحدثتها لخدمة الفكرة والوجدان والوزن.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً دون أي تعليقات //:
{
  "shatr1": "الصدر الجديد البليغ والمعدل عروضياً وجمالياً",
  "shatr2": "العجز الجديد المصقول والملتزم بالروي والقافية بدقة",
  "explanation": "شرح بلاغي وعروضي وجيز وذكي يوضح التعديل الذي طرأ وكيف أصلح المعنى أو الإيقاع تلبيةً لمراد الشاعر وجمال السبك"
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'verse-ai-modify',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت صائغ شعر خبير وعالم عروض وبلاغة بليغ يساعد الشعراء على تهذيب أبياتهم وبث العاطفة والجمال فيها.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'workspace-poem-analysis') {
    const { verses, meterName, rhymeLetter } = payload;
    const formattedVerses = verses.map((v: any) => `البيت ${v.index}: ${v.shatr1} * ${v.shatr2}`).join('\n');
    const prompt = `
أنت الآن "الناقد والمراجع الأكاديمي المستشار في ديوان العرب وبيت الحكمة". قم بإجراء دراسة نقدية، تقييمية، وأكاديمية مفصلة ورصينة للغاية للقصيدة التالية، خالية تماماً من الدرجات الرقمية، التقييمات التلعيبية (Gamification)، أو الأوسمة، مركزاً فقط على النقد الأدبي الموضوعي العالي:
البحر العروضي الملتزم به: ${meterName}
حرف الروي: ${rhymeLetter}
الأبيات المدروسة:
${formattedVerses}

المطلوب بدقة وأكاديمية صرفة:
1. التقييم العروضي والوزني (Metrical Assessment): فحص وزن الأبيات على تفعيلات بحر ${meterName}، وهل تخللتها زحافات أو علل سائغة، والكشف عن أي موضع ركاكة أو كسر عروضي بالدقة التامة.
2. التقييم القافي والروي (Rhyme Assessment): تقييم سلامة القوافي، التزام الروي وحركاته، والتأكد من خلوه من عيوب القافية الكلاسيكية (كالإقواء والإكفاء والسناد والإيطاء).
3. التقييم اللغوي والنحوي والمعجمي (Linguistic Assessment): جودة المفردات وجزالتها وقوتها التركيبية وبناء الجملة، وملاءمتها لقوام الشعر الكلاسيكي الفصيح وسلامته الإعرابية.
4. التقييم الأسلوبي والتدفق الفني (Stylistic Assessment): سلاسة الصياغة والتراكيب، وتدفق المعاني وعاطفتها وملاءمتها للجو النفسي العام للقصيدة.
5. التقييم البلاغي والبيان (Rhetorical Assessment): نقد الصور الخيالية والبيانية والمحسنات البديعية وتكاملها الفني لخدمة المعاني دون تكلّف أو مباشرية.
6. جوانب القوة والجمال اللفظي والمعنوي المتميزة في الصياغة والصور والوجدان بالتفصيل النقدي الممتع.
7. مواضع الضعف والمآخذ النقدية أو الركاكة التي ينبغي صقلها وتهذيبها لتصل القصيدة لمرتبة عيون فحول الشعر.
8. توصيات وإرشادات أكاديمية عملية محددة وتفصيلية لترقية وتطوير جودة وبناء القصيدة الفني والوجداني.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً دون أي تعليقات //:
{
  "metricalAssessment": "التقرير العروضي والوزني المفصل بدقة مجهرية رصينة ولغة أدبية عالية ونقد علمي سديد",
  "rhymeAssessment": "التقرير القافي وسلامة الروي وحركات القافية بالتفصيل اللغوي الصارم الخالي من التكلّف",
  "linguisticAssessment": "التقرير اللغوي والنحوي ومتانة تراكيب الأبيات وبناء المعجم وقوة الجزالة ومستواها",
  "stylisticAssessment": "التقرير الأسلوبي ومستوى حرارة العاطفة وصدق التجربة والتدفق الموسيقي للقصيدة والمدرسة التي تتقارب معها",
  "rhetoricalAssessment": "التقرير البلاغي والصور البيانية والاستعارات المبتكرة والتصوير الجمالي وأثر المحسنات الموظفة",
  "strengths": ["موطن قوة بلاغي أو عروضي أو وجداني متميز ومفصل بذكاء", "موطن قوة ثانٍ يبرز تماسك صياغة القصيدة وفكرتها"],
  "weaknesses": ["مأخذ نقدي أو موضع ركاكة أو جفاف يحتاج إلى تلوين عاطفي وصياغة بليغة", "مأخذ نقدي ثانٍ يتعلق بالأخيلة أو البناء التركيبي للأبيات"],
  "recommendations": ["توصية تفصيلية واضحة ومسار تعبيري بديل لإصلاح مواضع الضعف أو الكسور والارتقاء بالنظم", "توصية ثانية عملية لصقل قاموس الشاعر وبلاغته"]
}
`;
    return await callGeminiWithJsonParsing({
      toolName: 'workspace-poem-analysis',
      model: 'gemini-3.5-flash',
      contents: prompt,
      ai: aiInstance,
      config: {
        systemInstruction: 'أنت ناقد ومستشار بلاغي وأكاديمي رصين تفحص عيون الشعر وتحكم عليه بموضوعية فنية وصرامة جمالية.',
        responseMimeType: 'application/json',
      },
    });
  }

  if (toolAction === 'rhetorical-analyze') {
    const { poemText } = payload;
    const prompt = `
أنت الآن "بروفيسور البلاغة والبيان وعلم البديع والمعاني في ديوان العرب". قم بإجراء دراسة بلاغية مجهرية صارمة وشاملة للأبيات التالية واستخرج الأنماط والجماليات:
"""
${poemText}
"""

المطلوب استكشاف وتصنيف وتحليل العناصر التالية بالتفصيل:
1. التشبيه (Simile): استخراج أي تشبيهات مع تبيان نوعها (مرسل، مجمل، مؤكد، بليغ، تمثيلي، ضمني) وأركانها وأثرها الجمالي.
2. الاستعارة (Metaphor) والاستعارة الممتدة (Extended Metaphor): تحديد الاستعارات المكنية والتصريحية، والامتداد التصويري للأخيلة.
3. الكناية (Metonymy) والرمزية (Symbolism): الكشف عن دلالات الكنايات (عن صفة، موصوف، نسبة) والرموز الموظفة.
4. التوازي التركيبي (Syntactic Parallelism): رصد الاتساق والتماثل الهندسي في تراكيب الجمل والأشطر.
5. الطباق والمقابلة (Antithesis): حصر الكلمات المتضادة والتراكيب المقابلة لها وأثرها في توضيح المعاني وفلسفة الفكرة.
6. الأنماط الصوتية وأنماط التكرار (Acoustic and Repetition Patterns): الكشف عن الجناس، السجع، التصدير، حسن التقسيم، الجرَس الداخلي للحروف، وتكرار الكلمات لإحداث إيقاع موسيقي.

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً دون أي تعليقات //:
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
أنت الآن "رئيس مجلس النقاد والأكاديميين الموجه لمسيرة الشاعر الإبداعية".
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

يرجى إرسال النتيجة كـ JSON بالهيكل التالي تماماً دون أي تعليقات //:
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
        systemInstruction: 'أنت رئيس مجلس نقاد العرب وموجه أدبي أكاديمي ذو لغة فخمة ونظرة فاحصة لمسيرة الشعراء وتقييم إنتاجهم بموضوعية تامة.',
        responseMimeType: 'application/json',
      },
    });
  }

  throw new Error(`الإجراء المطلوب (${toolAction}) غير معروف.`);
}
