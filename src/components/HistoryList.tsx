import React, { useState } from 'react';
import { GeneratedPoem } from '../types';
import { BookOpen, Calendar, ChevronLeft, Trash2, Award, Search, Star, Heart } from 'lucide-react';

interface HistoryListProps {
  history: GeneratedPoem[];
  onSelectPoem: (poem: GeneratedPoem) => void;
  onDeletePoem: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

export default function HistoryList({ history, onSelectPoem, onDeletePoem, onToggleFavorite, onClearAll }: HistoryListProps) {
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
      <div className="bg-white border border-manuscript-border/50 rounded-2xl p-8 text-center" id="history-empty-state">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
          <BookOpen className="w-8 h-8 text-[#b58d3d]" />
        </div>
        <h4 className="text-royal-800 font-bold mb-1">الديوان الخاص بك فارغ حالياً</h4>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          عندما تقوم بنظم قصائد جديدة، ستظهر تلقائياً في هذا القسم للرجوع إليها ونسخها وتصديرها في أي وقت لاحق حتى لو قمت بإغلاق المتصفح.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-manuscript-border/40 rounded-2xl p-5 shadow-sm" id="history-container">
      <div className="flex flex-col gap-3 mb-4 border-b border-gray-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-royal-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-jullanar-600" />
              ديوانك المحفوظ محلياً ({history.length})
            </h3>
            <p className="text-[11px] text-gray-500">القصائد التي قمت بإنشائها مسبقاً محفوظة بأمان في متصفحك.</p>
          </div>
          <button
            onClick={onClearAll}
            className="text-xs text-red-600 hover:text-red-800 font-semibold bg-red-50 hover:bg-red-100/50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
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
              className="w-full bg-[#fdfcf9] border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:ring-2 focus:ring-[#1a472a] outline-none"
            />
          </div>
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              showOnlyFavorites
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-white' : 'fill-amber-600'}`} />
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
                className="group p-3.5 rounded-xl border border-manuscript-border/30 hover:border-royal-400 bg-manuscript-paper/40 hover:bg-royal-50/20 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-royal-100 text-royal-800">
                      بحر {poem.meterName}
                    </span>
                    {poem.weightSafetyPercentage !== undefined && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        موزون {poem.weightSafetyPercentage}%
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formattedDate}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-base text-royal-900 group-hover:text-jullanar-600 transition-colors truncate">
                    {poem.title}
                  </h4>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {poem.verses[0] ? `"${poem.verses[0].shatr1} ... ${poem.verses[0].shatr2}"` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => onToggleFavorite(poem.id, e)}
                    className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                    title={poem.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  >
                    <Star className={`w-4 h-4 ${poem.isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => onDeletePoem(poem.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="حذف من الديوان المحفوظ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-royal-600 group-hover:translate-x-[-2px] transition-all" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
