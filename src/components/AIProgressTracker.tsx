import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../firebase';
import { Sparkles, AlertCircle } from 'lucide-react';

interface AIProgressTrackerProps {
  clientId: string | null;
  isActive: boolean;
  localStatus?: string | null;
  error?: string | null;
}

export function AIProgressTracker({ clientId, isActive, localStatus, error }: AIProgressTrackerProps) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // If there's an error, it overrides everything and shows the error
    if (error) {
      setStatus(error);
      return;
    }

    if (!isActive) {
      const t = setTimeout(() => setStatus(null), 1000);
      return () => clearTimeout(t);
    }

    if (localStatus) {
      setStatus(localStatus);
    }

    let intervalId: NodeJS.Timeout;
    if (clientId && !error) {
      intervalId = setInterval(async () => {
        try {
          const res = await apiFetch(`/api/ai-status/${clientId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status) {
              setStatus(data.status);
            }
          }
        } catch (e) {
          // ignore
        }
      }, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [clientId, isActive, localStatus, error]);

  // We should show the tracker if it's active OR if there's an error to display
  // But usually error clears when user dismisses it or retries.
  // Wait, if error is shown, we want it to stay until error is cleared.
  const isVisible = (isActive && status) || (error && status);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-full px-5 py-3 flex items-center space-x-3 space-x-reverse z-50 overflow-hidden border ${error ? 'bg-[#2a0d13] border-[#da4c5f]/50' : 'bg-[#102216] border-[#dfba6b]/30'}`}
          dir="rtl"
        >
          {!error && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#dfba6b]/5 to-transparent animate-pulse"></div>
          )}
          {error && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#da4c5f]/10 to-transparent"></div>
          )}
          
          <motion.div
            animate={!error ? { rotate: 360 } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className={`relative z-10 flex-shrink-0 ${error ? 'text-[#da4c5f]' : 'text-[#dfba6b]'}`}
          >
            {error ? <AlertCircle className="w-5 h-5" /> : <Sparkles className="w-4 h-4" />}
          </motion.div>
          
          <motion.span 
            key={status}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className={`text-sm font-serif font-medium relative z-10 whitespace-nowrap ${error ? 'text-[#fbd6da]' : 'text-[#fbf9f4]'}`}
          >
            {status}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
