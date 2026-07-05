/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  FileText, 
  User, 
  Layers, 
  ChevronRight, 
  HelpCircle, 
  Trash2, 
  RotateCcw,
  Feather,
  Quote,
  Flame,
  Globe,
  Plus,
  Moon,
  Sun,
  Sliders,
  Award,
  Music,
  Star,
  ArrowLeftRight,
  Scissors,
  TrendingUp
} from 'lucide-react';
import MeterSelector from './components/MeterSelector';
import PoemDisplay from './components/PoemDisplay';
import HistoryList from './components/HistoryList';
import { AdvancedTools } from './components/AdvancedTools';
import PoeticOpposition from './components/PoeticOpposition';
import PoeticIndustries from './components/PoeticIndustries';
import PoemRevisionWorkspace from './components/PoemRevisionWorkspace';
import { PoetAnalytics } from './components/PoetAnalytics';
import { METERS_DATA } from './metersData';
import { GenerationParams, GeneratedPoem, RhymeSystem } from './types';

// Sliding educational/literary quotes to entertain the user while generating (which can take 10-15s due to long verses)
const LOADING_QUOTES = [
  "يجري الآن وزن الكلمات ومطابقتها للتفعيلات العروضية بدقة...",
  "يصوغ Gemini الأبيات بلغة تراثية جزلة تليق بدواوين العرب الحكيمة...",
  "يقوم الشاعر الرقمي بتحليل القافية المحددة وحرف الروي المختار...",
  "«الشعرُ ديوانُ العربِ، فيهِ حِكمتُهم وبلاغَتُهم وتاريخُهم المَجيد»",
  "«وما من كاتبٍ إلا سيفنى، ويُبقي الدهرُ ما كتبتْ يداهُ»",
  "«ولقد دعتني للمحاسن والندى.. خيلٌ مضوَّرةٌ وبيتٌ مُفردُ»",
  "نقوم الآن بنسج الاستعارات والمجازات وتوظيف البلاغة العباسية الفخمة..."
];

const PRESET_POETS = [
  'المتنبي',
  'أبو تمام',
  'البحتري',
  'أبو العلاء المعري',
  'الشريف الرضي',
  'ابن الفارض',
  'ابن عربي',
  'الشنفرى',
  'امرؤ القيس',
  'جرير',
  'الفرزدق',
  'الأخطل',
  'عنترة بن شداد',
  'أحمد شوقي',
  'إيليا أبو ماضي'
];

const PURPOSES = [
  'المدح',
  'الرثاء',
  'الهجاء',
  'الهجاء الفاحش',
  'الفخر',
  'الحماسة',
  'الغزل',
  'الغزل العفيف',
  'التشبيب',
  'التشبيب الفاحش',
  'الخمريات',
  'الخمريات الفاحشة',
  'الزهد',
  'الحكمة',
  'الوصف',
  'الاعتذار',
  'الشكوى',
  'المناجاة',
  'التصوف',
  'الشعر التعليمي',
  'النقائض',
  'غير ذلك'
];

