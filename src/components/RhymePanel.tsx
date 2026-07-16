/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ARABIC_LETTERS,
  RHYME_TYPES_INFO,
  RHYME_LEXICON,
  suggestBestRhymeLetter
} from '../rhymeData';
import { Sparkles, HelpCircle, BookOpen, Check, Search, AlertCircle, Copy, FileText, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RhymePanelProps {
  rhymeSystem: string; // mapped to unified, strophic, etc.
  onChangeRhymeSystem: (val: 'unified' | 'strophic' | 'tasri' | 'internal' | 'custom') => void;
  customRhymeLetter: string;
  onChangeCustomRhymeLetter: (val: string) => void;
  customRhymeType: string; // e.g. "موحدة", "لكل مقطوعة", "مزدوجة", etc.
  onChangeCustomRhymeType: (val: string) => void;
  purpose: string;
  description: string;
  isDarkMode?: boolean;
}

export const RhymePanel = React.memo(function RhymePanel({
  rhymeSystem,
  onChangeRhymeSystem,
  customRhymeLetter,
  onChangeCustomRhymeLetter,
  customRhymeType,
  onChangeCustomRhymeType,
  purpose,
  description,
  isDarkMode = true
}: RhymePanelProps) {
  const [lexiconSearch, setLexiconSearch] = useState<string>('');
  const [suggestionMessage, setSuggestionMessage] = useState<{ letter: string; reason: string } | null>(null);
  const [showSetupSuggestion, setShowSetupSuggestion] = useState<boolean>(false);
  const [isLexiconExpanded, setIsLexiconExpanded] = useState<boolean>(true);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);

  // Default to 'د' if no letter is selected
  const activeLetter = customRhymeLetter || 'د';

  // Handle manual letter selection
  const handleSelectLetter = (letter: string) => {
    onChangeCustomRhymeLetter(letter);
    setSuggestionMessage(null); // Clear suggestion highlight
    // Keep parent in custom system or unified depending on need
    if (rhymeSystem !== 'custom') {
      onChangeRhymeSystem('custom');
    }
  };

  // Suggest best rhyme letter using smart phonetic analyzer
  const handleSuggestLetter = () => {
    const result = suggestBestRhymeLetter(purpose, description);
    onChangeCustomRhymeLetter(result.letter);
    setSuggestionMessage(result);
    if (rhymeSystem !== 'custom') {
      onChangeRhymeSystem('custom');
    }
  };

  // Copy word helper
  const handleCopyWord = (word: string) => {
    navigator.clipboard.writeText(word);
    setCopiedWord(word);
    setTimeout(() => setCopiedWord(null), 1500);
  };

  // Find lexicon details for the selected letter
  const activeLexicon = useMemo(() => {
    return RHYME_LEXICON[activeLetter] || {
      letter: activeLetter,
      words: ['الخلود', 'الوجود', 'السجود', 'الحدود'],
      description: 'حرف روي مريح وناعم يسهل سبكه وتركيب الكلمات الشعرية عليه.',
      suggestedWasl: 'حركة مشبعة',
      suggestedRidf: 'حرف مد سابق للروي',
      suggestedTasees: 'لا يوجد'
    };
  }, [activeLetter]);

  // Filter words in lexicon
  const filteredWords = useMemo(() => {
    if (!lexiconSearch.trim()) return activeLexicon.words;
    return activeLexicon.words.filter(w => w.includes(lexiconSearch.trim()));
  }, [activeLexicon, lexiconSearch]);

  return (
    <div className={`border rounded-2xl p-6 flex flex-col gap-6 shadow-md relative overflow-hidden text-right ${
      isDarkMode 
        ? 'bg-gradient-to-b from-[#0c1c11] to-[#06110a] border-[#dfba6b]/30 text-white' 
        : 'bg-gradient-to-b from-[#fdfbf7] to-[#f5f1e9] border-[#b58d3d]/30 text-gray-800'
    }`} dir="rtl" id="rhyme-panel-container">
      {/* Ancient Script Overlay Accent */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_left,rgba(223,186,107,0.1),transparent)] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-[#dfba6b]/20 pb-4">
        <h3 className="font-serif font-black text-lg sm:text-xl flex items-center gap-2 text-[#dfba6b]">
          <Sparkles className="w-5.5 h-5.5 text-[#dfba6b] animate-pulse" />
          مَنْظُومَةُ وَأَلْوَاحُ القَافِيَةِ الاحترافية
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          اضبط موازين القافية ونظام الروي لقصيدتك، واستعن بمعجم القوافي العربي المتكامل لتسهيل النظم الشعري.
        </p>
      </div>

      {/* Grid of Rhyme Layout & Letter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left column: Rhyme Type (نوع القافية) */}
        <div className="flex flex-col gap-3">
          <label className="font-serif font-bold text-sm text-[#dfba6b] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#dfba6b]" />
            ١. نوع القافية (هيكل توزيع الروي)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RHYME_TYPES_INFO.map((type) => {
              // Map local type selection to the parent's rhymeSystem state
              let isSelected = false;
              if (type.id === 'unified' && rhymeSystem === 'unified' && customRhymeType !== 'مزدوجة' && customRhymeType !== 'متناوبة') isSelected = true;
              else if (type.id === 'strophic' && rhymeSystem === 'strophic') isSelected = true;
              else if (type.id === 'tasri' && rhymeSystem === 'tasri') isSelected = true;
              else if (type.id === 'double' && customRhymeType === 'مزدوجة') isSelected = true;
              else if (type.id === 'alternating' && customRhymeType === 'متناوبة') isSelected = true;
              else if (type.id === 'user_request' && rhymeSystem === 'custom' && !customRhymeLetter) isSelected = true;

              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    onChangeCustomRhymeType(type.name);
                    if (type.id === 'unified') {
                      onChangeRhymeSystem('unified');
                    } else if (type.id === 'strophic') {
                      onChangeRhymeSystem('strophic');
                    } else if (type.id === 'tasri') {
                      onChangeRhymeSystem('tasri');
                    } else if (type.id === 'double') {
                      onChangeRhymeSystem('unified'); // backend proxies double via customRhymeType
                    } else if (type.id === 'alternating') {
                      onChangeRhymeSystem('unified'); // backend proxies alternating via customRhymeType
                    } else if (type.id === 'user_request') {
                      onChangeRhymeSystem('custom');
                    }
                  }}
                  className={`p-3 rounded-xl border text-right transition-all duration-150 flex flex-col gap-1 cursor-pointer active:translate-y-0.5 ${
                    isSelected
                      ? 'bg-[#153420] border-[#dfba6b] text-white shadow-md'
                      : isDarkMode
                        ? 'bg-black/35 border-[#dfba6b]/15 text-gray-300 hover:border-[#dfba6b]/40 hover:bg-[#11261a]'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-[#b58d3d]/50 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-serif font-extrabold text-xs flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#dfba6b]' : 'bg-gray-400'}`} />
                    {type.name}
                  </span>
                  <span className="text-[10px] text-gray-400 leading-normal line-clamp-2">
                    {type.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Rhyme Letter (حرف الروي المخصص) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="font-serif font-bold text-sm text-[#dfba6b] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#dfba6b]" />
              ٢. حرف الرَّويِّ (الحرف الملتزم به في القافية)
            </label>
            
            {/* Auto-suggest button */}
            <button
              type="button"
              onClick={handleSuggestLetter}
              className="px-3 py-1 bg-gradient-to-r from-[#dfba6b] to-[#c5a153] hover:from-[#eec87a] hover:to-[#dfba6b] text-[#0c2114] text-[10px] font-sans font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-sm active:translate-y-0.5"
            >
              <Sparkles className="w-3 h-3" />
              اقترح أفضل روي
            </button>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            اختر يدوياً الحرف الذي تنتهي به الأبيات لتقييد القافية وصنع رنين موسيقي متجانس:
          </p>

          {/* Letter Grid */}
          <div className="grid grid-cols-7 gap-1.5 p-3 rounded-2xl bg-black/40 border border-[#dfba6b]/10">
            {ARABIC_LETTERS.map((letter) => {
              const isSelected = activeLetter === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => handleSelectLetter(letter)}
                  className={`w-full h-8 rounded-lg font-serif font-black text-sm flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#dfba6b] text-[#0c2114] font-extrabold scale-110 shadow-md ring-2 ring-amber-200'
                      : 'text-gray-300 hover:bg-[#152a1c] hover:text-[#dfba6b]'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Suggestion Reason Alert (glowing banner) */}
      <AnimatePresence>
        {suggestionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-3.5 rounded-xl border border-[#dfba6b]/40 bg-[#163a23]/60 text-white flex items-start gap-2 text-xs animate-fade-in shadow-inner"
          >
            <Sparkles className="w-4.5 h-4.5 text-[#dfba6b] shrink-0 mt-0.5" />
            <div>
              <span className="font-serif font-black text-sm text-[#dfba6b] block mb-0.5">
                توصية العروض الذكية: رويّ حرف ({suggestionMessage.letter})
              </span>
              <p className="leading-relaxed text-gray-200">{suggestionMessage.reason}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggest Poetic Setup (اقترح قافية مناسبة) */}
      <div className="flex flex-col gap-3 pt-3 border-t border-[#dfba6b]/10">
        <div className="flex items-center justify-between">
          <h4 className="font-serif font-bold text-sm text-gray-300 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[#dfba6b]" />
            مكونات هيكلية القافية المقترحة لحرف ({activeLetter})
          </h4>
          <button
            type="button"
            onClick={() => setShowSetupSuggestion(!showSetupSuggestion)}
            className="text-xs text-[#dfba6b] hover:underline flex items-center gap-1 cursor-pointer font-bold"
          >
            {showSetupSuggestion ? 'إخفاء التفاصيل العروضية' : 'عرض التفاصيل والعلل العروضية'}
            {showSetupSuggestion ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showSetupSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-black/45 border border-[#dfba6b]/15 animate-fade-in text-xs"
          >
            <div className="p-2 border-r border-[#dfba6b]/10 flex flex-col gap-0.5">
              <span className="text-[#dfba6b] font-bold">الوَصْل (الحركة اللاحقة للروي):</span>
              <p className="text-gray-300">{activeLexicon.suggestedWasl}</p>
            </div>
            <div className="p-2 border-r border-[#dfba6b]/10 flex flex-col gap-0.5">
              <span className="text-[#dfba6b] font-bold">الرِّدْف (حرف مد يلتصق بالروي):</span>
              <p className="text-gray-300">{activeLexicon.suggestedRidf}</p>
            </div>
            <div className="p-2 flex flex-col gap-0.5">
              <span className="text-[#dfba6b] font-bold">التَّأْسِيس (ألف سابقة بمسافة حرف):</span>
              <p className="text-gray-300">{activeLexicon.suggestedTasees}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Rhyme Lexicon (معجم القافية) */}
      <div className="flex flex-col gap-3 pt-3 border-t border-[#dfba6b]/10">
        <div className="flex items-center justify-between">
          <label className="font-serif font-bold text-sm text-[#dfba6b] flex items-center gap-1.5 cursor-pointer" onClick={() => setIsLexiconExpanded(!isLexiconExpanded)}>
            <BookOpen className="w-4 h-4 text-[#dfba6b]" />
            مُعْجَمُ القَافِيَةِ لحرف ({activeLetter})
            <span className="text-[10px] text-gray-400 font-sans font-normal">(يساعدك في العثور على الكلمات المسجوعة)</span>
          </label>
          <button
            type="button"
            onClick={() => setIsLexiconExpanded(!isLexiconExpanded)}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            {isLexiconExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isLexiconExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            <p className="text-xs text-gray-300 leading-normal italic">
              {activeLexicon.description}
            </p>

            {/* Search filter for words */}
            <div className="relative">
              <input
                type="text"
                value={lexiconSearch}
                onChange={(e) => setLexiconSearch(e.target.value)}
                placeholder="ابحث عن كلمة قافية مسجوعة محددة (مثال: خلود)..."
                className="w-full p-2.5 pr-9 rounded-xl text-xs bg-black/45 border border-[#dfba6b]/20 text-white focus:outline-none focus:ring-1 focus:ring-[#dfba6b]"
              />
              <Search className="w-4 h-4 text-[#dfba6b]/60 absolute top-3 right-3" />
            </div>

            {/* Words list */}
            {filteredWords.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[120px] overflow-y-auto p-1 text-center scrollbar-thin scrollbar-thumb-gray-800">
                {filteredWords.map((word) => {
                  const isCopied = copiedWord === word;
                  return (
                    <button
                      key={word}
                      type="button"
                      onClick={() => handleCopyWord(word)}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-serif font-bold cursor-pointer transition-all flex items-center justify-between hover:bg-[#152a1c] hover:border-[#dfba6b]/30 ${
                        isCopied 
                          ? 'bg-[#dfba6b] text-[#0c2114] border-[#dfba6b]' 
                          : 'bg-black/25 border-gray-800 text-gray-200'
                      }`}
                      title="انقر لنسخ الكلمة للاستخدام في القصيدة"
                    >
                      <span>{word}</span>
                      {isCopied ? (
                        <Check className="w-3 h-3 text-[#0c2114]" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#dfba6b]/40 hover:text-[#dfba6b]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>عذراً، لم نعثر على هذه الكلمة في مسرد حرف ({activeLetter}) السريع. جرب حذف أل التعريف أو التفتيش عروضيًا.</span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
});

export default RhymePanel;
