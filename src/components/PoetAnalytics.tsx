import React, { useState } from 'react';
import { GeneratedPoem } from '../types';
import { BookOpen, TrendingUp, Sparkles, RefreshCw, AlertCircle, FileText, Heart, Sliders, Feather, Activity } from 'lucide-react';

interface PoetAnalyticsProps {
  history: GeneratedPoem[];
}

export function PoetAnalytics({ history }: PoetAnalyticsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Compute offline fast statistics
  const totalPoems = history.length;
  const totalVerses = history.reduce((acc, p) => acc + (p.verses?.length || 0), 0);
  
  // Calculate top meters
  const meterCounts: { [key: string]: number } = {};
  history.forEach(p => {
    if (p.meterName) {
      meterCounts[p.meterName] = (meterCounts[p.meterName] || 0) + 1;
    }
  });
  const sortedMeters = Object.entries(meterCounts).sort((a, b) => b[1] - a[1]);

  // Calculate top rhyme letters
  const rhymeCounts: { [key: string]: number } = {};
  history.forEach(p => {
    if (p.rhymeLetter) {
      rhymeCounts[p.rhymeLetter] = (rhymeCounts[p.rhymeLetter] || 0) + 1;
    }
  });
  const sortedRhymes = Object.entries(rhymeCounts).sort((a, b) => b[1] - a[1]);

  // Calculate top purposes
  const purposeCounts: { [key: string]: number } = {};
  history.forEach(p => {
    if (p.purpose) {
      purposeCounts[p.purpose] = (purposeCounts[p.purpose] || 0) + 1;
    }
  });
  const sortedPurposes = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1]);

  const handleRunAnalysis = async () => {
    if (history.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/literary-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolAction: 'poet-profile-analysis',
          payload: {
            poems: history.map(p => ({
              title: p.title,
              meterName: p.meterName,
              rhymeLetter: p.rhymeLetter,
              verses: p.verses?.map(v => ({ shatr1: v.shatr1, shatr2: v.shatr2 }))
            }))
          }
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إجراء التحليل الأكاديمي لمسيرة الشاعر.');
    } finally {
      setLoading(false);
    }
  };

  if (totalPoems === 0) {
    return (
      <div className="bg-white border border-[#b58d3d]/25 rounded-2xl shadow-sm p-8 text-center max-w-4xl mx-auto" id="poet-analytics-empty-state">
        <div className="w-16 h-16 bg-[#1a472a]/5 text-[#1a472a] rounded-full flex items-center justify-center mx-auto mb-5">
          <TrendingUp className="w-8 h-8 text-[#8b1d2e]" />
        </div>
        <h2 className="font-serif font-black text-xl text-[#1a472a] mb-3">محرابُ السمات والتحليلاتِ البيانية للشاعر</h2>
        <p className="text-sm text-gray-600 leading-relaxed font-serif max-w-xl mx-auto mb-6">
          أهلاً بك في الفضاء الأكاديمي المخصص لرصد مسيرتك الإبداعية وتطور قريحتك النظمية على المدى الطويل.
          عند بدئك بنظم القصائد وحفظها في ديوانك المحفوظ، سيقوم النظام تلقائياً بتتبع البحور التي تميل إليها، والقوافي التي تفضلها، وثراء مفرداتك، وتنوعك البلاغي، ومن ثم تقديم استشارة نقدية مجهرية موجهة لصقل لغتك وتجاوز مواضع الضعف والتكرار.
        </p>
        <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl max-w-lg mx-auto text-xs text-[#b58d3d] leading-relaxed">
          <strong>💡 كيف تبدأ؟</strong> انظم قصيدتك الأولى من خلال علامة التبويب "صومعة النظم والبحور" ثم اضغط على زر "حفظ في الديوان" لتشرع المنصة في قراءة وفهم أسلوبك الأدبي الفريد وتتبع منحى تطورك الإبداعي.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#b58d3d]/25 rounded-2xl shadow-sm p-6" id="poet-analytics-dashboard">
      <div className="border-b border-gray-100 pb-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a472a] flex items-center gap-2 font-serif">
            <TrendingUp className="w-5 h-5 text-[#8b1d2e]" />
            السّمَات والتحليلاتُ البيانيّة لمسيرتِك الشعريّة
          </h2>
          <p className="text-xs text-gray-500 mt-1">دراسة فنية ومراجعة موضوعية شاملة لنتاج قريحتك الأدبية المحفوظة في الديوان</p>
        </div>
        
        <button
          onClick={handleRunAnalysis}
          disabled={loading}
          className="bg-[#1a472a] hover:bg-royal-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5 self-start md:self-auto"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'يجري النقد والدراسة الأكاديمية...' : 'إجراء مراجعة نقدية ذكية شاملة لديوانك'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs mb-6">
          {error}
        </div>
      )}

      {/* Offline Fast Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#fcfaf7] border border-amber-200/40 p-4 rounded-xl">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">إجمالي القصائد المنظومة</span>
          <span className="text-2xl font-serif font-black text-[#1a472a] block mt-1">{totalPoems} قصائد</span>
          <span className="text-[10px] text-gray-500 block mt-1">محفوظة في ديوانك الرقمي</span>
        </div>

        <div className="bg-[#fcfaf7] border border-amber-200/40 p-4 rounded-xl">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">مجموع الأبيات الموزونة</span>
          <span className="text-2xl font-serif font-black text-[#8b1d2e] block mt-1">{totalVerses} بيتاً</span>
          <span className="text-[10px] text-gray-500 block mt-1">تراكمت خلال رحلتك الإبداعية</span>
        </div>

        <div className="bg-[#fcfaf7] border border-amber-200/40 p-4 rounded-xl">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">البحر الأكثر تكراراً</span>
          <span className="text-xl font-serif font-black text-[#1a472a] block mt-1.5">
            {sortedMeters[0] ? sortedMeters[0][0] : 'غير متوفر'}
          </span>
          <span className="text-[10px] text-gray-500 block mt-1">
            بواقع {sortedMeters[0] ? sortedMeters[0][1] : 0} قصائد محفوظة
          </span>
        </div>

        <div className="bg-[#fcfaf7] border border-amber-200/40 p-4 rounded-xl">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">الروي الأكثر تفضيلاً</span>
          <span className="text-xl font-serif font-black text-[#8b1d2e] block mt-1.5">
            حرف ({sortedRhymes[0] ? sortedRhymes[0][0] : 'غير متوفر'})
          </span>
          <span className="text-[10px] text-gray-500 block mt-1">
            اختير في {sortedRhymes[0] ? sortedRhymes[0][1] : 0} مناسبات شعرية
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Preferred Meters list */}
        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs">
          <h3 className="font-serif font-bold text-xs text-[#1a472a] mb-3 pb-2 border-b border-gray-50 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#8b1d2e]" />
            توزيع البحور العروضية المفضلة:
          </h3>
          <div className="flex flex-col gap-2">
            {sortedMeters.map(([name, count], idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-serif bg-[#fcfaf7] p-2 rounded-lg">
                <span className="font-semibold text-gray-800">{name}</span>
                <span className="bg-[#1a472a]/5 text-[#1a472a] px-2 py-0.5 rounded-md font-bold">{count} قصائد</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rhyme Letters list */}
        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs">
          <h3 className="font-serif font-bold text-xs text-[#1a472a] mb-3 pb-2 border-b border-gray-50 flex items-center gap-1.5">
            <Feather className="w-4 h-4 text-[#8b1d2e]" />
            حروف الروي وقوافي ديوانك:
          </h3>
          <div className="flex flex-col gap-2">
            {sortedRhymes.map(([letter, count], idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-serif bg-[#fcfaf7] p-2 rounded-lg">
                <span className="font-semibold text-[#8b1d2e]">حرف الروي ({letter})</span>
                <span className="bg-[#8b1d2e]/5 text-[#8b1d2e] px-2 py-0.5 rounded-md font-bold">{count} مرات</span>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Purposes list */}
        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs">
          <h3 className="font-serif font-bold text-xs text-[#1a472a] mb-3 pb-2 border-b border-gray-50 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#8b1d2e]" />
            الأغراض والمحاور الفكرية:
          </h3>
          <div className="flex flex-col gap-2">
            {sortedPurposes.map(([purpose, count], idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-serif bg-[#fcfaf7] p-2 rounded-lg">
                <span className="font-semibold text-gray-800">{purpose}</span>
                <span className="bg-[#dfba6b]/10 text-[#8b1d2e] px-2 py-0.5 rounded-md font-bold">{count} قصائد</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Trajectory Report */}
      {analysisResult ? (
        <div className="border border-amber-200 bg-amber-50/10 rounded-2xl p-5 mt-6 animate-fade-in flex flex-col gap-5" id="ai-trajectory-report">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-serif font-black text-sm text-[#1a472a] flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-[#8b1d2e]" />
              التقرير النقدي الأكاديمي والسمات الفنية الشاملة لديوانك:
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">دراسة مجهرية موضوعية لأدواتك البلاغية والوزنية وتصويب الهنات</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Metrical Analysis */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs leading-relaxed">
              <h4 className="font-serif font-bold text-sm text-[#1a472a] mb-1.5">📐 النبض العروضي والحالة الإيقاعية:</h4>
              <p className="text-gray-600 font-serif whitespace-pre-line">{analysisResult.metricalAnalysis}</p>
            </div>

            {/* Acoustic Analysis */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs leading-relaxed">
              <h4 className="font-serif font-bold text-sm text-[#8b1d2e] mb-1.5">🎵 التردد الصوتي وقوافي القريحة:</h4>
              <p className="text-gray-600 font-serif whitespace-pre-line">{analysisResult.acousticAnalysis}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Lexical wealth */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs leading-relaxed">
              <h4 className="font-serif font-bold text-sm text-[#1a472a] mb-1.5">📜 معجمك اللغوي ومستوى الجزالة:</h4>
              <p className="text-gray-600 font-serif whitespace-pre-line">{analysisResult.lexicalWealth}</p>
            </div>

            {/* Rhetorical Profile */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs leading-relaxed">
              <h4 className="font-serif font-bold text-sm text-[#8b1d2e] mb-1.5">✨ المظهر البلاغي وتشكيل الأخيلة:</h4>
              <p className="text-gray-600 font-serif whitespace-pre-line">{analysisResult.rhetoricalProfile}</p>
            </div>
          </div>

          {/* Stylistic Persona */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs leading-relaxed">
            <h4 className="font-serif font-bold text-sm text-[#1a472a] mb-1.5">🏛️ البصمة والروح الأسلوبية (المدرسة الأدبية):</h4>
            <p className="text-gray-600 font-serif whitespace-pre-line">{analysisResult.stylisticPersona}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Weaknesses */}
            <div className="bg-[#8b1d2e]/5 border border-[#8b1d2e]/10 p-4 rounded-xl text-xs leading-relaxed">
              <h4 className="font-serif font-bold text-sm text-[#8b1d2e] mb-1.5">⚠️ مآخذ نقدية وهنات متكررة للتجاوز والصقل:</h4>
              <p className="text-gray-700 font-serif whitespace-pre-line">{analysisResult.recurringWeaknesses}</p>
            </div>

            {/* Guidance */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl text-xs leading-relaxed">
              <h4 className="font-serif font-bold text-sm text-emerald-800 mb-1.5">💡 التوجيه الإرشادي لمستقبلك الإبداعي:</h4>
              <p className="text-gray-700 font-serif whitespace-pre-line">{analysisResult.scholarlyGuidance}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/20 border border-amber-200/40 p-5 rounded-xl text-center text-xs text-gray-500 leading-relaxed font-serif mt-4">
          اضغط على الزر بالأعلى لقراءة وتحليل كامل أعمالك الشعرية المنظومة واستخراج التقرير الأكاديمي النقدي المتكامل لمسيرتك.
        </div>
      )}
    </div>
  );
}
