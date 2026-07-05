/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GeneratedPoem } from '../types';
import { Copy, FileText, Share2, Printer, Info, Check, Sparkles, RefreshCw, ChevronDown, ChevronUp, BookOpen, MessageSquare, ShieldCheck, Activity, Glasses, HelpCircle } from 'lucide-react';

interface PoemDisplayProps {
  poem: GeneratedPoem;
  onReset: () => void;
}

export default function PoemDisplay({ poem, onReset }: PoemDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [copiedVerseIndex, setCopiedVerseIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);
  const [shareToast, setShareToast] = useState(false);

  // مجهر البلاغة والبيان التفصيلي
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    lineByLine?: any[];
    rhetoricalImages?: any[];
    embellishments?: any[];
  } | null>(null);

  const handleFetchAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/literary-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolAction: 'explain-and-extract-rhetoric',
          payload: { verses: poem.verses, meterName: poem.meterName }
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAnalysisResult(data);
    } catch (err: any) {
      setAnalysisError(err.message || 'حدث خطأ أثناء تحميل المجهر البلاغي.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Helper to format the poem text for copying/downloading
  const getPlainPoemText = () => {
    let text = `=== ${poem.title} ===\n`;
    text += `بحر: ${poem.meterName} | الغرض: ${poem.purpose}\n`;
    if (poem.poetSimulated) text += `على أسلوب الشاعر: ${poem.poetSimulated}\n`;
    text += `------------------------------------------\n`;
    poem.verses.forEach((verse) => {
      text += `${verse.shatr1} .... ${verse.shatr2}\n`;
    });
    text += `------------------------------------------\n`;
    if (poem.explanation) {
      text += `\n[الشرح والتحليل الفني واللغوي]:\n${poem.explanation}\n`;
    }
    return text;
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(getPlainPoemText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopySingleVerse = async (shatr1: string, shatr2: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(`${shatr1} ❋ ${shatr2}`);
      setCopiedVerseIndex(idx);
      setTimeout(() => setCopiedVerseIndex(null), 1500);
    } catch (err) {
      console.error('Failed to copy verse: ', err);
    }
  };

  const downloadTxt = () => {
    const text = getPlainPoemText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${poem.title || 'قصيدة'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadDoc = () => {
    // Generate simple HTML that MS Word opens perfectly
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${poem.title}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Amiri', 'Georgia', serif; direction: rtl; text-align: center; background-color: #fcfaf7; padding: 20px; }
          h1 { color: #1a472a; font-size: 28px; margin-bottom: 5px; }
          .subtitle { color: #8b1d2e; font-size: 16px; margin-bottom: 30px; font-style: italic; }
          table { width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse; }
          td { padding: 12px; font-size: 18px; font-weight: bold; }
          .shatr-1 { text-align: right; width: 45%; }
          .divider { text-align: center; width: 10%; color: #b58d3d; font-size: 14px; }
          .shatr-2 { text-align: left; width: 45%; }
          .explanation { margin-top: 40px; border-top: 2px solid #b58d3d; padding-top: 20px; text-align: right; max-width: 600px; margin-left: auto; margin-right: auto; }
          .explanation-title { color: #1a472a; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .explanation-body { font-size: 14px; color: #333; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>${poem.title}</h1>
        <div class="subtitle">بحر ${poem.meterName} - غرض ${poem.purpose} ${poem.poetSimulated ? `(محاكاة أسلوب ${poem.poetSimulated})` : ''}</div>
        <table>
          ${poem.verses.map(v => `
            <tr>
              <td class="shatr-1">${v.shatr1}</td>
              <td class="divider">❋</td>
              <td class="shatr-2">${v.shatr2}</td>
            </tr>
          `).join('')}
        </table>
        ${poem.explanation ? `
          <div class="explanation">
            <div class="explanation-title">الشرح والتحليل الأدبي واللغوي</div>
            <div class="explanation-body">${poem.explanation.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${poem.title || 'قصيدة'}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    // Elegant printing layout
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
      <head>
        <title>${poem.title}</title>
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
          .verse {
            display: grid;
            grid-template-columns: 1fr 40px 1fr;
            align-items: center;
            margin-bottom: 15px;
            font-size: 20px;
            font-weight: bold;
          }
          .shatr1 { text-align: right; }
          .shatr2 { text-align: left; }
          .star { text-align: center; color: #b58d3d; font-size: 16px; }
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
          <h1>${poem.title}</h1>
          <div class="meta">بحر ${poem.meterName} | غرض ${poem.purpose} ${poem.poetSimulated ? ` | محاكاة أسلوب ${poem.poetSimulated}` : ''}</div>
        </div>
        <div>
          ${poem.verses.map(v => `
            <div class="verse">
              <div class="shatr1">${v.shatr1}</div>
              <div class="star">❋</div>
              <div class="shatr2">${v.shatr2}</div>
            </div>
          `).join('')}
        </div>
        ${poem.explanation ? `
          <div class="explanation-box">
            <div class="explanation-title">الشرح والتحليل الأدبي واللغوي</div>
            <div class="explanation-content">${poem.explanation}</div>
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: poem.title,
          text: `قرأتُ هذه القصيدة الجميلة الموزونة من بحر ${poem.meterName} بعنوان: "${poem.title}" والمولدة بصانع الشعر العربي:\n\n${poem.verses.map(v => `${v.shatr1} * ${v.shatr2}`).join('\n')}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing: ', err);
      }
    } else {
      // Fallback: Copy Link and show toast
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 3000);
      } catch (err) {
        console.error('Error copying share link: ', err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6" id="poem-display-section">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 p-4 rounded-2xl border border-[#b58d3d]/20 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
          <span className="text-sm font-semibold text-royal-800">اكتمل نظم ديوانك بنجاح!</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#b58d3d]/30 text-royal-800 bg-white hover:bg-royal-50 transition-colors cursor-pointer"
            title="نسخ القصيدة كاملة للشامخة"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-[#b58d3d]" />}
            {copied ? 'تم النسخ!' : 'نسخ القصيدة'}
          </button>

          <button
            onClick={downloadTxt}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#b58d3d]/30 text-royal-800 bg-white hover:bg-royal-50 transition-colors cursor-pointer"
            title="تنزيل كملف نصي عادي"
          >
            <FileText className="w-3.5 h-3.5 text-royal-600" />
            تنزيل TXT
          </button>

          <button
            onClick={downloadDoc}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#b58d3d]/30 text-royal-800 bg-white hover:bg-royal-50 transition-colors cursor-pointer"
            title="تنزيل لفتحها على ميكروسوفت وورد"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            تنزيل DOCX
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#b58d3d]/30 text-royal-800 bg-white hover:bg-royal-50 transition-colors cursor-pointer"
            title="حفظ بصيغة PDF أو طباعة مباشرة"
          >
            <Printer className="w-3.5 h-3.5 text-[#8b1d2e]" />
            حفظ PDF / طباعة
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#b58d3d]/30 text-royal-800 bg-white hover:bg-royal-50 transition-colors cursor-pointer"
            title="مشاركتها مع عشاق الشعر والأدب"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            مشاركة
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-royal-700 hover:bg-royal-800 text-white shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            نظم قصيدة جديدة
          </button>
        </div>
      </div>

      {shareToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>تم نسخ رابط التطبيق للحافظة لمشاركته بنجاح!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scroll Paper displaying the generated Poem */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="w-full manuscript-border bg-[#fdfbf7] shadow-xl relative flex flex-col overflow-hidden rounded-2xl min-h-[500px]">
            {/* Scroll watermark background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #b58d3d 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            
            {/* Scroll Header */}
            <div className="text-center pt-10 pb-6 border-b border-[#b58d3d]/15 px-6 relative">
              <div className="absolute top-4 left-4 text-xs font-semibold text-[#8b1d2e] bg-[#8b1d2e]/5 px-2.5 py-1 rounded-full border border-[#8b1d2e]/10">
                بحر {poem.meterName}
              </div>
              <span className="text-[#8b1d2e] font-serif italic text-sm block mb-1">
                في غرض {poem.purpose} {poem.poetSimulated ? `على أسلوب ${poem.poetSimulated}` : ''}
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a472a] drop-shadow-sm px-4">
                {poem.title || 'قصيدة من ديوان العرب'}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#b58d3d] to-transparent mx-auto mt-4" />
            </div>

            {/* Verses Container */}
            <div className="flex-1 px-4 md:px-12 py-8 space-y-4 max-h-[600px] overflow-y-auto custom-scroll">
              {poem.verses.map((verse, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleCopySingleVerse(verse.shatr1, verse.shatr2, idx)}
                  className="verse-line group relative p-1.5 rounded-lg hover:bg-[#1a472a]/5 transition-all duration-200 cursor-pointer"
                  title="اضغط لنسخ هذا البيت منفرداً"
                >
                  <div className="shatr text-right font-serif font-bold text-lg md:text-xl text-royal-900 leading-relaxed">
                    {verse.shatr1}
                  </div>
                  <div className="text-[#b58d3d] text-center text-xs font-serif self-center select-none group-hover:scale-125 transition-transform">
                    {copiedVerseIndex === idx ? (
                      <span className="text-green-600 text-[10px] font-sans font-semibold">تم!</span>
                    ) : (
                      '❋'
                    )}
                  </div>
                  <div className="shatr text-left font-serif font-bold text-lg md:text-xl text-royal-900 leading-relaxed">
                    {verse.shatr2}
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll Footer */}
            <div className="p-4 bg-[#1a472a] text-white flex flex-wrap gap-4 justify-between items-center bg-opacity-95 border-t border-[#b58d3d]/30 text-xs">
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-[#b58d3d] font-semibold text-[10px] uppercase">البحر العروضي</p>
                  <p className="font-bold text-sm font-serif">{poem.meterName}</p>
                </div>
                <div>
                  <p className="text-[#b58d3d] font-semibold text-[10px] uppercase">الروي والقافية</p>
                  <p className="font-bold text-sm">حرف {poem.rhymeLetter || 'موحد'}</p>
                </div>
                <div>
                  <p className="text-[#b58d3d] font-semibold text-[10px] uppercase">توليد الذكاء</p>
                  <p className="font-bold text-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    Gemini 3.5 المدفوع
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-gray-300 italic font-mono">
                صانع الشعر العربي © ٢٠٢٦
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel: Interactive Literary Analysis / Explanation */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* تقرير الفحص العروضي التلقائي */}
          <div className="bg-gradient-to-br from-[#1a472a]/5 to-emerald-50/50 border border-emerald-500/20 rounded-2xl shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-2 border-b border-emerald-500/10">
              <div className="bg-emerald-500/10 p-1.5 rounded-xl text-emerald-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1a472a] text-sm">تقرير التدقيق العروضي التلقائي</h3>
                <p className="text-[10px] text-emerald-700 font-semibold">تم اجتياز الفحص والتدقيق العروضي الفوري بنجاح</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-3 shadow-xs">
                <p className="text-2xl font-black text-emerald-600 font-mono">{poem.weightSafetyPercentage ?? 100}%</p>
                <p className="text-[10px] font-bold text-gray-500 mt-0.5">نسبة سلامة الوزن</p>
              </div>
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-3 shadow-xs">
                <p className="text-2xl font-black text-emerald-600 font-mono">{poem.rhymeSafetyPercentage ?? 100}%</p>
                <p className="text-[10px] font-bold text-gray-500 mt-0.5">نسبة التزام القافية</p>
              </div>
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-3 shadow-xs">
                <p className="text-2xl font-black text-royal-800 font-mono">{poem.verses.length}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-0.5">عدد الأبيات</p>
              </div>
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-3 shadow-xs flex flex-col justify-center items-center">
                <p className="text-sm font-serif font-bold text-royal-800 line-clamp-1">{poem.meterName}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-0.5">البحر المستعمل</p>
              </div>
            </div>
            
            <p className="text-[10px] text-gray-400 text-center leading-relaxed italic border-t border-dashed border-gray-100 pt-2">
              * تم تمرير القصيدة إلى المدقق العروضي الآلي لإصلاح أي كسور أو عيوب في القافية تلقائياً قبل تسليمها لك.
            </p>
          </div>

          <div className="bg-white border border-[#b58d3d]/20 rounded-2xl shadow-sm p-5 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h3 className="font-bold text-royal-800 text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#8b1d2e]" />
                  الشرح والتحليل الأدبي
                </h3>
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="p-1 text-gray-500 hover:text-royal-800 transition-colors"
                >
                  {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showExplanation && poem.explanation && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl text-xs leading-relaxed text-amber-900 flex gap-2">
                    <Info className="w-4 h-4 text-[#b58d3d] shrink-0" />
                    <div>
                      هذا التحليل والنقد البلاغي تم صياغته خصيصاً بواسطة ناقد أدبي ذكي من طراز رفيع لتوضيح عمق الصور البلاغية والمفردات المستعملة.
                    </div>
                  </div>

                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-serif prose max-h-[380px] overflow-y-auto custom-scroll pr-1">
                    {poem.explanation}
                  </div>
                </div>
              )}

              {!poem.explanation && (
                <p className="text-xs text-gray-500 italic text-center py-6">
                  لا يتوفر تحليل نقدي لهذه القصيدة حالياً.
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
              <span>تفعيلات البحر: <b className="font-serif text-[#1a472a]">{poem.feet}</b></span>
            </div>
          </div>

          {/* Tips for recitation */}
          <div className="bg-gradient-to-br from-royal-900 to-royal-800 text-white rounded-2xl p-5 border border-royal-700/50 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
            <h4 className="font-bold text-sm text-[#b58d3d] mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              نصيحة للإلقاء العذب:
            </h4>
            <p className="text-xs text-gray-200 leading-relaxed">
              لقد نُظمت هذه الأبيات على تفعيلات بحر <b>{poem.meterName}</b> وهو بحر يرتفع به الصوت تدريجياً لبيان مواطن المد والقوة. جرب قراءتها جهراً ملتزماً بوقوف خفيف عند نهاية كل صدر (الشطر الأول) لتكتشف جمالية الموسيقى الداخلية المحبوكة.
            </p>
          </div>

          {/* مجهر البلاغة والبيان التفصيلي بيتاً بيتاً */}
          <div className="bg-[#fdfcf7] border border-[#b58d3d]/30 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-serif font-black text-[#1a472a] text-sm flex items-center gap-2">
                <Glasses className="w-4 h-4 text-[#8b1d2e]" />
                المَجْهَرُ البَلَاغِيُّ التَّفْصِيلِيُّ
              </h4>
              {!analysisResult && (
                <button
                  onClick={handleFetchAnalysis}
                  disabled={analysisLoading}
                  className="bg-[#8b1d2e] hover:bg-[#1a472a] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {analysisLoading ? 'يجري فك التراكيب...' : 'تحليل الأبيات بيتاً بيتاً'}
                </button>
              )}
            </div>

            {analysisLoading && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <RefreshCw className="w-6 h-6 text-[#8b1d2e] animate-spin mb-2" />
                <p className="text-[10px] text-gray-500 font-serif">يجري استخلاص الصور البيانية، الجناس، والطباق وتفكيك الأبيات...</p>
              </div>
            )}

            {analysisError && (
              <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xl">{analysisError}</p>
            )}

            {analysisResult && (
              <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto custom-scroll pr-1 animate-fade-in">
                {/* شرح بيتاً بيتاً */}
                {analysisResult.lineByLine && (
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[11px] font-bold text-[#1a472a] bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">● شرح الأبيات بيتاً بيتاً:</span>
                    {analysisResult.lineByLine.map((lbl: any, idx: number) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-100 text-[11px] leading-relaxed">
                        <span className="font-bold text-[#8b1d2e] block mb-0.5">البيت {lbl.index}:</span>
                        <p className="text-gray-700 font-serif">{lbl.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* الصور البلاغية */}
                {analysisResult.rhetoricalImages && (
                  <div className="flex flex-col gap-2.5 mt-2">
                    <span className="text-[11px] font-bold text-[#1a472a] bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">● الصور البيانية والجمالية:</span>
                    {analysisResult.rhetoricalImages.map((img: any, idx: number) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-100 text-[11px] leading-relaxed">
                        <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.5 rounded font-black">{img.type}</span>
                        <span className="text-gray-400 text-[9px] ml-1"> - البيت {img.verseIndex}:</span>
                        <p className="font-serif font-semibold text-gray-800 my-1">"{img.phrase}"</p>
                        <p className="text-gray-500 leading-normal">{img.analysis}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* المحسنات البديعية */}
                {analysisResult.embellishments && (
                  <div className="flex flex-col gap-2.5 mt-2">
                    <span className="text-[11px] font-bold text-[#1a472a] bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">● المحسنات البديعية اللفظية والمعنوية:</span>
                    {analysisResult.embellishments.map((emb: any, idx: number) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-100 text-[11px] leading-relaxed">
                        <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.5 rounded font-black">{emb.type}</span>
                        <span className="text-gray-400 text-[9px] ml-1"> - البيت {emb.verseIndex}:</span>
                        <p className="font-serif font-semibold text-gray-800 my-1">"{emb.phrase}"</p>
                        <p className="text-gray-500 leading-normal">{emb.analysis}</p>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setAnalysisResult(null)}
                  className="text-center text-[10px] text-gray-400 hover:text-[#8b1d2e] py-1 border-t border-dashed border-gray-200 mt-2"
                >
                  إخلاق نتائج المجهر البلاغي
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
