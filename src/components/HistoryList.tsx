import React, { useState } from 'react';
import { GeneratedPoem } from '../types';
import { BookOpen, Calendar, ChevronLeft, Trash2, Award, Search, Star } from 'lucide-react';

interface HistoryListProps {
  history: GeneratedPoem[];
  onSelectPoem: (poem: GeneratedPoem) => void;
  onDeletePoem: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
  isDarkMode?: boolean;
}

export default function HistoryList({ history, onSelectPoem, onDeletePoem, onToggleFavorite, onClearAll, isDarkMode = true }: HistoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Filter history based on search query and favorite status
  const filteredHistory = history.filter((poem) => {
    const matchesSearch = 
      poem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poem.verses.some(
        (v) =>
          v.shatr1.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.shatr2.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      poem.meterName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFavorite = !showOnlyFavorites || poem.isFavorite;

    return matchesSearch && matchesFavorite;
  });

  if (history.length === 0) {
    return (
      <div className="border rounded-2xl p-8 text-center relative overflow-hidden bg-[#102216]/40 border-[#dfba6b]/20 text-white" id="history-empty-state">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border bg-[#dfba6b]/10 border-[#dfba6b]/30 text-[#dfba6b]">
          <BookOpen className="w-8 h-8" />
        </div>
        <h4 className="font-bold font-serif mb-1">الديوان الخاص بك فارغ حالياً</h4>
        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed font-serif">
          عندما تقوم بنظم قصائد جديدة، ستظهر تلقائياً في هذا القسم للرجوع إليها ونسخها وتصديرها في أي وقت لاحق.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-2xl p-5 shadow-lg relative overflow-hidden bg-[#09140d]/85 border-[#dfba6b]/30 text-white" id="history-container">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
      
      <div className="flex flex-col gap-3 mb-4 border-b border-white/5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold font-serif text-base flex items-center gap-2 text-[#dfba6b]">
              <Award className="w-5 h-5 text-[#dfba6b]" />
              ديوانك المحفوظ ({history.length})
            </h3>
            <p className="text-[11px] text-gray-400">القصائد التي قمت بإنشائها مسبقاً محفوظة بأمان في ديوانك السحابي.</p>
          </div>
          <button
            onClick={onClearAll}
            className="text-xs text-red-400 hover:text-red-300 font-semibold bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            مسح الكل
          </button>
        </div>

        {/* Search & Favorites Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالعنوان أو الأبيات أو البحر..."
              className="w-full border rounded-xl pr-9 pl-3 py-2 text-xs outline-none transition-all bg-[#030a05] border-[#dfba6b]/20 text-white focus:border-[#dfba6b]"
            />
          </div>
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              showOnlyFavorites
                ? 'bg-[#dfba6b] text-[#030a05] shadow-xs'
                : 'bg-amber-500/10 text-[#dfba6b] hover:bg-amber-500/20'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-[#030a05]' : 'fill-[#dfba6b]/30'}`} />
            المفضلة فقط
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scroll pr-1">
        {filteredHistory.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-6 italic">لم يُعثر على قصائد مطابقة لبحثك.</p>
        ) : (
          filteredHistory.map((poem) => {
            const formattedDate = new Date(poem.createdAt).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <div
                key={poem.id}
                onClick={() => onSelectPoem(poem)}
                className="group p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 border-[#dfba6b]/20 bg-[#0d1611]/60 hover:border-[#dfba6b] hover:bg-[#122417]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      بحر {poem.meterName}
                    </span>
                    {poem.weightSafetyPercentage !== undefined && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                        موزون {poem.weightSafetyPercentage}%
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formattedDate}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-base text-[#dfba6b] group-hover:text-amber-500 transition-colors truncate">
                    {poem.title}
                  </h4>
                  <p className="text-xs text-gray-400 italic truncate mt-0.5 font-serif">
                    {poem.verses[0] ? `"${poem.verses[0].shatr1} ... ${poem.verses[0].shatr2}"` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => onToggleFavorite(poem.id, e)}
                    className="p-1.5 rounded-lg hover:bg-amber-500/10 text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                    title={poem.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  >
                    <Star className={`w-4 h-4 ${poem.isFavorite ? 'fill-[#dfba6b] text-[#dfba6b]' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => onDeletePoem(poem.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="حذف من الديوان المحفوظ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-amber-500 group-hover:translate-x-[-2px] transition-all" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
