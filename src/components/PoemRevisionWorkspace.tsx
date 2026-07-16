import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Save, 
  History, 
  Check, 
  RefreshCw, 
  BookOpen, 
  Activity, 
  Scale, 
  PenTool, 
  Compass, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw,
  Eye,
  Sliders,
  ChevronLeft
} from 'lucide-react';
import { GeneratedPoem, PoemVerse } from '../types';

interface PoemRevisionWorkspaceProps {
  poem: GeneratedPoem;
  isDarkMode: boolean;
  onClose: () => void;
  onSaveFinal: (revisedPoem: GeneratedPoem) => void;
}

interface VerseVersion {
  shatr1: string;
  shatr2: string;
  timestamp: string;
  source: 'manual' | 'ai';
  note: string;
}

interface AnalysisReport {
  metricalAssessment: string;
  rhymeAssessment: string;
  linguisticAssessment: string;
  stylisticAssessment: string;
  rhetoricalAssessment: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export default function PoemRevisionWorkspace({ 
  poem, 
  isDarkMode, 
  onClose, 
  onSaveFinal 
}: PoemRevisionWorkspaceProps) {
  // Verses state
  const [verses, setVerses] = useState<PoemVerse[]>([]);
  
  // Tracking active edits for each verse
  const [editingVerses, setEditingVerses] = useState<Record<number, { shatr1: string; shatr2: string }>>({});
  
  // Version history for each verse
  const [verseVersions, setVerseVersions] = useState<Record<number, VerseVersion[]>>({});
  
  // Active comparison state for each verse: verseIndex -> compareWithVersionIndex
  const [comparingVersions, setComparingVersions] = useState<Record<number, number>>({});

  // AI input for each verse
  const [aiInstructions, setAiInstructions] = useState<Record<number, string>>({});
  const [verseLoading, setVerseLoading] = useState<Record<number, boolean>>({});
  const [verseExpl, setVerseExpl] = useState<Record<number, string>>({});

  // Global analysis state
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // General state
  const [poemTitle, setPoemTitle] = useState(poem.title);
  const [isSaved, setIsSaved] = useState(false);

  // Initialize workspace from poem
  useEffect(() => {
    if (poem && poem.verses) {
      setVerses(poem.verses);
      setPoemTitle(poem.title);
      
      const initialEdits: Record<number, { shatr1: string; shatr2: string }> = {};
      const initialVersions: Record<number, VerseVersion[]> = {};
      
      const nowStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      poem.verses.forEach(v => {
        initialEdits[v.index] = { shatr1: v.shatr1, shatr2: v.shatr2 };
        initialVersions[v.index] = [{
          shatr1: v.shatr1,
          shatr2: v.shatr2,
          timestamp: nowStr,
          source: 'manual',
          note: 'النسخة الأصلية المستوردة'
        }];
      });
      
      setEditingVerses(initialEdits);
      setVerseVersions(initialVersions);
    }
  }, [poem]);

  // Request global scholarly analysis of the entire poem
  const handleFetchFullAnalysis = async () => {
    setLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/literary-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolAction: 'workspace-poem-analysis',
          payload: {
            verses: verses,
            meterName: poem.meterName,
            rhymeLetter: poem.rhymeLetter
          }
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysisReport(data);
    } catch (err: any) {
      setAnalysisError(err.message || 'فشل تحميل التحليل البلاغي الشامل.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Auto-run analysis on mount to keep interface scholarly
  useEffect(() => {
    if (verses.length > 0 && !analysisReport && !loadingAnalysis) {
      handleFetchFullAnalysis();
    }
  }, [verses]);

  // Manual save for single verse card
  const handleManualSaveVerse = (verseIndex: number) => {
    const edit = editingVerses[verseIndex];
    if (!edit) return;

    // Update main verses array
    setVerses(prev => prev.map(v => v.index === verseIndex ? { ...v, shatr1: edit.shatr1, shatr2: edit.shatr2 } : v));

    // Save to version history
    const nowStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newVersion: VerseVersion = {
      shatr1: edit.shatr1,
      shatr2: edit.shatr2,
      timestamp: nowStr,
      source: 'manual',
      note: 'تعديل يدوي من الأديب'
    };

    setVerseVersions(prev => ({
      ...prev,
      [verseIndex]: [...(prev[verseIndex] || []), newVersion]
    }));

    // Reset comparison
    setComparingVersions(prev => {
      const copy = { ...prev };
      delete copy[verseIndex];
      return copy;
    });

    // Notify save
    setIsSaved(false);
  };

  // AI-Assisted Verse modification
  const handleAiModifyVerse = async (verseIndex: number, instruction: string) => {
    if (!instruction.trim()) return;

    setVerseLoading(prev => ({ ...prev, [verseIndex]: true }));
    setVerseExpl(prev => ({ ...prev, [verseIndex]: '' }));

    const edit = editingVerses[verseIndex] || { shatr1: '', shatr2: '' };

    try {
      const res = await fetch('/api/literary-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolAction: 'verse-ai-modify',
          payload: {
            shatr1: edit.shatr1,
            shatr2: edit.shatr2,
            instruction: instruction,
            meterName: poem.meterName,
            rhymeLetter: poem.rhymeLetter
          }
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Update current edit field values
      setEditingVerses(prev => ({
        ...prev,
        [verseIndex]: { shatr1: data.shatr1, shatr2: data.shatr2 }
      }));

      // Automatically update the main verse listing
      setVerses(prev => prev.map(v => v.index === verseIndex ? { ...v, shatr1: data.shatr1, shatr2: data.shatr2 } : v));

      // Append to versions history
      const nowStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newVersion: VerseVersion = {
        shatr1: data.shatr1,
        shatr2: data.shatr2,
        timestamp: nowStr,
        source: 'ai',
        note: `تهذيب آلي: ${instruction}`
      };

      setVerseVersions(prev => ({
        ...prev,
        [verseIndex]: [...(prev[verseIndex] || []), newVersion]
      }));

      // Display AI explanation of changes
      if (data.explanation) {
        setVerseExpl(prev => ({ ...prev, [verseIndex]: data.explanation }));
      }

      setIsSaved(false);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تعديل البيت عروضياً.');
    } finally {
      setVerseLoading(prev => ({ ...prev, [verseIndex]: false }));
    }
  };

  // Restore a specific historical version for a verse
  const handleRestoreVersion = (verseIndex: number, versionIdx: number) => {
    const historical = verseVersions[verseIndex]?.[versionIdx];
    if (!historical) return;

    // Reset current edit values
    setEditingVerses(prev => ({
      ...prev,
      [verseIndex]: { shatr1: historical.shatr1, shatr2: historical.shatr2 }
    }));

    // Update verses list
    setVerses(prev => prev.map(v => v.index === verseIndex ? { ...v, shatr1: historical.shatr1, shatr2: historical.shatr2 } : v));

    // Save as a new version entry indicating restoration
    const nowStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const restoreVersion: VerseVersion = {
      shatr1: historical.shatr1,
      shatr2: historical.shatr2,
      timestamp: nowStr,
      source: 'manual',
      note: `استعادة نسخة من تاريخ [${historical.timestamp}]`
    };

    setVerseVersions(prev => ({
      ...prev,
      [verseIndex]: [...(prev[verseIndex] || []), restoreVersion]
    }));

    // Clear comparison
    setComparingVersions(prev => {
      const copy = { ...prev };
      delete copy[verseIndex];
      return copy;
    });

    setIsSaved(false);
  };

  // Final Poem Save
  const handleSaveFinalPoem = () => {
    const finalPoem: GeneratedPoem = {
      ...poem,
      title: poemTitle,
      verses: verses,
      createdAt: new Date().toISOString()
    };

    onSaveFinal(finalPoem);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Helper lists of pre-defined instructions for fast workflow
  const preDefinedInstructions = [
    { label: 'تقوية البلاغة والبيان', val: 'Improve imagery and eloquence' },
    { label: 'إصلاح الكسر العروضي والوزن', val: 'Repair meter and weights' },
    { label: 'استبدال الكلمات بمرادفات أفخم', val: 'Replace words with classical synonyms' },
    { label: 'تعميق المعاني الفلسفية', val: 'Deepen intellectual and philosophical meaning' },
    { label: 'تبسيط التراكيب مع صون القافية', val: 'Simplify language style' },
  ];

  return (
    <div className="space-y-6 animate-fade-in scroll-mt-6" id="revision-workspace-root">
      {/* Top Banner Navigation */}
      <div className="p-6 rounded-3xl border relative overflow-hidden bg-[#09140d]/90 border-[#dfba6b]/30 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-amber-500"
              title="رجوع للقصيدة"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#dfba6b]/15 text-[#dfba6b] border border-[#dfba6b]/30">محترف النقد والتهذيب</span>
                <span className="text-xs text-emerald-300 font-serif">بحر {poem.meterName} • الروي: {poem.rhymeLetter}</span>
              </div>
              <input 
                type="text"
                value={poemTitle}
                onChange={(e) => setPoemTitle(e.target.value)}
                className="bg-transparent border-b border-white/10 focus:border-[#dfba6b] text-xl font-bold font-serif outline-none py-1 mt-1 text-[#dfba6b] max-w-md"
                placeholder="عنوان المخطوطة..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSaveFinalPoem}
              className="px-6 py-3 bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 text-white border border-[#dfba6b]/40 font-bold text-xs rounded-2xl shadow-md cursor-pointer transition-all flex items-center gap-2 animate-pulse hover:animate-none"
            >
              {isSaved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4 text-[#dfba6b]" />}
              <span>{isSaved ? 'تم حفظ النسخة النهائية!' : 'حفظ النسخة النهائية'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - Full Poem Analysis Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl border shadow-sm h-full flex flex-col bg-[#09140d]/95 border-[#dfba6b]/20">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 shrink-0">
              <h3 className="font-serif font-black text-sm text-[#dfba6b] flex items-center gap-2">
                <BookOpen className="w-4 h-5 text-emerald-500" />
                التقرير الأكاديمي والتحليل التخصصي
              </h3>
              <button 
                onClick={handleFetchFullAnalysis}
                disabled={loadingAnalysis}
                className="p-1.5 rounded-lg text-emerald-400 hover:text-white disabled:opacity-50"
                title="إعادة تحليل المخطوطة"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalysis ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingAnalysis && (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <RefreshCw className="w-8 h-8 text-[#dfba6b] animate-spin mb-4" />
                <p className="text-xs text-emerald-300 font-serif leading-normal">يجري تحكيم المخطوطة بيتاً بيتاً عروضياً ولغوياً وبلاغياً...</p>
                <span className="text-[10px] text-gray-500 mt-1">يجريه مجلس النقاد الأكاديمي لبيت الشعر</span>
              </div>
            )}

            {analysisError && !loadingAnalysis && (
              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs text-center py-8">
                <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                <p>{analysisError}</p>
                <button 
                  onClick={handleFetchFullAnalysis}
                  className="mt-4 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl text-[10px]"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {analysisReport && !loadingAnalysis && (
              <div className="flex-1 overflow-y-auto max-h-[800px] custom-scroll space-y-5 pr-1">
                {/* Metrical & Rhyme stats combined */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-[#030a05] border border-emerald-950">
                    <span className="text-[10px] uppercase font-black text-emerald-400 font-serif block mb-1">المطابقة العروضية</span>
                    <p className="text-xs text-emerald-100 leading-relaxed font-serif">{analysisReport.metricalAssessment}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#030a05] border border-emerald-950">
                    <span className="text-[10px] uppercase font-black text-[#dfba6b] font-serif block mb-1">المدخل القافي والروي</span>
                    <p className="text-xs text-emerald-100 leading-relaxed font-serif">{analysisReport.rhymeAssessment}</p>
                  </div>
                </div>

                {/* Linguistic & Stylistic */}
                <div className="p-4 rounded-2xl bg-[#030a05] border border-emerald-950 space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-emerald-400 block mb-1 font-serif">● تقييم اللغة والمفردات:</span>
                    <p className="text-emerald-100 leading-relaxed font-serif">{analysisReport.linguisticAssessment}</p>
                  </div>
                  <div className="border-t border-emerald-950/45 pt-2">
                    <span className="font-bold text-emerald-400 block mb-1 font-serif">● المنحى الأسلوبي والبنائي:</span>
                    <p className="text-emerald-100 leading-relaxed font-serif">{analysisReport.stylisticAssessment}</p>
                  </div>
                </div>

                {/* Rhetorical */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-xs">
                  <span className="font-bold text-emerald-300 block mb-1 font-serif">● البلاغة والبيان والصور:</span>
                  <p className="text-emerald-100 leading-relaxed font-serif">{analysisReport.rhetoricalAssessment}</p>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-[10px] font-black text-emerald-400 uppercase font-serif flex items-center gap-1 mb-2">
                      <CheckCircle className="w-3.5 h-3.5" /> مواطن القوة والجمال
                    </span>
                    <ul className="space-y-1.5 list-disc list-inside text-[11px] text-emerald-100 font-serif leading-relaxed">
                      {analysisReport.strengths?.map((str, idx) => (
                        <li key={idx} className="marker:text-emerald-500">{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#8b1d2e]/5 border border-[#8b1d2e]/10">
                    <span className="text-[10px] font-black text-rose-400 uppercase font-serif flex items-center gap-1 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> مآخذ ونقاط ضعف
                    </span>
                    <ul className="space-y-1.5 list-disc list-inside text-[11px] text-rose-200 font-serif leading-relaxed">
                      {analysisReport.weaknesses?.map((weak, idx) => (
                        <li key={idx} className="marker:text-rose-500">{weak}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                  <span className="text-[11px] font-black text-amber-300 uppercase font-serif flex items-center gap-1 mb-2">
                    <Compass className="w-4 h-4 text-amber-400" /> توصيات المراجعة وتهذيب النظم
                  </span>
                  <ul className="space-y-2 text-xs text-amber-100 font-serif leading-relaxed">
                    {analysisReport.recommendations?.map((rec, idx) => (
                      <li key={idx} className="flex gap-1.5">
                        <span className="text-amber-500 shrink-0">◀</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Verse-by-Verse Manuscript Board */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between shrink-0 mb-1">
            <h3 className="font-serif font-black text-base text-[#dfba6b] flex items-center gap-2">
              <PenTool className="w-4.5 h-4.5 text-[#8b1d2e]" />
              لوحة الصياغة وتهذيب الأبيات بيتاً بيتاً
            </h3>
            <span className="text-xs text-emerald-400 font-mono">{verses.length} أبيات منظومة</span>
          </div>

          <div className="space-y-6 max-h-[850px] overflow-y-auto custom-scroll pr-1">
            {verses.map((verse, index) => {
              const currentEdit = editingVerses[verse.index] || { shatr1: '', shatr2: '' };
              const history = verseVersions[verse.index] || [];
              const compareIdx = comparingVersions[verse.index];
              const isLoading = verseLoading[verse.index];
              const changesExplanation = verseExpl[verse.index];

              return (
                <div 
                  key={verse.index}
                  className="p-5 rounded-3xl border shadow-xs relative transition-all bg-[#09140d]/90 border-[#dfba6b]/15 hover:border-[#dfba6b]/30 text-white"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                    <span className="text-[10px] font-black uppercase text-[#dfba6b] bg-amber-955/20 px-2.5 py-1 rounded-lg border border-[#dfba6b]/15">
                      البيت {verse.index}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <span>{history.length} نُسخ</span>
                    </div>
                  </div>

                  {/* Editable Fields for Sadr & Ajuz */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-emerald-300 block">صدر البيت (الشطر الأول):</label>
                      <input 
                        type="text"
                        value={currentEdit.shatr1}
                        onChange={(e) => setEditingVerses(prev => ({
                          ...prev,
                          [verse.index]: { ...currentEdit, shatr1: e.target.value }
                        }))}
                        className="w-full p-3 rounded-xl font-serif font-black text-sm md:text-base border bg-[#030a05] border-white/10 text-white focus:border-[#dfba6b]/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-emerald-300 block">عجز البيت (الشطر الثاني):</label>
                      <input 
                        type="text"
                        value={currentEdit.shatr2}
                        onChange={(e) => setEditingVerses(prev => ({
                          ...prev,
                          [verse.index]: { ...currentEdit, shatr2: e.target.value }
                        }))}
                        className="w-full p-3 rounded-xl font-serif font-black text-sm md:text-base border bg-[#030a05] border-white/10 text-white focus:border-[#dfba6b]/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Manual Save Button */}
                  <div className="flex justify-end gap-2 border-b border-dashed border-white/5 pb-3 mb-4">
                    <button
                      onClick={() => handleManualSaveVerse(verse.index)}
                      className="px-3.5 py-1.5 bg-[#8b1d2e] hover:bg-[#a32236] border border-[#dfba6b]/30 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>حفظ وتوثيق التعديل اليدوي</span>
                    </button>
                  </div>

                  {/* AI Assistant for this Verse */}
                  <div className="space-y-3 bg-black/30 p-3.5 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        استشارة ومعالجة البيت عروضياً وبلاغياً بالـ AI
                      </span>
                    </div>

                    {/* Predefined prompts */}
                    <div className="flex flex-wrap gap-1.5">
                      {preDefinedInstructions.map((p, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleAiModifyVerse(verse.index, p.label)}
                          disabled={isLoading}
                          className="px-2.5 py-1 text-[9px] bg-[#0c1e11] hover:bg-[#15341d] border border-[#dfba6b]/20 text-emerald-100 rounded-lg cursor-pointer transition-all"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom instruction */}
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={aiInstructions[verse.index] || ''}
                        onChange={(e) => setAiInstructions(prev => ({ ...prev, [verse.index]: e.target.value }))}
                        placeholder="أدخل توجيهاً مخصصاً... (مثال: 'استبدل كلمة المحافل بكلمة السنابل' أو 'أصلح تفعيلة العجز')"
                        className="flex-1 p-2 rounded-xl text-xs border bg-[#030a05] border-white/10 text-white focus:outline-none focus:border-[#dfba6b]"
                        disabled={isLoading}
                      />
                      <button
                        onClick={() => handleAiModifyVerse(verse.index, aiInstructions[verse.index] || '')}
                        disabled={isLoading || !(aiInstructions[verse.index] || '').trim()}
                        className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white border border-[#dfba6b]/35 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-all shrink-0"
                      >
                        {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'تطبيق'}
                      </button>
                    </div>

                    {/* AI Changes Explanation */}
                    {changesExplanation && (
                      <div className="text-[10px] text-emerald-400 leading-relaxed font-serif bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                        <b>تقرير الصقل:</b> {changesExplanation}
                      </div>
                    )}
                  </div>

                  {/* Version Control Timeline */}
                  {history.length > 1 && (
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold">
                        <span className="flex items-center gap-1">
                          <History className="w-3.5 h-3.5 text-[#dfba6b]" />
                          أرشيف التعديلات والنسخ السابقة
                        </span>
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto custom-scroll pr-1">
                        {history.map((v, vIdx) => {
                          const isCurrentActive = currentEdit.shatr1 === v.shatr1 && currentEdit.shatr2 === v.shatr2;
                          const isComparing = compareIdx === vIdx;

                          return (
                            <div 
                              key={vIdx}
                              className={`p-2.5 rounded-xl border text-[10px] flex flex-col md:flex-row justify-between gap-2 transition-all ${
                                isCurrentActive 
                                  ? 'bg-amber-500/5 border-[#dfba6b]/30' 
                                  : 'bg-black/40 border-white/5'
                              }`}
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[9px] text-gray-500">[{v.timestamp}]</span>
                                  <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold ${
                                    v.source === 'ai' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#030a05] text-gray-400'
                                  }`}>{v.source === 'ai' ? 'صقل آلي' : 'تعديل أديب'}</span>
                                  <span className="text-emerald-300 italic font-serif">{v.note}</span>
                                </div>
                                <div className="font-serif font-semibold text-emerald-100">
                                  {v.shatr1} ... {v.shatr2}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 self-end">
                                <button
                                  onClick={() => setComparingVersions(prev => prev[verse.index] === vIdx ? { ...prev, [verse.index]: -1 } : { ...prev, [verse.index]: vIdx })}
                                  className={`px-2 py-1 rounded-[4px] font-bold text-[8px] flex items-center gap-0.5 border ${
                                    isComparing 
                                      ? 'bg-[#dfba6b] text-[#030a05] border-[#dfba6b]' 
                                      : 'bg-transparent border-white/10 text-[#dfba6b]'
                                  }`}
                                  title="قارن الفروق"
                                >
                                  <Scale className="w-2.5 h-2.5" />
                                  <span>{isComparing ? 'إغلاق المقارنة' : 'مقارنة'}</span>
                                </button>
                                <button
                                  onClick={() => handleRestoreVersion(verse.index, vIdx)}
                                  disabled={isCurrentActive}
                                  className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 disabled:opacity-40 rounded-[4px] font-bold text-[8px] flex items-center gap-0.5 transition-all"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>استعادة</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Side by Side Difference Comparison block */}
                      {compareIdx !== undefined && compareIdx >= 0 && history[compareIdx] && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-[10px] space-y-2 animate-fade-in font-serif">
                          <p className="font-bold text-amber-500 flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5" />
                            مقارنة مجهرية للفروق:
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#030a05]/50 p-2 rounded-lg border border-white/5">
                              <span className="text-[8px] text-gray-400 font-bold block mb-1">النسخة السابقة المحددة:</span>
                              <p className="font-bold text-[#dfba6b]">{history[compareIdx].shatr1}</p>
                              <p className="font-bold text-[#dfba6b]">{history[compareIdx].shatr2}</p>
                            </div>
                            <div className="bg-[#030a05]/50 p-2 rounded-lg border border-white/5">
                              <span className="text-[8px] text-emerald-400 font-bold block mb-1">النسخة الحالية النشطة:</span>
                              <p className="font-bold text-white">{currentEdit.shatr1}</p>
                              <p className="font-bold text-white">{currentEdit.shatr2}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
