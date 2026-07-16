/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { METERS_DATA } from '../metersData';
import { PoeticMeterInfo } from '../types';
import { HelpCircle, BookOpen, Music, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MeterSelectorProps {
  selectedMeter: string;
  onChange: (meterName: string) => void;
  isDarkMode?: boolean;
}

export default function MeterSelector({ selectedMeter, onChange, isDarkMode = true }: MeterSelectorProps) {
  const [hoveredMeter, setHoveredMeter] = useState<string | null>(null);

  const meters = Object.keys(METERS_DATA);
  const activeMeterName = hoveredMeter || selectedMeter || 'الطويل';
  const activeMeterInfo: PoeticMeterInfo = METERS_DATA[activeMeterName];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="meter-selector-container">
      {/* Meters List/Grid */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        <label className="font-bold text-lg flex items-center gap-2 text-[#dfba6b]">
          <Music className="w-5 h-5 text-[#dfba6b]" />
          البحر الشعري (الوزن العروضي)
        </label>
        <p className="text-xs leading-relaxed text-gray-300 mb-2">
          اختر البحر الذي تود بناء قصيدتك عليه. مرر مؤشر الماوس أو اضغط على أي بحر لعرض تفعيلاته ومثاله الشعري.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {meters.map((meterName) => {
            const isSelected = selectedMeter === meterName;
            return (
              <button
                key={meterName}
                id={`btn-meter-${meterName}`}
                type="button"
                className={`relative py-3 px-4 rounded-xl border text-right transition-all duration-200 font-serif font-bold text-sm flex items-center justify-between cursor-pointer active:translate-y-0.5 ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#dfba6b] to-[#c5a153] text-[#0c2114] border-[#ffebad] shadow-[0_4px_12px_rgba(223,186,107,0.35)]'
                    : 'bg-gradient-to-b from-[#112618] to-[#0a180f] text-gray-200 border-[#dfba6b]/20 hover:border-[#dfba6b]/50 hover:from-[#183522] hover:to-[#0f2316]'
                }`}
                onClick={() => onChange(meterName)}
                onMouseEnter={() => setHoveredMeter(meterName)}
                onMouseLeave={() => setHoveredMeter(null)}
              >
                <span>بحر {meterName}</span>
                {isSelected ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8b1d2e] animate-pulse shadow-xs" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#dfba6b]/30" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meter Details Panel (Ancient Manuscript Design) */}
      <div className="lg:col-span-5 flex flex-col">
        <div className="h-full border rounded-2xl shadow-md p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0c1c11] to-[#07110a] border-[#dfba6b]/30 text-white">
          {/* Subtle design assets mimicking parchment */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(213,195,156,0.15),transparent)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[radial-gradient(ellipse_at_bottom_left,rgba(213,195,156,0.15),transparent)] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMeterName}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4 h-full justify-between relative z-10"
            >
              <div>
                <div className="flex items-center justify-between border-b border-manuscript-border/30 pb-3 mb-3">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1 bg-[#152a1c] text-[#dfba6b] border-[#dfba6b]/30">
                    <Sparkles className="w-3 h-3 text-[#dfba6b]" />
                    تفاصيل ميزان البحر
                  </span>
                  {hoveredMeter && (
                    <span className="text-[10px] text-amber-500 animate-pulse font-bold">معاينة سريعة</span>
                  )}
                </div>

                <h3 className="font-serif font-bold text-2xl mb-1 text-white">
                  بحر {activeMeterInfo.name}
                </h3>

                <div className="my-4 p-3 rounded-xl border bg-black/30 border-[#dfba6b]/20">
                  <div className="text-[10px] text-gray-400 mb-1 font-bold">تفعيلاته العروضية:</div>
                  <div className="font-serif font-bold text-base text-[#dfba6b] tracking-wide leading-relaxed" dir="ltr">
                    {activeMeterInfo.feet}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-[10px] text-gray-400 mb-1 font-bold flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-[#dfba6b]" />
                    الوصف الموسيقي والمزاجي:
                  </div>
                  <p className="text-xs leading-relaxed text-gray-300">
                    {activeMeterInfo.description}
                  </p>
                </div>
              </div>

              {/* Example Verse Section */}
              <div className="mt-4 pt-4 border-t border-manuscript-border/20">
                <div className="text-[10px] text-gray-400 mb-2 font-bold flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#dfba6b]" />
                  شاهد شعري شهير على البحر:
                </div>
                <div className="p-4 rounded-xl border relative bg-[#152a1c]/60 border-[#dfba6b]/20">
                  <p className="font-serif font-bold text-center text-sm md:text-base leading-relaxed text-[#dfba6b]">
                    {activeMeterInfo.example.verse}
                  </p>
                  <p className="text-left text-xs font-semibold mt-2 text-gray-300">
                    — {activeMeterInfo.example.poet}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
