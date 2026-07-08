/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../db';
import { FirestorePlan } from '../types';

export const DEFAULT_PLANS: Record<string, FirestorePlan> = {
  free: {
    planId: 'free',
    name: 'الخطة المجانية',
    limit: 10,
    price: '0 دولار',
    features: ['الوصول الأساسي للأدوات الأدبية', 'نظم قصائد قصيرة ومحدودة', '١٠ استخدامات يومية كحد أقصى']
  },
  member: {
    planId: 'member',
    name: 'الخطة الاحترافية (عضو)',
    limit: 100,
    price: '20 دولار شهرياً',
    features: ['جميع مميزات الخطة المجانية', 'أولوية معالجة فائقة السرعة', 'أداة المعارضة الشعرية المتقدمة', 'المحسنات البديعية والبلاغية كاملة', '١٠٠ استخدام يومياً متاحاً']
  },
  premium: {
    planId: 'premium',
    name: 'الخطة المميزة',
    limit: 500,
    price: '80 دولار شهرياً',
    features: ['جميع ميزات المنصة والذكاء الاصطناعي بلا قيود', 'أقصى سرعة استجابة فائقة من Gemini', 'استشارات ومقترحات شعرية متقدمة ودقيقة', 'دعم فني خاص على مدار الساعة', '٥٠٠ استخدام يومي متاح']
  }
};

export class PlansService {
  /**
   * Seed the default plans into Firestore if they don't already exist.
   */
  static async seedPlans(): Promise<void> {
    if (!db) return;
    try {
      for (const [planId, planData] of Object.entries(DEFAULT_PLANS)) {
        const planDoc = await db.collection('plans').doc(planId).get();
        if (!planDoc.exists) {
          await db.collection('plans').doc(planId).set(planData);
          console.log(`[PlansService] Seeded plan: ${planId}`);
        }
      }
    } catch (err) {
      console.error('[PlansService] Error seeding plans:', err);
    }
  }

  /**
   * Fetch all active plans from Firestore.
   */
  static async getAllPlans(): Promise<Record<string, FirestorePlan>> {
    if (!db) return DEFAULT_PLANS;
    try {
      const snap = await db.collection('plans').get();
      if (snap.size === 0) {
        // Automatically seed and return default if empty
        await this.seedPlans();
        return DEFAULT_PLANS;
      }
      const plans: Record<string, FirestorePlan> = {};
      snap.forEach((doc: any) => {
        const data = doc.data() as FirestorePlan;
        plans[data.planId] = data;
      });
      return plans;
    } catch (err) {
      console.error('[PlansService] Error fetching all plans, using default fallback:', err);
      return DEFAULT_PLANS;
    }
  }

  /**
   * Fetch a specific plan's details.
   */
  static async getPlan(planId: string): Promise<FirestorePlan | null> {
    if (!db) return DEFAULT_PLANS[planId] || null;
    try {
      const planDoc = await db.collection('plans').doc(planId).get();
      if (planDoc.exists) {
        return planDoc.data() as FirestorePlan;
      }
      return DEFAULT_PLANS[planId] || null;
    } catch (err) {
      console.error(`[PlansService] Error fetching plan ${planId}:`, err);
      return DEFAULT_PLANS[planId] || null;
    }
  }
}
