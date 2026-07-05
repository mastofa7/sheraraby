import React, { useState } from 'react';
import { Sparkles, ArrowRightLeft, BookOpen, HelpCircle, PenTool, Search, MessageSquare, Clipboard, Check, RefreshCw, Upload, FileText, ChevronRight, Scale, Activity, Glasses, Compass } from 'lucide-react';
import { PoeticMeterInfo } from '../types';

interface AdvancedToolsProps {
  meters: PoeticMeterInfo[];
  currentPoem: any;
  onApplyNewPoem: (poem: any) => void;
}

export function AdvancedTools({ meters, currentPoem, onApplyNewPoem }: AdvancedToolsProps) {
  const [activeSubTool, setActiveSubTool] = useState<'rhymes' | 'prose2poem' | 'transmute' | 'rhymeChanger' | 'critique' | 'comparison' | 'analyzeProsody' | 'styleTransform' | 'originality' | 'inspiration' | 'rhetorical'>('rhymes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 11. Rhetorical state
  const [rhetoricalText, setRhetoricalText] = useState('');
  const [rhetoricalResult, setRhetoricalResult] = useState<any>(null);

  // 1. Rhyme generator state
  const [rhymeLetter, setRhymeLetter] = useState('ر');
  const [rhymeResults, setRhymeResults] = useState<any>(null);

  // 2. Prose to Poem state
  const [proseText, setProseText] = useState('');
  const [proseMeter, setProseMeter] = useState('البحر الطويل');
  const [proseRhyme, setProseRhyme] = useState('م');
  const [proseGenre, setProseGenre] = useState('وجدانيات');
  const [proseVerses, setProseVerses] = useState(5);
  const [proseResult, setProseResult] = useState<any>(null);

  // 3. Transmute state
  const [transmuteTarget, setTransmuteTarget] = useState('البحر الكامل');
  const [transmuteRhyme, setTransmuteRhyme] = useState('د');
  const [transmuteResult, setTransmuteResult] = useState<any>(null);

  // 4. Rhyme Changer state
  const [targetRhymeLetter, setTargetRhymeLetter] = useState('ب');
  const [rhymeChangeResult, setRhymeChangeResult] = useState<any>(null);

  // 5. Style analyzer state
  const [analyzerText, setAnalyzerText] = useState('');
  const [analyzerResult, setAnalyzerResult] = useState<any>(null);

  // 6. Compare state
  const [comparePoem1, setComparePoem1] = useState('');
  const [comparePoem2, setComparePoem2] = useState('');
  const [compareResult, setCompareResult] = useState<any>(null);

  // 7. Prosody analyzer state
  const [prosodyText, setProsodyText] = useState('');
  const [prosodyResult, setProsodyResult] = useState<any>(null);

  // 8. Style Transform state
  const [transformText, setTransformText] = useState('');
  const [transformStyle, setTransformStyle] = useState('جاهلي بدوي جزيل');
  const [transformResult, setTransformResult] = useState<any>(null);

  // 9. Originality state
  const [originalityText, setOriginalityText] = useState('');
  const [originalityResult, setOriginalityResult] = useState<any>(null);

  // 10. Inspiration state
  const [inspirationTopic, setInspirationTopic] = useState('');
  const [inspirationResult, setInspirationResult] = useState<any>(null);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleToolSubmit = async (action: string, payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/literary-tool', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ toolAction: action, payload }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (action === 'generate-rhymes') setRhymeResults(data);
      else if (action === 'prose-to-poem') setProseResult(data);
      else if (action === 'transmute-meter') setTransmuteResult(data);
      else if (action === 'change-rhyme') setRhymeChangeResult(data);
      else if (action === 'analyze-style') setAnalyzerResult(data);
      else if (action === 'compare-poems') setCompareResult(data);
      else if (action === 'analyze-prosody') setProsodyResult(data);
      else if (action === 'style-analyze-transform') setTransformResult(data);
      else if (action === 'originality-analyze') setOriginalityResult(data);
      else if (action === 'inspiration-generate') setInspirationResult(data);
      else if (action === 'rhetorical-analyze') setRhetoricalResult(data);

    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء معالجة الأداة الأدبية.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#b58d3d]/25 rounded-2xl shadow-sm p-6" id="advanced-tools-container">
      <div className="border-b border-gray-100 pb-4 mb-6">
        <h2 className="text-xl font-bold text-[#1a472a] flex items-center gap-2 font-serif">
          <PenTool className="w-5 h-5 text-[#8b1d2e]" />
          أدواتُ البلاغة وعُلوم العَرُوض المتقدّمَة
        </h2>
        <p className="text-xs text-gray-500 mt-1">تجهيزات واستشارات عروضية ونقدية متخصصة تحت إشراف نخبة من فحول اللغويين</p>
      </div>

      {/* Navigation for Sub-Tools */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-100 pb-4 mb-6">
        <button
          onClick={() => { setActiveSubTool('rhymes'); setError(null); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTool === 'rhymes' ? 'bg-[#1a472a] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          مولد القوافي الذكي
        </button>

        <button
          onClick={() => { setActiveSubTool('prose2poem'); setError(null); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTool === 'prose2poem' ? 'bg-[#1a472a] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          تحويل النثر إلى شعر
        </button>

        <button
          onClick={() => { setActiveSubTool('transmute'); setError(null); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTool === 'transmute' ? 'bg-[#1a472a] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          تحويل البحر العروضي
        </button>

        <button
          onClick={() => { setActiveSubTool('rhymeChanger'); setError(null); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTool === 'rhymeChanger' ? 'bg-[#1a472a] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          تغيير القافية تلقائياً
        </button>

        <button
          onClick={() => { setActiveSubTool('critique'); setError(null); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTool === 'critique' ? 'bg-[#1a472a] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
        >
          <Upload className="w-3.5 h-3.5" />
          محلل الأسلوب والنقد
        </button>

        <button
          onClick={() => { setActiveSubTool('comparison'); setError(null); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTool === 'comparison' ? 'bg-[#1a472a] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
        >
          <Scale className="w-3.5 h-3.5" />
          مقارنة قصيدتين
        </button>

        <button
          onClick={() => { setActiveSubTool('analyzeProsody'); setError(null); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTool === 'analyzeProsody' ? 'bg-[#8b1d2e] text-white shadow-sm' : 'bg-red-50/50 text-[#8b1d2e] hover:bg-red-50'}`}
        >
          <Activity className="w-3.5 h-3.5" />
          مصحح العروض والكسور
        </button>

        <button
          onClick={() => { setActiveSubTool('styleTransform'); setError(null); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTool === 'styleTransform' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50/50 text-amber-800 hover:bg-amber-50'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          مختبر التحويل الأسلوبي
        </button>

        <button
          onClick={() => { setActiveSubTool('originality'); setError(null); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTool === 'originality' ? 'bg-[#1a472a] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
        >
          <Glasses className="w-3.5 h-3.5" />
          مقياس الأصالة والفرادة
        </button>

        <button
          onClick={() => { setActiveSubTool('inspiration'); setError(null); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTool === 'inspiration' ? 'bg-indigo-700 text-white shadow-sm' : 'bg-indigo-50/50 text-indigo-800 hover:bg-indigo-50'}`}
        >
          <Compass className="w-3.5 h-3.5" />
          باعث القرائح والإلهام
        </button>

        <button
          onClick={() => { setActiveSubTool('rhetorical'); setError(null); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTool === 'rhetorical' ? 'bg-[#8b1d2e] text-white shadow-sm' : 'bg-[#8b1d2e]/5 text-[#8b1d2e] hover:bg-[#8b1d2e]/10'}`}
        >
          <FileText className="w-3.5 h-3.5" />
          محرك التحليل البلاغي
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs mb-4">
          {error}
        </div>
      )}

      {/* 1. SMART RHYME GENERATOR */}
      {activeSubTool === 'rhymes' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="bg-[#fcfaf7] border border-[#b58d3d]/20 rounded-2xl p-4 flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-[#1a472a] block mb-1">اختر أو اكتب حرف الروي المستهدف:</label>
              <input
                type="text"
                value={rhymeLetter}
                onChange={(e) => setRhymeLetter(e.target.value)}
                placeholder="مثال: ل، د، ر"
                maxLength={2}
                className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-center font-bold text-lg text-royal-800"
              />
            </div>
            <button
              onClick={() => handleToolSubmit('generate-rhymes', { letter: rhymeLetter })}
              disabled={loading || !rhymeLetter}
              className="bg-[#1a472a] text-white hover:bg-royal-800 px-6 py-3 rounded-xl text-xs font-bold shrink-0 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'يجري جرد القوافي...' : 'ابحث عن القوافي التراثية'}
            </button>
          </div>

          {rhymeResults && (
            <div className="border border-amber-200 bg-amber-50/20 rounded-2xl p-5 mt-2 animate-fade-in">
              <h3 className="font-serif font-black text-sm text-[#1a472a] mb-3 flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-[#8b1d2e]" />
                حصيلة معجم القوافي لحرف الروي ({rhymeResults.letter}):
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rhymeResults.rhymes?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#8b1d2e] font-serif">{item.word}</span>
                      <button
                        onClick={() => copyToClipboard(item.word, `rhyme-${idx}`)}
                        className="text-gray-400 hover:text-[#1a472a]"
                      >
                        {copiedText === `rhyme-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{item.meaning}</p>
                    {item.verseExample && (
                      <p className="text-[9px] text-[#1a472a] italic mt-1.5 border-t border-dashed border-gray-100 pt-1 leading-normal font-serif">
                        "{item.verseExample}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PROSE TO POETRY CONVERSION */}
      {activeSubTool === 'prose2poem' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#1a472a] block">أدخل النثر العربي المراد صياغته شعراً:</label>
            <textarea
              value={proseText}
              onChange={(e) => setProseText(e.target.value)}
              placeholder="اكتب فكرة أو مقالاً نثرياً أو خاطرة تفيض بالمشاعر..."
              className="w-full min-h-[100px] border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a472a] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">البحر المستهدف:</label>
              <select
                value={proseMeter}
                onChange={(e) => setProseMeter(e.target.value)}
                className="w-full bg-[#fcfaf7] border border-gray-200 rounded-xl p-2.5 text-xs outline-none"
              >
                {meters.map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">الروي (تلقائي أو مخصص):</label>
              <input
                type="text"
                value={proseRhyme}
                onChange={(e) => setProseRhyme(e.target.value)}
                placeholder="حرف الروي"
                className="w-full bg-[#fcfaf7] border border-gray-200 rounded-xl p-2.5 text-xs text-center font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">النمط والعاطفة السائدة:</label>
              <select
                value={proseGenre}
                onChange={(e) => setProseGenre(e.target.value)}
                className="w-full bg-[#fcfaf7] border border-gray-200 rounded-xl p-2.5 text-xs outline-none"
              >
                <option value="وجداني غزل">غزل ووجدانيات</option>
                <option value="حكمة فلسفية">حكمة وفلسفة</option>
                <option value="فخر وحماسة">فخر وحماسة</option>
                <option value="رثاء حزين">رثاء وتفجع</option>
                <option value="مديح عالي">مديح وسناء</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">عدد الأبيات المطلوبة:</label>
              <input
                type="number"
                min="3"
                max="15"
                value={proseVerses}
                onChange={(e) => setProseVerses(parseInt(e.target.value) || 5)}
                className="w-full bg-[#fcfaf7] border border-gray-200 rounded-xl p-2.5 text-xs text-center font-bold"
              />
            </div>
          </div>

          <button
            onClick={() => handleToolSubmit('prose-to-poem', { proseText, meterName: proseMeter, rhymeLetter: proseRhyme, versesCount: proseVerses, genre: proseGenre })}
            disabled={loading || !proseText}
            className="w-full bg-[#1a472a] text-white hover:bg-royal-800 py-3 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
            {loading ? 'يجري محاكاة النظم وتعديل التفعيلات عروضياً...' : 'سبك النثر في قالب القصيد'}
          </button>

          {proseResult && (
            <div className="border border-[#b58d3d]/30 bg-amber-50/10 rounded-2xl p-5 mt-2 animate-fade-in relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif font-black text-[#1a472a] text-base">{proseResult.title}</h3>
                <button
                  onClick={() => onApplyNewPoem({
                    title: proseResult.title,
                    verses: proseResult.verses,
                    meterName: proseMeter,
                    explanation: proseResult.explanation,
                    rhymeLetter: proseRhyme || 'تلقائية'
                  })}
                  className="bg-royal-100 hover:bg-royal-200 text-royal-800 text-[10px] px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  عرض في الواجهة الكبرى
                </button>
              </div>

              <div className="flex flex-col gap-2.5 mb-4 border-b border-gray-100 pb-4">
                {proseResult.verses?.map((v: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center py-1.5 hover:bg-white/50 rounded-lg">
                    <span className="font-serif text-sm font-semibold text-gray-800">{v.shatr1}</span>
                    <span className="font-serif text-sm font-semibold text-[#8b1d2e]">{v.shatr2}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-600 leading-relaxed bg-white/60 p-3.5 rounded-xl border border-gray-100">
                <p className="font-bold text-[#1a472a] mb-1">التقرير البلاغي وعملية الصياغة:</p>
                <p>{proseResult.explanation}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TRANSMUTE METER */}
      {activeSubTool === 'transmute' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {!currentPoem ? (
            <p className="text-xs text-[#8b1d2e] bg-red-50 p-4 rounded-xl font-bold text-center">
              يرجى إنشاء قصيدة أو اختيارها من الديوان أولاً لتتمكن من تحويل بحرها العروضي!
            </p>
          ) : (
            <>
              <div className="bg-[#fcfaf7] border border-[#b58d3d]/20 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">القصيدة الحالية:</p>
                  <p className="font-serif text-sm font-bold text-[#1a472a] mt-0.5">{currentPoem.title} (بحر {currentPoem.meterName})</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <div>
                    <label className="text-[10px] text-gray-400 block">البحر الجديد المطلوب النقل إليه:</label>
                    <select
                      value={transmuteTarget}
                      onChange={(e) => setTransmuteTarget(e.target.value)}
                      className="bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold mt-1 outline-none"
                    >
                      {meters.filter(m => m.name !== currentPoem.meterName).map(m => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block">حرف الروي المفضل:</label>
                    <input
                      type="text"
                      maxLength={1}
                      value={transmuteRhyme}
                      onChange={(e) => setTransmuteRhyme(e.target.value)}
                      className="bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold mt-1 w-16 text-center"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleToolSubmit('transmute-meter', { verses: currentPoem.verses, currentMeter: currentPoem.meterName, targetMeter: transmuteTarget, rhymeLetter: transmuteRhyme })}
                disabled={loading}
                className="w-full bg-[#1a472a] text-white hover:bg-royal-800 py-3 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                {loading ? 'يجري تعديل التفعيلات والمقاطع العروضية...' : `تحويل القصيدة إلى بحر ${transmuteTarget}`}
              </button>

              {transmuteResult && (
                <div className="border border-[#b58d3d]/30 bg-amber-50/10 rounded-2xl p-5 mt-2 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif font-black text-[#1a472a] text-base">{transmuteResult.title}</h3>
                    <button
                      onClick={() => onApplyNewPoem({
                        title: transmuteResult.title,
                        verses: transmuteResult.verses,
                        meterName: transmuteTarget,
                        explanation: transmuteResult.explanation,
                        rhymeLetter: transmuteRhyme || 'تلقائية'
                      })}
                      className="bg-royal-100 hover:bg-royal-200 text-royal-800 text-[10px] px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      اعتماد القصيدة المعدلة بالواجهة
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5 mb-4 border-b border-gray-100 pb-4">
                    {transmuteResult.verses?.map((v: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center py-1.5 hover:bg-white/50 rounded-lg">
                        <span className="font-serif text-sm font-semibold text-gray-800">{v.shatr1}</span>
                        <span className="font-serif text-sm font-semibold text-[#8b1d2e]">{v.shatr2}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-600 leading-relaxed bg-white/60 p-3.5 rounded-xl border border-gray-100">
                    <p className="font-bold text-[#1a472a] mb-1">التقرير اللغوي لعملية النقل والتحوير:</p>
                    <p>{transmuteResult.explanation}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 4. RHYME CHANGER */}
      {activeSubTool === 'rhymeChanger' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {!currentPoem ? (
            <p className="text-xs text-[#8b1d2e] bg-red-50 p-4 rounded-xl font-bold text-center">
              يرجى إنشاء قصيدة أو اختيارها من الديوان أولاً لتتمكن من تغيير قافيتها تلقائياً!
            </p>
          ) : (
            <>
              <div className="bg-[#fcfaf7] border border-[#b58d3d]/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500">القصيدة الحالية:</p>
                  <p className="font-serif text-sm font-bold text-[#1a472a] mt-0.5">{currentPoem.title} (القافية الحالية: {currentPoem.rhymeLetter})</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 font-semibold">حرف الروي الجديد المستهدف:</span>
                  <input
                    type="text"
                    maxLength={1}
                    value={targetRhymeLetter}
                    onChange={(e) => setTargetRhymeLetter(e.target.value)}
                    className="w-16 bg-white border border-gray-200 rounded-xl p-2.5 text-center font-bold text-lg text-royal-800"
                  />
                </div>
              </div>

              <button
                onClick={() => handleToolSubmit('change-rhyme', { verses: currentPoem.verses, currentRhyme: currentPoem.rhymeLetter, targetRhyme: targetRhymeLetter, meterName: currentPoem.meterName })}
                disabled={loading}
                className="w-full bg-[#1a472a] text-white hover:bg-royal-800 py-3 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {loading ? 'يجري تطويع نهايات الأبيات عروضياً وقافية...' : `تعديل القافية إلى حرف (${targetRhymeLetter})`}
              </button>

              {rhymeChangeResult && (
                <div className="border border-[#b58d3d]/30 bg-amber-50/10 rounded-2xl p-5 mt-2 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif font-black text-[#1a472a] text-base">{rhymeChangeResult.title}</h3>
                    <button
                      onClick={() => onApplyNewPoem({
                        title: rhymeChangeResult.title,
                        verses: rhymeChangeResult.verses,
                        meterName: currentPoem.meterName,
                        explanation: rhymeChangeResult.explanation,
                        rhymeLetter: targetRhymeLetter
                      })}
                      className="bg-royal-100 hover:bg-royal-200 text-royal-800 text-[10px] px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      اعتماد القصيدة المعدلة بالواجهة
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5 mb-4 border-b border-gray-100 pb-4">
                    {rhymeChangeResult.verses?.map((v: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center py-1.5 hover:bg-white/50 rounded-lg">
                        <span className="font-serif text-sm font-semibold text-gray-800">{v.shatr1}</span>
                        <span className="font-serif text-sm font-semibold text-[#8b1d2e]">{v.shatr2}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-600 leading-relaxed bg-white/60 p-3.5 rounded-xl border border-gray-100">
                    <p className="font-bold text-[#1a472a] mb-1">شرح تعديل القوافي والجزالة:</p>
                    <p>{rhymeChangeResult.explanation}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 5. POEM STYLE ANALYZER */}
      {activeSubTool === 'critique' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#1a472a] block">الصق الأبيات أو القصيدة المرفوعة للتحليل النقدي وعروضها:</label>
            <textarea
              value={analyzerText}
              onChange={(e) => setAnalyzerText(e.target.value)}
              placeholder="الصق الأبيات المراد مراجعتها بلاغياً ونقلياً هنا..."
              className="w-full min-h-[120px] border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a472a] outline-none"
            />
          </div>

          <button
            onClick={() => handleToolSubmit('analyze-style', { text: analyzerText })}
            disabled={loading || !analyzerText}
            className="w-full bg-[#1a472a] text-white hover:bg-royal-800 py-3 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
            {loading ? 'يجري التدقيق الأسلوبي والمجهري للبلاغة...' : 'تحليل الأسلوب والبيان عروضياً ولغوياً'}
          </button>

          {analyzerResult && (
            <div className="border border-amber-200 bg-amber-50/10 rounded-2xl p-5 mt-2 animate-fade-in flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400">البحر المقدر</p>
                  <p className="text-sm font-serif font-black text-[#1a472a] mt-1">{analyzerResult.estimatedMeter || 'غير محدد'}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400">العصر المتوقع</p>
                  <p className="text-sm font-serif font-black text-[#1a472a] mt-1">{analyzerResult.estimatedEra || 'غير محدد'}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400">حرف الروي</p>
                  <p className="text-sm font-serif font-black text-[#8b1d2e] mt-1">{analyzerResult.rhymeLetter || 'غير محدد'}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400">درجة الخيال البياني</p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">{analyzerResult.imageryRating || '8'}/10</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 text-xs leading-relaxed text-gray-700">
                <h4 className="font-bold text-[#1a472a] mb-1.5">التقرير الأسلوبي والنقدي الشامل:</h4>
                <p>{analyzerResult.styleCritique}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-emerald-800 mb-2">مواطن القوة والمظاهر الجمالية:</h5>
                  <ul className="list-disc list-inside text-[11px] text-gray-700 leading-relaxed flex flex-col gap-1.5">
                    {analyzerResult.positives?.map((pos: string, idx: number) => (
                      <li key={idx}>{pos}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#8b1d2e]/5 border border-[#8b1d2e]/10 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-[#8b1d2e] mb-2">ملاحظات نقدية واقتراحات الصقل:</h5>
                  <ul className="list-disc list-inside text-[11px] text-gray-700 leading-relaxed flex flex-col gap-1.5">
                    {analyzerResult.negatives?.map((neg: string, idx: number) => (
                      <li key={idx}>{neg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. COMPARE TWO POEMS */}
      {activeSubTool === 'comparison' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#1a472a] block">القصيدة الأولى:</label>
              <textarea
                value={comparePoem1}
                onChange={(e) => setComparePoem1(e.target.value)}
                placeholder="الصق القصيدة الأولى هنا..."
                className="w-full min-h-[120px] border border-gray-200 rounded-xl p-3 text-xs outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#1a472a] block">القصيدة الثانية:</label>
              <textarea
                value={comparePoem2}
                onChange={(e) => setComparePoem2(e.target.value)}
                placeholder="الصق القصيدة الثانية هنا..."
                className="w-full min-h-[120px] border border-gray-200 rounded-xl p-3 text-xs outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => handleToolSubmit('compare-poems', { poem1: comparePoem1, poem2: comparePoem2 })}
            disabled={loading || !comparePoem1 || !comparePoem2}
            className="w-full bg-[#1a472a] text-white hover:bg-royal-800 py-3 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
            {loading ? 'يجري المفاضلة اللغوية وعروض الأوزان...' : 'إجراء المقارنة البلاغية ونقد عكاظ'}
          </button>

          {compareResult && (
            <div className="border border-amber-200 bg-amber-50/10 rounded-2xl p-5 mt-2 animate-fade-in flex flex-col gap-4">
              <h3 className="font-serif font-black text-sm text-[#1a472a] border-b border-gray-100 pb-2">نتائج التحكيم والمفاضلة بين القصيدتين:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-gray-700">
                <div className="bg-white border border-gray-100 p-4 rounded-xl">
                  <p className="font-bold text-[#1a472a] mb-1.5">القصيدة الأولى:</p>
                  <p><strong>العروض:</strong> {compareResult.comparativeTable?.poem1Meter}</p>
                  <p className="mt-1"><strong>المستوى المعجمي:</strong> {compareResult.comparativeTable?.poem1Vocabulary}</p>
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-xl">
                  <p className="font-bold text-[#8b1d2e] mb-1.5">القصيدة الثانية:</p>
                  <p><strong>العروض:</strong> {compareResult.comparativeTable?.poem2Meter}</p>
                  <p className="mt-1"><strong>المستوى المعجمي:</strong> {compareResult.comparativeTable?.poem2Vocabulary}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 text-xs leading-relaxed text-gray-700">
                <h4 className="font-bold text-[#1a472a] mb-1.5">المقارنة البلاغية والجمالية:</h4>
                <p>{compareResult.rhetoricalComparison}</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 text-xs leading-relaxed text-gray-700">
                <h4 className="font-bold text-[#1a472a] mb-1.5">التحليل والمطابقة العروضية:</h4>
                <p>{compareResult.metricalComparison}</p>
              </div>

              <div className="bg-amber-100/40 border border-amber-300 rounded-xl p-4 text-xs leading-relaxed text-gray-800">
                <h4 className="font-serif font-bold text-sm text-[#8b1d2e] mb-1 flex items-center gap-1">
                  <Scale className="w-4 h-4" />
                  الحكم النقدي المرجح:
                </h4>
                <p>{compareResult.verdict}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. PROSODY AND BROKEN FEET ANALYZER */}
      {activeSubTool === 'analyzeProsody' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#8b1d2e] block">أدخل الأبيات الشعرية المراد فحصها عروضياً وتدقيق أوزانها وكسورها:</label>
            <textarea
              value={prosodyText}
              onChange={(e) => setProsodyText(e.target.value)}
              placeholder="اكتب هنا بيتاً أو أكثر من الشعر؛ ليقوم المفتش العروضي بمسحه وتحديد الكسور وتفعيلاته..."
              className="w-full min-h-[120px] border border-gray-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[#8b1d2e] outline-none font-serif"
            />
          </div>

          <button
            onClick={() => handleToolSubmit('analyze-prosody', { verseText: prosodyText })}
            disabled={loading || !prosodyText.trim()}
            className="w-full bg-[#8b1d2e] text-white hover:bg-red-950 py-3 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            {loading ? 'يجري الفحص المجهري لموازين التفعيلات والزحافات...' : 'تشغيل المفتش العروضي وبحث الكسور'}
          </button>

          {prosodyResult && (
            <div className="border border-red-200 bg-red-50/10 rounded-2xl p-5 mt-2 animate-fade-in flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">البحر الشعري المكتشف</span>
                  <p className="font-serif font-black text-lg text-[#8b1d2e] mt-1">بحر {prosodyResult.detectedMeter || 'غير محدد'}</p>
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">التفعيلات العروضية المثالية</span>
                  <p className="font-mono text-xs text-[#1a472a] font-bold mt-2" dir="ltr">{prosodyResult.feetTemplate}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="font-serif font-bold text-sm text-gray-800 border-b border-gray-100 pb-2">سجل الفحص العروضي والكسور عجزاً وصلياً:</h4>
                {prosodyResult.issues?.map((issue: any, idx: number) => (
                  <div key={idx} className={`p-4 rounded-xl border ${issue.hasViolation ? 'bg-red-500/5 border-red-500/10' : 'bg-green-500/5 border-green-500/10'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-600">البيت {issue.verseIndex || idx + 1}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${issue.hasViolation ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {issue.hasViolation ? '⚠️ تم رصد خلل أو انكسار عروضي' : '✓ البيت موزون وسليم'}
                      </span>
                    </div>

                    <p className="font-serif font-bold text-sm text-center text-gray-800 my-3 italic">"{issue.verseText}"</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white/60 p-3 rounded-lg border border-gray-100 mb-3">
                      <div>
                        <strong className="text-gray-500 text-[10px] block">تفعيلات الصدر:</strong>
                        <p className="font-serif font-semibold text-[#1a472a] mt-0.5">{issue.sadrFeet || 'سليمة'}</p>
                      </div>
                      <div>
                        <strong className="text-gray-500 text-[10px] block">تفعيلات العجز:</strong>
                        <p className="font-serif font-semibold text-[#1a472a] mt-0.5">{issue.ajuzFeet || 'سليمة'}</p>
                      </div>
                    </div>

                    {issue.hasViolation && (
                      <div className="mt-3 bg-red-100/10 p-3 rounded-lg border border-red-200/20 text-xs text-gray-700 leading-relaxed">
                        <strong className="text-[#8b1d2e] block mb-1">تفاصيل الخلل عروضياً:</strong>
                        <p>{issue.violationDetails}</p>
                      </div>
                    )}

                    {issue.corrections && issue.corrections.length > 0 && (
                      <div className="mt-4 border-t border-dashed border-gray-200 pt-3">
                        <strong className="text-emerald-800 text-xs block mb-2">البدائل التصحيحية المقترحة عروضياً:</strong>
                        <div className="flex flex-col gap-2.5">
                          {issue.corrections.map((corr: any, cidx: number) => (
                            <div key={cidx} className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-xs">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-center font-serif font-bold text-gray-800 py-1 border-b border-emerald-500/10 mb-2">
                                <span>{corr.correctedSadr}</span>
                                <span className="text-emerald-800">{corr.correctedAjuz}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 mb-1"><strong>تفعيلاتها السليمة:</strong> <code className="text-[#8b1d2e]">{corr.feet}</code></p>
                              <p className="text-[10px] text-gray-600"><strong>شرح الصياغة:</strong> {corr.reasoning}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. STYLE & VOCABULARY TRANSFORMATION LAB */}
      {activeSubTool === 'styleTransform' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#1a472a] block">الصق الأبيات أو النص النثري المراد مراجعته وتحويل أسلوبه لغوياً وفنياً:</label>
            <textarea
              value={transformText}
              onChange={(e) => setTransformText(e.target.value)}
              placeholder="اكتب الأبيات أو فكرة القصيدة ليقوم المختبر بصقل جزالة ألفاظها وتحوير نمطها الأدبي..."
              className="w-full min-h-[120px] border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a472a] outline-none font-serif"
            />
          </div>

          <div className="bg-[#fcfaf7] border border-[#b58d3d]/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 text-xs">
            <div className="flex-1">
              <label className="font-bold text-[#1a472a] block mb-1">النمط والروح الأدبية المستهدفة للتحوير:</label>
              <select
                value={transformStyle}
                onChange={(e) => setTransformStyle(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-2.5 font-bold outline-none cursor-pointer"
              >
                <option value="جزالة وفحولة العصر الجاهلي وصحرائه وألفاظه">العصر الجاهلي وصدر الإسلام (قوة، متانة وجزالة لفظية)</option>
                <option value="فخامة وعمق العصر العباسي وصوره البديعية">العصر العباسي الفخم (نمط الحكمة وتنميق الفكر والبيان)</option>
                <option value="رقة وعذوبة وأزهار العصر الأندلسي المغرد">العصر الأندلسي (خفة الأوزان ورقة العواطف وعذب النغمة)</option>
                <option value="بساطة وعاطفة وصور العصر الحديث الرمزية">العصر الحديث (سلاسة وبلاغة بليغة ميسرة تلامس القلوب)</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => handleToolSubmit('style-analyze-transform', { poemText: transformText, targetStyle: transformStyle })}
            disabled={loading || !transformText.trim()}
            className="w-full bg-amber-600 text-white hover:bg-amber-800 py-3 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'يجري محاكاة الأسلوب وإعادة نسج صياغة الدواوين...' : 'تشغيل مختبر الصياغة والتحوير الأسلوبي'}
          </button>

          {transformResult && (
            <div className="border border-amber-200 bg-amber-50/10 rounded-2xl p-5 mt-2 animate-fade-in flex flex-col gap-5">
              <div>
                <h4 className="font-serif font-black text-sm text-[#1a472a] mb-2">مقياس التحليل الأسلوبي المجهري للنص الأصلي:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white border border-gray-100 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold block">كثافة وثراء المفردات</span>
                    <p className="font-serif font-semibold text-gray-800 mt-1">{transformResult.styleAnalysis?.vocabularyDensity}</p>
                  </div>
                  <div className="bg-white border border-gray-100 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold block">مستوى الكلاسيكية والجزالة</span>
                    <p className="font-serif font-semibold text-gray-800 mt-1">{transformResult.styleAnalysis?.classicalityLevel}</p>
                  </div>
                  <div className="bg-white border border-gray-100 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold block">النضوج والتعقيد المعجمي</span>
                    <p className="font-serif font-semibold text-gray-800 mt-1">{transformResult.styleAnalysis?.lexicalSophistication}</p>
                  </div>
                  <div className="bg-white border border-gray-100 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold block">التراكيب اللفظية والربط</span>
                    <p className="font-serif font-semibold text-gray-800 mt-1">{transformResult.styleAnalysis?.sentenceStructure}</p>
                  </div>
                  <div className="bg-white border border-gray-100 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold block">طبيعة الخيال والبيان</span>
                    <p className="font-serif font-semibold text-gray-800 mt-1">{transformResult.styleAnalysis?.imageryPatterns}</p>
                  </div>
                  <div className="bg-white border border-gray-100 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold block">الحقول الدلالية المسيطرة</span>
                    <p className="font-serif font-semibold text-gray-800 mt-1">{transformResult.styleAnalysis?.semanticFields}</p>
                  </div>
                </div>
              </div>

              {/* Transformed Poem verses */}
              <div className="border-t border-dashed border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-serif font-black text-[#1a472a] text-sm flex items-center gap-1">
                    📖 الصياغة المحولة للنمط الجديد: <span className="text-amber-800">({transformResult.transformedTitle})</span>
                  </h4>
                  <button
                    onClick={() => onApplyNewPoem({
                      title: transformResult.transformedTitle,
                      verses: transformResult.transformedVerses,
                      meterName: currentPoem?.meterName || 'تلقائي',
                      explanation: transformResult.comparisonExplanation,
                      rhymeLetter: currentPoem?.rhymeLetter || 'تلقائي'
                    })}
                    className="bg-royal-100 hover:bg-royal-200 text-royal-800 text-[10px] px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    اعتماد النسخة المحولة بالواجهة الكبرى
                  </button>
                </div>

                <div className="bg-white border border-[#b58d3d]/15 p-5 rounded-2xl flex flex-col gap-3">
                  {transformResult.transformedVerses?.map((v: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center py-2 hover:bg-amber-500/5 rounded-lg">
                      <span className="font-serif text-sm font-semibold text-gray-800">{v.shatr1}</span>
                      <span className="font-serif text-sm font-semibold text-[#8b1d2e]">{v.shatr2}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl text-xs leading-relaxed text-gray-700">
                <strong className="text-amber-900 font-serif block mb-1">التقرير والمقارنة الأدبية الأسلوبية:</strong>
                <p>{transformResult.comparisonExplanation}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. ORIGINALITY AND REPETITION DETECTOR */}
      {activeSubTool === 'originality' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#1a472a] block">الصق القصيدة أو النص الشعري لقياس فرادته وأصالته ونبذ الكليشيهات:</label>
            <textarea
              value={originalityText}
              onChange={(e) => setOriginalityText(e.target.value)}
              placeholder="الصق الأبيات ليجري فحص الكلمات والتشبيهات المكررة والمستهلكة وتوليد بدائل تضمن تميزك الأدبي..."
              className="w-full min-h-[120px] border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a472a] outline-none font-serif"
            />
          </div>

          <button
            onClick={() => handleToolSubmit('originality-analyze', { poemText: originalityText })}
            disabled={loading || !originalityText.trim()}
            className="w-full bg-[#1a472a] text-white hover:bg-emerald-950 py-3 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Glasses className="w-4 h-4" />}
            {loading ? 'يجري الكشف ومطابقة الدواوين وتصفية الكليشيهات...' : 'تشغيل محلل الفرادة والأصالة اللفظية'}
          </button>

          {originalityResult && (
            <div className="border border-emerald-200 bg-emerald-50/10 rounded-2xl p-5 mt-2 animate-fade-in flex flex-col gap-5">
              <div className="flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-xs">
                {/* Visual originality score indicator */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f3f4f6" strokeWidth="4" />
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke={originalityResult.score >= 80 ? '#10b981' : originalityResult.score >= 60 ? '#f59e0b' : '#ef4444'} strokeWidth="4" strokeDasharray={`${2 * Math.PI * 28}`} strokeDashoffset={`${2 * Math.PI * 28 * (1 - originalityResult.score / 100)}`} />
                  </svg>
                  <span className="absolute text-sm font-black text-gray-800">{originalityResult.score || '85'}%</span>
                </div>
                <div>
                  <h4 className="font-serif font-black text-[#1a472a] text-sm">معدل فرادة وأصالة البناء اللفظي</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">درجة تقييم ابتكار التراكيب وتجنب النظم التقليدي الشائع في قواميس النقد العربي.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Repetitions block */}
                <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                  <h5 className="text-xs font-bold text-amber-900 mb-3 border-b border-amber-500/10 pb-1.5 flex items-center gap-1">
                    ⚠️ تكرارات وألفاظ مستعملة بكثرة:
                  </h5>
                  {originalityResult.internalRepetitions && originalityResult.internalRepetitions.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                      {originalityResult.internalRepetitions.map((rep: any, i: number) => (
                        <div key={i} className="bg-white p-2 rounded border border-amber-500/10 text-[11px]">
                          <span className="font-bold text-[#8b1d2e]">{rep.phrase}</span> <span className="text-gray-400">(البيت {rep.verseIndex})</span>
                          <p className="text-gray-500 mt-0.5 leading-normal">{rep.issue}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">لا يوجد تكرارات لفظية مخلّة بالبناء الفني.</p>
                  )}
                </div>

                {/* Clichés block */}
                <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                  <h5 className="text-xs font-bold text-[#8b1d2e] mb-3 border-b border-[#8b1d2e]/10 pb-1.5 flex items-center gap-1">
                    🚫 كليشيهات واستعارات مبتذلة:
                  </h5>
                  {originalityResult.clichésAndOverused && originalityResult.clichésAndOverused.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                      {originalityResult.clichésAndOverused.map((cli: any, i: number) => (
                        <div key={i} className="bg-white p-2 rounded border border-red-500/10 text-[11px]">
                          <span className="font-bold text-red-700">{cli.phrase}</span> <span className="text-gray-400">(البيت {cli.verseIndex})</span>
                          <p className="text-gray-500 mt-0.5 leading-normal">{cli.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">الخيال البياني مبتكر ومتميز وخالٍ من الكليشيهات الرتيبة.</p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-xl text-xs leading-relaxed text-gray-700">
                <strong className="text-[#1a472a] block mb-1">التقرير النقدي والأدبي للأصالة:</strong>
                <p>{originalityResult.originalityReport}</p>
              </div>

              {originalityResult.recommendations && originalityResult.recommendations.length > 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl text-xs">
                  <strong className="text-emerald-900 font-serif block mb-2">توصيات فحول النقاد لرفع فرادة القصيدة:</strong>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed flex flex-col gap-2">
                    {originalityResult.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 10. CREATIVE INSPIRATION BOARD GENERATOR */}
      {activeSubTool === 'inspiration' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="bg-[#fcfaf7] border border-[#b58d3d]/25 rounded-2xl p-4 flex flex-col md:flex-row items-end gap-4 text-xs">
            <div className="flex-1">
              <label className="font-bold text-[#1a472a] block mb-1">حدد فكرة أو غرضاً تريد إثارة قريحتك النظمية حوله:</label>
              <input
                type="text"
                value={inspirationTopic}
                onChange={(e) => setInspirationTopic(e.target.value)}
                placeholder="اكتب موضوعاً؛ مثل: (الفخر بالشرف والسعي وراء العلا، أو ذكرى ديار الأحبة بعد الفراق)..."
                className="w-full bg-white border border-gray-200 rounded-xl p-3 font-serif font-bold text-sm focus:ring-2 focus:ring-[#1a472a] outline-none"
              />
            </div>
            <button
              onClick={() => handleToolSubmit('inspiration-generate', { topic: inspirationTopic })}
              disabled={loading || !inspirationTopic.trim()}
              className="bg-indigo-700 text-white hover:bg-indigo-900 px-6 py-3 rounded-xl font-bold shrink-0 shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
              {loading ? 'يجري بعث الأخيلة ومعاجم الدواوين...' : 'توليد لوحة الإلهام الفني'}
            </button>
          </div>

          {inspirationResult && (
            <div className="border border-indigo-200 bg-indigo-50/10 rounded-2xl p-5 mt-2 animate-fade-in flex flex-col gap-5">
              <div className="border-b border-indigo-100 pb-2">
                <span className="text-[10px] text-indigo-500 font-bold block uppercase tracking-wider">لوحة الإلهام الفكري المفتوحة</span>
                <h3 className="font-serif font-black text-lg text-indigo-950 mt-1">« {inspirationResult.themeName} »</h3>
              </div>

              {/* Imagery and Scenes list */}
              <div>
                <h4 className="font-serif font-bold text-sm text-[#1a472a] mb-2.5">🎥 صور واستعارات بيانية متميزة (مواد للنظم):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {inspirationResult.imageryAndScenes?.map((img: any, idx: number) => (
                    <div key={idx} className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs">
                      <strong className="text-[#8b1d2e] font-serif block text-sm mb-1">{img.title}</strong>
                      <p className="text-gray-600 leading-relaxed font-serif italic">"{img.description}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Symbols & History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-indigo-100/40 pt-4 text-xs">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#1a472a] mb-2">🏛️ رموز تراثية ودلالات نفسية موصى بها:</h4>
                  <div className="flex flex-col gap-2">
                    {inspirationResult.symbolsAndHistory?.map((sym: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100">
                        <strong className="text-indigo-900 block font-serif">{sym.symbol}</strong>
                        <p className="text-gray-500 text-[11px] mt-0.5 leading-normal">{sym.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Classical vocabulary list */}
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#8b1d2e] mb-2">📜 معجم المفردات التراثية الجزلة المقترحة:</h4>
                  <div className="flex flex-col gap-2">
                    {inspirationResult.classicalVocabulary?.map((voc: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-2.5">
                        <span className="font-serif font-bold text-sm text-[#8b1d2e] bg-red-50 px-2 py-1 rounded shrink-0">{voc.word}</span>
                        <p className="text-gray-500 text-[11px] leading-relaxed">{voc.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Philosophical Themes */}
              {inspirationResult.philosophicalThemes && inspirationResult.philosophicalThemes.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-xs">
                  <strong className="text-indigo-950 font-serif block mb-2">💡 آفاق وفلسفة عاطفية للتدرج المعنوي للقصيدة:</strong>
                  <ul className="list-decimal list-inside text-gray-700 leading-relaxed flex flex-col gap-2">
                    {inspirationResult.philosophicalThemes.map((theme: string, idx: number) => (
                      <li key={idx} className="font-serif">{theme}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 11. ADVANCED RHETORICAL ANALYSIS ENGINE */}
      {activeSubTool === 'rhetorical' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#8b1d2e] block">الصق القصيدة أو الأبيات للتحليل البلاغي والبياني المفصل:</label>
            <textarea
              value={rhetoricalText}
              onChange={(e) => setRhetoricalText(e.target.value)}
              placeholder="الصق أبياتك الشعرية هنا ليستكشف النظام الصور البلاغية والبدائع والتشبيهات..."
              className="w-full min-h-[140px] border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#8b1d2e] outline-none font-serif"
            />
          </div>

          <button
            onClick={() => handleToolSubmit('rhetorical-analyze', { poemText: rhetoricalText })}
            disabled={loading || !rhetoricalText}
            className="w-full bg-[#8b1d2e] text-white hover:bg-red-800 py-3 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
            {loading ? 'يجري تفكيك النص واستخراج الصور والبدائع البلاغية...' : 'تحليل البيان والبدائع والأخيلة البلاغية'}
          </button>

          {rhetoricalResult && (
            <div className="border border-red-100 bg-red-50/5 rounded-2xl p-5 mt-2 animate-fade-in flex flex-col gap-5">
              
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs">
                <h4 className="font-serif font-black text-sm text-[#8b1d2e] mb-2 flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  النقد البلاغي والدراسة الجمالية الشاملة:
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed font-serif">{rhetoricalResult.rhetoricalCritique}</p>
              </div>

              {/* Similes */}
              {rhetoricalResult.similes && rhetoricalResult.similes.length > 0 && (
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#1a472a] mb-2">✨ مظهر التشبيه وأركانه الفنية:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {rhetoricalResult.similes.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white border border-gray-100 p-3.5 rounded-xl">
                        <span className="font-serif font-semibold text-xs text-[#8b1d2e] block mb-1">« {item.phrase} »</span>
                        <p className="text-[10px] text-[#1a472a] font-bold">نوع التشبيه: {item.type}</p>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{item.analysis}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metaphors */}
              {rhetoricalResult.metaphors && rhetoricalResult.metaphors.length > 0 && (
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#1a472a] mb-2">🎭 الاستعارات والمجازات والأخيلة الممتدة:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {rhetoricalResult.metaphors.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white border border-gray-100 p-3.5 rounded-xl">
                        <span className="font-serif font-semibold text-xs text-[#8b1d2e] block mb-1">« {item.phrase} »</span>
                        {item.isExtended && <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-bold inline-block mb-1">استعارة ممتدة</span>}
                        <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{item.analysis}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metonymies & Symbols */}
              {rhetoricalResult.metonymiesAndSymbols && rhetoricalResult.metonymiesAndSymbols.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-xs">
                  <div>
                    <h4 className="font-serif font-bold text-xs text-[#1a472a] mb-2">🗝️ الكنايات والرموز ودلالاتها التراثية:</h4>
                    <div className="flex flex-col gap-2">
                      {rhetoricalResult.metonymiesAndSymbols.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100">
                          <span className="font-serif font-semibold text-xs text-[#8b1d2e] block mb-0.5">« {item.phrase} »</span>
                          <span className="text-[9px] text-indigo-800 font-bold bg-indigo-50 px-1 py-0.5 rounded inline-block mb-1">{item.type}</span>
                          <p className="text-[11px] text-gray-500 leading-relaxed">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Antithesis (Tibaq and Muqabalah) */}
                  {rhetoricalResult.antithesis && rhetoricalResult.antithesis.length > 0 && (
                    <div>
                      <h4 className="font-serif font-bold text-xs text-[#1a472a] mb-2">⚖️ الطباق والمقابلة في بناء المعاني:</h4>
                      <div className="flex flex-col gap-2">
                        {rhetoricalResult.antithesis.map((item: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-1.5 text-xs font-serif font-bold mb-1">
                              <span className="text-gray-800 font-bold">{item.word1}</span>
                              <span className="text-[#8b1d2e]">↔</span>
                              <span className="text-[#8b1d2e] font-bold">{item.word2}</span>
                              <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold ms-auto">{item.type}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">{item.analysis}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Syntactic Parallelism & Acoustic Patterns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-xs">
                {rhetoricalResult.syntacticParallelism && rhetoricalResult.syntacticParallelism.length > 0 && (
                  <div>
                    <h4 className="font-serif font-bold text-xs text-[#1a472a] mb-2">📐 التوازي والتماثل التركيبي الهندسي:</h4>
                    <div className="flex flex-col gap-2">
                      {rhetoricalResult.syntacticParallelism.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100">
                          <p className="font-serif font-bold text-[#8b1d2e] text-[11px] mb-1">« {item.verses} »</p>
                          <p className="text-[11px] text-gray-500 leading-relaxed">{item.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rhetoricalResult.acousticAndRepetitions && rhetoricalResult.acousticAndRepetitions.length > 0 && (
                  <div>
                    <h4 className="font-serif font-bold text-xs text-[#8b1d2e] mb-2">🎵 الموسيقى الداخلية وجرَس الأنماط الصوتية:</h4>
                    <div className="flex flex-col gap-2">
                      {rhetoricalResult.acousticAndRepetitions.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-serif font-semibold text-xs text-[#8b1d2e]">« {item.phrase} »</span>
                            <span className="text-[9px] bg-red-50 text-[#8b1d2e] px-1.5 py-0.5 rounded font-bold">{item.pattern}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-relaxed">{item.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}

