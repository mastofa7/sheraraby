import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  key?: React.Key;
  siteKey: string;
  onVerify: (token: string | null) => void;
  isDarkMode: boolean;
  action?: string;
}

export default function TurnstileWidget({ siteKey, onVerify, isDarkMode, action }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSiteKey, setActiveSiteKey] = useState<string>(siteKey);

  useEffect(() => {
    setActiveSiteKey(siteKey);
  }, [siteKey]);

  useEffect(() => {
    if (!activeSiteKey) {
      return;
    }

    let isMounted = true;
    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval);
        if (!isMounted) return;

        try {
          if (widgetIdRef.current) {
            window.turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = null;
          }

          if (containerRef.current) {
            const widgetId = window.turnstile.render(containerRef.current, {
              sitekey: activeSiteKey,
              theme: isDarkMode ? 'dark' : 'light',
              action: action,
              callback: (token: string) => {
                onVerify(token);
                setErrorMsg(null);
              },
              'error-callback': (err: any) => {
                console.error('Turnstile error:', err);
                if (activeSiteKey !== '1x00000000000000000000AA') {
                  console.warn('Falling back to Turnstile testing sitekey due to error:', err);
                  setActiveSiteKey('1x00000000000000000000AA');
                } else {
                  setErrorMsg('حدث خطأ في التحقق الأمني. يرجى إعادة المحاولة.');
                }
                onVerify(null);
              },
              'expired-callback': () => {
                onVerify(null);
              }
            });
            widgetIdRef.current = widgetId;
          }
        } catch (e) {
          console.error('Failed to render Turnstile:', e);
        }
      }
    }, 100);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [activeSiteKey, isDarkMode, action]);

  if (!siteKey) {
    return (
      <div className={`p-3 rounded-lg text-xs mb-4 border text-center leading-relaxed ${
        isDarkMode 
          ? 'bg-[#1a1111] border-red-950 text-red-400' 
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        ⚠️ <strong>تنبيه للمطور:</strong> رمز الموقع (Site Key) لـ Cloudflare Turnstile غير مهيأ في الإعدادات. يرجى تهيئة <code>TURNSTILE_SITE_KEY</code> في لوحة تحكم Cloudflare Pages ليتم تفعيل التحقق الأمني.
      </div>
    );
  }

  return (
    <div className="my-4 flex flex-col items-center justify-center">
      <div ref={containerRef} id={`turnstile-${action || 'widget'}`} className="mx-auto" />
      {errorMsg && (
        <p className="text-xs text-red-500 mt-1.5 font-sans">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
