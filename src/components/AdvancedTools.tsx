import React, { useState } from 'react';
import { Sparkles, ArrowRightLeft, BookOpen, HelpCircle, PenTool, Search, MessageSquare, Clipboard, Check, RefreshCw, Upload, FileText, ChevronRight, Scale } from 'lucide-react';
import { PoeticMeterInfo } from '../types';

interface AdvancedToolsProps {
  meters: PoeticMeterInfo[];
  currentPoem: any;
  onApplyNewPoem: (poem: any) => void;
}

export function AdvancedTools({ meters, currentPoem, onApplyNewPoem }: AdvancedToolsProps) {
  const [activeSubTool, setActiveSubTool] = useState<'rhymes' | 'prose2poem' | 'transmute' | 'rhymeChanger' | 'critique' | 'comparison'>('rhymes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
}
