/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../db';
import { FirestoreUsageLog } from '../types';

export class UsageLogsService {
  /**
   * Get the document ID for a specific user and date.
   */
  private static getDocId(uid: string, date: string): string {
    return `${uid}_${date}`;
  }

  /**
   * Retrieve a usage log for a specific user and date.
   */
  static async getLog(uid: string, date: string): Promise<FirestoreUsageLog | null> {
    if (!db) return null;
    try {
      const docId = this.getDocId(uid, date);
      const doc = await db.collection('usage_logs').doc(docId).get();
      if (doc.exists) {
        return doc.data() as FirestoreUsageLog;
      }
      return null;
    } catch (err) {
      console.error(`[UsageLogsService] Error fetching usage log for user ${uid}:`, err);
      return null;
    }
  }

  /**
   * Log a new request or increment usage for today.
   * Returns the updated requestsUsed count.
   */
  static async incrementUsage(uid: string): Promise<number> {
    if (!db) return 0;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const docId = this.getDocId(uid, today);
      const existing = await this.getLog(uid, today);

      const updatedCount = (existing?.requestsUsed || 0) + 1;
      const logData: FirestoreUsageLog = {
        uid,
        date: today,
        requestsUsed: updatedCount,
        lastRequest: new Date().toISOString()
      };

      await db.collection('usage_logs').doc(docId).set(logData, { merge: true });
      return updatedCount;
    } catch (err) {
      console.error(`[UsageLogsService] Error incrementing usage for user ${uid}:`, err);
      return 0;
    }
  }

  /**
   * Reset usage logs count for testing/admin purposes.
   */
  static async resetUsage(uid: string, date: string): Promise<void> {
    if (!db) return;
    try {
      const docId = this.getDocId(uid, date);
      await db.collection('usage_logs').doc(docId).set({
        requestsUsed: 0,
        lastRequest: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error(`[UsageLogsService] Error resetting usage for user ${uid}:`, err);
    }
  }
}
