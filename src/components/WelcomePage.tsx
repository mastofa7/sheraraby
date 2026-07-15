import React from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Award, 
  Layers, 
  Crown, 
  Feather, 
  Quote, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Users
} from 'lucide-react';

interface WelcomePageProps {
  onSignInWithGoogle: () => void;
  onSignInAnonymously: () => void;
  isDarkMode: boolean;
  unauthorizedDomainError: string | null;
  popupClosedError: boolean;
  error: string | null;
  isSigningIn?: boolean;
}

export default function WelcomePage({
  onSignInWithGoogle,
  onSignInAnonymously,
  isDarkMode,
  unauthorizedDomainError,
  popupClosedError,
  error,
  isSigningIn = false
}: WelcomePageProps) {
  return (
    <div className={`min-h-screen text-right select-none transition-colors duration-300 font-sans ${
      isDarkMode ? 'bg-[#060c08] text-gray-200' : 'bg-[#fbf9f4] text-gray-800'
    }`} dir="rtl">
      
      {/* Decorative Traditional Arabic Header Line */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#b58d3d] to-transparent" />

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-16 px-4">
        {/* Subtle radial gradients for premium depth */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,rgba(181,141,61,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[radial-gradient(ellipse_at_bottom_left,rgba(26,71,42,0.12),transparent_60%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          
          {/* Platform Badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif font-bold mb-6 border ${
            isDarkMode 
              ? 'border-[#dfba6b]/30 bg-[#0d1c11] text-[#dfba6b]' 
              : 'border-[#b58d3d]/30 bg-[#1a472a]/5 text-[#1a472a]'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#dfba6b] animate-pulse" />
            <span>بوابة الذكاء البلاغي المدفوعة — بنية Gemini المتفوقة</span>
          </div>

          {/* Logo Icon */}
          <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center mb-6 shadow-xl transition-transform hover:rotate-6 ${
            isDarkMode 
              ? 'bg-[#102216] border-[#dfba6b] text-[#dfba6b]' 
              : 'bg-[#1a472a] border-[#b58d3d] text-white'
          }`}>
            <Feather className="w-12 h-12" />
          </div>

          {/* Project Title */}
          <h1 className={`text-4xl md:text-5xl font-black font-serif tracking-tight mb-4 ${
            isDarkMode ? 'text-[#dfba6b]' : 'text-[#1a472a]'
          }`}>
            صَانِعُ الشِّعْرِ الْعَرَبِيّ
          </h1>

          {/* Core Tagline */}
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-serif max-w-2xl leading-relaxed mb-8">
            ديوان العبقرية الرقمي الأول من نوعه لتمكين النظم، العروض، النقد البلاغي، والمحاكاة التراثية الموزونة باستخدام نماذج الذكاء الاصطناعي الفائقة.
          </p>

          {/* Prompt Action: Google Login */}
          <div className="w-full max-w-md mx-auto mb-10">
            <button
              onClick={onSignInWithGoogle}
              disabled={isSigningIn}
              className={`w-full py-4 px-6 rounded-2xl font-serif font-bold text-base md:text-lg shadow-xl active:translate-y-0.5 transition-all flex items-center justify-center gap-3 border ${
                isSigningIn ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
              } ${
                isDarkMode 
                  ? 'bg-gradient-to-b from-[#dfba6b] to-[#cba355] text-[#060c08] border-[#dfba6b] hover:brightness-110' 
                  : 'bg-gradient-to-b from-[#1a472a] to-[#12331e] text-white border-[#12331e] hover:brightness-105'
              }`}
              id="welcome-google-signin-btn"
            >
              {isSigningIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  الدخول والتحليق بواسطة Google
                </>
              )}
            </button>

            {/* Error Handlers */}
            {unauthorizedDomainError && (
              <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs text-center leading-relaxed">
                🚨 عذراً، النطاق <strong>{unauthorizedDomainError}</strong> غير مضاف لجهات الاتصال المسموحة في Firebase Console. 
                يرجى إضافته أو التواصل مع الإدارة.
              </div>
            )}

            {popupClosedError && (
              <div className="mt-6 p-6 rounded-2xl border-2 border-amber-400 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-right space-y-4" dir="rtl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">💡</span>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-serif font-bold text-sm text-amber-950 dark:text-amber-300">
                      حل مشكلة تسجيل الدخول (إغلاق أو حظر النافذة المنبثقة)
                    </h4>
                    <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                      يبدو أن متصفحك أو إطار العمل الحالي (IFrame) يمنع ظهور النوافذ المنبثقة لـ Google Sign-In لتسجيل الدخول.
                    </p>
                    <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 font-bold">
                      لا تقلق! لقد قمنا بتوفير حلين فوريين لمتابعة إبداعك الأدبي دون قيود:
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={onSignInAnonymously}
                        className="px-4 py-2 bg-[#1a472a] hover:bg-[#1f5633] text-[#dfba6b] font-serif font-black text-[11px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-[#dfba6b]/20"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        الحل 1: دخول فوري كشاعر ضيف
                      </button>

                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 font-serif font-bold text-[11px] rounded-xl shadow-xs transition-all text-center flex items-center justify-center gap-1.5 border border-gray-200"
                      >
                        🌐 الحل 2: فتح في علامة تبويب مستقلة
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && !popupClosedError && !unauthorizedDomainError && (
              <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs text-center leading-relaxed">
                {error}
              </div>
            )}
          </div>

          {/* Quick Notice */}
          <div className={`p-4 rounded-xl border text-xs max-w-lg mb-12 text-center leading-relaxed ${
            isDarkMode ? 'bg-[#0f2115] border-[#dfba6b]/20 text-gray-300' : 'bg-white border-[#b58d3d]/20 text-gray-600'
          }`}>
            ⚖️ <strong>ملاحظة هامة:</strong> يتطلب هذا النظام المصادقة التامة لتوفير الدعم السحابي لقصائدك ومنع الإغراق السيبراني والاستهلاك المفرط لعدّادات النماذج.
          </div>
        </div>
      </div>

      {/* Developer Profile Card (بيانات المطور) */}
      <div className={`py-12 px-4 border-t border-b ${
        isDarkMode ? 'bg-[#0c140f] border-white/5' : 'bg-[#f7f4ed] border-gray-150'
      }`}>
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
          <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center shrink-0 ${
            isDarkMode ? 'bg-[#102216] border-[#dfba6b]/30' : 'bg-white border-[#b58d3d]/30'
          }`}>
            <Award className="w-10 h-10 text-[#dfba6b]" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#b58d3d] font-bold">مُؤسّس ومُطوّر المَنصّة</span>
            <h3 className={`font-serif font-bold text-xl mt-1 mb-2 ${
              isDarkMode ? 'text-white' : 'text-[#1a472a]'
            }`}>
              مصطفى محمود محمد عبد الحليم
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              باحث ومطور برمجيات، ومؤسس منصة صانع الشعر العربي للتمكين الرقمي العروضي والبلاغي. يُعنى بدمج الأدب الكلاسيكي الأصيل بالخوارزميات والذكاء الاصطناعي لتطوير المعاجم البلاغية ونظم القوافي.
            </p>
          </div>
        </div>
      </div>

      {/* About Section (نبذة عن المنصة) */}
      <div className="py-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-[#b58d3d] tracking-widest uppercase">تَعْريفٌ شَامِل</span>
          <h2 className={`text-2xl font-bold font-serif mt-1 ${isDarkMode ? 'text-white' : 'text-royal-800'}`}>
            عَن المَنصّة ورِسَالَتِهَا
          </h2>
          <div className="w-16 h-0.5 bg-[#b58d3d] mx-auto mt-3" />
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 font-serif leading-relaxed text-justify mb-8">
          تعد منصة <strong>صانع الشعر العربي</strong> أول بيئة رقمية ذكية متخصصة تعتمد على نماذج Gemini الفائقة لتطوير الأدب العربي وإحيائه. تُعنى المنصة بنظم الشعر العمودي بمختلف البحور الخليلية الخمسة عشر وتحليل الأوزان تفعيلةً وتفعيلة، مع تقديم خدمات المعارضة الشعرية المضاهاة لعيون الشعر التاريخي، وصياغة المحسنات البديعية وتوليدها، ومطابقة وتكملة القوافي والبحور لخدمة الأدباء والشعراء والباحثين في التراث العربي الأصيل.
        </p>
      </div>

      {/* Features Section */}
      <div className={`py-16 px-4 border-t border-b ${
        isDarkMode ? 'bg-[#0a110d] border-white/5' : 'bg-white border-gray-100'
      }`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#b58d3d] tracking-widest uppercase">تَقْنِيَاتُ النَّظْم</span>
            <h2 className={`text-2xl font-bold font-serif mt-1 ${isDarkMode ? 'text-white' : 'text-royal-800'}`}>
              أَهَمُّ مُمَيِّزَاتِ المَنصَّةِ الرَّقْمِيَّة
            </h2>
            <div className="w-16 h-0.5 bg-[#b58d3d] mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className={`p-6 rounded-2xl border text-right transition-all hover:translate-y-[-2px] ${
              isDarkMode ? 'bg-[#102015] border-[#dfba6b]/15' : 'bg-[#fdfcf9] border-[#b58d3d]/15'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 text-[#dfba6b]">
                <Feather className="w-5 h-5" />
              </div>
              <h3 className={`font-serif font-bold text-base mb-2 ${isDarkMode ? 'text-white' : 'text-[#1a472a]'}`}>
                صومعة النظم والبحور
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                نظم قصائد عمودية على ١٥ بحراً عروضياً متكاملاً، مع إمكانية مضاهاة القافية وضبط الوزن بدقة بالغة الجمال والتماسك.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`p-6 rounded-2xl border text-right transition-all hover:translate-y-[-2px] ${
              isDarkMode ? 'bg-[#102015] border-[#dfba6b]/15' : 'bg-[#fdfcf9] border-[#b58d3d]/15'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 text-[#dfba6b]">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className={`font-serif font-bold text-base mb-2 ${isDarkMode ? 'text-white' : 'text-[#1a472a]'}`}>
                المعارضة الشعرية المتقدمة
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                مضاهاة ومحاكاة المعارضات التاريخية لأمراء الشعر العربي، مع ضبط الحوار الفني والقافية المشتركة.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`p-6 rounded-2xl border text-right transition-all hover:translate-y-[-2px] ${
              isDarkMode ? 'bg-[#102015] border-[#dfba6b]/15' : 'bg-[#fdfcf9] border-[#b58d3d]/15'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 text-[#dfba6b]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className={`font-serif font-bold text-base mb-2 ${isDarkMode ? 'text-white' : 'text-[#1a472a]'}`}>
                المحسنات البديعية والبلاغية
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                صياغة وتوليد الاستعارات والتشبيهات والطباق والمقابلة بطرق أدبية جزلة تتناغم مع قرائح الفصحاء.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`p-6 rounded-2xl border text-right transition-all hover:translate-y-[-2px] ${
              isDarkMode ? 'bg-[#102015] border-[#dfba6b]/15' : 'bg-[#fdfcf9] border-[#b58d3d]/15'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 text-[#dfba6b]">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className={`font-serif font-bold text-base mb-2 ${isDarkMode ? 'text-white' : 'text-[#1a472a]'}`}>
                مصحح العروض والتفاعيل
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                أداة متخصصة لتجزئة الأبيات تفعيلة تفعيلة ومطابقة النطق للكشف الصارم عن أي كسر أو هفوات عروضية.
              </p>
            </div>

            {/* Feature 5 */}
            <div className={`p-6 rounded-2xl border text-right transition-all hover:translate-y-[-2px] ${
              isDarkMode ? 'bg-[#102015] border-[#dfba6b]/15' : 'bg-[#fdfcf9] border-[#b58d3d]/15'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 text-[#dfba6b]">
                <Quote className="w-5 h-5" />
              </div>
              <h3 className={`font-serif font-bold text-base mb-2 ${isDarkMode ? 'text-white' : 'text-[#1a472a]'}`}>
                خزانة ديوانك الشخصي
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                مساحة سحابية شخصية مؤمنة لحفظ ومراجعة كل قصيدة ومخطوطة وضعتها، للرجوع إليها أو نقدها لاحقاً.
              </p>
            </div>

            {/* Feature 6 */}
            <div className={`p-6 rounded-2xl border text-right transition-all hover:translate-y-[-2px] ${
              isDarkMode ? 'bg-[#102015] border-[#dfba6b]/15' : 'bg-[#fdfcf9] border-[#b58d3d]/15'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 text-[#dfba6b]">
                <Users className="w-5 h-5" />
              </div>
              <h3 className={`font-serif font-bold text-base mb-2 ${isDarkMode ? 'text-white' : 'text-[#1a472a]'}`}>
                حساب مالك خاص
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                لوحة إدارية متكاملة تتيح للمشرفين تتبع العمليات، ومتابعة سجلات الاستخدام وتحديث الاشتراكات بسهولة.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing / Plans Section */}
      <div className="py-16 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-[#b58d3d] tracking-widest uppercase">الاشْتِرَاكَات</span>
          <h2 className={`text-2xl font-bold font-serif mt-1 ${isDarkMode ? 'text-white' : 'text-royal-800'}`}>
            الخُطَطُ والْبَاقَاتُ الأدَبِيَّةُ المُتَاحَة
          </h2>
          <div className="w-16 h-0.5 bg-[#b58d3d] mx-auto mt-3" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Plan 1: Free */}
          <div className={`p-8 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
            isDarkMode ? 'bg-[#102015] border-[#dfba6b]/15' : 'bg-white border-[#b58d3d]/20'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400">البداية المجانية</span>
              <h3 className={`text-xl font-bold font-serif mt-1 mb-4 ${isDarkMode ? 'text-white' : 'text-[#1a472a]'}`}>الباقة المجانية</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold font-serif text-[#dfba6b]">0</span>
                <span className="text-xs text-gray-400">دولار / شهرياً</span>
              </div>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                الخيار الأساسي المناسب للشعراء الهواة وتجربة الأدوات عروضاً ونظماً.
              </p>
              <ul className="space-y-3 mb-8 text-xs text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>١٠ استخدامات يومية كحد أقصى</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>تحليل بحور وعروض الشعر</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>حفظ القصائد بالأرشيف والديوان</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Plan 2: Member (Silver) */}
          <div className={`p-8 rounded-2xl border flex flex-col justify-between relative overflow-hidden scale-102 shadow-lg ${
            isDarkMode ? 'bg-[#102517] border-[#dfba6b]/40' : 'bg-[#fdfbf7] border-[#b58d3d]/50'
          }`}>
            {/* Popular badge */}
            <div className="absolute top-0 left-0 bg-[#b58d3d] text-white text-[9px] font-bold px-3 py-1 rounded-br-xl">
              الأكثر طلباً
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#b58d3d]">ترقية ممتازة</span>
              <h3 className={`text-xl font-bold font-serif mt-1 mb-4 ${isDarkMode ? 'text-white' : 'text-[#1a472a]'}`}>الباقة الأدبية المتوسطة</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold font-serif text-[#b58d3d]">20</span>
                <span className="text-xs text-gray-400">دولار / شهرياً</span>
              </div>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                للشعراء الفصحاء والباحثين الراغبين في نظم متكامل ومتقدم يومياً.
              </p>
              <ul className="space-y-3 mb-8 text-xs text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>١٠٠ استخدام يومياً متاحاً</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>أداة المعارضة الشعرية المتقدمة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>المحسنات البديعية والبلاغية كاملة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>أولوية معالجة عروضية فائقة السرعة</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Plan 3: Premium (Gold) */}
          <div className={`p-8 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
            isDarkMode ? 'bg-[#102015] border-[#dfba6b]/15' : 'bg-white border-[#b58d3d]/20'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#dfba6b]">الأقصى واللامحدود</span>
              <h3 className={`text-xl font-bold font-serif mt-1 mb-4 ${isDarkMode ? 'text-white' : 'text-[#1a472a]'}`}>الباقة الاحترافية الفائقة</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold font-serif text-[#dfba6b]">80</span>
                <span className="text-xs text-gray-400">دولار / شهرياً</span>
              </div>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                للبيوت الأدبية والرواد المحترفين الباحثين عن أعلى أداء بلاغي.
              </p>
              <ul className="space-y-3 mb-8 text-xs text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>٥٠٠ استخدام يومي متاح</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>أقصى سرعة استجابة فائقة من Gemini</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>جميع أدوات وميزات المنصة بلا قيود</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>دعم فني واستشارات خاصة</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

        <div className="text-center mt-12">
          <button
            onClick={onSignInWithGoogle}
            className={`inline-flex items-center gap-2 py-3.5 px-8 rounded-xl font-serif font-bold text-sm shadow-md transition-all hover:scale-102 cursor-pointer ${
              isDarkMode 
                ? 'bg-[#1a472a] hover:bg-[#153a22] text-white border border-[#dfba6b]/30' 
                : 'bg-[#1a472a] hover:bg-[#153a22] text-white'
            }`}
          >
            سجل الدخول الآن لبدء النظم العمودي مجاناً
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className={`py-12 border-t text-center text-xs ${
        isDarkMode ? 'bg-[#060c08] border-white/5 text-gray-500' : 'bg-gray-50 border-gray-150 text-gray-400'
      }`}>
        <p className="font-serif text-[#b58d3d] font-bold text-sm mb-1">صانع الشعر العربي — موازين الأصالة والقرائح الرقمية</p>
        <p className="mb-4">جميع الحقوق محفوظة لمنصة صانع الشعر العربي © ٢٠٢٦</p>
        <div className="w-16 h-px bg-gray-200 dark:bg-white/10 mx-auto" />
      </footer>

    </div>
  );
}
