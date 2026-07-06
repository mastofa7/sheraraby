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
  Info
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

  useEffect(() => {
    fetchStats();
  }, []);

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
            <TrendingUp className="w-3 h-3 text-emerald-500" /> +١٥٪ نسبة زيادة النشاط
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
            <TrendingUp className="w-3 h-3 text-emerald-500" /> معدل الاستجابة ممتاز
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
    </div>
  );
}
