/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { METERS_DATA } from '../metersData';
import { PoeticMeterInfo, PoeticMeterVariant } from '../types';
import { HelpCircle, BookOpen, Music, Sparkles, Layers, ListFilter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MeterSelectorProps {
  selectedMeter: string;
  onChange: (meterName: string) => void;
  selectedVariant?: string;
  onVariantChange?: (variantName: string) => void;
  isDarkMode?: boolean;
}

export const MeterSelector = React.memo(function MeterSelector({
  selectedMeter,
  onChange,
  selectedVariant,
  onVariantChange,
  isDarkMode = true
}: MeterSelectorProps) {
  const [hoveredMeter, setHoveredMeter] = useState<string | null>(null);
  const [hoveredVariant, setHoveredVariant] = useState<PoeticMeterVariant | null>(null);

  const meters = Object.keys(METERS_DATA);
  const activeMeterName = hoveredMeter || selectedMeter || 'الطويل';
  const activeMeterInfo: PoeticMeterInfo = METERS_DATA[activeMeterName];

  // Get current variants list for active meter
  const variants = activeMeterInfo.variants || [];

  // Sync selected variant in parent state when meter changes
  useEffect(() => {
    const meterInfo = METERS_DATA[selectedMeter];
    if (meterInfo && meterInfo.variants && meterInfo.variants.length > 0) {
      // If parent selectedVariant doesn't match any variant of current meter, set default
      const hasMatchingVariant = meterInfo.variants.some(v => v.name === selectedVariant);
      if (!hasMatchingVariant && onVariantChange) {
        onVariantChange(meterInfo.variants[0].name);
      }
    }
  }, [selectedMeter]);

  // Find active variant to display (hovered variant gets priority for quick preview)
  const activeVariant: PoeticMeterVariant | undefined = hoveredVariant || 
    variants.find(v => v.name === selectedVariant) || 
    variants[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="meter-selector-container" dir="rtl">
      {/* Column 1: Selection Controls (Meters Grid & Variations List) */}
      <div className="lg:col-span-7 flex flex-col gap-5 text-right">
        {/* Step 1: Select Poetic Meter */}
        <div className="flex flex-col gap-2">
          <label className="font-serif font-black text-lg flex items-center gap-2 text-[#dfba6b]">
            <Music className="w-5 h-5 text-[#dfba6b]" />
            ١. البحر الشعري (الوزن العروضي)
          </label>
          <p className="text-xs leading-relaxed text-gray-300">
            اختر البحر العروضي الرئيسي لقصيدتك. مرر الفأرة لمعاينة تفاصيله، واضغط للاعتماد.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
            {meters.map((meterName) => {
              const isSelected = selectedMeter === meterName;
              return (
                <button
                  key={meterName}
                  id={`btn-meter-${meterName}`}
                  type="button"
                  className={`relative py-2.5 px-3 rounded-xl border text-right transition-all duration-200 font-serif font-bold text-xs sm:text-sm flex items-center justify-between cursor-pointer active:translate-y-0.5 ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#dfba6b] to-[#c5a153] text-[#0c2114] border-[#ffebad] shadow-[0_4px_12px_rgba(223,186,107,0.35)]'
                      : 'bg-gradient-to-b from-[#112618] to-[#0a180f] text-gray-200 border-[#dfba6b]/20 hover:border-[#dfba6b]/50 hover:from-[#183522] hover:to-[#0f2316]'
                  }`}
                  onClick={() => {
                    onChange(meterName);
                    // Select first variant of the newly selected meter automatically
                    const newMeterInfo = METERS_DATA[meterName];
                    if (newMeterInfo && newMeterInfo.variants && newMeterInfo.variants.length > 0 && onVariantChange) {
                      onVariantChange(newMeterInfo.variants[0].name);
                    }
                  }}
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

        {/* Step 2: Select Poetic Variation (الصورة العروضية) */}
        {variants.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-800 animate-fade-in">
            <label className="font-serif font-black text-base flex items-center gap-2 text-[#dfba6b]">
              <Layers className="w-4.5 h-4.5 text-[#dfba6b]" />
              ٢. الصورة العروضية المشهورة للـ{activeMeterName}
            </label>
            <p className="text-xs leading-relaxed text-gray-300">
              لكل بحر صور متعددة استعملها فحول الشعراء (تامة، مجزوءة، مشطورة...). اختر الصورة المناسبة لهيكل قصيدتك:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {variants.map((v) => {
                const isSelected = selectedVariant === v.name;
                return (
                  <button
                    key={v.name}
                    type="button"
                    className={`relative p-3 rounded-xl border text-right transition-all duration-200 flex flex-col gap-1 cursor-pointer active:translate-y-0.5 ${
                      isSelected
                        ? 'bg-[#153420] border-[#dfba6b] text-white shadow-[0_2px_8px_rgba(223,186,107,0.15)]'
                        : 'bg-black/35 border-[#dfba6b]/10 text-gray-300 hover:border-[#dfba6b]/40 hover:bg-[#112619]'
                    }`}
                    onClick={() => {
                      if (onVariantChange) onVariantChange(v.name);
                    }}
                    onMouseEnter={() => setHoveredVariant(v)}
                    onMouseLeave={() => setHoveredVariant(null)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-serif font-bold text-xs text-[#dfba6b]">{v.name}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 text-[9px] bg-[#dfba6b] text-[#0c2114] rounded-md font-sans font-extrabold animate-pulse">
                          نشط عروضياً
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono truncate w-full block text-left" dir="ltr">
                      {v.feet}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Column 2: Manuscript Display Details Panel */}
      <div className="lg:col-span-5 flex flex-col">
        <div className="h-full border rounded-2xl shadow-md p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0c1c11] to-[#07110a] border-[#dfba6b]/30 text-white min-h-[380px]">
          {/* Decorative design assets mimicking ancient parchment layout */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(213,195,156,0.15),transparent)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[radial-gradient(ellipse_at_bottom_left,rgba(213,195,156,0.15),transparent)] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeMeterName}-${activeVariant?.name}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4 h-full justify-between relative z-10 text-right"
            >
              <div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-2.5 mb-2.5">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 bg-[#152a1c] text-[#dfba6b] border-[#dfba6b]/30">
                    <Sparkles className="w-3 h-3 text-[#dfba6b]" />
                    تفاصيل ميزان الصورة المختارة
                  </span>
                  {(hoveredMeter || hoveredVariant) && (
                    <span className="text-[9px] text-amber-500 animate-pulse font-extrabold">معاينة تفاعلية</span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5">
                  <h3 className="font-serif font-black text-2xl text-white">
                    بحر {activeMeterName}
                  </h3>
                  {activeVariant && (
                    <span className="text-xs font-serif text-[#dfba6b] font-bold block">
                      صورة: {activeVariant.name}
                    </span>
                  )}
                </div>

                {activeVariant && (
                  <>
                    <div className="my-3 p-3 rounded-xl border bg-black/45 border-[#dfba6b]/20">
                      <div className="text-[9px] text-gray-400 mb-1 font-bold flex items-center gap-1">
                        <ListFilter className="w-3 h-3 text-[#dfba6b]" />
                        تفعيلات هذه الصورة العروضية:
                      </div>
                      <div className="font-serif font-bold text-sm sm:text-base text-[#dfba6b] tracking-wide leading-relaxed text-center" dir="rtl">
                        {activeVariant.feet}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-[9px] text-gray-400 mb-1 font-bold flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-[#dfba6b]" />
                        الوصف والاستعمال العروضي:
                      </div>
                      <p className="text-xs leading-relaxed text-gray-300">
                        {activeVariant.description}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Example Verse Section */}
              {activeVariant?.example && (
                <div className="mt-2 pt-3 border-t border-gray-800">
                  <div className="text-[9px] text-gray-400 mb-2 font-bold flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#dfba6b]" />
                    الشاهد العروضي المأثور لهذه الصورة:
                  </div>
                  <div className="p-3 rounded-xl border relative bg-[#152a1c]/60 border-[#dfba6b]/20">
                    <p className="font-serif font-black text-center text-xs md:text-sm leading-relaxed text-[#dfba6b] py-1">
                      {activeVariant.example.verse}
                    </p>
                    <p className="text-left text-[11px] font-bold mt-1 text-gray-400">
                      — {activeVariant.example.poet}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

export default MeterSelector;
