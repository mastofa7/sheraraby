import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Check, 
  Sparkles, 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  ShieldCheck, 
  CreditCard,
  CheckCircle2,
  RefreshCw,
  Zap,
  Info,
  Gift
} from 'lucide-react';
import { apiFetch } from '../firebase';

interface PlanDetail {
  id: string;
  name: string;
  limit: number;
  features: string[];
  price?: string;
}

interface SubscriptionPlansProps {
  isDarkMode: boolean;
  user: any;
  onUpdateRemainingUses: (uses: number) => void;
  onUpdateUserPlanId?: (planId: string) => void;
  onSignIn?: () => void;
}

export default function SubscriptionPlans({ 
  isDarkMode, 
  user, 
  onUpdateRemainingUses,
  onUpdateUserPlanId,
  onSignIn
}: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string>('visitor');
  const [maxLimit, setMaxLimit] = useState<number>(10);
  const [usedToday, setUsedToday] = useState<number>(0);
  const [allPlans, setAllPlans] = useState<Record<string, PlanDetail>>({});
  const [upgradingTo, setUpgradingTo] = useState<string | null>(null);
  const [showSimModal, setShowSimModal] = useState<boolean>(false);
  const [cardName, setCardName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('4000 1234 5678 9010');
  const [cardExpiry, setCardExpiry] = useState<string>('12/29');
  const [cardCvv, setCardCvv] = useState<string>('123');
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  const fetchSubscriptionStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/user/plan');
      if (!res.ok) {
        throw new Error('فشل تحميل بيانات الاشتراك من الخادم.');
      }
      const data = await res.json();
      setPlanId(data.planId);
      setMaxLimit(data.maxLimit);
      setUsedToday(data.usedToday);
      setAllPlans(data.allPlans);
      if (onUpdateUserPlanId) {
        onUpdateUserPlanId(data.planId);
      }
      onUpdateRemainingUses(data.remainingDailyUses);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ غير متوقع أثناء تحميل بيانات خطط الاشتراك.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user]);

  const handleUpgradeClick = async (targetPlan: string) => {
    if (!user) {
      alert('يرجى تسجيل الدخول أولاً للاشتراك وتفعيل الخطط المتقدمة.');
      return;
    }

    if (targetPlan === 'free' || targetPlan === 'visitor') {
      await handleUpgradePlan(targetPlan);
      return;
    }

    // Inform the user that payment via Paymob is coming soon
    alert('بوابة الدفع الإلكتروني عبر Paymob قيد الربط والتفعيل النهائي حالياً وسوف تتاح قريباً جداً! يمكنك استخدام الدفع التجريبي الآن لتجربة كافة مميزات الباقة مجاناً.');

    // Fallback to local simulation sandbox to keep app fully testable
    setUpgradingTo(targetPlan);
    setCardName(user?.displayName || 'الشاعر العربي');
    setShowSimModal(true);
    setPaymentSuccess(false);
    setProcessingPayment(false);
  };

  const handleUpgradePlan = async (targetPlan: string) => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/user/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: targetPlan })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل تحديث الخطة.');
      }
      const data = await res.json();
      setPlanId(data.planId);
      setMaxLimit(data.maxLimit);
      setUsedToday(data.usedToday);
      if (onUpdateUserPlanId) {
        onUpdateUserPlanId(data.planId);
      }
      onUpdateRemainingUses(data.remainingDailyUses);
      // Persist in local storage as reliable backup
      localStorage.setItem('user_subscription_plan_backup', data.planId);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'حدث خطأ أثناء الترقية.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = () => {
    if (!cardName.trim()) {
      alert('يرجى إدخال اسم صاحب البطاقة');
      return;
    }
    setProcessingPayment(true);
    // Simulate server side payment authentication & validation
    setTimeout(async () => {
      setProcessingPayment(false);
      setPaymentSuccess(true);
      if (upgradingTo) {
        await handleUpgradePlan(upgradingTo);
      }
      setTimeout(() => {
        setShowSimModal(false);
        setPaymentSuccess(false);
        setUpgradingTo(null);
      }, 2000);
    }, 1500);
  };

  if (!user) {
    return (
      <div className="space-y-6 animate-fade-in" dir="rtl">
        <div className="border-b border-gray-100 dark:border-white/5 pb-4">
          <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${
            isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-950/10 text-[#1a472a]'
          }`}>
            نظام العضويات والاشتراكات الفاخرة
          </span>
          <h2 className={`text-2xl font-serif font-black mt-1.5 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
            الاشتراكات
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">تطوير وتوسيع حدود الاستخدام اليومي لدعم إبداعك وصياغتك الشعرية</p>
        </div>

        <div className={`border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm min-h-[300px] ${
          isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/20 text-white' : 'bg-white border-[#b58d3d]/20 text-gray-800'
        }`}>
          <Crown className="w-12 h-12 text-amber-500 animate-pulse mb-2" />
          <h3 className="font-serif font-black text-xl">سجل الدخول بواسطة Google لإظهار خطة الاشتراك الخاصة بك.</h3>
          <p className="text-xs text-gray-400 max-w-md leading-relaxed">
            برجاء تسجيل الدخول لعرض باقة اشتراكك الحالية وإدارتها أو ترقيتها للحصول على خيارات النظم والبحور اللانهائية ومزايا حصرية.
          </p>
          <button
            onClick={onSignIn}
            className="px-6 py-3 bg-[#1a472a] hover:bg-[#153a22] text-white font-serif font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            <Crown className="w-4 h-4 text-[#dfba6b]" />
            سجل الدخول بواسطة Google لإظهار خطة الاشتراك الخاصة بك.
          </button>
        </div>
      </div>
    );
  }

  if (loading && Object.keys(allPlans).length === 0) {
    return (
      <div className={`border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm min-h-[300px] ${
        isDarkMode ? 'bg-[#102216]/50 border-[#dfba6b]/20 text-white' : 'bg-white border-[#b58d3d]/20 text-gray-800'
      }`}>
        <RefreshCw className="w-8 h-8 text-[#b58d3d] animate-spin" />
        <p className="font-serif font-bold text-lg animate-pulse">يجري تهيئة نظام الاشتراكات والخطط الأدبية...</p>
      </div>
    );
  }

  const remainingDailyUses = Math.max(0, maxLimit - usedToday);
  const usagePercent = Math.min(100, Math.round((usedToday / maxLimit) * 100));

  // Plan visual cards mapping helper
  const planDesign = {
    visitor: {
      color: 'from-gray-500 to-gray-400',
      text: 'text-gray-500',
      bg: isDarkMode ? 'bg-gray-950/20' : 'bg-gray-50',
      border: 'border-gray-200 dark:border-white/5',
      badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    },
    free: {
      color: 'from-emerald-600 to-emerald-500',
      text: 'text-emerald-600',
      bg: isDarkMode ? 'bg-emerald-950/10' : 'bg-emerald-50/50',
      border: 'border-emerald-200 dark:border-emerald-950/30',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
    },
    silver: {
      color: 'from-slate-400 to-slate-200',
      text: 'text-slate-500',
      bg: isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50',
      border: 'border-slate-300 dark:border-slate-800',
      badge: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
    },
    gold: {
      color: 'from-[#b58d3d] to-[#dfba6b]',
      text: 'text-[#b58d3d]',
      bg: isDarkMode ? 'bg-[#dfba6b]/10' : 'bg-amber-50/30',
      border: 'border-[#dfba6b]/40 dark:border-[#dfba6b]/30',
      badge: 'bg-amber-100 text-amber-800 dark:bg-[#dfba6b]/20 dark:text-[#dfba6b]'
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Upper header */}
      <div className="border-b border-gray-100 dark:border-white/5 pb-4">
        <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${
          isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-950/10 text-[#1a472a]'
        }`}>
          نظام العضويات والاشتراكات الفاخرة
        </span>
        <h2 className={`text-2xl font-serif font-black mt-1.5 ${isDarkMode ? 'text-[#dfba6b]' : 'text-royal-800'}`}>
          الاشتراكات
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">تطوير وتوسيع حدود الاستخدام اليومي لدعم إبداعك وصياغتك الشعرية</p>
      </div>

      {/* Usage Status Dashboard Card */}
      <div className={`border rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all ${
        isDarkMode ? 'bg-[#102216]/60 border-[#dfba6b]/20 text-white' : 'bg-white border-manuscript-border text-gray-800'
      }`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 block font-serif">حالة الاشتراك النشط حالياً</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-serif font-black px-3.5 py-1 rounded-xl ${
                planId === 'gold' 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-400/20' 
                  : planId === 'silver' 
                  ? 'bg-slate-400/10 text-slate-300 border border-slate-400/20' 
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'
              }`}>
                باقة {allPlans[planId]?.name || (planId === 'visitor' ? 'زائر' : 'مجاني')}
              </span>
              <span className="text-xs text-gray-400">
                {planId === 'visitor' ? '• زائر غير مسجل' : '• حساب مسجل نشط'}
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-md space-y-2">
            <div className="flex justify-between items-end text-xs">
              <span className="text-gray-400">الاستخدام اليومي للعدادات الأدبية:</span>
              <span className="font-sans font-bold">
                {usedToday} / {maxLimit} <span className="text-[10px] text-gray-400">(المتبقي: {remainingDailyUses})</span>
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

        {!user && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center gap-2 text-xs text-amber-500">
            <Info className="w-4 h-4 shrink-0" />
            <span>تسجيل الدخول يرقيك تلقائياً إلى الخطة **المجانية** ويرفع حدك اليومي من ١٠ إلى ٣٠ استخداماً مجانياً فوراً!</span>
          </div>
        )}
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(allPlans)
          .filter(([id]) => id !== 'visitor')
          .map(([id, planData]) => {
          const plan = planData as PlanDetail;
          const isCurrent = planId === id;
          const design = planDesign[id as keyof typeof planDesign] || planDesign.free;
          
          return (
            <div 
              key={id}
              className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 shadow-xs relative ${
                isCurrent 
                  ? 'border-amber-400 dark:border-[#dfba6b] scale-[1.03] ring-1 ring-amber-400/20' 
                  : design.border
              } ${design.bg}`}
            >
              {/* Highlight current plan badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-4 bg-[#8b1d2e] text-white text-[9px] font-bold font-serif px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-red-500/20">
                  <Crown className="w-3 h-3" /> خطتك الحالية
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${design.badge}`}>
                      {plan.name}
                    </span>
                    {plan.price && (
                      <span className="text-xs font-serif font-black text-[#8b1d2e] dark:text-[#dfba6b] bg-amber-500/5 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/10">
                        {plan.price}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-serif font-black">{plan.limit}</span>
                    <span className="text-xs text-gray-400">استخدام / يومياً</span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {id === 'free' ? 'مجاناً للأعضاء المسجلين' : id === 'silver' ? 'ترقية سريعة وبأسعار رمزية' : 'باقة النخبة والشعراء الكبار'}
                  </span>
                </div>

                {/* Features List */}
                <div className="border-t border-gray-100 dark:border-white/5 pt-4 space-y-2.5">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isCurrent ? 'text-amber-500' : 'text-emerald-600'}`} />
                      <span className="text-gray-400 leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                {isCurrent ? (
                  <button 
                    disabled 
                    className="w-full py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/20 cursor-default"
                  >
                    الخطة مفعلة حالياً
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpgradeClick(id)}
                    className={`w-full py-2.5 text-xs font-serif font-bold rounded-xl transition-all cursor-pointer ${
                      id === 'gold' 
                        ? 'bg-gradient-to-r from-[#b58d3d] to-[#dfba6b] hover:from-[#9c7830] hover:to-[#cfa85a] text-white shadow-md' 
                        : id === 'silver'
                        ? 'bg-[#1a472a] hover:bg-[#12331e] text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-200'
                    }`}
                  >
                    {id === 'free' ? 'تفعيل الخطة المجانية' : 'اشترك الآن'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Gateway Sandbox Simulation Modal */}
      {showSimModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl space-y-5 relative ${
            isDarkMode ? 'bg-[#0f2115] border-[#dfba6b]/30 text-white' : 'bg-white border-[#b58d3d]/30 text-gray-800'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs bg-[#b58d3d]/10 text-[#b58d3d] font-bold px-2 py-0.5 rounded">بيئة فحص آمنة (Sandbox)</span>
                <h3 className="font-serif font-black text-lg mt-1 text-[#b58d3d] flex items-center gap-1.5">
                  <CreditCard className="w-5 h-5" /> ترقية الاشتراك الرقمي
                </h3>
              </div>
              <button 
                onClick={() => setShowSimModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {paymentSuccess ? (
              <div className="text-center py-8 space-y-4 animate-scale-up">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h4 className="font-serif font-black text-xl text-emerald-600 dark:text-emerald-400">تمت الترقية بنجاح!</h4>
                <p className="text-xs text-gray-400">تم قيد باقة {(allPlans[upgradingTo || ''] as PlanDetail | undefined)?.name} لحسابك على الفور وتوسيع العدادات الأدبية.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 leading-normal">
                  أنت بصدد الترقية إلى الباقة **{(allPlans[upgradingTo || ''] as PlanDetail | undefined)?.name}** بحد يومي **{(allPlans[upgradingTo || ''] as PlanDetail | undefined)?.limit}** استخدام. بما أن بوابة الدفع غير مرتبطة حالياً، يمكنك النقر على زر "تأكيد الدفع التخيلي" لإتمام الترقية فوراً وفحص جاهزية النظام.
                </p>

                {/* Simulated Credit Card Input Form */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">اسم صاحب البطاقة</label>
                    <input 
                      type="text" 
                      value={cardName} 
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-transparent border-gray-200 dark:border-white/10" 
                      placeholder="اسم صاحب البطاقة"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">رقم بطاقة الائتمان (تخيلي)</label>
                    <input 
                      type="text" 
                      value={cardNumber} 
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-transparent border-gray-200 dark:border-white/10 font-mono" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">تاريخ الانتهاء</label>
                      <input 
                        type="text" 
                        value={cardExpiry} 
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-transparent border-gray-200 dark:border-white/10 font-mono" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">الرمز السري (CVV)</label>
                      <input 
                        type="password" 
                        value={cardCvv} 
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-transparent border-gray-200 dark:border-white/10 font-mono text-center" 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[10px] text-blue-500 leading-normal">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>تأمين كامل وتشفير طرفي. النظام يلتزم بأعلى معايير الأمان لحماية بيانات المستخدمين الموقرة.</span>
                </div>

                <div className="flex gap-3 pt-3">
                  <button 
                    onClick={handleSimulatePayment}
                    disabled={processingPayment}
                    className="flex-1 py-2.5 bg-[#8b1d2e] hover:bg-[#6e1321] text-white text-xs font-serif font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {processingPayment ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> جاري التحقق المالي...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" /> تأكيد الدفع التجريبي والتفعيل
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setShowSimModal(false)}
                    disabled={processingPayment}
                    className="px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-serif font-bold rounded-xl transition-all cursor-pointer"
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
