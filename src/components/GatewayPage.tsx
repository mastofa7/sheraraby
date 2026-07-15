import React from 'react';
import { 
  Sparkles, 
  Crown, 
  Award, 
  LogOut, 
  Feather, 
  Play, 
  ShieldAlert,
  Flame,
  Gauge
} from 'lucide-react';

interface GatewayPageProps {
  user: any;
  userPlanId: string;
  userPlanLimit: number;
  remainingDailyUses: number | null;
  isUserAdmin: boolean;
  onEnterPlatform: () => void;
  onSignOut: () => void;
  isDarkMode: boolean;
}

export default function GatewayPage({
  user,
  userPlanId,
  userPlanLimit,
  remainingDailyUses,
  isUserAdmin,
  onEnterPlatform,
  onSignOut,
  isDarkMode
}: GatewayPageProps) {
  
  // Format Plan Names
  const getPlanLabel = () => {
    if (isUserAdmin) return 'المالك والمدير (كامل الصلاحيات)';
    return 'الخطة المجانية (Free)';
  };

  // Format limits
  const limitLabel = isUserAdmin ? 'غير محدود عروضياً' : `${userPlanLimit} محاولات يومياً`;
  const remainingLabel = isUserAdmin ? 'استهلاك غير محدود (∞)' : `${remainingDailyUses !== null ? remainingDailyUses : '...'} محاولات متبقية اليوم`;

  return (
    <div className={`min-h-screen text-right select-none transition-colors duration-300 font-sans flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-[#060c08] text-gray-200' : 'bg-[#fbf9f4] text-gray-800'
    }`} dir="rtl">
      
      {/* Absolute Background Ornaments */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(181,141,61,0.1),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[radial-gradient(ellipse_at_bottom_left,rgba(26,71,42,0.08),transparent_60%)] pointer-events-none" />

      {/* Main Gateway Card */}
      <div className={`w-full max-w-lg rounded-2xl border p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#0a140f] border-[#dfba6b]/30 shadow-black/50' 
          : 'bg-[#fdfcf9] border-[#b58d3d]/35 shadow-[#1a472a]/5'
      }`}>
        
        {/* Decorative Traditional Border Corner Accent */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-[radial-gradient(ellipse_at_top_left,rgba(181,141,61,0.15),transparent)]" />
        
        {/* Header Greeting */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border mb-4 bg-amber-500/10 border-amber-500/20 text-amber-500">
            <Sparkles className="w-3 h-3 text-[#dfba6b]" />
            <span>بوابة التحقق الآمن وعقد القرائح</span>
          </div>
          <h2 className={`text-2xl font-serif font-black ${isDarkMode ? 'text-[#dfba6b]' : 'text-[#1a472a]'}`}>
            مَرْحَبَاً بِكَ يَا شَاعِرَنَا الْفَذّ!
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            تمت المصادقة سحابياً بنجاح، نرجو تأكيد بيانات هويتك لمتابعة الدخول.
          </p>
        </div>

        {/* Profile Card details container */}
        <div className={`p-6 rounded-xl border mb-6 flex flex-col items-center gap-4 ${
          isDarkMode ? 'bg-[#0f2115] border-[#dfba6b]/15' : 'bg-[#f6f4ee] border-[#b58d3d]/20'
        }`}>
          
          {/* User Image Picture with gold rings */}
          <div className="relative group">
            <div className="absolute inset-0 bg-[#dfba6b] rounded-full blur-xs opacity-75 animate-pulse" />
            <img 
              src={user?.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
              alt={user?.displayName || 'الشاعر'} 
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full border-2 border-[#dfba6b] object-cover relative z-10"
            />
            {isUserAdmin && (
              <div className="absolute bottom-0 right-0 z-20 bg-amber-500 border border-[#dfba6b] rounded-full p-1 shadow-md" title="المالك">
                <Crown className="w-4 h-4 text-[#060c08]" />
              </div>
            )}
          </div>

          {/* Name & Email */}
          <div className="text-center">
            <h3 className={`font-serif font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.displayName || 'أديب صانع الشعر'}
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.email}</p>
          </div>

          <div className="w-full h-px bg-gray-200 dark:bg-white/10 my-1" />

          {/* Plan & Usage statistics */}
          <div className="w-full space-y-3 text-xs">
            {/* Plan row */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-serif">الباقة الفنية:</span>
              <span className={`px-2 py-1 rounded-lg font-serif font-bold flex items-center gap-1 border ${
                isUserAdmin 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                  : userPlanId === 'gold' || userPlanId === 'premium'
                  ? 'bg-amber-500/10 border-amber-500/20 text-[#dfba6b]'
                  : userPlanId === 'silver' || userPlanId === 'member'
                  ? 'bg-slate-400/10 border-slate-400/20 text-slate-300'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              }`}>
                {isUserAdmin ? <Crown className="w-3 h-3 text-amber-500 shrink-0" /> : <Award className="w-3 h-3 shrink-0" />}
                {getPlanLabel()}
              </span>
            </div>

            {/* Daily limit row */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-serif">الحد اليومي الممنوح:</span>
              <span className="font-bold text-gray-300 dark:text-gray-200">{limitLabel}</span>
            </div>

            {/* Remaining Today row */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-serif">العداد الباقي لليوم:</span>
              <span className={`font-bold flex items-center gap-1 ${
                isUserAdmin ? 'text-amber-400' : (remainingDailyUses !== 0 ? 'text-emerald-400' : 'text-red-400')
              }`}>
                <Gauge className="w-3.5 h-3.5 shrink-0" />
                {remainingLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Button */}
        <div className="flex flex-col gap-3">
          
          {/* Proceed button: enter platform */}
          <button
            onClick={onEnterPlatform}
            className={`w-full py-4 rounded-xl font-serif font-bold text-base shadow-xl active:translate-y-0.5 transition-all flex items-center justify-center gap-2 border-b-4 cursor-pointer ${
              isDarkMode
                ? 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-900'
                : 'bg-[#1a472a] hover:bg-[#153a22] text-white border-[#0d2a18]'
            }`}
            id="gateway-enter-platform-btn"
          >
            <Play className="w-4 h-4 shrink-0 fill-current" />
            الدخول إلى صومعة النظم والمنصة
          </button>

          {/* Signout button */}
          <button
            onClick={onSignOut}
            className={`w-full py-2.5 rounded-xl text-xs font-serif font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              isDarkMode 
                ? 'border-red-900/30 text-red-400 hover:bg-red-950/20' 
                : 'border-red-200 text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            تسجيل خروج (تغيير الحساب)
          </button>
        </div>

        {/* Platform credit */}
        <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-6">
          اسم المطور: مصطفى محمود محمد عبد الحليم (مؤسس ومطور منصة صانع الشعر العربي)
        </p>

      </div>
    </div>
  );
}
