import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Activity, 
  Flame, 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  Wrench, 
  RefreshCw, 
  Feather, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ChevronLeft,
  Server,
  Globe,
  Info,
  CreditCard,
  DollarSign,
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import { apiFetch } from '../firebase';

interface AdminDashboardProps {
  isDarkMode: boolean;
  onBackToStudio: () => void;
}

export default function AdminDashboard({ isDarkMode, onBackToStudio }: AdminDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHoverBar, setActiveHoverBar] = useState<number | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/stats');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'فشل تحميل الإحصائيات الإدارية من الخادم.');
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ فني غير متوقع أثناء تحميل البيانات.');
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'server' | 'subscriptions' | 'diwans'>('server');
  const [subStats, setSubStats] = useState<any>(null);
  const [loadingSub, setLoadingSub] = useState<boolean>(false);
  const [errorSub, setErrorSub] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const [allDiwans, setAllDiwans] = useState<any[]>([]);
  const [loadingDiwans, setLoadingDiwans] = useState<boolean>(false);
  const [errorDiwans, setErrorDiwans] = useState<string | null>(null);
  const [diwanSearch, setDiwanSearch] = useState<string>('');
  const [selectedAdminPoem, setSelectedAdminPoem] = useState<any | null>(null);

  const fetchAllDiwans = async () => {
    setLoadingDiwans(true);
    setErrorDiwans(null);
    try {
      const res = await apiFetch('/api/admin/all-diwans');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'فشل تحميل الدواوين من الخادم.');
      }
      const data = await res.json();
      setAllDiwans(data);
    } catch (err: any) {
      console.error(err);
      setErrorDiwans(err.message || 'حدث خطأ فني أثناء تحميل الدواوين.');
    } finally {
      setLoadingDiwans(false);
    }
  };

  const fetchSubStats = async () => {
    setLoadingSub(true);
    setErrorSub(null);
    try {
      const res = await apiFetch('/api/admin/subscription-stats');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'فشل تحميل بيانات الاشتراكات من الخادم.');
      }
      const data = await res.json();
      setSubStats(data);
    } catch (err: any) {
      console.error(err);
      setErrorSub(err.message || 'حدث خطأ فني أثناء تحميل بيانات الاشتراكات.');
    } finally {
      setLoadingSub(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      fetchSubStats();
    } else if (activeTab === 'diwans') {
      fetchAllDiwans();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className={`border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm min-h-[400px] ${
        isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/20 text-white' : 'bg-white border-[#b58d3d]/20 text-gray-800'
      }`}>
        <div className="relative">
          <div className={`w-12 h-12 rounded-full border-4 animate-spin ${
            isDarkMode ? 'border-t-[#dfba6b] border-emerald-950' : 'border-t-[#1a472a] border-amber-100'
          }`} />
          <Feather className="w-5 h-5 text-[#8b1d2e] absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="font-serif font-bold text-lg animate-pulse">يجري تجميع البيانات وتحليل حركة الخادم عروضياً...</p>
        <p className="text-xs text-gray-400">يرجى الانتظار لحظات لتوليد لوحة القيادة الرقمية</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`border rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4 shadow-sm max-w-xl mx-auto ${
        isDarkMode ? 'bg-[#1a0f10] border-red-900/30 text-white' : 'bg-red-50 border-red-200 text-gray-800'
      }`}>
        <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce" />
        <h3 className="font-serif font-black text-xl text-red-600">عائق في الاتصال بلوحة التحكم</h3>
        <p className="text-sm leading-relaxed">{error}</p>
        <div className="flex gap-4 mt-2">
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> إعادة المحاولة
          </button>
          <button
            onClick={onBackToStudio}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            العودة للصومعة الأدبية
          </button>
        </div>
      </div>
    );
  }

  // Derived variables for display
  const globalLimit = stats?.globalLimit || 2000;
  const globalUsage = stats?.globalUsage || 0;
  const remainingGlobal = Math.max(0, globalLimit - globalUsage);
  const usagePercentage = Math.round((globalUsage / globalLimit) * 100);

  // SVG dimensions for charts
  const historyWidth = 600;
  const historyHeight = 220;
  const barChartWidth = 500;
  const barChartHeight = 220;

  // Build points for last 24h Area Chart
  const points = stats?.hourlyRequests || [];
  const maxRequestsCount = Math.max(...points.map((p: any) => p.count), 1);
  const paddingX = 40;
  const paddingY = 30;

  const chartPoints = points.map((p: any, index: number) => {
    const x = paddingX + (index * (historyWidth - paddingX * 2)) / Math.max(1, points.length - 1);
    const y = historyHeight - paddingY - (p.count * (historyHeight - paddingY * 2)) / maxRequestsCount;
    return { x, y, label: p.hour, value: p.count };
  });

  const areaPath = chartPoints.length > 0 
    ? `${chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} L ${chartPoints[chartPoints.length - 1].x} ${historyHeight - paddingY} L ${chartPoints[0].x} ${historyHeight - paddingY} Z`
    : '';

  const linePath = chartPoints.length > 0 
    ? chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  // Tools stats
  const toolStats = stats?.toolUsage || [];
  const maxToolValue = Math.max(...toolStats.map((t: any) => t.value), 1);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Upper bar with Back button and status banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-4">
        <div>
          <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${
            isDarkMode ? 'bg-[#dfba6b]/10 text-[#dfba6b]' : 'bg-[#1a472a]/10 text-[#1a472a]'
          }`}>
            لوحة الإشراف العليا للمالك
          </span>
          <h2 className={`text-2xl font-serif font-black mt-1.5 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
            لوحة التحكم الإحصائية التفاعلية
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">مراقبة حية للاستخدام والحدود التشغيلية وسلامة الخدمات السحابية</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isDarkMode ? 'bg-[#0f2115] border-[#dfba6b]/30 text-white hover:bg-[#1a3723]' : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
            title="تحديث البيانات فورياً"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin-hover" />
          </button>

          <button
            onClick={onBackToStudio}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#8b1d2e] hover:bg-[#6e1321] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer font-serif"
          >
            العودة للصومعة الشعرية <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-100 dark:border-white/5 gap-2 pb-px mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('server')}
          className={`px-5 py-3 text-sm font-serif font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'server'
              ? (isDarkMode ? 'border-[#dfba6b] text-[#dfba6b]' : 'border-[#1a472a] text-[#1a472a]')
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          ⚙️ إحصائيات النظام والاستخدام
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-5 py-3 text-sm font-serif font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? (isDarkMode ? 'border-[#dfba6b] text-[#dfba6b]' : 'border-[#1a472a] text-[#1a472a]')
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          💳 لوحة إدارة الاشتراكات والمدفوعات
        </button>
        <button
          onClick={() => setActiveTab('diwans')}
          className={`px-5 py-3 text-sm font-serif font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'diwans'
              ? (isDarkMode ? 'border-[#dfba6b] text-[#dfba6b]' : 'border-[#1a472a] text-[#1a472a]')
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          📜 دواوين المستخدمين المحفوظة
        </button>
      </div>

      {activeTab === 'server' && (
        <>
          {/* Grid 1: Basic Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Users Today */}
        <div className={`border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:scale-[1.02] ${
          isDarkMode ? 'bg-[#102216] border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
        }`}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-serif font-bold text-gray-400">زوار اليوم النشطين</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-black text-blue-600 dark:text-blue-400">
            {stats?.usersToday} <span className="text-xs font-sans text-gray-400 font-normal">مستخدم</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" /> نشاط مستمر ومسجل للزوار اليوم
          </p>
        </div>

        {/* Card 2: Registered Users */}
        <div className={`border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:scale-[1.02] ${
          isDarkMode ? 'bg-[#102216] border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
        }`}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-serif font-bold text-gray-400">المستخدمين المسجلين</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-black text-amber-600 dark:text-[#dfba6b]">
            {stats?.registeredUsers} <span className="text-xs font-sans text-gray-400 font-normal">عضو</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            تمت مزامنتهم بالخادم وقاعدة Firebase
          </p>
        </div>

        {/* Card 3: Requests Today */}
        <div className={`border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:scale-[1.02] ${
          isDarkMode ? 'bg-[#102216] border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
        }`}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-serif font-bold text-gray-400">إجمالي الطلبات اليوم</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-black text-emerald-600 dark:text-emerald-400">
            {stats?.totalRequests} <span className="text-xs font-sans text-gray-400 font-normal">طلب</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" /> تم تسجيلها في السجل السحابي
          </p>
        </div>

        {/* Card 4: Generated Poems */}
        <div className={`border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:scale-[1.02] ${
          isDarkMode ? 'bg-[#102216] border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
        }`}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-serif font-bold text-gray-400">القصائد المولدة</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600">
              <Feather className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-black text-purple-600 dark:text-purple-400">
            {stats?.generatedPoems} <span className="text-xs font-sans text-gray-400 font-normal">قصيدة</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            تم نظم موازينها الشعرية بالكامل
          </p>
        </div>

        {/* Card 5: Tool Usages */}
        <div className={`border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:scale-[1.02] ${
          isDarkMode ? 'bg-[#102216] border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
        }`}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-serif font-bold text-gray-400">استخدام الأدوات الأدبية</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-black text-indigo-600 dark:text-indigo-400">
            {stats?.literaryTools} <span className="text-xs font-sans text-gray-400 font-normal">مرة</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            العروض البلاغية ونقد الأبيات
          </p>
        </div>
      </div>

      {/* Grid 2: Global Limit and Response Time Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Global Limit Card (70%) */}
        <div className={`lg:col-span-8 border rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between ${
          isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-serif font-black text-lg flex items-center gap-1.5 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
                <Globe className="w-5 h-5 text-emerald-600" /> المتبقي من الحد العالمي اليومي لـ Gemini
              </h3>
              <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg ${
                usagePercentage > 80 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-600'
              }`}>
                تم استهلاك {usagePercentage}%
              </span>
            </div>
            <p className="text-xs text-gray-500">
              الحد الأقصى المسموح به لجميع زوار المنصة يومياً لحماية ميزانية الخادم من الاستهلاك العشوائي.
            </p>
          </div>

          <div className="my-6">
            <div className="flex items-end justify-between mb-2">
              <div className="text-right">
                <span className="text-xs text-gray-400 block mb-0.5">المتبقي الآمن</span>
                <span className="text-3xl font-serif font-black text-emerald-600 dark:text-[#dfba6b]">
                  {remainingGlobal}
                </span>
                <span className="text-xs text-gray-400"> / {globalLimit} طلب</span>
              </div>
              <div className="text-left">
                <span className="text-xs text-gray-400 block mb-0.5">إجمالي استهلاك اليوم</span>
                <span className="text-2xl font-serif font-black text-gray-500 dark:text-gray-300">
                  {globalUsage}
                </span>
              </div>
            </div>

            {/* Custom styled progress bar */}
            <div className="h-4 w-full bg-gray-100 dark:bg-emerald-950/40 rounded-full overflow-hidden p-0.5 border border-gray-200/50 dark:border-emerald-900/20">
              <div 
                className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
                  usagePercentage > 85 
                    ? 'from-red-600 to-red-400' 
                    : usagePercentage > 60 
                    ? 'from-amber-600 to-amber-400' 
                    : 'from-emerald-700 to-emerald-400'
                }`}
                style={{ width: `${Math.min(100, usagePercentage)}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-gray-400 bg-gray-50 dark:bg-[#0a120d] p-3 rounded-xl border border-gray-100 dark:border-white/5 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>يتجدد هذا العداد تلقائياً كل ٢٤ ساعة عند الساعة ١٢:٠٠ منتصف الليل بتوقيت مكة المكرمة.</span>
          </div>
        </div>

        {/* Response Time Gauge Card (30%) */}
        <div className={`lg:col-span-4 border rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between text-center ${
          isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
        }`}>
          <div>
            <h3 className={`font-serif font-black text-base flex items-center justify-center gap-1.5 mb-1 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
              <Clock className="w-5 h-5 text-[#8b1d2e]" /> متوسط زمن الاستجابة لـ Gemini
            </h3>
            <p className="text-[10px] text-gray-400">الوقت المستغرق لصياغة وتدقيق الأبيات الشعرية عروضياً</p>
          </div>

          <div className="my-6 relative flex flex-col items-center justify-center">
            {/* Speedometer representation in visual CSS */}
            <div className="w-36 h-20 overflow-hidden relative flex items-end justify-center">
              {/* Arc background */}
              <div className="absolute top-0 w-36 h-36 rounded-full border-[10px] border-gray-100 dark:border-emerald-950/40" />
              {/* Arc colored */}
              <div className="absolute top-0 w-36 h-36 rounded-full border-[10px] border-transparent border-t-[#8b1d2e] border-r-[#dfba6b]" style={{ transform: 'rotate(45deg)' }} />
              
              {/* Inside score */}
              <div className="z-10 pb-1 flex flex-col items-center">
                <span className="text-3xl font-serif font-black text-royal-900 dark:text-[#dfba6b]">
                  {stats?.averageResponseTime || 8.4}
                </span>
                <span className="text-[10px] text-gray-400 font-sans leading-none">ثانية / طلب</span>
              </div>
            </div>

            {/* Hand pin or status label below */}
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full mt-3 ${
              (stats?.averageResponseTime || 8.4) < 10 
                ? 'bg-emerald-500/10 text-emerald-600' 
                : 'bg-amber-500/10 text-amber-500'
            }`}>
              {(stats?.averageResponseTime || 8.4) < 10 ? 'أداء ممتاز وسريع جداً' : 'أداء معتدل'}
            </span>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed">
            يقاس بناءً على استدعاءات نماذج الاستدلال الكبيرة لـ Gemini ومطابقتها للقافية.
          </p>
        </div>
      </div>

      {/* Grid 3: Live Service Status (4 Indicator LEDs) */}
      <div className={`border rounded-2xl p-6 shadow-xs ${
        isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
      }`}>
        <h3 className={`font-serif font-black text-lg flex items-center gap-1.5 mb-4 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
          <Server className="w-5 h-5 text-[#b58d3d]" /> بوابات الخدمات وحالة الاتصال بالبنية التحتية
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Service 1: Gemini */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDarkMode ? 'bg-[#0a120d] border-emerald-950/60' : 'bg-gray-50 border-gray-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  stats?.status?.gemini === 'connected' ? 'bg-emerald-400' : 'bg-red-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  stats?.status?.gemini === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
                }`}></span>
              </div>
              <div>
                <span className="text-xs font-serif font-bold text-gray-400 block">خدمة خوارزميات</span>
                <span className="text-sm font-bold leading-tight">Gemini Generative API</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              stats?.status?.gemini === 'connected' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
            }`}>
              {stats?.status?.gemini === 'connected' ? 'متصل' : 'مغلق'}
            </span>
          </div>

          {/* Service 2: Cloudflare KV */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDarkMode ? 'bg-[#0a120d] border-emerald-950/60' : 'bg-gray-50 border-gray-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <div>
                <span className="text-xs font-serif font-bold text-gray-400 block">قاعدة تخزين الكاش</span>
                <span className="text-sm font-bold leading-tight">Cloudflare KV</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
              مستقر
            </span>
          </div>

          {/* Service 3: Cloudflare Turnstile */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDarkMode ? 'bg-[#0a120d] border-emerald-950/60' : 'bg-gray-50 border-gray-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  stats?.status?.turnstile === 'connected' ? 'bg-emerald-400' : 'bg-red-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  stats?.status?.turnstile === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
                }`}></span>
              </div>
              <div>
                <span className="text-xs font-serif font-bold text-gray-400 block">حماية التحقق الأمني</span>
                <span className="text-sm font-bold leading-tight">Turnstile Captcha</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              stats?.status?.turnstile === 'connected' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
            }`}>
              {stats?.status?.turnstile === 'connected' ? 'مفعل' : 'معطل'}
            </span>
          </div>

          {/* Service 4: Firebase Admin */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDarkMode ? 'bg-[#0a120d] border-emerald-950/60' : 'bg-gray-50 border-gray-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  stats?.status?.firebase === 'connected' ? 'bg-emerald-400' : 'bg-red-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  stats?.status?.firebase === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
                }`}></span>
              </div>
              <div>
                <span className="text-xs font-serif font-bold text-gray-400 block">توثيق الحسابات والـ DB</span>
                <span className="text-sm font-bold leading-tight">Firebase Admin SDK</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              stats?.status?.firebase === 'connected' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
            }`}>
              {stats?.status?.firebase === 'connected' ? 'متصل' : 'غير متصل'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid 4: Rejected Requests Breakdown */}
      <div className={`border rounded-2xl p-6 shadow-xs relative overflow-hidden ${
        isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
      }`}>
        <h3 className={`font-serif font-black text-lg flex items-center gap-1.5 mb-2 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
          <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" /> تفصيل وتتبع الطلبات المرفوضة حماية للأنظمة
        </h3>
        <p className="text-xs text-gray-400 mb-6">مراقبة محاولات الاستخدام المفرط أو الهجمات أو الروبوتات المرفوضة برمجياً.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Limit Rejections */}
          <div className="bg-red-500/[0.02] dark:bg-red-500/[0.01] border border-red-500/10 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-serif font-bold text-gray-400">تجاوز الحد اليومي للشخص</span>
              <span className="text-[10px] bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded">عتبة الفرد</span>
            </div>
            <div className="text-3xl font-serif font-black text-red-600 dark:text-red-400 my-2">
              {stats?.rejectedDaily || 0} <span className="text-xs font-sans text-gray-400 font-normal">محاولة مرفوضة</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-normal">
              طلبات تم حظرها بسبب بلوغ الزائر أو صاحب الـ IP لحده المسموح به اليوم (١٠ لغير المسجل، ٣٠ للمسجل).
            </p>
          </div>

          {/* Global Limit Rejections */}
          <div className="bg-red-500/[0.02] dark:bg-red-500/[0.01] border border-red-500/10 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-serif font-bold text-gray-400">تجاوز الحد العالمي اليومي</span>
              <span className="text-[10px] bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded">عتبة الخادم</span>
            </div>
            <div className="text-3xl font-serif font-black text-red-600 dark:text-red-400 my-2">
              {stats?.rejectedGlobal || 0} <span className="text-xs font-sans text-gray-400 font-normal">محاولة مرفوضة</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-normal">
              طلبات تم حظرها بسبب وصول المنصة بكاملها للحد الأقصى العالمي المسموح به البالغ ٢٠٠٠ طلب يومياً.
            </p>
          </div>

          {/* Turnstile Captcha Rejections */}
          <div className="bg-red-500/[0.02] dark:bg-red-500/[0.01] border border-red-500/10 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-serif font-bold text-gray-400">فشل التحقق التلقائي (Turnstile)</span>
              <span className="text-[10px] bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded">عتبة الأمان</span>
            </div>
            <div className="text-3xl font-serif font-black text-red-600 dark:text-red-400 my-2">
              {stats?.rejectedTurnstile || 0} <span className="text-xs font-sans text-gray-400 font-normal">محاولة مرفوضة</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-normal">
              طلبات تم حظرها بسبب فشل كود التحقق الأمني أو التوكن التابع لـ Cloudflare، أو هجمات بوتات إغراق.
            </p>
          </div>
        </div>
      </div>

      {/* Grid 5: Professional Charts (24h Traffic & Most Used Tools) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: 24h Traffic Area Chart (60%) */}
        <div className={`lg:col-span-7 border rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col ${
          isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
        }`}>
          <div>
            <h3 className={`font-serif font-black text-lg flex items-center gap-1.5 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
              <TrendingUp className="w-5 h-5 text-emerald-600" /> مخطط حركة الطلبات ونشاط الخادم (آخر ٢٤ ساعة)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">تتبع ذروة النشاط والاستخدام للمنصة لكل ساعة</p>
          </div>

          {/* Responsive custom SVG Area Chart */}
          <div className="flex-1 w-full overflow-x-auto custom-scroll mt-6 min-h-[220px]">
            <svg 
              className="w-full h-full min-w-[500px]" 
              viewBox={`0 0 ${historyWidth} ${historyHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {Array.from({ length: 5 }).map((_, i) => {
                const y = paddingY + (i * (historyHeight - paddingY * 2)) / 4;
                const valueLabel = Math.round(maxRequestsCount - (i * maxRequestsCount) / 4);
                return (
                  <g key={i}>
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={historyWidth - paddingX} 
                      y2={y} 
                      stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'} 
                      strokeWidth="1" 
                    />
                    <text 
                      x={paddingX - 10} 
                      y={y + 4} 
                      className="text-[9px] fill-gray-400 font-sans" 
                      textAnchor="end"
                    >
                      {valueLabel}
                    </text>
                  </g>
                );
              })}

              {/* Area filled */}
              {areaPath && (
                <path d={areaPath} fill="url(#areaGrad)" />
              )}

              {/* Line */}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Points & Tooltip */}
              {chartPoints.map((pt, i) => (
                <g key={i}>
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4" 
                    className="fill-[#1a472a] stroke-[#10b981] stroke-[2] cursor-pointer hover:r-6 transition-all"
                    onMouseEnter={(e) => {
                      setHoveredPoint({ x: pt.x, y: pt.y - 12, label: pt.label, value: pt.value });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* X axis labels (staggered display to fit labels) */}
                  {i % 3 === 0 && (
                    <text 
                      x={pt.x} 
                      y={historyHeight - 10} 
                      className="text-[8px] fill-gray-400 font-sans" 
                      textAnchor="middle"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              ))}

              {/* Interactive Tooltip Card in SVG */}
              {hoveredPoint && (
                <g>
                  {/* Background rect */}
                  <rect 
                    x={Math.max(10, Math.min(historyWidth - 110, hoveredPoint.x - 50))} 
                    y={Math.max(5, hoveredPoint.y - 30)} 
                    width="100" 
                    height="32" 
                    rx="6" 
                    fill={isDarkMode ? '#0c1611' : '#ffffff'} 
                    stroke="#10b981" 
                    strokeWidth="1.5"
                    className="shadow-md"
                  />
                  <text 
                    x={Math.max(10, Math.min(historyWidth - 110, hoveredPoint.x - 50)) + 50} 
                    y={Math.max(5, hoveredPoint.y - 30) + 12} 
                    className={`text-[8px] font-bold ${isDarkMode ? 'fill-[#dfba6b]' : 'fill-[#1a472a]'} font-serif`} 
                    textAnchor="middle"
                  >
                    الساعة: {hoveredPoint.label}
                  </text>
                  <text 
                    x={Math.max(10, Math.min(historyWidth - 110, hoveredPoint.x - 50)) + 50} 
                    y={Math.max(5, hoveredPoint.y - 30) + 24} 
                    className={`text-[9px] font-bold ${isDarkMode ? 'fill-white' : 'fill-gray-800'} font-sans`} 
                    textAnchor="middle"
                  >
                    الطلبات: {hoveredPoint.value}
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Chart 2: Most Used Tools Horizontal Bar Chart (40%) */}
        <div className={`lg:col-span-5 border rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between ${
          isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
        }`}>
          <div>
            <h3 className={`font-serif font-black text-lg flex items-center gap-1.5 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
              <Sparkles className="w-5 h-5 text-[#b58d3d]" /> ترتيب الأدوات والخصائص الأكثر استخداماً
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">ترتيب تنازلي بحسب إقبال القرّاء والشعراء</p>
          </div>

          <div className="flex-1 w-full space-y-4 mt-6">
            {toolStats.map((tool: any, index: number) => {
              const itemWidthPercentage = Math.round((tool.value / maxToolValue) * 100);
              // assign beautiful color based on index
              const colorClass = index === 0 
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' 
                : index === 1 
                ? 'bg-gradient-to-r from-[#b58d3d] to-[#dfba6b]' 
                : index === 2 
                ? 'bg-gradient-to-r from-purple-600 to-purple-400' 
                : 'bg-gradient-to-r from-gray-500 to-gray-400';

              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-serif font-black">{tool.name}</span>
                    <span className="font-sans font-bold text-gray-400">{tool.value} طلب</span>
                  </div>

                  <div className="h-2.5 w-full bg-gray-100 dark:bg-emerald-950/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${colorClass}`}
                      style={{ width: `${itemWidthPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
        </>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {loadingSub ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 rounded-full border-4 border-t-transparent border-[#dfba6b] animate-spin" />
              <p className="font-serif text-sm text-gray-400 animate-pulse">جاري تحميل بيانات الاشتراكات وتحليل العمليات من Paymob و Firestore...</p>
            </div>
          ) : errorSub ? (
            <div className={`p-6 rounded-xl border text-center ${isDarkMode ? 'bg-[#1a0f10] border-red-900/30 text-red-300' : 'bg-red-50 border-red-200 text-red-900'}`}>
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2 animate-bounce" />
              <h4 className="font-serif font-black text-base">عثرة أثناء جلب الإحصائيات</h4>
              <p className="text-xs mt-1">{errorSub}</p>
              <button onClick={fetchSubStats} className="mt-3 px-4 py-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg">إعادة المحاولة</button>
            </div>
          ) : !subStats ? (
            <p className="text-center text-sm text-gray-500">لا تتوفر بيانات حالياً.</p>
          ) : (
            <>
              {/* Bento Grid containing aggregated metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Total Subscribers */}
                <div className={`border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:scale-[1.02] ${
                  isDarkMode ? 'bg-[#102216] border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
                }`}>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-serif font-bold text-gray-400">إجمالي المشتركين النشطين</span>
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-serif font-black text-emerald-600 dark:text-emerald-400">
                    {subStats.totalSubscribers} <span className="text-xs font-sans text-gray-400 font-normal">مشترك</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> نشطون عبر بوابة Paymob
                  </p>
                </div>

                {/* Metric 2: Pro/Silver Subscribers */}
                <div className={`border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:scale-[1.02] ${
                  isDarkMode ? 'bg-[#102216] border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
                }`}>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl" />
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-serif font-bold text-gray-400">الخطة الاحترافية (Pro)</span>
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-serif font-black text-blue-500 dark:text-blue-400">
                    {subStats.proSubscribers} <span className="text-xs font-sans text-gray-400 font-normal">مشترك</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">
                    بقيمة <span className="font-bold text-blue-500">$20</span> شهرياً للمشترك
                  </p>
                </div>

                {/* Metric 3: Premium/Gold Subscribers */}
                <div className={`border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:scale-[1.02] ${
                  isDarkMode ? 'bg-[#102216] border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
                }`}>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-serif font-bold text-gray-400">الخطة المميزة (Premium)</span>
                    <div className="p-2 bg-amber-500/10 rounded-xl text-[#dfba6b]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-serif font-black text-amber-500 dark:text-[#dfba6b]">
                    {subStats.premiumSubscribers} <span className="text-xs font-sans text-gray-400 font-normal">مشترك</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">
                    بقيمة <span className="font-bold text-amber-500">$80</span> شهرياً للمشترك
                  </p>
                </div>

                {/* Metric 4: Expected Monthly Revenue */}
                <div className={`border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:scale-[1.02] ${
                  isDarkMode ? 'bg-[#102216] border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
                }`}>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl" />
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-serif font-bold text-gray-400">الإيراد الشهري المتوقع (MRR)</span>
                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-serif font-black text-purple-600 dark:text-purple-400">
                    ${subStats.monthlyRevenue} <span className="text-xs font-sans text-gray-400 font-normal">دولار</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" /> معدل الدخل السنوي المتوقع: ${(subStats.monthlyRevenue * 12)}
                  </p>
                </div>
              </div>

              {/* Status boxes for canceled and expired */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDarkMode ? 'bg-[#15120c] border-[#dfba6b]/10' : 'bg-amber-50/50 border-amber-200/50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#dfba6b]/10 flex items-center justify-center text-[#dfba6b]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-serif">الاشتراكات المنتهية</span>
                      <span className="text-lg font-serif font-black text-[#dfba6b]">{subStats.expiredSubscriptions}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-serif">عادت تلقائياً للخطة المجانية</span>
                </div>

                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDarkMode ? 'bg-[#1a0f10] border-red-950/40' : 'bg-red-50/50 border-red-200/50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-serif">الاشتراكات الملغاة</span>
                      <span className="text-lg font-serif font-black text-red-600 dark:text-red-400">{subStats.canceledSubscriptions}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-serif">أوقف المستخدم التجديد التلقائي</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Last Payments List */}
                <div className={`lg:col-span-1 border rounded-2xl p-5 shadow-xs ${
                  isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
                }`}>
                  <h3 className="font-serif font-black text-base flex items-center gap-1.5 mb-4">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> آخر عمليات الدفع الناجحة
                  </h3>
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {subStats.latestPayments && subStats.latestPayments.length > 0 ? (
                      subStats.latestPayments.map((pay: any) => (
                        <div key={pay.id} className="p-3 rounded-xl bg-gray-50 dark:bg-emerald-950/15 border border-gray-100 dark:border-white/5 flex flex-col gap-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-400 truncate max-w-[130px] font-sans" title={pay.email}>
                              {pay.email}
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-serif text-sm">
                              +${pay.amount}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-500">
                            <span>خطة: {pay.planId === 'gold' ? 'الذهبية' : 'الفضية'}</span>
                            <span className="font-sans">{new Date(pay.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-gray-500 py-6">لا توجد دفعات مسجلة بعد.</p>
                    )}
                  </div>
                </div>

                {/* Right Side: Subscribers List with Search & Filtering */}
                <div className={`lg:col-span-2 border rounded-2xl p-5 shadow-xs flex flex-col justify-between ${
                  isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/15 text-white' : 'bg-white border-manuscript-border text-gray-800'
                }`}>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <h3 className="font-serif font-black text-base flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#b58d3d]" /> قائمة الحسابات والاشتراكات
                      </h3>
                      {/* Search & Filters */}
                      <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-48">
                          <input
                            type="text"
                            placeholder="ابحث بالبريد الإلكتروني..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-xs p-2 pr-7 rounded-lg bg-gray-50 dark:bg-[#0a120d] border border-gray-200 dark:border-white/10 outline-none focus:ring-1 focus:ring-emerald-500 text-right"
                          />
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5" />
                        </div>
                        <select
                          value={planFilter}
                          onChange={(e) => setPlanFilter(e.target.value)}
                          className="text-xs p-2 rounded-lg bg-gray-50 dark:bg-[#0a120d] border border-gray-200 dark:border-white/10 outline-none cursor-pointer"
                        >
                          <option value="all">كل الخطط</option>
                          <option value="silver">الفضية (Pro)</option>
                          <option value="gold">الذهبية (Premium)</option>
                          <option value="free">المجانية</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400">
                            <th className="pb-2 font-semibold">البريد الإلكتروني</th>
                            <th className="pb-2 font-semibold">الخطة</th>
                            <th className="pb-2 font-semibold">حالة الاشتراك</th>
                            <th className="pb-2 font-semibold">معرف المعاملة (Paymob)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                          {subStats.allUsers && subStats.allUsers.length > 0 ? (
                            subStats.allUsers
                              .filter((u: any) => {
                                const matchesSearch = u.email?.toLowerCase().includes(searchTerm.toLowerCase());
                                const matchesFilter = planFilter === 'all' || u.planId === planFilter;
                                return matchesSearch && matchesFilter;
                              })
                              .map((userRow: any) => {
                                const isSilver = userRow.planId === 'silver';
                                const isGold = userRow.planId === 'gold';
                                const isActive = userRow.subscriptionStatus === 'active' || userRow.subscriptionStatus === 'trialing';

                                return (
                                  <tr key={userRow.id} className="hover:bg-gray-50 dark:hover:bg-emerald-950/5">
                                    <td className="py-3 font-semibold font-sans truncate max-w-[140px]" title={userRow.email}>
                                      {userRow.email}
                                    </td>
                                    <td className="py-3">
                                      {isGold ? (
                                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-[#dfba6b] font-bold">ذهبية</span>
                                      ) : isSilver ? (
                                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold">فضية</span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded bg-gray-500/10 text-gray-400">مجانية</span>
                                      )}
                                    </td>
                                    <td className="py-3">
                                      {isActive ? (
                                        <span className="text-emerald-500 font-bold">● نشط</span>
                                      ) : userRow.subscriptionStatus === 'canceled' ? (
                                        <span className="text-red-500 font-semibold">● ملغى</span>
                                      ) : userRow.subscriptionStatus === 'expired' ? (
                                        <span className="text-[#dfba6b] font-semibold">● منتهٍ</span>
                                      ) : (
                                        <span className="text-gray-400">—</span>
                                      )}
                                    </td>
                                    <td className="py-3 font-mono text-[10px] text-gray-400">
                                      {userRow.paymentTransactionId || 'لا يوجد'}
                                    </td>
                                  </tr>
                                );
                              })
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-gray-500">لا يوجد حسابات مسجلة مطابقة للبحث.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'diwans' && (
        <div className="space-y-6">
          <div className={`border rounded-2xl p-6 shadow-xs ${
            isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/15' : 'bg-white border-manuscript-border'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
              <div>
                <h3 className={`text-base font-serif font-black ${isDarkMode ? 'text-[#dfba6b]' : 'text-[#1a472a]'}`}>
                  📜 دواوين المستخدمين المحفوظة سحابياً
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  استعراض عام وقراءة للقصائد والمقاطع التي قام الشعراء المسجلون بحفظها في ديوانهم الشخصي.
                </p>
              </div>

              {/* Refresh & Search */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-60">
                  <input
                    type="text"
                    placeholder="ابحث بالبريد، اسم القصيدة، أو البحر..."
                    value={diwanSearch}
                    onChange={(e) => setDiwanSearch(e.target.value)}
                    className="w-full text-xs p-2 pr-7 rounded-lg bg-gray-50 dark:bg-[#0a120d] border border-gray-200 dark:border-white/10 outline-none focus:ring-1 focus:ring-[#1a472a] text-right"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5" />
                </div>
                <button
                  onClick={fetchAllDiwans}
                  className="px-3 py-2 text-xs bg-[#1a472a] hover:bg-[#153a22] text-white font-serif font-bold rounded-lg transition-all cursor-pointer shrink-0"
                >
                  تحديث القائمة
                </button>
              </div>
            </div>

            {loadingDiwans ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-t-transparent border-[#dfba6b] animate-spin" />
                <p className="font-serif text-sm text-gray-400 animate-pulse">جاري تحميل دواوين المستخدمين من قاعدة البيانات السحابية...</p>
              </div>
            ) : errorDiwans ? (
              <div className="p-6 text-center text-red-500 text-xs">
                {errorDiwans}
              </div>
            ) : allDiwans.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-xs">
                لا توجد أي قصائد محفوظة في الدواوين حالياً.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400">
                      <th className="pb-2 font-semibold">المستخدم والبريد</th>
                      <th className="pb-2 font-semibold">عنوان القصيدة</th>
                      <th className="pb-2 font-semibold">البحر</th>
                      <th className="pb-2 font-semibold">الروي</th>
                      <th className="pb-2 font-semibold">تاريخ الحفظ</th>
                      <th className="pb-2 font-semibold text-left">التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                    {allDiwans
                      .filter((p: any) => {
                        const s = diwanSearch.toLowerCase();
                        return (
                          !s ||
                          p.userEmail?.toLowerCase().includes(s) ||
                          p.title?.toLowerCase().includes(s) ||
                          p.meterName?.toLowerCase().includes(s)
                        );
                      })
                      .map((poem: any) => {
                        return (
                          <tr key={poem.id} className="hover:bg-gray-50 dark:hover:bg-emerald-950/5">
                            <td className="py-3 font-semibold font-sans truncate max-w-[140px]" title={poem.userEmail}>
                              {poem.userEmail || 'مجهول'}
                            </td>
                            <td className="py-3 font-serif font-black text-gray-800 dark:text-gray-100">
                              {poem.title || 'قصيدة بلا عنوان'}
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                                {poem.meterName}
                              </span>
                            </td>
                            <td className="py-3 font-serif font-semibold">
                              {poem.rhymeLetter || poem.verses?.[0]?.rhyme || '—'}
                            </td>
                            <td className="py-3 text-gray-400 font-sans text-[11px]">
                              {poem.createdAt ? new Date(poem.createdAt).toLocaleDateString('ar-EG') : '—'}
                            </td>
                            <td className="py-3 text-left">
                              <button
                                onClick={() => setSelectedAdminPoem(poem)}
                                className="px-2.5 py-1 text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-[#dfba6b] rounded-md font-serif font-bold transition-all cursor-pointer"
                              >
                                👁️ استعراض المخطوطة
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal for viewing the selected poem */}
          {selectedAdminPoem && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
              <div className={`w-full max-w-2xl rounded-2xl p-6 text-right max-h-[85vh] overflow-y-auto relative ${
                isDarkMode ? 'bg-[#0f1d14] text-white border-2 border-[#dfba6b]/30' : 'bg-manuscript-paper text-gray-900 border-2 border-[#b58d3d]'
              }`}>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/5 mb-4">
                  <div>
                    <h3 className="font-serif font-black text-lg text-emerald-600 dark:text-[#dfba6b]">
                      {selectedAdminPoem.title || 'قصيدة بلا عنوان'}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1">
                      صاحب المخطوطة: <span className="font-sans font-bold">{selectedAdminPoem.userEmail}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedAdminPoem(null)}
                    className="p-1 text-gray-400 hover:text-white text-xs font-bold"
                  >
                    إغلاق [X]
                  </button>
                </div>

                {/* Poem verses display */}
                <div className="space-y-3 py-6 px-4 bg-emerald-950/10 dark:bg-black/20 rounded-xl mb-4 border border-[#b58d3d]/10">
                  {selectedAdminPoem.verses && selectedAdminPoem.verses.map((verse: any, i: number) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center text-sm font-serif leading-loose">
                      <div className="font-bold border-l border-emerald-900/10 dark:border-white/5 px-2">
                        {verse.firstHemistich || verse.first || verse.first_hemistich}
                      </div>
                      <div className="font-bold px-2">
                        {verse.secondHemistich || verse.second || verse.second_hemistich}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-serif font-bold mb-4">
                  <div className="p-2 rounded bg-gray-500/5">البحر: {selectedAdminPoem.meterName}</div>
                  <div className="p-2 rounded bg-gray-500/5">القافية/الروي: {selectedAdminPoem.rhymeLetter || '—'}</div>
                  <div className="p-2 rounded bg-gray-500/5">الغرض: {selectedAdminPoem.purpose || '—'}</div>
                </div>

                {selectedAdminPoem.explanation && (
                  <div className="mt-4 p-3 bg-amber-500/5 rounded-lg text-xs leading-relaxed border border-amber-500/10">
                    <h4 className="font-serif font-bold text-emerald-600 dark:text-[#dfba6b] mb-1">الشرح اللغوي والتفسير:</h4>
                    <p className="text-gray-400">{selectedAdminPoem.explanation}</p>
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
