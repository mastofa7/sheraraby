/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PURPOSES_DATA, FLAT_PURPOSES, PurposeCategory } from '../purposesData';
import { Search, ChevronDown, ChevronUp, BookOpen, Sparkles, Check, ListFilter, SlidersHorizontal, AlertCircle, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PurposeSelectorProps {
  selectedPurpose: string;
  onChange: (purposeName: string) => void;
  isDarkMode?: boolean;
}

export const PurposeSelector = React.memo(function PurposeSelector({
  selectedPurpose,
  onChange,
  isDarkMode = true
}: PurposeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'thematic' | 'alphabetical'>('thematic');
  
  // Keep track of which categories are expanded in thematic view
  // By default, the first category is expanded, others are collapsed
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    madah: true // Pre-expand Madah (the first one)
  });

  const [customPurposeActive, setCustomPurposeActive] = useState<boolean>(false);
  const [customPurposeText, setCustomPurposeText] = useState<string>('');

  // Toggle category collapse
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Expand all categories helper (especially useful when searching)
  const expandAll = () => {
    const all: Record<string, boolean> = {};
    PURPOSES_DATA.forEach(cat => {
      all[cat.id] = true;
    });
    setExpandedCategories(all);
  };

  // Collapse all categories helper
  const collapseAll = () => {
    setExpandedCategories({});
  };

  // Custom purpose submit helper
  const handleCustomPurposeSubmit = () => {
    if (customPurposeText.trim()) {
      onChange(customPurposeText.trim());
      setCustomPurposeActive(false);
    }
  };

  // Search filter and view preparation
  const thematicData = useMemo(() => {
    if (!searchQuery.trim()) return PURPOSES_DATA;

    return PURPOSES_DATA.map(cat => {
      const filteredSubs = cat.subPurposes.filter(sub => 
        sub.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return {
        ...cat,
        subPurposes: filteredSubs
      };
    }).filter(cat => cat.subPurposes.length > 0);
  }, [searchQuery]);

  // Alphabetical flat list of matching purposes
  const alphabeticalData = useMemo(() => {
    let list = FLAT_PURPOSES;
    if (searchQuery.trim()) {
      list = FLAT_PURPOSES.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return [...list].sort((a, b) => a.localeCompare(b, 'ar'));
  }, [searchQuery]);

  // Automatically expand categories when user starts typing a search query
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      expandAll(); // Expand all to show search results instantly
    }
  };

  // Check if a sub-purpose is currently selected
  const isSelected = (purpose: string) => {
    return selectedPurpose === purpose;
  };

  return (
    <div className={`border rounded-2xl p-5 flex flex-col gap-4 text-right shadow-md relative overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-b from-[#0c1c11] to-[#06110a] border-[#dfba6b]/30 text-white' 
        : 'bg-gradient-to-b from-[#fdfbf7] to-[#f5f1e9] border-[#b58d3d]/30 text-gray-800'
    }`} dir="rtl" id="purpose-selector-container">
      {/* Decorative top header accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(223,186,107,0.1),transparent)] pointer-events-none" />

      {/* Header controls */}
      <div className="flex flex-col gap-1">
        <h3 className="font-serif font-black text-base sm:text-lg flex items-center gap-2 text-[#dfba6b]">
          <BookOpen className="w-5 h-5 text-[#dfba6b]" />
          أغراض الشعر ومقاصد النظم (بناء كلاسيكي متكامل)
        </h3>
        <p className="text-xs text-gray-300 leading-relaxed">
          انقر لتحديد غرضك الشعري لتوجيه صياغة وبناء معاني الأبيات. استعمل الفلتر السريع للوصول الفوري لأغراض السرد والنسيب والوصف.
        </p>
      </div>

      {/* Action panel (Search & Toggle sorting modes) */}
      <div className="flex flex-col sm:flex-row gap-2 mt-1">
        {/* Search input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ابحث في الغرض الفرعي أو المجموعة (مثال: رثاء، حكمة، غزل عذري)..."
            className="w-full p-2.5 pr-9 text-xs rounded-xl bg-black/45 border border-[#dfba6b]/20 text-white focus:outline-none focus:ring-1 focus:ring-[#dfba6b]"
          />
          <Search className="w-4 h-4 text-[#dfba6b]/60 absolute top-3.5 right-3" />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute left-3 top-2.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-1.5 py-0.5 rounded cursor-pointer font-bold"
            >
              مسح الفلتر
            </button>
          )}
        </div>

        {/* Sorting Toggles */}
        <div className="flex rounded-xl bg-black/40 border border-[#dfba6b]/20 p-1 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('thematic')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1 ${
              viewMode === 'thematic'
                ? 'bg-[#dfba6b] text-[#0c2114] shadow-sm'
                : 'text-gray-300 hover:text-[#dfba6b]'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            المجموعات الموضوعية
          </button>
          <button
            type="button"
            onClick={() => setViewMode('alphabetical')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1 ${
              viewMode === 'alphabetical'
                ? 'bg-[#dfba6b] text-[#0c2114] shadow-sm'
                : 'text-gray-300 hover:text-[#dfba6b]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            ترتيب أبجدي شامل
          </button>
        </div>
      </div>

      {/* Thematic Accordions View */}
      {viewMode === 'thematic' && (
        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800 w-full">
          {thematicData.length > 0 ? (
            thematicData.map((category) => {
              const isExpanded = !!expandedCategories[category.id];
              return (
                <div
                  key={category.id}
                  className="rounded-xl border border-[#dfba6b]/10 bg-black/30 overflow-hidden flex flex-col shrink-0 w-full"
                >
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-[#152a1c]/40 transition-all gap-3 shrink-0"
                  >
                    <div className="flex flex-col text-right flex-1 min-w-0">
                      <span className="font-serif font-black text-sm text-[#dfba6b] flex items-center gap-1.5 leading-relaxed">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        {category.title}
                      </span>
                      <span className="text-[10px] text-gray-300 leading-relaxed mt-0.5 whitespace-normal break-words">
                        {category.description}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#dfba6b] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#dfba6b] shrink-0" />
                    )}
                  </button>
 
                  {/* Sub Purposes List (Collapsible content) */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                        className="border-t border-[#dfba6b]/5 bg-black/40 p-3 overflow-hidden w-full"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                          {category.subPurposes.map((sub) => {
                            const selected = isSelected(sub);
                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => onChange(sub)}
                                className={`p-3 rounded-lg border text-right text-xs transition-all flex items-center justify-between gap-2.5 cursor-pointer active:translate-y-0.5 min-h-[44px] h-auto w-full shrink-0 ${
                                  selected
                                    ? 'bg-[#153420] border-[#dfba6b] text-white font-serif font-black shadow-inner'
                                    : 'bg-black/15 border-transparent text-gray-300 hover:bg-[#11261a] hover:text-[#dfba6b]'
                                }`}
                              >
                                <span className="whitespace-normal break-words leading-relaxed text-right flex-1">{sub}</span>
                                {selected && (
                                  <Check className="w-3.5 h-3.5 text-[#dfba6b] shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              <span>عذراً، لم نعثر على أي أغراض فرعية تطابق البحث "{searchQuery}". جرب صياغة مغايرة.</span>
            </div>
          )}
        </div>
      )}
 
      {/* Alphabetical Flat View */}
      {viewMode === 'alphabetical' && (
        <div className="max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800 w-full">
          {alphabeticalData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-1 w-full">
              {alphabeticalData.map((sub) => {
                const selected = isSelected(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => onChange(sub)}
                    className={`p-3 rounded-lg border text-right text-xs transition-all flex items-center justify-between gap-2.5 cursor-pointer active:translate-y-0.5 min-h-[44px] h-auto w-full shrink-0 ${
                      selected
                        ? 'bg-[#153420] border-[#dfba6b] text-white font-serif font-black shadow-inner'
                        : 'bg-black/25 border-gray-800 text-gray-300 hover:bg-[#11261a] hover:text-[#dfba6b]'
                    }`}
                  >
                    <span className="whitespace-normal break-words leading-relaxed text-right flex-1">{sub}</span>
                    {selected && (
                      <Check className="w-3.5 h-3.5 text-[#dfba6b] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              <span>عذراً، لم نعثر على أي غرض فرعي يطابق البحث "{searchQuery}".</span>
            </div>
          )}
        </div>
      )}

      {/* Selected Purpose Banner Display */}
      <div className="p-3.5 rounded-xl border bg-black/45 border-[#dfba6b]/10 text-white text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#dfba6b] shrink-0" />
          <span>الغرض الشعري المحدد حالياً:</span>
          <strong className="font-serif font-black text-[#dfba6b] text-sm underline decoration-wavy decoration-[#dfba6b]/50">
            {selectedPurpose || 'لم يتم التحديد بعد'}
          </strong>
        </div>

        {/* Custom unlisted option button */}
        <button
          type="button"
          onClick={() => setCustomPurposeActive(true)}
          className="text-xs text-[#dfba6b] hover:underline flex items-center gap-1 cursor-pointer font-bold"
        >
          <Edit3 className="w-3.5 h-3.5" />
          اكتب غرضاً مخصّصاً
        </button>
      </div>

      {/* Custom Purpose Input Modal Overlay */}
      <AnimatePresence>
        {customPurposeActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md border rounded-2xl p-6 shadow-2xl relative bg-[#0c1c11] border-[#dfba6b]/40 text-white text-right"
              dir="rtl"
            >
              <div className="flex items-center gap-2 text-[#dfba6b] border-b border-gray-800 pb-3 mb-4">
                <Edit3 className="w-5 h-5" />
                <h4 className="font-serif font-black text-base">كتابة غرض شعري مخصص خارج القائمة</h4>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed mb-4">
                اكتب الغرض أو المناسبة الخاصة التي تريد النظم فيها، وسيقوم المولد بصياغة معاني القصيدة بالتوافق مع مقصودك بدقة بالغة.
              </p>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={customPurposeText}
                  onChange={(e) => setCustomPurposeText(e.target.value)}
                  placeholder="مثال: رثاء قطتي الأليفة، مدح تخرج ابن أخي، إلخ..."
                  className="w-full p-3 rounded-xl text-sm bg-black border border-[#dfba6b]/20 text-white focus:outline-none focus:ring-1 focus:ring-[#dfba6b]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCustomPurposeSubmit();
                  }}
                />

                <div className="flex gap-2 justify-end mt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCustomPurposeActive(false)}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl cursor-pointer font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleCustomPurposeSubmit}
                    disabled={!customPurposeText.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-[#dfba6b] to-[#c5a153] hover:from-[#eec87a] hover:to-[#dfba6b] text-[#0c2114] rounded-xl cursor-pointer font-black disabled:opacity-50"
                  >
                    اعتماد الغرض المخصّص
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default PurposeSelector;
