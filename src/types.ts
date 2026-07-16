/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PoeticMeterVariant {
  name: string; // اسم الصورة العروضية (مثال: البسيط التام، البسيط المجزوء)
  feet: string; // التفعيلات العروضية المحددة لهذه الصورة
  description: string; // شرح مفصل لهذه الصورة العروضية واستخدامها
  example: {
    verse: string; // الشاهد الشعري لهذه الصورة
    poet: string; // الشاعر قائل الشاهد
  };
}

export interface PoeticMeterInfo {
  name: string;
  feet: string; // التفعيلات الكاملة
  description: string; // شرح مختصر
  example: {
    verse: string; // البيت المثال
    poet: string; // الشاعر القائل
  };
  variants?: PoeticMeterVariant[]; // الصور العروضية المتوفرة
}

export type RhymeSystem =
  | 'unified' // قافية موحدة في جميع الأبيات
  | 'strophic' // قافية لكل مقطوعة
  | 'tasri' // التصريع في المطلع فقط
  | 'internal' // قافية بين شطري البيت الواحد
  | 'custom'; // تخصيص حرف الروي يدويًا

export interface GenerationParams {
  meterName: string; // البحر الشعري
  meterVariant?: string; // الصورة العروضية المختارة للبحر (مثلاً: البسيط المجزوء)
  purpose: string; // الغرض الشعري
  customPurpose?: string; // غرض مخصص إن وجد
  isOpposition: boolean; // هل يريد معارضة قصيدة؟
  oppositionPoem?: string; // نص القصيدة المراد معارضتها
  isSimulatingPoet: boolean; // هل يريد محاكاة شاعر معين؟
  poetName?: string; // اسم الشاعر المراد محاكاته
  description: string; // وصف موضوع القصيدة (نثراً)
  versesCount: number; // عدد الأبيats
  rhymeSystem: RhymeSystem; // نظام القافية
  customRhymeLetter?: string; // حرف الروي المخصص يدويًا
  customRhymeType?: string; // نوع القافية المختار من لوحة القافية (موحدة، لكل مقطوعة، مزدوجة، متناوبة، إلخ)
}

export interface PoemVerse {
  shatr1: string; // الصدر
  shatr2: string; // العجز
  index: number;
}

export interface GeneratedPoem {
  id: string;
  title: string;
  verses: PoemVerse[];
  meterName: string;
  feet: string;
  rhymeLetter: string;
  purpose: string;
  poetSimulated?: string;
  isOpposition?: boolean;
  explanation?: string; // شرح معاني المفردات أو الصور البلاغية بأسلوب مبسط
  weightSafetyPercentage?: number; // نسبة سلامة الوزن
  rhymeSafetyPercentage?: number; // نسبة التزام القافية
  isFavorite?: boolean; // هل تم تفضيل القصيدة؟
  createdAt: string;
}
