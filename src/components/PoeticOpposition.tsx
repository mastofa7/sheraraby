/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GeneratedPoem } from '../types';
import { 
  ArrowLeftRight, 
  Sparkles, 
  HelpCircle, 
  Search, 
  FileDown, 
  Copy, 
  Printer, 
  RefreshCw, 
  Check, 
  ArrowRight, 
  Layers, 
  AlertCircle,
  Award,
  BookOpen,
  Feather,
  Info
} from 'lucide-react';

interface PoeticOppositionProps {
  isDarkMode: boolean;
  onSavePoemToHistory: (poem: GeneratedPoem) => void;
}

export default function PoeticOpposition({ isDarkMode, onSavePoemToHistory }: PoeticOppositionProps) {
  // Original poem state
  const [originalPoemText, setOriginalPoemText] = useState('');
  
  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    meter: string;
    feet: string;
    rhyme: string;
    rawiyy: string;
    purpose: string;
    lexicon: string;
    images: string;
    languageLevel: string;
    style: string;
    poet?: string;
  } | null>(null);

  // Generation parameters
  const [manualPoet, setManualPoet] = useState('');
  const [newMeanings, setNewMeanings] = useState('');
  const [versesCount, setVersesCount] = useState(6);

  // Generation result state
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [opposedPoem, setOpposedPoem] = useState<{
    id: string;
    title: string;
    verses: Array<{ shatr1: string; shatr2: string; index: number }>;
    meterName: string;
    rhymeLetter: string;
    poetSimulated: string;
    styleSimilarity: number;
    weightSafetyPercentage: number;
    rhymeSafetyPercentage: number;
    explanation: string;
  } | null>(null);

  // Copy and Share local states
  const [copied, setCopied] = useState(false);
  const [savedToArchive, setSavedToArchive] = useState(false);

  // Handle original poem analysis
  const handleAnalyzeOriginal = async () => {
    if (!originalPoemText.trim()) {
      setAnalysisError('يرجى كتابة أو لصق أبيات القصيدة الأصلية أولاً.');
      return;
    }
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setOpposedPoem(null);
    setSavedToArchive(false);

    try {
      const res = await fetch('/.netlify/functions/generate?action=literary-tool', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'literary-tool',
          toolAction: 'opposition-analyze',
          payload: { poemText: originalPoemText }
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setAnalysisResult(data);
      if (data.poet && data.poet !== 'غير معروف') {
        setManualPoet(data.poet);
      } else {
        setManualPoet('');
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'فشل تحليل القصيدة الأصلية. يرجى التحقق من الاتصال بالإنترنت.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle generation of opposition poem
  const handleGenerateOpposition = async () => {
    if (!analysisResult) return;
    if (!newMeanings.trim()) {
      setGenerationError('يرجى إدخال المعاني الجديدة المطلوبة لنظم المعارضة حولها.');
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    setOpposedPoem(null);
    setSavedToArchive(false);

    try {
      const res = await fetch('/.netlify/functions/generate?action=literary-tool', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'literary-tool',
          toolAction: 'opposition-generate',
          payload: {
            originalPoem: originalPoemText,
            analysis: analysisResult,
            manualPoet: manualPoet,
            newMeanings: newMeanings,
            versesCount: versesCount
          }
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Add a unique ID
      const poemWithId = {
        ...data,
        id: Math.random().toString(36).substring(2, 11)
      };

      setOpposedPoem(poemWithId);
    } catch (err: any) {
      setGenerationError(err.message || 'فشل توليد المعارضة الشعرية. يرجى المحاولة لاحقاً.');
    } finally {
      setGenerating(false);
    }
  };

  // Archive storage helper
  const handleSaveToArchive = () => {
    if (!opposedPoem) return;

    const formattedPoem: GeneratedPoem = {
      id: opposedPoem.id,
      title: opposedPoem.title,
      verses: opposedPoem.verses.map(v => ({
        shatr1: v.shatr1,
        shatr2: v.shatr2,
        index: v.index
      })),
      meterName: opposedPoem.meterName,
      feet: analysisResult?.feet || 'تفعيلات البحر المكتشف',
      rhymeLetter: opposedPoem.rhymeLetter,
      purpose: `${analysisResult?.purpose || 'معارضة'} (معارضة شعرية)`,
      poetSimulated: opposedPoem.poetSimulated,
      isOpposition: true,
      explanation: opposedPoem.explanation,
      weightSafetyPercentage: opposedPoem.weightSafetyPercentage,
      rhymeSafetyPercentage: opposedPoem.rhymeSafetyPercentage,
      createdAt: new Date().toISOString()
    };

    onSavePoemToHistory(formattedPoem);
    setSavedToArchive(true);
  };

  // Formatting helper for exports
  const getPlainPoemText = () => {
    if (!opposedPoem) return '';
    let text = `=== معارضة شعرية: ${opposedPoem.title} ===\n`;
    text += `بحر: ${opposedPoem.meterName} | الروي: ${opposedPoem.rhymeLetter}\n`;
    text += `معارضة لقصيدة الشاعر: ${opposedPoem.poetSimulated}\n`;
    text += `نسبة التشابه الأسلوبي: ${opposedPoem.styleSimilarity}%\n`;
    text += `نسبة سلامة الوزن العروضي: ${opposedPoem.weightSafetyPercentage}%\n`;
    text += `------------------------------------------\n`;
    opposedPoem.verses.forEach((verse) => {
      text += `${verse.shatr1} .... ${verse.shatr2}\n`;
    });
    text += `------------------------------------------\n`;
    if (opposedPoem.explanation) {
      text += `\n[التقرير النقدي والأدبي والشرح]:\n${opposedPoem.explanation}\n`;
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
    link.download = `معارضة_${opposedPoem?.title || 'قصيدة'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadDoc = () => {
    if (!opposedPoem) return;
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${opposedPoem.title}</title>
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
        <h1>${opposedPoem.title}</h1>
        <div class="subtitle">معارضة شعرية على بحر ${opposedPoem.meterName} - للشاعر ${opposedPoem.poetSimulated}</div>
        <table>
          ${opposedPoem.verses.map(v => `
            <tr>
              <td class="shatr-1">${v.shatr1}</td>
              <td class="divider">❋</td>
              <td class="shatr-2">${v.shatr2}</td>
            </tr>
          `).join('')}
        </table>
        ${opposedPoem.explanation ? `
          <div class="explanation">
            <div class="explanation-title">التقرير النقدي والتحليل البلاغي والعروضي</div>
            <div class="explanation-body">${opposedPoem.explanation.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `معارضة_${opposedPoem.title}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!opposedPoem) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
      <head>
        <title>${opposedPoem.title}</title>
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
          <h1>${opposedPoem.title}</h1>
          <div class="meta">معارضة شعرية - بحر ${opposedPoem.meterName} | روي ${opposedPoem.rhymeLetter} | محاكاة أسلوب الشاعر ${opposedPoem.poetSimulated}</div>
        </div>
        <div>
          ${opposedPoem.verses.map(v => `
            <div class="verse">
              <div class="shatr1">${v.shatr1}</div>
              <div class="star">❋</div>
              <div class="shatr2">${v.shatr2}</div>
            </div>
          `).join('')}
        </div>
        ${opposedPoem.explanation ? `
          <div class="explanation-box">
            <div class="explanation-title">التقرير النقدي والتحليل الأدبي واللغوي</div>
            <div class="explanation-content">${opposedPoem.explanation}</div>
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

  const handleResetAll = () => {
    setOriginalPoemText('');
    setAnalysisResult(null);
    setOpposedPoem(null);
    setNewMeanings('');
    setManualPoet('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden ${
        isDarkMode ? 'bg-[#0f1d14] border-[#dfba6b]/20 text-white' : 'bg-[#fdfbf7] border-[#b58d3d]/30 text-gray-800'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#dfba6b]/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-[#b58d3d]/40 flex items-center justify-center text-amber-600 shrink-0">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold font-serif ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>المعارضة الشعرية الاحترافية</h2>
              <p className="text-xs text-gray-500 mt-1">عارض عيون الشعر العربي لكبار الفحول؛ محاكاة تامة للوزن والقافية والأسلوب مع صياغة معانٍ جديدة مبتكرة بالكامل.</p>
            </div>
          </div>
          {analysisResult && (
            <button 
              onClick={handleResetAll}
              className="px-4 py-2 text-xs font-bold bg-[#8b1d2e] hover:bg-red-800 text-white rounded-xl transition-colors shrink-0"
            >
              ابدأ معارضة جديدة
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - Form Panel */}
        <div className="lg:col-span-5 space-y-6">
          {/* Phase 1: Paste original poem */}
          {!analysisResult && (
            <div className={`p-5 rounded-3xl border shadow-sm ${
              isDarkMode ? 'bg-[#102216] border-white/5' : 'bg-white border-manuscript-border'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 bg-[#8b1d2e]/10 text-[#8b1d2e] text-xs font-bold rounded-full flex items-center justify-center">١</span>
                <h3 className="font-serif font-black text-sm text-[#1a472a] dark:text-[#dfba6b]">ألصق أو اكتب القصيدة الأصلية كاملة</h3>
              </div>

              <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
                سيتولى النظام آلياً دراسة الأبيات واستخراج تفعيلاتها وقافيتها، ويحاول التعرف على صاحب القصيدة من بين دواوين العرب.
              </p>

              <textarea
                value={originalPoemText}
                onChange={(e) => setOriginalPoemText(e.target.value)}
                placeholder="ألصق الأبيات هنا... صدر وعجز أو أبياتاً كاملة متتالية."
                rows={10}
                className={`w-full p-4 rounded-2xl text-sm font-serif leading-relaxed resize-y border ${
                  isDarkMode 
                    ? 'bg-[#0a120d] border-white/10 text-[#eefaf3] focus:border-[#dfba6b]/50' 
                    : 'bg-amber-50/10 border-manuscript-border text-gray-800 focus:border-[#1a472a]'
                } focus:outline-none focus:ring-1 focus:ring-amber-500`}
              />

              {analysisError && (
                <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              <button
                onClick={handleAnalyzeOriginal}
                disabled={analyzing || !originalPoemText.trim()}
                className="w-full mt-4 py-3 bg-[#1a472a] hover:bg-royal-800 text-white font-bold rounded-2xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>يجري استخراج التفعيلات وتحليل ديوان العرب...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>تحليل القصيدة واستخلاص القوالب</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Phase 2: Show Analysis metrics and inputs for new meanings */}
          {analysisResult && (
            <div className="space-y-6 animate-fade-in">
              {/* Report of Analysis */}
              <div className={`p-5 rounded-3xl border shadow-sm ${
                isDarkMode ? 'bg-[#102216] border-white/5' : 'bg-white border-manuscript-border'
              }`}>
                <h3 className="font-serif font-black text-sm text-[#1a472a] dark:text-[#dfba6b] mb-4 pb-2 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#8b1d2e]" />
                  الهوية العروضية للقصيدة الأصلية
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-center">
                    <p className="text-xs text-gray-400 font-semibold mb-0.5">البحر الشعري</p>
                    <p className="font-serif font-bold text-sm text-[#8b1d2e]">{analysisResult.meter}</p>
                  </div>
                  <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-center">
                    <p className="text-xs text-gray-400 font-semibold mb-0.5">حرف الروي</p>
                    <p className="font-serif font-bold text-sm text-[#8b1d2e]">حرف {analysisResult.rawiyy}</p>
                  </div>
                  <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-center">
                    <p className="text-xs text-gray-400 font-semibold mb-0.5">القافية</p>
                    <p className="font-serif font-bold text-sm text-royal-800 dark:text-[#dfba6b]">{analysisResult.rhyme}</p>
                  </div>
                  <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-center">
                    <p className="text-xs text-gray-400 font-semibold mb-0.5">الغرض</p>
                    <p className="font-serif font-bold text-sm text-royal-800 dark:text-[#dfba6b]">{analysisResult.purpose}</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="font-bold text-gray-400">التفعيلات: </span>
                    <span className="font-mono text-[#8b1d2e] font-bold" dir="ltr">{analysisResult.feet}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-black/20 p-2.5 rounded-lg text-[11px] leading-relaxed text-gray-500">
                    <p className="mb-1"><b className="text-gray-600 dark:text-gray-300">المعجم اللغوي: </b>{analysisResult.lexicon}</p>
                    <p className="mb-1"><b className="text-gray-600 dark:text-gray-300">الأسلوب والصور: </b>{analysisResult.images}</p>
                    <p><b className="text-gray-600 dark:text-gray-300">مستوى اللغة: </b>{analysisResult.languageLevel}</p>
                  </div>
                </div>
              </div>

              {/* Set simulated Poet & Meaning input */}
              <div className={`p-5 rounded-3xl border shadow-sm ${
                isDarkMode ? 'bg-[#102216] border-white/5' : 'bg-white border-manuscript-border'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-5 h-5 bg-[#8b1d2e]/10 text-[#8b1d2e] text-xs font-bold rounded-full flex items-center justify-center">٢</span>
                  <h3 className="font-serif font-black text-sm text-[#1a472a] dark:text-[#dfba6b]">معالم وأفكار المعارضة</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">
                      صاحب القصيدة المتوقع (الشاعر المحاكى):
                    </label>
                    <input
                      type="text"
                      value={manualPoet}
                      onChange={(e) => setManualPoet(e.target.value)}
                      placeholder="امرؤ القيس، المتنبي، شوقي..."
                      className={`w-full p-3 rounded-xl text-xs border ${
                        isDarkMode ? 'bg-[#0a120d] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'
                      } focus:outline-none focus:border-[#1a472a]`}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">يحاول النظام مضاهاة أسلوب هذا الشاعر وصوره وروح معانيه في المعارضة.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">
                      المعاني الجديدة والأفكار المراد نظمها (نثراً):
                    </label>
                    <textarea
                      value={newMeanings}
                      onChange={(e) => setNewMeanings(e.target.value)}
                      placeholder="اكتب المعاني أو الأفكار أو المناسبة التي تريد نظم معارضتك عنها... (مثال: فخر بحكمة الأجداد، أو غزل عفيف بليغ، أو رثاء للمدن والممالك)."
                      rows={4}
                      className={`w-full p-3.5 rounded-xl text-xs resize-none border ${
                        isDarkMode ? 'bg-[#0a120d] border-white/10 text-[#eefaf3]' : 'bg-amber-50/10 border-gray-200 text-gray-800'
                      } focus:outline-none focus:border-[#1a472a]`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-gray-500">عدد الأبيات المستهدفة:</label>
                      <span className="text-xs font-bold font-serif text-[#8b1d2e]">{versesCount} أبيات</span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={12}
                      value={versesCount}
                      onChange={(e) => setVersesCount(Number(e.target.value))}
                      className="w-full accent-[#8b1d2e]"
                    />
                  </div>

                  {generationError && (
                    <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{generationError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateOpposition}
                    disabled={generating || !newMeanings.trim()}
                    className="w-full py-3.5 bg-[#8b1d2e] hover:bg-red-800 text-white font-bold rounded-2xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>يجري نظم المعارضة وتمريرها على المدقق...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>نظم وتدقيق المعارضة الشعرية</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column - Result Showcase */}
        <div className="lg:col-span-7">
          {/* Welcome Screen before Generation */}
          {!generating && !opposedPoem && (
            <div className={`h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-dashed ${
              isDarkMode ? 'border-white/10 text-gray-400 bg-white/1' : 'border-manuscript-border text-gray-500 bg-amber-50/5'
            }`}>
              <div className="w-16 h-16 rounded-full bg-amber-500/5 border border-[#b58d3d]/20 flex items-center justify-center mb-4 text-[#b58d3d]">
                <Feather className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-black text-lg text-royal-800 dark:text-[#dfba6b] mb-2">لوحة المعارضة الفنية</h3>
              <p className="max-w-md text-xs leading-relaxed">
                بعد تحليل المقطوعة الأصلية وتحديد معاني المعارضة، ستظهر الأبيات المصوغة في هذا الجانب مصحوبة بتقرير الدقة العروضية والتحليل البلاغي المقارن لأسلوب الشاعر.
              </p>
            </div>
          )}

          {/* Loading Animation during Generation */}
          {generating && (
            <div className={`h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-dashed ${
              isDarkMode ? 'border-white/10 text-gray-400' : 'border-[#b58d3d]/30 text-gray-600 bg-[#fdfbf7]'
            }`}>
              <div className="relative mb-6">
                <RefreshCw className="w-12 h-12 text-[#8b1d2e] animate-spin" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute top-0 right-0 animate-bounce" />
              </div>
              <h3 className="font-serif font-black text-lg text-royal-800 dark:text-[#dfba6b] mb-2">أبواب المعارضة مغلقة للنظم...</h3>
              <div className="space-y-1.5 max-w-sm text-xs text-gray-400 leading-normal">
                <p>● يقوم "الشاعر الرقمي" بنسج مسودة الأبيات المعارضة.</p>
                <p>● يفحص "العروضي" الوزن بيتاً بيتاً لتثبيت الموسيقى.</p>
                <p>● يتأكد "القافي" من متانة الروي، ويصفي "البلاغي" التعابير النثرية.</p>
                <p>● يُحكّم "الناقد الأكبر" جودة البناء لسلامة المضاهاة لأسلوب {manualPoet || "الشاعر الأصلي"}.</p>
              </div>
            </div>
          )}

          {/* Opposed Poem Result View */}
          {opposedPoem && (
            <div className="space-y-6 animate-fade-in">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-[#102216]/90 p-4 rounded-2xl border border-manuscript-border dark:border-[#dfba6b]/20 shadow-xs">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-bold text-emerald-700">اكتمل نظم المعارضة بنجاح!</span>
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

              {/* The Manuscript Paper Display */}
              <div className="w-full bg-[#fdfbf7] dark:bg-[#0c1610] rounded-3xl border border-[#b58d3d]/30 shadow-lg overflow-hidden relative">
                {/* Vintage Watermark */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #b58d3d 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                
                {/* Header */}
                <div className="text-center pt-8 pb-5 border-b border-dashed border-[#b58d3d]/20 px-6">
                  <span className="text-[#8b1d2e] dark:text-[#dfba6b] font-serif italic text-xs block mb-1">
                    معارضة لـ {opposedPoem.poetSimulated} • بحر {opposedPoem.meterName}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-serif font-black text-[#1a472a] dark:text-white leading-tight">
                    {opposedPoem.title}
                  </h2>
                  <div className="w-20 h-0.5 bg-[#b58d3d] mx-auto mt-3" />
                </div>

                {/* Verses Grid */}
                <div className="px-6 md:px-12 py-8 space-y-4">
                  {opposedPoem.verses.map((verse, idx) => (
                    <div 
                      key={idx}
                      className="grid grid-cols-1 md:grid-cols-11 items-center gap-2 p-1.5 rounded-lg hover:bg-[#1a472a]/5 transition-all"
                    >
                      <div className="md:col-span-5 text-right font-serif font-bold text-base md:text-lg text-royal-900 dark:text-[#eefaf3] leading-relaxed">
                        {verse.shatr1}
                      </div>
                      <div className="md:col-span-1 text-[#b58d3d] text-center text-xs font-serif select-none">
                        ❋
                      </div>
                      <div className="md:col-span-5 text-left font-serif font-bold text-base md:text-lg text-royal-900 dark:text-[#eefaf3] leading-relaxed">
                        {verse.shatr2}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Report block */}
                <div className="p-4 bg-royal-900 text-white flex flex-wrap gap-4 justify-between items-center bg-opacity-95 text-[11px] border-t border-[#b58d3d]/30">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <p className="text-[#dfba6b] font-bold text-[9px] uppercase">التشابه الأسلوبي</p>
                      <p className="font-bold text-xs">{opposedPoem.styleSimilarity}%</p>
                    </div>
                    <div>
                      <p className="text-[#dfba6b] font-bold text-[9px] uppercase">سلامة الوزن</p>
                      <p className="font-bold text-xs">{opposedPoem.weightSafetyPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-[#dfba6b] font-bold text-[9px] uppercase">التزام الروي</p>
                      <p className="font-bold text-xs">{opposedPoem.rhymeSafetyPercentage}%</p>
                    </div>
                  </div>
                  <span className="italic text-gray-300 font-serif">صانع المعارضة الرقمي</span>
                </div>
              </div>

              {/* Literary Explanation box */}
              {opposedPoem.explanation && (
                <div className={`p-5 rounded-3xl border shadow-sm ${
                  isDarkMode ? 'bg-[#102216] border-white/5' : 'bg-white border-manuscript-border'
                }`}>
                  <h3 className="font-serif font-black text-sm text-[#1a472a] dark:text-[#dfba6b] mb-3 pb-2 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#8b1d2e]" />
                    التقرير النقدي والتحليل الأدبي واللغوي
                  </h3>
                  <div className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-serif">
                    {opposedPoem.explanation}
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
