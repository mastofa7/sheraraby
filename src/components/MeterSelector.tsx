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
}

export default function MeterSelector({ selectedMeter, onChange }: MeterSelectorProps) {
  const [hoveredMeter, setHoveredMeter] = useState<string | null>(null);

  const meters = Object.keys(METERS_DATA);
  const activeMeterName = hoveredMeter || selectedMeter || 'الطويل';
  const activeMeterInfo: PoeticMeterInfo = METERS_DATA[activeMeterName];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="meter-selector-container">
      {/* Meters List/Grid */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        <label className="text-royal-800 font-bold text-lg flex items-center gap-2">
          <Music className="w-5 h-5 text-jullanar-600" />
          البحر الشعري (الوزن العروضي)
        </label>
        <p className="text-sm text-gray-600 mb-2">
          اختر البحر الذي تود بناء قصيدتك عليه. مرر مؤشر الماوس أو اضغط على أي بحر لعرض تفعيلاته ومثاله الشعري.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {meters.map((meterName) => {
            const isSelected = selectedMeter === meterName;
            return (
              <button
                key={meterName}
                id={`btn-meter-${meterName}`}
                type="button"
                className={`relative py-3 px-4 rounded-xl border text-right transition-all duration-300 font-medium text-sm flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-royal-700 text-white border-royal-700 shadow-md ring-2 ring-royal-200'
                    : 'bg-white hover:bg-royal-50 text-gray-700 border-manuscript-border hover:border-royal-400'
                }`}
                onClick={() => onChange(meterName)}
                onMouseEnter={() => setHoveredMeter(meterName)}
                onMouseLeave={() => setHoveredMeter(null)}
              >
                <span>بحر {meterName}</span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-jullanar-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meter Details Panel (Ancient Manuscript Design) */}
      <div className="lg:col-span-5 flex flex-col">
        <div className="h-full bg-manuscript-paper border border-manuscript-border rounded-2xl shadow-sm p-6 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle design assets mimicking parchment */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(213,195,156,0.2),transparent)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[radial-gradient(ellipse_at_bottom_left,rgba(213,195,156,0.2),transparent)] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMeterName}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4 h-full justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-manuscript-border/60 pb-3 mb-3">
                  <span className="text-xs font-semibold bg-jullanar-50 text-jullanar-700 px-3 py-1 rounded-full border border-jullanar-100 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    تفاصيل ميزان البحر
                  </span>
                  {hoveredMeter && (
                    <span className="text-xs text-royal-600 animate-pulse font-medium">معاينة سريعة</span>
                  )}
                </div>

                <h3 className="font-serif font-bold text-2xl text-royal-900 mb-1">
                  بحر {activeMeterInfo.name}
                </h3>

                <div className="my-4 bg-white/80 p-3 rounded-xl border border-manuscript-border/40">
                  <div className="text-xs text-gray-500 mb-1 font-semibold">تفعيلاته العروضية:</div>
                  <div className="font-serif font-bold text-base text-jullanar-700 tracking-wide leading-relaxed" dir="ltr">
                    {activeMeterInfo.feet}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1 font-semibold flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-royal-600" />
                    الوصف الموسيقي والمزاجي:
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {activeMeterInfo.description}
                  </p>
                </div>
              </div>

              {/* Example Verse Section */}
              <div className="mt-4 pt-4 border-t border-manuscript-border/60">
                <div className="text-xs text-gray-500 mb-2 font-semibold flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-royal-600" />
                  شاهد شعري شهير على البحر:
                </div>
                <div className="bg-royal-50/50 p-4 rounded-xl border border-royal-100/40 relative">
                  <p className="font-serif font-bold text-center text-sm md:text-base text-royal-900 leading-relaxed">
                    {activeMeterInfo.example.verse}
                  </p>
                  <p className="text-left text-xs text-jullanar-700 font-semibold mt-2">
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
