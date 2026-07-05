/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GeneratedPoem } from '../types';
import { 
  Scissors, 
  Sparkles, 
  FileDown, 
  Copy, 
  Printer, 
  RefreshCw, 
  Check, 
  Layers, 
  AlertCircle,
  Award,
  BookOpen,
  Quote,
  Layers2
} from 'lucide-react';
import TurnstileWidget from './TurnstileWidget';

interface PoeticIndustriesProps {
  isDarkMode: boolean;
  turnstileSiteKey: string;
  onSavePoemToHistory: (poem: GeneratedPoem) => void;
  onUpdateRemainingUses?: (uses: number) => void;
  remainingDailyUses?: number | null;
}

type IndustryType = 'takhmees' | 'tasbeeq' | 'tashteer';

export default function PoeticIndustries({ isDarkMode, turnstileSiteKey, onSavePoemToHistory, onUpdateRemainingUses, remainingDailyUses }: PoeticIndustriesProps) {
  const [industryType, setIndustryType] = useState<IndustryType>('takhmees');
  const [originalPoemText, setOriginalPoemText] = useState('');

  // Turnstile state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState<number>(0);

  // Processing states
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedToArchive, setSavedToArchive] = useState(false);

  // Result state
  const [result, setResult] = useState<{
    meterName: string;
    rhymeLetter: string;
    weightSafetyPercentage: number;
    rhymeSafetyPercentage: number;
    versesCount: number;
    addedHemistichsCount: number;
    stanzas: Array<{
      index: number;
      originalSadr: string;
      originalAjuz: string;
      added?: string[]; // For Takhmees/Tasbeeq
      addedSadr?: string; // For Tashteer
      addedAjuz?: string; // For Tashteer
    }>;
    explanation: string;
  } | null>(null);

  const handleApplyIndustry = async () => {
    if (turnstileSiteKey && !turnstileToken) {
      setError('يرجى إكمال التحقق الأمني (Turnstile) أولاً.');
      return;
    }
    if (!originalPoemText.trim()) {
      setError('يرجى لصق أو كتابة أبيات القصيدة الأصلية لتطبيق الصناعة عليها.');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);
    setSavedToArchive(false);

    try {
      const res = await fetch('/api/literary-tool', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toolAction: 'industries-generate',
          payload: {
            industryType,
            originalPoem: originalPoemText
          },
          turnstileToken
        })
      });

      const data = await res.json();
      if (data && typeof data.remainingDailyUses === 'number') {
        onUpdateRemainingUses?.(data.remainingDailyUses);
      }
      if (!res.ok || data.error) throw new Error(data.error || 'فشل تطبيق الصناعة التراثية المحددة.');

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'فشل تطبيق الصناعة التراثية المحددة. يرجى مراجعة صياغة الأبيات والمحاولة ثانية.');
    } finally {
      setGenerating(false);
      // Reset Turnstile token and increment reset key
      setTurnstileToken(null);
      setTurnstileResetKey(prev => prev + 1);
    }
  };

  const getIndustryNameArabic = (type: IndustryType) => {
    if (type === 'takhmees') return 'تخميس';
    if (type === 'tasbeeq') return 'تسبيع';
    return 'تشطير';
  };

  // Archive and Diwan Helper
  const handleSaveToArchive = () => {
    if (!result) return;

    // To prevent breaking the core archive viewer, we flatten the stanzas into standard dual-hemistich rows:
    // This allows the default PoemDisplay component to render it with full compatibility.
    const versesFlattened: any[] = [];
    let verseIndex = 1;

    result.stanzas.forEach((stanza, sIdx) => {
      if (industryType === 'tashteer') {
        versesFlattened.push({
          shatr1: `[مضاف] ${stanza.addedSadr || ''}`,
          shatr2: `[أصل] ${stanza.originalSadr}`,
          index: verseIndex++
        });
        versesFlattened.push({
          shatr1: `[مضاف] ${stanza.addedAjuz || ''}`,
          shatr2: `[أصل] ${stanza.originalAjuz}`,
          index: verseIndex++
        });
      } else {
        // Takhmees (3 added, 2 original) or Tasbeeq (5 added, 2 original)
        const allAdded = stanza.added || [];
        // Pair the added ones two by two
        for (let i = 0; i < allAdded.length; i += 2) {
          if (i + 1 < allAdded.length) {
            versesFlattened.push({
              shatr1: `[مضاف] ${allAdded[i]}`,
              shatr2: `[مضاف] ${allAdded[i+1]}`,
              index: verseIndex++
            });
          } else {
            // odd one out, pair with empty or mark
            versesFlattened.push({
              shatr1: `[مضاف] ${allAdded[i]}`,
              shatr2: '❋',
              index: verseIndex++
            });
          }
        }
        // Then original صدر وعجز
        versesFlattened.push({
          shatr1: `[أصل] ${stanza.originalSadr}`,
          shatr2: `[أصل] ${stanza.originalAjuz}`,
          index: verseIndex++
        });
      }
    });

    const formattedPoem: GeneratedPoem = {
      id: Math.random().toString(36).substring(2, 11),
      title: `${getIndustryNameArabic(industryType)} لقصيدة من بحر ${result.meterName}`,
      verses: versesFlattened,
      meterName: result.meterName,
      feet: `صناعة شعرية تراثية (${getIndustryNameArabic(industryType)})`,
      rhymeLetter: result.rhymeLetter,
      purpose: `${getIndustryNameArabic(industryType)} تراثي`,
      isOpposition: false,
      explanation: result.explanation,
      weightSafetyPercentage: result.weightSafetyPercentage,
      rhymeSafetyPercentage: result.rhymeSafetyPercentage,
      createdAt: new Date().toISOString()
    };

    onSavePoemToHistory(formattedPoem);
    setSavedToArchive(true);
  };

  // Text formatting for copy/download
  const getPlainPoemText = () => {
    if (!result) return '';
    let text = `=== صناعة تراثية: ${getIndustryNameArabic(industryType)} ===\n`;
    text += `بحر: ${result.meterName} | روي: ${result.rhymeLetter}\n`;
    text += `سلامة الوزن العروضي: ${result.weightSafetyPercentage}%\n`;
    text += `عدد المقطوعات المعالجة: ${result.versesCount}\n`;
    text += `------------------------------------------\n`;

    result.stanzas.forEach((stanza, sIdx) => {
      text += `[المقطوعة رقم ${sIdx + 1}]\n`;
      if (industryType === 'tashteer') {
        text += `(شطر مضاف): ${stanza.addedSadr}\n`;
        text += `(صدر أصيل): ${stanza.originalSadr}\n`;
        text += `(شطر مضاف): ${stanza.addedAjuz}\n`;
        text += `(عجز أصيل): ${stanza.originalAjuz}\n`;
      } else {
        const added = stanza.added || [];
        added.forEach((line, aIdx) => {
          text += `(شطر مضاف ${aIdx + 1}): ${line}\n`;
        });
        text += `(صدر أصيل): ${stanza.originalSadr}\n`;
        text += `(عجز أصيل): ${stanza.originalAjuz}\n`;
      }
      text += `\n`;
    });

    text += `------------------------------------------\n`;
    if (result.explanation) {
      text += `\n[التحليل والتقرير الأدبي واللغوي]:\n${result.explanation}\n`;
    }
    return text;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getPlainPoemText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadTxt = () => {
    const text = getPlainPoemText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `صناعة_${getIndustryNameArabic(industryType)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadDoc = () => {
    if (!result) return;
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${getIndustryNameArabic(industryType)}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Amiri', 'Georgia', serif; direction: rtl; text-align: center; background-color: #fcfaf7; padding: 20px; }
          h1 { color: #1a472a; font-size: 28px; margin-bottom: 5px; }
          .subtitle { color: #8b1d2e; font-size: 16px; margin-bottom: 30px; font-style: italic; }
          .stanza { border: 1px solid #b58d3d; padding: 15px; margin: 20px auto; max-width: 600px; border-radius: 8px; background-color: #fff; }
          .added { color: #8b1d2e; font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .original { color: #1a472a; font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .explanation { margin-top: 40px; border-top: 2px solid #b58d3d; padding-top: 20px; text-align: right; max-width: 600px; margin-left: auto; margin-right: auto; }
          .explanation-title { color: #1a472a; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .explanation-body { font-size: 14px; color: #333; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>صناعة الـ ${getIndustryNameArabic(industryType)}</h1>
        <div class="subtitle">بحر ${result.meterName} - روي ${result.rhymeLetter}</div>
        
        ${result.stanzas.map((stanza, sIdx) => `
          <div class="stanza">
            <h3>المقطوعة ${sIdx + 1}</h3>
            ${industryType === 'tashteer' ? `
              <div class="added">[مضاف] ${stanza.addedSadr}</div>
              <div class="original">[أصل] ${stanza.originalSadr}</div>
              <div class="added">[مضاف] ${stanza.addedAjuz}</div>
              <div class="original">[أصل] ${stanza.originalAjuz}</div>
            ` : `
              ${(stanza.added || []).map(line => `<div class="added">[مضاف] ${line}</div>`).join('')}
              <div class="original">[أصل] ${stanza.originalSadr}</div>
              <div class="original">[أصل] ${stanza.originalAjuz}</div>
            `}
          </div>
        `).join('')}

        ${result.explanation ? `
          <div class="explanation">
            <div class="explanation-title">الشرح والتحليل الأدبي واللغوي</div>
            <div class="explanation-body">${result.explanation.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `صناعة_${getIndustryNameArabic(industryType)}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!result) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
      <head>
        <title>صناعة الـ ${getIndustryNameArabic(industryType)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
          body {
            font-family: 'Amiri', serif;
            direction: rtl;
            padding: 40px;
            background-color: #ffffff;
            color: #1a1a1a;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #b58d3d;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 {
            color: #1a472a;
            font-size: 32px;
            margin: 0 0 10px 0;
          }
          .meta {
            font-size: 16px;
            color: #8b1d2e;
            font-style: italic;
          }
          .stanza {
            border: 1px dashed #b58d3d;
            padding: 20px;
            margin-bottom: 25px;
            border-radius: 8px;
            background-color: #faf8f5;
          }
          .line {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .added { color: #8b1d2e; }
          .original { color: #1a472a; }
          .explanation-box {
            margin-top: 40px;
            border-top: 1px dashed #b58d3d;
            padding-top: 20px;
          }
          .explanation-title {
            color: #1a472a;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .explanation-content {
            font-size: 15px;
            line-height: 1.7;
            text-align: justify;
            color: #333;
            white-space: pre-wrap;
          }
          @media print {
            body { padding: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>صناعة الـ ${getIndustryNameArabic(industryType)}</h1>
          <div class="meta">بحر ${result.meterName} | روي ${result.rhymeLetter} | سلامة النظم والوزن ${result.weightSafetyPercentage}%</div>
        </div>
        
        <div>
          ${result.stanzas.map((stanza, sIdx) => `
            <div class="stanza">
              <h3>المقطوعة ${sIdx + 1}</h3>
              ${industryType === 'tashteer' ? `
                <div class="line added">[مضاف] ${stanza.addedSadr}</div>
                <div class="line original">[أصل] ${stanza.originalSadr}</div>
                <div class="line added">[مضاف] ${stanza.addedAjuz}</div>
                <div class="line original">[أصل] ${stanza.originalAjuz}</div>
              ` : `
                ${(stanza.added || []).map(line => `<div class="line added">[مضاف] ${line}</div>`).join('')}
                <div class="line original">[أصل] ${stanza.originalSadr}</div>
                <div class="line original">[أصل] ${stanza.originalAjuz}</div>
              `}
            </div>
          `).join('')}
        </div>

        ${result.explanation ? `
          <div class="explanation-box">
            <div class="explanation-title">التقرير النقدي والتحليل البلاغي والأدبي</div>
            <div class="explanation-content">${result.explanation}</div>
          </div>
        ` : ''}
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleReset = () => {
    setOriginalPoemText('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden ${
        isDarkMode ? 'bg-[#0f1d14] border-[#dfba6b]/20 text-white' : 'bg-[#fdfbf7] border-[#b58d3d]/30 text-gray-800'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#dfba6b]/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-[#b58d3d]/40 flex items-center justify-center text-amber-600 shrink-0">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold font-serif ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>الصناعات الشعرية التراثية</h2>
              <p className="text-xs text-gray-500 mt-1">تطبيق أنماط الصناعات الكلاسيكية القديمة (التخميس، التسبيع، والتشطير) على قصائدك أو دواوين الفحول بنظم متصل وموزون.</p>
            </div>
          </div>
          {result && (
            <button 
              onClick={handleReset}
              className="px-4 py-2 text-xs font-bold bg-[#8b1d2e] hover:bg-red-800 text-white rounded-xl transition-colors shrink-0"
            >
              ابدأ صناعة جديدة
            </button>
          )}
        </div>
      </div>

      {/* Sub tabs selectors */}
      {!result && !generating && (
        <div className="flex gap-2 max-w-md mx-auto bg-gray-100 dark:bg-[#0a120d] p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/5">
          <button
            onClick={() => setIndustryType('takhmees')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
              industryType === 'takhmees'
                ? 'bg-white dark:bg-[#1a472a] text-[#8b1d2e] dark:text-[#dfba6b] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            التخميس
          </button>
          <button
            onClick={() => setIndustryType('tasbeeq')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
              industryType === 'tasbeeq'
                ? 'bg-white dark:bg-[#1a472a] text-[#8b1d2e] dark:text-[#dfba6b] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            التسبيع
          </button>
          <button
            onClick={() => setIndustryType('tashteer')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
              industryType === 'tashteer'
                ? 'bg-white dark:bg-[#1a472a] text-[#8b1d2e] dark:text-[#dfba6b] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            التشطير
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form panel Column */}
        <div className="lg:col-span-5 space-y-6">
          {!result && (
            <div className={`p-5 rounded-3xl border shadow-sm ${
              isDarkMode ? 'bg-[#102216] border-white/5' : 'bg-white border-manuscript-border'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 bg-[#8b1d2e]/10 text-[#8b1d2e] text-xs font-bold rounded-full flex items-center justify-center">١</span>
                <h3 className="font-serif font-black text-sm text-[#1a472a] dark:text-[#dfba6b]">القصيدة الأم للتطبيق</h3>
              </div>

              {/* Descriptive instructions */}
              <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl text-[11px] leading-relaxed text-gray-500 mb-4">
                {industryType === 'takhmees' && (
                  <p><b>حول التخميس:</b> سيتم نظم ثلاثة أشطر عروضية جديدة ملتحمة تسبق كل بيت أصلي، لتخرج القصيدة بهيئة مقطوعات مخمسة بالكامل.</p>
                )}
                {industryType === 'tasbeeq' && (
                  <p><b>حول التسبيع:</b> سيتم نظم خمسة أشطر عروضية جديدة تسبق كل بيت أصيل، لتنسج مقطوعات من سبعة أشطر ممتلئة بالبلاغة.</p>
                )}
                {industryType === 'tashteer' && (
                  <p><b>حول التشطير:</b> سيتم شطر كل بيت نصفين بوضع شطر مضاف يسبق الصدر الأصيل، وشطر مضاف يسبق العجز الأصيل بدقة.</p>
                )}
              </div>

              <textarea
                value={originalPoemText}
                onChange={(e) => setOriginalPoemText(e.target.value)}
                placeholder="ألصق الأبيات الأصلية هنا... ندعم القصائد الطويلة حتى ١٠٠ بيت."
                rows={12}
                className={`w-full p-4 rounded-2xl text-sm font-serif leading-relaxed resize-y border ${
                  isDarkMode 
                    ? 'bg-[#0a120d] border-white/10 text-[#eefaf3] focus:border-[#dfba6b]/50' 
                    : 'bg-amber-50/10 border-manuscript-border text-gray-800 focus:border-[#1a472a]'
                } focus:outline-none focus:ring-1 focus:ring-amber-500`}
              />

              {error && (
                <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {turnstileSiteKey && (
                <div className="mt-4">
                  <TurnstileWidget
                    key={turnstileResetKey}
                    siteKey={turnstileSiteKey}
                    onVerify={setTurnstileToken}
                    isDarkMode={isDarkMode}
                    action={`industries_${industryType}`}
                  />
                </div>
              )}

              {remainingDailyUses !== undefined && (
                <div className="mt-3 flex items-center justify-between text-xs font-serif font-bold">
                  <span className={`${isDarkMode ? 'text-[#dfba6b]' : 'text-[#1a472a]'}`}>
                    المتبقي اليوم: {remainingDailyUses !== null ? `${remainingDailyUses} من 10` : '...'}
                  </span>
                </div>
              )}

              {remainingDailyUses === 0 && (
                <div className={`mt-3 p-4 rounded-xl border text-xs leading-relaxed ${
                  isDarkMode ? 'bg-[#3b1216]/40 border-red-900/40 text-red-300' : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <h4 className="font-bold font-serif mb-1">📜 كنانة المحاولات قد نفدت!</h4>
                  <p className="font-serif italic text-[11px]">
                    عشرةُ سِهامٍ أُطلِقَت في فضاء البلاغة اليوم، وقَد استنفدتَ كِنانة محاولاتك لِهذا اليوم. نرجو من قرائحكَ الفذّة الاستراحة قليلًا والعودة إلينا غداً لنظم أبهى القوافي!
                  </p>
                </div>
              )}

              <button
                onClick={handleApplyIndustry}
                disabled={generating || !originalPoemText.trim() || (!!turnstileSiteKey && !turnstileToken) || remainingDailyUses === 0}
                className={`w-full mt-4 py-3 text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 ${
                  (generating || !originalPoemText.trim() || (!!turnstileSiteKey && !turnstileToken) || remainingDailyUses === 0)
                    ? 'bg-gray-400 cursor-not-allowed opacity-75'
                    : 'bg-[#1a472a] hover:bg-royal-800 cursor-pointer'
                }`}
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>يجري تطبيق الـ {getIndustryNameArabic(industryType)} والتدقيق...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    <span>تطبيق الـ {getIndustryNameArabic(industryType)}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Report section showing after success */}
          {result && (
            <div className={`p-5 rounded-3xl border shadow-sm ${
              isDarkMode ? 'bg-[#102216] border-white/5' : 'bg-white border-manuscript-border'
            }`}>
              <h3 className="font-serif font-black text-sm text-[#1a472a] dark:text-[#dfba6b] mb-4 pb-2 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#8b1d2e]" />
                تقرير النظم والصناعة
              </h3>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                  <p className="text-2xl font-black text-emerald-600 font-mono">{result.weightSafetyPercentage}%</p>
                  <p className="text-[10px] font-bold text-gray-500 mt-0.5">سلامة الوزن</p>
                </div>
                <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                  <p className="text-2xl font-black text-emerald-600 font-mono">{result.rhymeSafetyPercentage}%</p>
                  <p className="text-[10px] font-bold text-gray-500 mt-0.5">التزام القافية</p>
                </div>
                <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl">
                  <p className="text-xl font-bold text-royal-800 dark:text-white font-mono">{result.versesCount}</p>
                  <p className="text-[10px] font-bold text-gray-500 mt-0.5">الأبيات المعالجة</p>
                </div>
                <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl">
                  <p className="text-xl font-bold text-royal-800 dark:text-white font-mono">{result.addedHemistichsCount}</p>
                  <p className="text-[10px] font-bold text-gray-500 mt-0.5">الأشطر المضافة</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-gray-100 dark:border-white/5 text-xs text-gray-500 space-y-1">
                <p>● <b>البحر العروضي:</b> بحر {result.meterName}</p>
                <p>● <b>الروي المستخلص:</b> حرف {result.rhymeLetter}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel Result showcase Column */}
        <div className="lg:col-span-7">
          {/* Default view */}
          {!generating && !result && (
            <div className={`h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-dashed ${
              isDarkMode ? 'border-white/10 text-gray-400' : 'border-manuscript-border text-gray-500 bg-amber-50/5'
            }`}>
              <div className="w-16 h-16 rounded-full bg-amber-500/5 border border-[#b58d3d]/20 flex items-center justify-center mb-4 text-[#b58d3d]">
                <Layers2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-black text-lg text-royal-800 dark:text-[#dfba6b] mb-2">منارة الصناعة والتشطير</h3>
              <p className="max-w-md text-xs leading-relaxed">
                حدد أحد صناعات الشعر العربي القديم (تخميس، تسبيع، تشطير) على اليمين ثم ألصق أبياتك للحصول على مسبوكة متكاملة وعروضية تماماً.
              </p>
            </div>
          )}

          {/* Loading view */}
          {generating && (
            <div className={`h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-dashed ${
              isDarkMode ? 'border-white/10 text-gray-400' : 'border-[#b58d3d]/30 text-gray-600 bg-[#fdfbf7]'
            }`}>
              <div className="relative mb-6">
                <RefreshCw className="w-12 h-12 text-[#8b1d2e] animate-spin" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute top-0 right-0" />
              </div>
              <h3 className="font-serif font-black text-lg text-royal-800 dark:text-[#dfba6b] mb-2">تطبيق النظم التراثي الموزون...</h3>
              <div className="space-y-1.5 max-w-sm text-xs text-gray-400 leading-normal">
                <p>● يحلل العروضي بحر وقافية وروي الأبيات الأصلية.</p>
                <p>● يصوغ الشاعر الأبيات المضافة متحدة بالبحر والمجرى.</p>
                <p>● يضمن القافي توازن روّي الصدور والأعجاز بانسجام ممتد.</p>
                <p>● يراجع المدقق العروضي المسبوكة آلياً لسلامة وزن التخميس.</p>
              </div>
            </div>
          )}

          {/* Success Result View */}
          {result && (
            <div className="space-y-6 animate-fade-in">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-[#102216]/90 p-4 rounded-2xl border border-manuscript-border dark:border-[#dfba6b]/20 shadow-xs">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-bold text-emerald-700">اكتمل صياغة الـ {getIndustryNameArabic(industryType)}!</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                    {copied ? 'تم النسخ!' : 'نسخ'}
                  </button>
                  <button
                    onClick={downloadTxt}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-royal-600" />
                    TXT
                  </button>
                  <button
                    onClick={downloadDoc}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-600" />
                    DOCX
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#8b1d2e]" />
                    PDF
                  </button>
                  <button
                    onClick={handleSaveToArchive}
                    disabled={savedToArchive}
                    className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      savedToArchive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                        : 'bg-royal-700 text-white hover:bg-royal-800'
                    }`}
                  >
                    {savedToArchive ? <Check className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                    {savedToArchive ? 'في الديوان' : 'حفظ بالديوان'}
                  </button>
                </div>
              </div>

              {/* Stanza display paper */}
              <div className="w-full bg-[#fdfbf7] dark:bg-[#0c1610] rounded-3xl border border-[#b58d3d]/30 shadow-lg overflow-hidden relative">
                {/* Vintage Watermark */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #b58d3d 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                
                {/* Header */}
                <div className="text-center pt-8 pb-5 border-b border-dashed border-[#b58d3d]/20 px-6">
                  <span className="text-[#8b1d2e] dark:text-[#dfba6b] font-serif italic text-xs block mb-1">
                    صناعة {getIndustryNameArabic(industryType)} • بحر {result.meterName}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-serif font-black text-[#1a472a] dark:text-white leading-tight">
                    مخطوطة الـ {getIndustryNameArabic(industryType)} المصنوعة
                  </h2>
                  <div className="w-20 h-0.5 bg-[#b58d3d] mx-auto mt-3" />
                </div>

                {/* Stanzas layout */}
                <div className="px-6 md:px-12 py-8 space-y-8 max-h-[600px] overflow-y-auto custom-scroll">
                  {result.stanzas.map((stanza, sIdx) => (
                    <div 
                      key={sIdx}
                      className="border border-[#b58d3d]/20 rounded-2xl p-5 bg-white/40 dark:bg-black/10 shadow-xs relative"
                    >
                      <span className="absolute top-3 right-3 text-[9px] font-black uppercase text-[#8b1d2e] bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded">المقطوعة {sIdx + 1}</span>
                      
                      <div className="space-y-3 mt-4 text-center">
                        {industryType === 'tashteer' ? (
                          <div className="flex flex-col gap-2">
                            <div>
                              <span className="text-[9px] text-[#8b1d2e] font-bold block">شطر مضاف:</span>
                              <p className="font-serif font-bold text-base text-[#8b1d2e]">{stanza.addedSadr}</p>
                            </div>
                            <div className="border-t border-dashed border-gray-100 my-1" />
                            <div>
                              <span className="text-[9px] text-emerald-700 font-bold block">الصدر الأصلي:</span>
                              <p className="font-serif font-bold text-base text-[#1a472a] dark:text-[#aef8cf]">{stanza.originalSadr}</p>
                            </div>
                            <div className="border-t border-dashed border-gray-100 my-1" />
                            <div>
                              <span className="text-[9px] text-[#8b1d2e] font-bold block">شطر مضاف:</span>
                              <p className="font-serif font-bold text-base text-[#8b1d2e]">{stanza.addedAjuz}</p>
                            </div>
                            <div className="border-t border-dashed border-gray-100 my-1" />
                            <div>
                              <span className="text-[9px] text-emerald-700 font-bold block">العجز الأصلي:</span>
                              <p className="font-serif font-bold text-base text-[#1a472a] dark:text-[#aef8cf]">{stanza.originalAjuz}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {/* Added lines */}
                            {(stanza.added || []).map((line, lIdx) => (
                              <div key={lIdx}>
                                <span className="text-[9px] text-[#8b1d2e] font-bold block">شطر مضاف {lIdx + 1}:</span>
                                <p className="font-serif font-bold text-base text-[#8b1d2e]">{line}</p>
                                <div className="border-t border-dashed border-gray-100/50 my-1" />
                              </div>
                            ))}
                            {/* Original verses */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200/50">
                              <div>
                                <span className="text-[9px] text-emerald-700 font-bold block">الصدر الأصلي:</span>
                                <p className="font-serif font-bold text-base text-[#1a472a] dark:text-[#aef8cf]">{stanza.originalSadr}</p>
                              </div>
                              <div>
                                <span className="text-[9px] text-emerald-700 font-bold block">العجز الأصلي:</span>
                                <p className="font-serif font-bold text-base text-[#1a472a] dark:text-[#aef8cf]">{stanza.originalAjuz}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer bar */}
                <div className="p-4 bg-royal-900 text-white text-[11px] border-t border-[#b58d3d]/30 text-center italic font-serif">
                  صناعة الـ {getIndustryNameArabic(industryType)} • ديوان العبقرية الرقمي
                </div>
              </div>

              {/* Explanation/Critique */}
              {result.explanation && (
                <div className={`p-5 rounded-3xl border shadow-sm ${
                  isDarkMode ? 'bg-[#102216] border-white/5' : 'bg-white border-manuscript-border'
                }`}>
                  <h3 className="font-serif font-black text-sm text-[#1a472a] dark:text-[#dfba6b] mb-3 pb-2 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#8b1d2e]" />
                    التقرير الفني ومطابقة معجم الصناعة
                  </h3>
                  <div className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-serif">
                    {result.explanation}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
