import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Check, 
  RefreshCw,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '../firebase';

interface PlanDetail {
  id: string;
  name: string;
  limit: number;
  features: string[];
  price: string;
}

interface SubscriptionPlansProps {
  isDarkMode: boolean;
  user: any;
  onUpdateRemainingUses: (uses: number) => void;
  onUpdateUserPlanId?: (planId: string) => void;
}

export default function SubscriptionPlans({ 
  isDarkMode, 
  user, 
  onUpdateRemainingUses,
  onUpdateUserPlanId
}: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string>('free');
  const [maxLimit, setMaxLimit] = useState<number>(10);
  const [usedToday, setUsedToday] = useState<number>(0);
  const [upgradingTo, setUpgradingTo] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Hardcoded plan specifications as requested
  const plans: Record<string, PlanDetail> = {
    free: {
      id: 'free',
      name: 'الخطة المجانية',
      limit: 10,
      price: 'مجاني',
      features: [
        'تحليل عروض وبحور الشعر العربي',
        'تكملة القوافي والبحور المتقاطعة',
        'حفظ القصائد بالأرشيف الشخصي',
        '١٠ استخدامات يومية كحد أقصى'
      ]
    },
    member: {
      id: 'member',
      name: 'الخطة المتوسطة',
      limit: 100,
      price: '20 دولار شهرياً',
      features: [
        'جميع مميزات الخطة المجانية',
        '١٠٠ استخدام يومياً متاحاً',
        'أولوية معالجة فائقة السرعة للقصائد',
        'أداة المعارضة الشعرية المتقدمة',
        'المحسنات البديعية والبلاغية كاملة'
      ]
    },
    premium: {
      id: 'premium',
      name: 'الخطة الاحترافية',
      limit: 500,
      price: '80 دولار شهرياً',
      features: [
        'جميع ميزات المنصة والذكاء الاصطناعي بلا قيود',
        '٥٠٠ استخدام يومي متاح',
        'أقصى سرعة استجابة فائقة ومباشرة من Gemini',
        'استشارات ومقترحات شعرية متقدمة ودقيقة جداً',
        'دعم فني مخصص على مدار الساعة للشعراء'
      ]
    }
  };

  const fetchSubscriptionStatus = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/user/plan');
      if (!res.ok) {
        throw new Error('فشل تحميل بيانات الاشتراك من الخادم.');
      }
      const data = await res.json();
      setPlanId(data.planId || 'free');
      setMaxLimit(data.maxLimit || 10);
      setUsedToday(data.usedToday || 0);
      if (onUpdateUserPlanId) {
        onUpdateUserPlanId(data.planId || 'free');
      }
      onUpdateRemainingUses(data.remainingDailyUses ?? 10);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ غير متوقع أثناء تحميل خطط الاشتراك.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user]);

  // If the user has not signed in, do not render subscriptions at all (completely hidden)
  if (!user) {
    return null;
  }

  const handleUpgradeClick = (targetPlan: string) => {
    setUpgradingTo(targetPlan);
    setShowConfirmModal(true);
    setSuccess(false);
    setProcessing(false);
  };

  const handleConfirmUpgrade = async () => {
    if (!upgradingTo) return;
    setProcessing(true);
    try {
      const res = await apiFetch('/api/user/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: upgradingTo })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل تحديث الخطة.');
      }
      const data = await res.json();
      setPlanId(data.planId || upgradingTo);
      setMaxLimit(data.maxLimit || plans[upgradingTo].limit);
      setUsedToday(data.usedToday || 0);
      
      if (onUpdateUserPlanId) {
        onUpdateUserPlanId(data.planId || upgradingTo);
      }
      onUpdateRemainingUses(data.remainingDailyUses ?? plans[upgradingTo].limit);
      
      setSuccess(true);
      setTimeout(() => {
        setShowConfirmModal(false);
        setUpgradingTo(null);
        setSuccess(false);
      }, 1800);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'حدث خطأ أثناء ترقية الخطة.');
    } finally {
      setProcessing(false);
    }
  };

  const remainingDailyUses = Math.max(0, maxLimit - usedToday);
  const usagePercent = Math.min(100, Math.round((usedToday / maxLimit) * 100));

  // visual configurations for cards
  const planDesign: Record<string, { color: string; text: string; bg: string; border: string; badge: string }> = {
    free: {
      color: 'from-emerald-600 to-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: isDarkMode ? 'bg-[#0f2115]/30 border-emerald-950/20' : 'bg-emerald-50/20 border-emerald-100',
      border: 'border-emerald-200 dark:border-emerald-950/30',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
    },
    member: {
      color: 'from-slate-600 to-slate-500',
      text: 'text-slate-600 dark:text-slate-400',
      bg: isDarkMode ? 'bg-slate-900/20 border-slate-800/40' : 'bg-slate-50/50 border-slate-200/60',
      border: 'border-slate-300 dark:border-slate-800/40',
      badge: 'bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300'
    },
    premium: {
      color: 'from-[#b58d3d] to-[#dfba6b]',
      text: 'text-[#b58d3d]',
      bg: isDarkMode ? 'bg-[#dfba6b]/5 border-[#dfba6b]/10' : 'bg-amber-50/10 border-amber-100/60',
      border: 'border-[#dfba6b]/30 dark:border-[#dfba6b]/20',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-[#dfba6b]'
    }
  };

  if (loading && Object.keys(plans).length === 0) {
    return (
      <div className={`border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm min-h-[300px] ${
        isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/20 text-white' : 'bg-white border-[#b58d3d]/20 text-gray-800'
      }`}>
        <RefreshCw className="w-8 h-8 text-[#b58d3d] animate-spin" />
        <p className="font-serif font-bold text-lg animate-pulse">يجري تهيئة نظام الاشتراكات والخطط الأدبية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header section */}
      <div className="border-b border-gray-100 dark:border-white/5 pb-4">
        <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${
          isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-950/10 text-[#1a472a]'
        }`}>
          باقات العضويات والاشتراكات الأدبية
        </span>
        <h2 className={`text-2xl font-serif font-black mt-1.5 ${isDarkMode ? 'text-[#dfba6b]' : 'text-[#1a472a]'}`}>
          الاشتراكات المتاحة
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">اختر خطتك الأدبية المفضلة لتوسيع حدود صياغة روائع الشعر والقصائد</p>
      </div>

      {/* Usage dashboard widget */}
      <div className={`border rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all ${
        isDarkMode ? 'bg-[#102216]/60 border-[#dfba6b]/20 text-white' : 'bg-white border-[#b58d3d]/20 text-gray-800'
      }`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl animate-pulse" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 block font-serif">حالة باقتك الحالية</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-serif font-black px-3.5 py-1 rounded-xl ${
                planId === 'premium' || planId === 'gold'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-400/20' 
                  : planId === 'member' || planId === 'silver'
                  ? 'bg-slate-400/10 text-slate-300 border border-slate-400/20' 
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'
              }`}>
                {planId === 'premium' || planId === 'gold' ? 'الخطة الاحترافية' : planId === 'member' || planId === 'silver' ? 'الخطة المتوسطة' : 'الخطة المجانية'}
              </span>
              <span className="text-xs text-gray-400">• حساب مسجل نشط</span>
            </div>
          </div>

          <div className="flex-1 max-w-md space-y-2">
            <div className="flex justify-between items-end text-xs">
              <span className="text-gray-400">الاستخدام اليومي المتاح للعدادات الأدبية:</span>
              <span className="font-sans font-bold">
                {usedToday} / {maxLimit} <span className="text-[10px] text-gray-400">(المتبقي اليوم: {remainingDailyUses})</span>
              </span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 dark:bg-emerald-950/40 rounded-full overflow-hidden p-0.5 border border-gray-200/50 dark:border-emerald-900/10">
              <div 
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-l from-[#b58d3d] to-[#dfba6b]"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(plans).map(([id, plan]) => {
          const isCurrent = planId === id || (id === 'member' && planId === 'silver') || (id === 'premium' && planId === 'gold');
          const design = planDesign[id] || planDesign.free;

          return (
            <div 
              key={id}
              className={`border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-xs relative ${
                isCurrent 
                  ? 'border-amber-400 dark:border-[#dfba6b] scale-[1.03] ring-1 ring-amber-400/20 shadow-md' 
                  : design.border
              } ${design.bg}`}
            >
              {/* Current plan indicator badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-4 bg-amber-500 text-amber-950 text-[9px] font-bold font-serif px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Crown className="w-3 h-3" /> خطتك الحالية
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${design.badge}`}>
                      {plan.name}
                    </span>
                    <span className="text-xs font-serif font-black text-[#8b1d2e] dark:text-[#dfba6b] bg-amber-500/5 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/10">
                      {plan.price}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-3xl font-serif font-black">{plan.limit}</span>
                    <span className="text-xs text-gray-400">استخدام / يومياً</span>
                  </div>
                </div>

                {/* Features list */}
                <div className="border-t border-gray-100 dark:border-white/5 pt-4 space-y-2.5">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isCurrent ? 'text-amber-500' : 'text-emerald-600'}`} />
                      <span className="text-gray-400 leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action button */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                {isCurrent ? (
                  <button 
                    disabled 
                    className="w-full py-2.5 bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 text-xs font-serif font-bold rounded-xl border border-gray-200 dark:border-white/5 cursor-not-allowed select-none"
                    id={`active-btn-${id}`}
                  >
                    خطتك الحالية
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpgradeClick(id)}
                    className={`w-full py-2.5 text-xs font-serif font-bold rounded-xl transition-all cursor-pointer ${
                      id === 'premium' 
                        ? 'bg-gradient-to-r from-[#b58d3d] to-[#dfba6b] hover:from-[#9c7830] hover:to-[#cfa85a] text-[#1a472a] shadow-md' 
                        : id === 'member'
                        ? 'bg-[#1a472a] hover:bg-[#12331e] text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-200'
                    }`}
                    id={`upgrade-btn-${id}`}
                  >
                    {id === 'free' ? 'تفعيل الخطة المجانية' : 'اشترك الآن'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simplified Upgrade Confirmation Popup (RTL & Beautiful) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl space-y-5 relative ${
            isDarkMode ? 'bg-[#0f2115] border-[#dfba6b]/30 text-white' : 'bg-white border-[#b58d3d]/30 text-gray-800'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs bg-[#b58d3d]/10 text-[#b58d3d] font-bold px-2.5 py-0.5 rounded">نظام المحاكاة الأدبية</span>
                <h3 className="font-serif font-black text-lg mt-1 text-[#b58d3d] flex items-center gap-1.5">
                  <Crown className="w-5 h-5" /> تأكيد تفعيل الاشتراك
                </h3>
              </div>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                id="close-modal-btn"
              >
                ✕
              </button>
            </div>

            {success ? (
              <div className="text-center py-8 space-y-4 animate-scale-up">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h4 className="font-serif font-black text-xl text-emerald-600 dark:text-emerald-400">تهانينا! تم تفعيل الاشتراك</h4>
                <p className="text-xs text-gray-400">تمت ترقية حسابك وتفعيل {plans[upgradingTo || '' ]?.name} فوراً لتبدأ رحلتك الأدبية اللانهائية.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs leading-relaxed space-y-1.5">
                  <p>أنت بصدد تغيير اشتراكك وتفعيل **{plans[upgradingTo || '']?.name}**.</p>
                  <ul className="list-disc list-inside space-y-1 opacity-80 mr-2">
                    <li>الحد اليومي الجديد: **{plans[upgradingTo || '']?.limit} استخدام**</li>
                    <li>تكلفة الاشتراك: **{plans[upgradingTo || '']?.price}**</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[10px] text-blue-500 leading-normal">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>بناءً على تفضيلاتك الموقرة، تم إرجاء تفعيل بوابة الدفع الفعلية (Paymob) وسيجري الآن تفعيل الاشتراك تجريبياً فوراً بدون أي تكاليف مادية حقيقية للتجريب.</span>
                </div>

                <div className="flex gap-3 pt-3">
                  <button 
                    onClick={handleConfirmUpgrade}
                    disabled={processing}
                    className="flex-1 py-2.5 bg-[#1a472a] hover:bg-[#12331e] text-white text-xs font-serif font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    id="confirm-upgrade-btn"
                  >
                    {processing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> جاري التفعيل...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" /> تأكيد الاشتراك والتفعيل الفوري
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setShowConfirmModal(false)}
                    disabled={processing}
                    className="px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-serif font-bold rounded-xl transition-all cursor-pointer"
                    id="cancel-upgrade-btn"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