export default function App() {
  // Gemini API Backend Proxy Connection States
  const [isGeminiConnected, setIsGeminiConnected] = useState<boolean>(true);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'ok') {
            setIsGeminiConnected(data.gemini === 'connected');
          } else {
            setIsGeminiConnected(false);
          }
        } else {
          setIsGeminiConnected(false);
        }
      } catch (e) {
        console.error('Failed to check backend health:', e);
        setIsGeminiConnected(false);
      } finally {
        setCheckingHealth(false);
      }
    };
    checkHealth();
  }, []);

  // 1. Initial State for form
  const [meterName, setMeterName] = useState<string>('الطويل');
  const [purpose, setPurpose] = useState<string>('الفخر');
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [isOpposition, setIsOpposition] = useState<boolean>(false);
  const [oppositionPoem, setOppositionPoem] = useState<string>('');
  const [isSimulatingPoet, setIsSimulatingPoet] = useState<boolean>(false);
  const [poetName, setPoetName] = useState<string>('المتنبي');
  const [description, setDescription] = useState<string>('');
  const [versesCount, setVersesCount] = useState<number>(7);
  const [rhymeSystem, setRhymeSystem] = useState<RhymeSystem>('unified');
  const [customRhymeLetter, setCustomRhymeLetter] = useState<string>('');

  // ميزات متقدمة
  const [activeMainTab, setActiveMainTab] = useState<'studio' | 'opposition' | 'industries' | 'tools' | 'archive' | 'meters' | 'analytics'>('studio');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  
  // إعدادات النظم المتقدمة
  const [temperature, setTemperature] = useState<number>(0.7);
  const [strictMeter, setStrictMeter] = useState<boolean>(true);
  const [vocabularyStyle, setVocabularyStyle] = useState<string>('classic');
  const [poeticGenreForm, setPoeticGenreForm] = useState<string>('classic');

  // محاكاة شاعرين (قصيدة مشتركة)
  const [jointSimulatePoets, setJointSimulatePoets] = useState<boolean>(false);
  const [poetName2, setPoetName2] = useState<string>('أبو نواس');

  // اقتراح البحور والأغراض
  const [suggestLoading, setSuggestLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<{
    meters?: { name: string; reason: string }[];
    purposes?: { name: string; reason: string }[];
  } | null>(null);

  // App-wide lifecycle states
  const [isRevisionWorkspaceOpen, setIsRevisionWorkspaceOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingQuoteIndex, setLoadingQuoteIndex] = useState<number>(0);
  const [currentPoem, setCurrentPoem] = useState<GeneratedPoem | null>(null);
  const [history, setHistory] = useState<GeneratedPoem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Developer Logs State
  const [devLogs, setDevLogs] = useState<any[]>([]);
  const [showLogsPanel, setShowLogsPanel] = useState<boolean>(false);

  const fetchDevLogs = async () => {
    try {
      const res = await fetch('/api/dev-logs');
      if (res.ok) {
        const data = await res.json();
        setDevLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch dev logs', err);
    }
  };

  useEffect(() => {
    if (showLogsPanel) {
      fetchDevLogs();
      const interval = setInterval(fetchDevLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [showLogsPanel]);

  // Load saved poems and dark mode from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('arabic_poems_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
      const savedDarkMode = localStorage.getItem('arabic_poems_dark_mode');
      if (savedDarkMode === 'true') {
        setIsDarkMode(true);
      }
    } catch (err) {
      console.error('Failed to load history from localStorage', err);
    }
  }, []);

  // Update localStorage when history changes
  const saveHistoryToStorage = (updatedHistory: GeneratedPoem[]) => {
    try {
      localStorage.setItem('arabic_poems_history', JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
    } catch (err) {
      console.error('Failed to save history', err);
    }
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.map((poem) => {
      if (poem.id === id) {
        return { ...poem, isFavorite: !poem.isFavorite };
      }
      return poem;
    });
    saveHistoryToStorage(updated);
    if (currentPoem?.id === id) {
      setCurrentPoem({ ...currentPoem, isFavorite: !currentPoem.isFavorite });
    }
  };

  const handleToggleDarkMode = () => {
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    localStorage.setItem('arabic_poems_dark_mode', String(nextVal));
  };

  const handleFetchSuggestions = async () => {
    if (!description.trim()) {
      alert('يرجى كتابة لمحة عن الموضوع أولاً في حقل الوصف!');
      return;
    }
    setSuggestLoading(true);
    setSuggestions(null);
    try {
      const response = await fetch('/api/literary-tool', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toolAction: 'suggest-meters-and-purposes',
          payload: { topic: description }
        })
      });
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSuggestLoading(false);
    }
  };

  // Rotate loading quotes when loading is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingQuoteIndex((prev) => (prev + 1) % LOADING_QUOTES.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!description.trim()) {
      setError('يرجى كتابة وصف نثري لموضوع القصيدة لمساعدة الموديل في صياغتها.');
      setLoading(false);
      return;
    }

    if (versesCount < 1 || versesCount > 100) {
      setError('عدد الأبيات يجب أن يكون بين بيت واحد و100 بيت كحد أقصى.');
      setLoading(false);
      return;
    }

    if (rhymeSystem === 'custom' && !customRhymeLetter.trim()) {
      setError('يرجى تحديد حرف الروي الذي ترغب بالنظم عليه (مثل: م، ل، د).');
      setLoading(false);
      return;
    }

    try {
      let finalDescription = description;
      let finalPoetName = poetName;

      // 1. Handle special genre forms
      if (poeticGenreForm === 'sufi') {
        finalDescription = `[قصيدة صوفية عرفانية عالية المستوى وعميقة المعاني، تتغنى بالوجد الإلهي، والمحبة الروحية، واللطائف الغيبية والفناء في الحق، بأسلوب يعبر عن ذوق روحي رفيع كابن عربي وابن الفارض]:\n${finalDescription}`;
      } else if (poeticGenreForm === 'prophetic') {
        finalDescription = `[قصيدة مديح نبوي شريف، تفيض بمحبة الرسول عليه الصلاة والسلام وذكر صفاته الخَلْقية والخُلُقية وعطر سيرته العذبة، بأسلوب كلاسيكي مهيب يضاهي البوصيري في بردته وأحمد شوقي]:\n${finalDescription}`;
      } else if (poeticGenreForm === 'muwashshah') {
        finalDescription = `[موشح أندلسي أصيل ومطرب، ذو غصون وأقفال ملحنة وقوافٍ متنوعة عذبة النغمة رشيقة الحركة يحاكي لسان الدين بن الخطيب وابن زمرك]:\n${finalDescription}`;
      } else if (poeticGenreForm === 'zajal') {
        finalDescription = `[زجل عربي بليغ وموزون ذو جرس موسيقي شعبي أصيل ورشيق، يقترب من لغة الزجالين الأوائل كابن قزمان]:\n${finalDescription}`;
      } else if (poeticGenreForm === "ruba'iyyat") {
        finalDescription = `[رباعيات فلسفية حكيمة، يتألف كل مقطع من أربعة أشطر بنظام قافية (أ أ ب أ) كرباعيات الخيام الشهيرة، تبحث في أسرار الوجود والزمن والحكمة]:\n${finalDescription}`;
      } else if (poeticGenreForm === "maqtou'at") {
        finalDescription = `[مقطوعة شعرية قصيرة جداً ومكثفة تركز على فكرة واحدة ببلاغة عالية ووجازة فائقة]:\n${finalDescription}`;
      }

      // 2. Handle joint poets style simulation
      if (isSimulatingPoet && jointSimulatePoets) {
        finalPoetName = `${poetName} و ${poetName2}`;
      }

      // 3. Handle advanced controls (vocabularyStyle, temperature, strictness)
      finalDescription = `${finalDescription}\n\n[إرشادات النظم الفنية الإضافية]:\n- نمط المفردات والمعجم اللغوي المفضل: (${vocabularyStyle === 'classic' ? 'تراثي جاهلي جزيل ورصين' : vocabularyStyle === 'abbasid' ? 'عباسي فخم ومنمق بلاغياً' : 'حديث بليغ ميسر السلاسة'}).\n- درجة دقة وتماسك الأوزان العروضية: (${strictMeter ? 'صارمة جداً وخالية تماماً من الكسور أو التسامح العروضي' : 'سلسة ومعتدلة'}).`;

      const params: GenerationParams = {
        meterName,
        purpose,
        customPurpose: purpose === 'غير ذلك' ? customPurpose : undefined,
        isOpposition,
        oppositionPoem: isOpposition ? oppositionPoem : undefined,
        isSimulatingPoet,
        poetName: isSimulatingPoet ? finalPoetName : undefined,
        description: finalDescription,
        versesCount,
        rhymeSystem,
        customRhymeLetter: rhymeSystem === 'custom' ? customRhymeLetter : undefined,
      };

      const response = await fetch('/api/generate-poem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل توليد القصيدة. يرجى مراجعة الخادم.');
      }

      const rawPoemData = await response.json();
      
      // Construct final object
      const newPoem: GeneratedPoem = {
        id: rawPoemData.id || Math.random().toString(36).substring(2, 9),
        title: rawPoemData.title || 'قصيدة مرتجلة',
        verses: rawPoemData.verses || [],
        meterName: rawPoemData.meterName || meterName,
        feet: rawPoemData.feet || 'غير معروف',
        rhymeLetter: rawPoemData.rhymeLetter || customRhymeLetter || 'تلقائي',
        purpose: rawPoemData.purpose || (purpose === 'غير ذلك' ? customPurpose : purpose),
        poetSimulated: isSimulatingPoet ? poetName : undefined,
        isOpposition: isOpposition,
        explanation: rawPoemData.explanation,
        weightSafetyPercentage: rawPoemData.weightSafetyPercentage,
        rhymeSafetyPercentage: rawPoemData.rhymeSafetyPercentage,
        createdAt: rawPoemData.createdAt || new Date().toISOString(),
      };

      setCurrentPoem(newPoem);
      
      // Save to history
      const updatedHistory = [newPoem, ...history];
      saveHistoryToStorage(updatedHistory);

      // Scroll smoothly to results
      setTimeout(() => {
        document.getElementById('poem-results-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ في الاتصال بالذكاء الاصطناعي لتوليد القصيدة.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFromHistory = (poem: GeneratedPoem) => {
    setCurrentPoem(poem);
    // Populate form with poem variables to allow easy fine-tuning
    setMeterName(poem.meterName);
    setPurpose(poem.purpose);
    setVersesCount(poem.verses.length);
    if (poem.poetSimulated) {
      setIsSimulatingPoet(true);
      setPoetName(poem.poetSimulated);
    } else {
      setIsSimulatingPoet(false);
    }
    // Scroll smoothly to the results
    setTimeout(() => {
      document.getElementById('poem-results-view')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDeletePoem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((p) => p.id !== id);
    saveHistoryToStorage(updated);
    if (currentPoem?.id === id) {
      setCurrentPoem(null);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف جميع القصائد المحفوظة بالديوان؟ لا يمكن استرجاعها.')) {
      saveHistoryToStorage([]);
      setCurrentPoem(null);
    }
  };



  return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${
      isDarkMode 
        ? 'bg-[#0a120d] text-[#e8f5ee] selection:bg-[#dfba6b]/30 selection:text-[#aef8cf]' 
        : 'bg-[#f8f5f0] text-gray-900 selection:bg-[#b58d3d]/30 selection:text-[#1a472a]'
    }`} id="app-root">
      {/* Decorative top strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#1a472a] via-[#b58d3d] to-[#8b1d2e]" />

      {/* Royal Elegant Header */}
      <header className={`border-b transition-colors duration-300 shadow-md py-5 px-4 md:px-8 relative z-20 ${
        isDarkMode ? 'bg-[#0f2115] border-[#dfba6b]/30 text-white' : 'bg-[#1a472a] border-[#b58d3d]/40 text-white'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#b58d3d] rounded-xl flex items-center justify-center text-2xl shadow-md border border-[#fbf9f4]/20 shrink-0">
              🖋️
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-white flex items-center gap-2">
                صانع الشعر العربي
                <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-[#8b1d2e] text-white border border-red-500/20 animate-pulse">
                  Gemini مدفوع
                </span>
              </h1>
              <p className={`text-xs font-sans mt-0.5 ${isDarkMode ? 'text-[#dfba6b]' : 'text-[#b58d3d]'}`}>
                منصة كلاسيكية ذكية لنظم الشعر العربي الفصيح الموزون وتحليل تفعيلات الخليل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={handleToggleDarkMode}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-[#152e1f] border-[#dfba6b]/30 text-[#dfba6b] hover:bg-[#1f422e]' 
                  : 'bg-[#1a472a] border-[#b58d3d]/30 text-[#b58d3d] hover:bg-[#235f38]'
              }`}
              title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <span className={`text-xs border px-3 py-1.5 rounded-lg font-serif hidden sm:inline-block ${
              isDarkMode ? 'border-[#dfba6b]/30 bg-[#0a120d] text-[#dfba6b]' : 'border-[#b58d3d]/30 bg-[#1a472a]/50 text-[#b58d3d]'
            }`}>
              ديوان العرب الرقمي
            </span>

            <span className="text-[10px] uppercase font-mono tracking-widest text-white/50 hidden md:inline-block">
              v2.6.0 • نشط
            </span>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 mt-5 border-t border-white/10 pt-4 overflow-x-auto custom-scroll">
          <button
            onClick={() => setActiveMainTab('studio')}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'studio'
                ? 'bg-[#dfba6b] text-[#1a472a] shadow-md'
                : 'text-white/80 hover:bg-white/5'
            }`}
          >
            <Feather className="w-3.5 h-3.5" />
            صومعة النظم والبحور
          </button>

          <button
            onClick={() => setActiveMainTab('opposition')}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'opposition'
                ? 'bg-[#dfba6b] text-[#1a472a] shadow-md'
                : 'text-white/80 hover:bg-white/5'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            المعارضة الشعرية
          </button>

          <button
            onClick={() => setActiveMainTab('industries')}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'industries'
                ? 'bg-[#dfba6b] text-[#1a472a] shadow-md'
                : 'text-white/80 hover:bg-white/5'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            الصناعات الشعرية التراثية
          </button>

          <button
            onClick={() => setActiveMainTab('tools')}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'tools'
                ? 'bg-[#dfba6b] text-[#1a472a] shadow-md'
                : 'text-white/80 hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            أدوات البلاغة والعروض المتقدمة
          </button>

          <button
            onClick={() => setActiveMainTab('archive')}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'archive'
                ? 'bg-[#dfba6b] text-[#1a472a] shadow-md'
                : 'text-white/80 hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            ديوانك المحفوظ ({history.length})
          </button>

          <button
            onClick={() => setActiveMainTab('meters')}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'meters'
                ? 'bg-[#dfba6b] text-[#1a472a] shadow-md'
                : 'text-white/80 hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            موسوعة البحور العربية
          </button>

          <button
            onClick={() => setActiveMainTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'analytics'
                ? 'bg-[#dfba6b] text-[#1a472a] shadow-md'
                : 'text-white/80 hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            تحليلات الشاعر البيانية
          </button>


        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6 relative">
        
        {/* Banner quote */}
        <div className={`border transition-colors duration-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center gap-4 ${
          isDarkMode ? 'bg-[#0f1d14] border-[#dfba6b]/20 text-[#e8f5ee]' : 'bg-white border-[#b58d3d]/25 text-gray-800'
        }`}>
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-amber-50/20 to-transparent pointer-events-none" />
          <div className={`p-3 rounded-xl shrink-0 ${isDarkMode ? 'bg-[#dfba6b]/10' : 'bg-[#1a472a]/5'}`}>
            <Quote className={`w-6 h-6 ${isDarkMode ? 'text-[#dfba6b]' : 'text-[#8b1d2e]'}`} />
          </div>
          <div>
            <p className="font-serif italic text-sm md:text-base leading-relaxed">
              "الشعر هو طائر يعبر الفترات الطويلة والأزمنة؛ صانع الشعر العربي يعيد إحياء المعلقات ويصوغ القوافي بإلهام متكامل من التراث العربي الفصيح."
            </p>
            <span className={`text-xs font-semibold mt-1 block ${isDarkMode ? 'text-[#dfba6b]' : 'text-[#b58d3d]'}`}>— المخطوطات والقرائح القديمة</span>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in ${
            isDarkMode ? 'bg-[#0a120d]/98' : 'bg-[#f8f5f0]/95'
          }`}>
            <div className="relative mb-8">
              <div className={`w-24 h-24 rounded-full border-4 animate-spin ${
                isDarkMode ? 'border-t-[#dfba6b] border-[#152e1f]' : 'border-t-[#1a472a] border-[#b58d3d]/30'
              }`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Feather className="w-8 h-8 text-[#8b1d2e] animate-bounce" />
              </div>
            </div>
            
            <h3 className={`font-serif font-bold text-2xl mb-2 ${isDarkMode ? 'text-[#dfba6b]' : 'text-[#1a472a]'}`}>
              يجري نظم الدر المنثور عروضياً الآن...
            </h3>
            
            <div className={`max-w-md mx-auto p-4 border rounded-2xl shadow-inner ${
              isDarkMode ? 'bg-[#102216] border-[#dfba6b]/20' : 'bg-white/80 border-amber-200'
            }`}>
              <p className="text-sm font-serif italic animate-pulse text-[#1a6d49] dark:text-[#dfba6b]">
                {LOADING_QUOTES[loadingQuoteIndex]}
              </p>
            </div>
            
            <p className="text-xs text-gray-400 mt-6">
              قد تستغرق الصياغة الدقيقة وعروض البحور من 5 إلى 15 ثانية للتثبت من القافية والوزن.
            </p>
          </div>
        )}

        {/* Active Tab View */}
        {activeMainTab === 'studio' && (
          <div className="space-y-6">
            {isRevisionWorkspaceOpen && currentPoem ? (
              <PoemRevisionWorkspace
                poem={currentPoem}
                isDarkMode={isDarkMode}
                onClose={() => setIsRevisionWorkspaceOpen(false)}
                onSaveFinal={(revisedPoem) => {
                  setCurrentPoem(revisedPoem);
                  const updatedHistory = history.map(p => p.id === revisedPoem.id ? revisedPoem : p);
                  saveHistoryToStorage(updatedHistory);
                }}
              />
            ) : (
              <>
                {/* Results Area if Poem generated */}
                {currentPoem && (
                  <div id="poem-results-view" className="scroll-mt-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
                        <Sparkles className="w-5 h-5 text-[#b58d3d]" />
                        القصيدة المولدة حالياً
                      </h2>
                      <button
                        onClick={() => {
                          setCurrentPoem(null);
                          setIsRevisionWorkspaceOpen(false);
                        }}
                        className="text-xs text-gray-500 hover:text-royal-800 flex items-center gap-1"
                      >
                        إغلاق العرض الحالي <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <PoemDisplay 
                      poem={currentPoem} 
                      onReset={() => {
                        setCurrentPoem(null);
                        setIsRevisionWorkspaceOpen(false);
                      }} 
                      onOpenRevisionWorkspace={() => setIsRevisionWorkspaceOpen(true)}
                    />
                  </div>
                )}

                {/* Input parameters panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main generator parameters form */}
              <form onSubmit={handleSubmit} className={`lg:col-span-8 border rounded-2xl p-6 shadow-sm flex flex-col gap-6 ${
                isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/20' : 'bg-white border-[#b58d3d]/20'
              }`} id="generator-form">
                <div className="border-b border-gray-100 dark:border-white/5 pb-4 mb-2 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className={`text-xl font-bold flex items-center gap-2 font-serif ${isDarkMode ? 'text-[#dfba6b]' : 'text-[#1a472a]'}`}>
                      <Feather className="w-5 h-5 text-[#8b1d2e]" />
                      تهيِئَة مَوَازِينِ القصيدَةِ
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">حدد معايير البحر والغرض ومحاكاة الأساليب المطلوبة لينظمها الذكاء الاصطناعي</p>
                  </div>

                  {/* Poetic Forms / Genres Template Selector */}
                  <div className="flex items-center gap-1.5 bg-royal-50/50 dark:bg-[#152e1f] p-1.5 rounded-xl border border-manuscript-border/30">
                    <span className="text-[10px] font-bold text-gray-500 block px-1.5">النمط الأدبي:</span>
                    <select
                      value={poeticGenreForm}
                      onChange={(e) => setPoeticGenreForm(e.target.value)}
                      className="bg-transparent text-xs font-bold outline-none border-none text-[#1a472a] dark:text-[#dfba6b] cursor-pointer"
                    >
                      <option value="classic">قصيدة عمودية كلاسيكية</option>
                      <option value="sufi">صوفيّة عرفانية مَجيدة</option>
                      <option value="prophetic">مديح نبوي شريف</option>
                      <option value="muwashshah">موشح أندلسي ملحّن</option>
                      <option value="zajal">زجل عربي بليغ</option>
                      <option value="ruba'iyyat">رباعيات الخيّام الحكيمة</option>
                      <option value="maqtou'at">مقطوعة شعريّة وجيزة</option>
                    </select>
                  </div>
                </div>

                {/* ERROR VIEW */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-start gap-2">
                    <Trash2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold">تنبيه وملاحظة عروضية</h4>
                      <p className="text-xs mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {/* 1. METER SELECTOR (CUSTOM COMPLEX GRID IN METERSELECTOR COMPONENT) */}
                <div className="border-b border-gray-100 dark:border-white/5 pb-6">
                  <MeterSelector selectedMeter={meterName} onChange={setMeterName} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 2. PURPOSE SELECTOR */}
                  <div className="flex flex-col gap-2">
                    <label className={`font-bold text-sm flex items-center gap-1 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
                      <Layers className="w-4 h-4 text-[#b58d3d]" />
                      غرض القصيدة الشعري
                    </label>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className={`w-full p-3 rounded-xl text-sm focus:ring-2 focus:ring-[#1a472a] outline-none transition-all cursor-pointer ${
                        isDarkMode ? 'bg-[#0a120d] border-[#dfba6b]/30 text-white' : 'bg-[#fcfaf7] border-[#b58d3d]/30'
                      }`}
                      id="purpose-select"
                    >
                      {PURPOSES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>

                    {purpose === 'غير ذلك' && (
                      <input
                        type="text"
                        value={customPurpose}
                        onChange={(e) => setCustomPurpose(e.target.value)}
                        placeholder="ادخل غرضاً مخصّصاً للقصيدة..."
                        className={`w-full p-3 rounded-xl text-sm focus:ring-2 focus:ring-[#1a472a] outline-none mt-2 ${
                          isDarkMode ? 'bg-[#0a120d] border-[#dfba6b]/30 text-white' : 'bg-[#fcfaf7] border-[#b58d3d]/30'
                        }`}
                        required
                      />
                    )}
                  </div>

                  {/* 6. VERSES COUNT & RHYME SELECTION */}
                  <div className="flex flex-col gap-2">
                    <label className={`font-bold text-sm flex items-center gap-1 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
                      <BookOpen className="w-4 h-4 text-[#8b1d2e]" />
                      عدد أبيات القصيدة (1 - 100)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={versesCount}
                        onChange={(e) => setVersesCount(parseInt(e.target.value) || 7)}
                        className="flex-1 accent-[#1a472a] cursor-pointer"
                      />
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={versesCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setVersesCount(isNaN(val) ? 7 : Math.max(1, Math.min(100, val)));
                        }}
                        className={`w-16 p-2 text-center rounded-xl font-bold focus:ring-2 focus:ring-[#1a472a] ${
                          isDarkMode ? 'bg-[#0a120d] border-[#dfba6b]/30 text-[#dfba6b]' : 'bg-[#fcfaf7] border-[#b58d3d]/30 text-[#1a472a]'
                        }`}
                      />
                      <span className="text-xs text-gray-500 font-semibold">بيتًا</span>
                    </div>
                  </div>
                </div>

                {/* 7. RHYME SYSTEM */}
                <div className={`border rounded-xl p-4 flex flex-col gap-3 ${
                  isDarkMode ? 'bg-[#0a120d]/50 border-[#dfba6b]/20' : 'bg-[#fdfbf7] border-[#b58d3d]/20'
                }`}>
                  <label className={`font-bold text-sm ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>كيف تريد نظام القافية؟</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRhymeSystem('unified')}
                      className={`p-3 rounded-lg border text-xs text-right font-medium transition-all cursor-pointer ${
                        rhymeSystem === 'unified'
                          ? 'bg-[#1a472a] text-white border-[#1a472a]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      ● قافية موحدة في جميع الأبيات
                    </button>

                    <button
                      type="button"
                      onClick={() => setRhymeSystem('strophic')}
                      className={`p-3 rounded-lg border text-xs text-right font-medium transition-all cursor-pointer ${
                        rhymeSystem === 'strophic'
                          ? 'bg-[#1a472a] text-white border-[#1a472a]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      ● قافية لكل مقطوعة
                    </button>

                    <button
                      type="button"
                      onClick={() => setRhymeSystem('tasri')}
                      className={`p-3 rounded-lg border text-xs text-right font-medium transition-all cursor-pointer ${
                        rhymeSystem === 'tasri'
                          ? 'bg-[#1a472a] text-white border-[#1a472a]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      ● التصريع في المطلع فقط
                    </button>

                    <button
                      type="button"
                      onClick={() => setRhymeSystem('internal')}
                      className={`p-3 rounded-lg border text-xs text-right font-medium transition-all cursor-pointer ${
                        rhymeSystem === 'internal'
                          ? 'bg-[#1a472a] text-white border-[#1a472a]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      ● قافية بين شطري البيت الواحد
                    </button>

                    <button
                      type="button"
                      onClick={() => setRhymeSystem('custom')}
                      className={`p-3 rounded-lg border text-xs text-right font-medium transition-all cursor-pointer ${
                        rhymeSystem === 'custom'
                          ? 'bg-[#1a472a] text-white border-[#1a472a]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      ● تخصيص حرف الروي يدويًا
                    </button>
                  </div>

                  {rhymeSystem === 'custom' && (
                    <div className="mt-2 animate-fade-in">
                      <label className="text-xs text-gray-600 block mb-1">اكتب حرف الروي المراد الالتزام به (مثل: د، ل، ر):</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={customRhymeLetter}
                        onChange={(e) => setCustomRhymeLetter(e.target.value)}
                        placeholder="مثال: ل"
                        className="w-24 bg-white border border-[#b58d3d]/30 p-2 text-center rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#1a472a]"
                      />
                    </div>
                  )}
                </div>

                {/* 3. POETIC OPPOSITION (المعارضة الشعرية) */}
                <div className="border-t border-gray-100 dark:border-white/5 pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`font-bold text-sm ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>هل تريد معارضة قصيدة معينة؟</span>
                      <span className="text-[11px] text-gray-500">ميزة محاكاة قصيدة تراثية شهيرة ونظم قصيدة جديدة على ميزانها وقافيتها وقوتها.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOpposition}
                        onChange={(e) => setIsOpposition(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a472a]"></div>
                    </label>
                  </div>

                  {isOpposition && (
                    <div className="animate-fade-in flex flex-col gap-2">
                      <label className="text-xs text-gray-600 font-semibold">الصق القصيدة المطلوب معارضتها هنا:</label>
                      <textarea
                        value={oppositionPoem}
                        onChange={(e) => setOppositionPoem(e.target.value)}
                        placeholder="مثال لقصيدة كعب بن زهير (بانت سعاد فقلبي اليوم متبول)..."
                        className={`w-full p-3 rounded-xl text-sm focus:ring-2 focus:ring-[#1a472a] h-28 outline-none ${
                          isDarkMode ? 'bg-[#0a120d] border-[#dfba6b]/30 text-white' : 'bg-[#fcfaf7] border-[#b58d3d]/30'
                        }`}
                        required={isOpposition}
                      />
                      <p className="text-[10px] text-[#b58d3d] italic">سيقوم نظام Gemini بتحليل بحرها وقافيتها وأسلوبها ونظم المعارضة الجديدة على نفس الوزن والروي وبأسلوب بليغ للغاية.</p>
                    </div>
                  )}
                </div>

                {/* 4. POET SIMULATION (محاكاة شاعر) */}
                <div className="border-t border-gray-100 dark:border-white/5 pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`font-bold text-sm ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>هل تريد محاكاة أسلوب شاعر معين؟</span>
                      <span className="text-[11px] text-gray-500">ميزة تقمص فكر وفلسفة وخصائص أسلوب كبار شعراء الأدب العربي.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSimulatingPoet}
                        onChange={(e) => setIsSimulatingPoet(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a472a]"></div>
                    </label>
                  </div>

                  {isSimulatingPoet && (
                    <div className="animate-fade-in flex flex-col gap-3">
                      {/* Joint Simulation Toggle */}
                      <div className="flex items-center justify-between bg-amber-500/5 p-2 rounded-lg border border-amber-500/15 mb-1">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            دمج أسلوب شاعرين (قصيدة مشتركة)
                          </span>
                          <span className="text-[10px] text-gray-400">امزج روحي شاعرين مختلفين لصياغة توليفة عبقرية</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={jointSimulatePoets}
                          onChange={(e) => setJointSimulatePoets(e.target.checked)}
                          className="w-4 h-4 accent-[#1a472a] cursor-pointer"
                        />
                      </div>

                      <label className="text-xs text-gray-600 font-semibold">
                        {jointSimulatePoets ? 'اختر الشاعر الأول:' : 'اختر شاعرك المفضل أو اكتب اسمه:'}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_POETS.map((poet) => (
                          <button
                            key={poet}
                            type="button"
                            onClick={() => setPoetName(poet)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                              poetName === poet
                                ? 'bg-[#8b1d2e] text-white border-[#8b1d2e]'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {poet}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-semibold shrink-0">اسم الشاعر الأول:</span>
                        <input
                          type="text"
                          value={poetName}
                          onChange={(e) => setPoetName(e.target.value)}
                          placeholder="اكتب اسم الشاعر الأول..."
                          className={`flex-1 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-[#1a472a] ${
                            isDarkMode ? 'bg-[#0a120d] border-[#dfba6b]/30 text-white' : 'bg-[#fcfaf7] border-[#b58d3d]/30'
                          }`}
                        />
                      </div>

                      {/* Second Poet Form if joint style simulation is enabled */}
                      {jointSimulatePoets && (
                        <div className="bg-[#fcfbf7] dark:bg-[#0c1711] p-3 rounded-xl border border-dashed border-manuscript-border/50 flex flex-col gap-2 mt-1 animate-fade-in">
                          <label className="text-xs font-bold text-[#1a472a] dark:text-[#dfba6b]">الشاعر الثاني للقصيدة المشتركة:</label>
                          <select
                            value={poetName2}
                            onChange={(e) => setPoetName2(e.target.value)}
                            className={`p-2.5 rounded-lg text-xs font-semibold outline-none border focus:ring-2 focus:ring-[#1a472a] cursor-pointer ${
                              isDarkMode ? 'bg-[#0a120d] border-[#dfba6b]/30 text-white' : 'bg-white border-gray-200'
                            }`}
                          >
                            {PRESET_POETS.filter(p => p !== poetName).map((poet) => (
                              <option key={poet} value={poet}>{poet}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. DESCRIPTION (وصف موضوع القصيدة) */}
                <div className="border-t border-gray-100 dark:border-white/5 pt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className={`font-bold text-sm flex items-center gap-1 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      وصف موضوع القصيدة نثراً (الأفكار المطلوب نظمهُا)
                    </label>

                    {/* AI Suggest Meters & Purposes */}
                    <button
                      type="button"
                      onClick={handleFetchSuggestions}
                      disabled={suggestLoading}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-950 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      {suggestLoading ? 'يجري الموازنة الفكرية...' : '✨ اقترح لي البحور والأغراض المناسبة'}
                    </button>
                  </div>

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="صف هنا بالتفصيل ما تريد نظمه في هذه القصيدة؛ مثل: (قصيدة في مدح خادم أو صديق وفي يتميز بصفات الجود والكرم، مع مقارنته بجبال طويق ثباتاً، مستعملاً كلمات فخمة وتعبيرات بلاغية دقيقة)..."
                    className={`w-full p-3.5 rounded-xl text-sm focus:ring-2 focus:ring-[#1a472a] h-32 outline-none leading-relaxed resize-y ${
                      isDarkMode ? 'bg-[#0a120d] border-[#dfba6b]/30 text-white' : 'bg-[#fcfaf7] border-[#b58d3d]/30'
                    }`}
                    required
                  />

                  {/* Suggestions Display Panel */}
                  {suggestions && (
                    <div className="p-3 bg-[#fdfcf7] dark:bg-[#12241a] border border-[#b58d3d]/30 rounded-xl mt-2 flex flex-col gap-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1a472a] dark:text-[#dfba6b] flex items-center gap-1">
                          🔮 ترشيحات المجهر الفكري لقصيدتك:
                        </span>
                        <button 
                          onClick={() => setSuggestions(null)} 
                          className="text-[10px] text-gray-400 hover:text-[#8b1d2e]"
                        >
                          إغلاق
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Meters suggestion list */}
                        {suggestions.meters && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-[#8b1d2e] border-b border-gray-100 pb-1">● بحور ملائمة عروضياً (اضغط للتطبيق):</span>
                            {suggestions.meters.map((met: any, i: number) => (
                              <div 
                                key={i} 
                                onClick={() => setMeterName(met.name)}
                                className="bg-white dark:bg-[#0c1611] p-2 rounded-lg border border-gray-100 hover:border-royal-400 cursor-pointer transition-all"
                              >
                                <strong className="text-royal-800 dark:text-emerald-400">بحر {met.name}:</strong>
                                <p className="text-[10px] text-gray-500 mt-0.5">{met.reason}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Purposes suggestion list */}
                        {suggestions.purposes && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-[#8b1d2e] border-b border-gray-100 pb-1">● أغراض مواءمة فكرياً (اضغط للتطبيق):</span>
                            {suggestions.purposes.map((pur: any, i: number) => (
                              <div 
                                key={i}
                                onClick={() => setPurpose(pur.name)}
                                className="bg-white dark:bg-[#0c1611] p-2 rounded-lg border border-gray-100 hover:border-[#8b1d2e] cursor-pointer transition-all"
                              >
                                <strong className="text-royal-800 dark:text-emerald-400">{pur.name}:</strong>
                                <p className="text-[10px] text-gray-500 mt-0.5">{pur.reason}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-500">
                    كلما كان الوصف وافياً ودقيقاً ومحدداً للمفاهيم، كلما تفوق الذكاء الاصطناعي في تقديم صور بلاغية غاية في الجمال والتماسك على البحر المختار.
                  </p>
                </div>

                {/* ADVANCED SETTINGS PANEL (لوحة الإعدادات المتقدمة للشاعر) */}
                <div className="border-t border-gray-100 dark:border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors ${
                      isDarkMode ? 'text-[#dfba6b] hover:text-white' : 'text-[#1a472a] hover:text-[#8b1d2e]'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    لوحة الإعدادات الفنية والوزنية المتقدمة {showAdvancedSettings ? '▲' : '▼'}
                  </button>

                  {showAdvancedSettings && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 p-4 rounded-xl border border-dashed border-manuscript-border bg-[#fdfcf9] dark:bg-[#0c1711] animate-fade-in text-xs">
                      {/* 1. Temp / Creativeness */}
                      <div className="flex flex-col gap-2">
                        <span className="font-bold text-[#1a472a] dark:text-[#dfba6b]">حرارة الإبداع (الخيال الشعري):</span>
                        <select
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.7)}
                          className="bg-white dark:bg-[#0a120d] border border-gray-200 dark:border-[#dfba6b]/30 p-2 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="0.4">متحفظ ورصين عروضياً (0.4)</option>
                          <option value="0.7">متوازن كلاسيكي (0.7)</option>
                          <option value="1.0">فيض خيالي وجريء (1.0)</option>
                        </select>
                      </div>

                      {/* 2. Vocabulary style */}
                      <div className="flex flex-col gap-2">
                        <span className="font-bold text-[#1a472a] dark:text-[#dfba6b]">معجم المفردات (العصر اللغوي):</span>
                        <select
                          value={vocabularyStyle}
                          onChange={(e) => setVocabularyStyle(e.target.value)}
                          className="bg-white dark:bg-[#0a120d] border border-gray-200 dark:border-[#dfba6b]/30 p-2 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="classic">جاهلي وإسلامي عريق وجزيل</option>
                          <option value="abbasid">عباسي فخم ومنمق بالبديع</option>
                          <option value="modern">أندلسي وحديث عذب وسلس</option>
                        </select>
                      </div>

                      {/* 3. Strict verification */}
                      <div className="flex flex-col gap-2 justify-center">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={strictMeter}
                            onChange={(e) => setStrictMeter(e.target.checked)}
                            className="w-4 h-4 accent-[#1a472a] cursor-pointer"
                          />
                          <span className="font-bold text-[#1a472a] dark:text-[#dfba6b]">فحص وتدقيق عروضي تلقائي صارم</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">يضمن خلو القصيدة تماماً من الهفوات والكسور قبل تسليمها.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-2 border-b-4 ${
                    loading 
                      ? 'bg-gray-400 text-gray-200 border-gray-600 cursor-not-allowed opacity-75' 
                      : 'bg-[#1a472a] text-white hover:bg-[#153a22] cursor-pointer border-[#0d2a18]'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      جاري صياغة موازين القصيدة...
                    </>
                  ) : (
                    <>
                      <Feather className="w-5 h-5 text-[#dfba6b]" />
                      أنشئ القصيدة الموزونة الآن
                    </>
                  )}
                </button>
              </form>

              {/* Side section containing Saved Poem History list */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className={`rounded-2xl p-6 border shadow-sm relative overflow-hidden flex flex-col justify-between h-[180px] ${
                  isDarkMode ? 'bg-[#122418] border-[#dfba6b]/30 text-white' : 'bg-[#1a472a] border-[#b58d3d]/35 text-white'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(181,141,61,0.25),transparent)] pointer-events-none" />
                  <div>
                    <span className="text-xs text-[#b58d3d] font-bold tracking-widest uppercase">موسوعة العروض الرقمية</span>
                    <h3 className="font-serif font-bold text-lg mt-1 mb-2">بحور خليل بن أحمد العروضي</h3>
                    <p className="text-xs text-gray-100 leading-relaxed">
                      يحتوي هذا النظام على ١٥ بحراً عروضياً متكاملاً، تخدم كقالب دقيق لنظم أروع القصائد مع مطابقتها للمعجم البلاغي.
                    </p>
                  </div>
                </div>

                {/* Offline Saved poems list history */}
                <HistoryList
                  history={history}
                  onSelectPoem={handleSelectFromHistory}
                  onDeletePoem={handleDeletePoem}
                  onToggleFavorite={handleToggleFavorite}
                  onClearAll={handleClearHistory}
                />

                {/* Beautiful Vintage Card showing Diwan legacy */}
                <div className={`border rounded-2xl p-5 shadow-sm relative text-center ${
                  isDarkMode ? 'bg-[#0f1d14] border-[#dfba6b]/20 text-white' : 'bg-manuscript-paper border-[#b58d3d]/40 text-gray-800'
                }`}>
                  <div className="w-10 h-10 bg-white/80 dark:bg-[#102216] rounded-full border border-manuscript-border flex items-center justify-center mx-auto mb-3">
                    <Quote className="w-5 h-5 text-[#8b1d2e]" />
                  </div>
                  <h4 className={`font-serif font-bold text-sm mb-1 ${isDarkMode ? 'text-[#dfba6b]' : 'text-[#1a472a]'}`}>بيت مأثور في فضل الشعر</h4>
                  <p className="font-serif italic text-xs leading-relaxed">
                    "لِسَانُ الْفَتَى سَبْعٌ عَلَيْهِ شَبَاتُهُ / فَلَا تُمِتْ عَقْلًا بِمَا لَا يُسَطَّرُ"
                  </p>
                  <span className="text-[10px] text-gray-400 block mt-2">— ديوان الحكمة</span>
                </div>
              </div>
            </div>
          </>
          )}
          </div>
        )}

        {activeMainTab === 'opposition' && (
          <div className="animate-fade-in">
            <PoeticOpposition
              isDarkMode={isDarkMode}
              onSavePoemToHistory={(poem) => {
                const updated = [poem, ...history];
                setHistory(updated);
                saveHistoryToStorage(updated);
              }}
            />
          </div>
        )}

        {activeMainTab === 'industries' && (
          <div className="animate-fade-in">
            <PoeticIndustries
              isDarkMode={isDarkMode}
              onSavePoemToHistory={(poem) => {
                const updated = [poem, ...history];
                setHistory(updated);
                saveHistoryToStorage(updated);
              }}
            />
          </div>
        )}

        {activeMainTab === 'tools' && (
          <div className="animate-fade-in">
            <AdvancedTools
              meters={Object.values(METERS_DATA)}
              currentPoem={currentPoem}
              onApplyNewPoem={(poem) => {
                setCurrentPoem(poem);
                if (poem && !history.some(p => p.id === poem.id)) {
                  const updated = [poem, ...history];
                  setHistory(updated);
                  saveHistoryToStorage(updated);
                }
                setActiveMainTab('studio');
                setTimeout(() => {
                  document.getElementById('poem-results-view')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            />
          </div>
        )}

        {activeMainTab === 'archive' && (
          <div className="animate-fade-in max-w-4xl mx-auto w-full">
            <div className="mb-4">
              <h2 className={`text-xl font-bold font-serif ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>خِزَانَةُ الدِّيوَانِ الشَّخْصِيَّة</h2>
              <p className="text-xs text-gray-500">مراجعة والبحث والوصول لجميع مأثوراتك الشعرية التي نظمتها على المنصة.</p>
            </div>
            
            {/* Inline selected poem in archive if chosen */}
            {currentPoem && (
              <div className="mb-6 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/15 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif font-black text-[#1a472a] text-sm">مستعرض المخطوطة المحدد:</h3>
                  <button 
                    onClick={() => setCurrentPoem(null)}
                    className="text-xs text-[#8b1d2e] hover:underline"
                  >
                    إغلاق المعاينة
                  </button>
                </div>
                <PoemDisplay poem={currentPoem} onReset={() => setCurrentPoem(null)} />
              </div>
            )}

            <HistoryList
              history={history}
              onSelectPoem={handleSelectFromHistory}
              onDeletePoem={handleDeletePoem}
              onToggleFavorite={handleToggleFavorite}
              onClearAll={handleClearHistory}
            />
          </div>
        )}

        {activeMainTab === 'meters' && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h2 className={`text-2xl font-serif font-black ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>مَوْسُوعَةُ البحورِ والأوزَانِ العربيَّة</h2>
              <p className="text-xs text-gray-500">دراسة ومعاينة تفاعلية لبحور خليل بن أحمد الفراهيدي، تفعيلاتها، تراكيبها، وأمثلتها المأثورة.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(METERS_DATA).map((key) => {
                const met = METERS_DATA[key];
                return (
                  <div key={key} className={`border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
                    isDarkMode ? 'bg-[#102216] border-[#dfba6b]/20 text-[#eefaf3]' : 'bg-white border-manuscript-border text-gray-800'
                  }`}>
                    <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[#dfba6b]/5 to-transparent pointer-events-none" />
                    
                    <span className="text-[10px] font-black uppercase text-[#8b1d2e] bg-red-50 dark:bg-[#8b1d2e]/10 px-2 py-0.5 rounded">بحر كلاسيكي</span>
                    <h3 className="font-serif font-black text-xl text-royal-800 dark:text-[#dfba6b] mt-2 mb-1">بحر {met.name}</h3>
                    
                    <div className="bg-royal-50/50 dark:bg-[#0a120d] p-2.5 rounded-lg border border-gray-100 dark:border-white/5 my-3">
                      <span className="text-[9px] text-gray-400 font-bold block mb-0.5">تفعيلاته:</span>
                      <p className="font-serif font-bold text-xs text-[#8b1d2e] tracking-wide" dir="ltr">{met.feet}</p>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{met.description}</p>
                    
                    {met.example && (
                      <div className="border-t border-dashed border-gray-100 pt-3">
                        <span className="text-[9px] text-gray-400 font-bold block mb-1">شاهد من تراث البحر:</span>
                        <p className="font-serif italic text-xs text-royal-900 dark:text-[#aef8cf] leading-normal font-bold">"{met.example.verse}"</p>
                        <span className="text-[9px] text-gray-400 block text-left mt-0.5">— {met.example.poet}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeMainTab === 'analytics' && (
          <div className="animate-fade-in">
            <PoetAnalytics history={history} />
          </div>
        )}




      </main>

      {/* Royal Elegant Footer */}
      <footer className={`transition-colors duration-300 border-t py-8 px-4 mt-12 text-xs relative z-10 ${
        isDarkMode ? 'bg-[#0f2115] border-[#dfba6b]/20 text-gray-400' : 'bg-[#1a472a] border-[#b58d3d]/30 text-white'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-lg">🖋️</span>
            <div>
              <p className="font-serif font-bold text-sm text-white">صانع الشعر العربي - ديوان العبقرية الرقمي</p>
              <p className="text-[10px] text-gray-400 mt-0.5">تمكين البلاغة والنقد الرقمي بالاعتماد على ذكاء نماذج Gemini الفائقة</p>
            </div>
          </div>

          <div className="flex gap-6 text-[10px] text-gray-300 font-sans">
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setActiveMainTab('studio')}>صومعة النظم</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setActiveMainTab('tools')}>العيادة البلاغية</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setActiveMainTab('archive')}>ديوانك المحفوظ</span>
          </div>

          <div className="text-[10px] text-gray-400">
            © جميع الحقوق محفوظة لـ صانع الشعر العربي ٢٠٢٦
          </div>
        </div>
      </footer>


    </div>
  );
}
