/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../db';
import { FirestoreUser } from '../types';
import { addDevLog } from '../../src/backend-logic';

export class UsersService {
  /**
   * Check if user email is admin.
   */
  static isAdminEmail(email: string): boolean {
    return email === 'mw9392000@gmail.com';
  }

  /**
   * Get or create a user profile in Firestore.
   */
  static async getOrCreateUser(uid: string, authData?: { email?: string; name?: string; picture?: string }): Promise<FirestoreUser | null> {
    if (!db) return null;
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();

      if (userDoc.exists) {
        let user = userDoc.data() as FirestoreUser;
        
        // Ensure role is correctly updated if owner changes or is checked
        if (user.email && this.isAdminEmail(user.email) && user.role !== 'admin') {
          user.role = 'admin';
          await db.collection('users').doc(uid).set({ role: 'admin' }, { merge: true });
        }

        // Auto-reset remaining usage if it's a new day
        if (user.lastResetDate !== today) {
          const isOwner = user.email ? this.isAdminEmail(user.email) : false;
          user.dailyLimit = isOwner ? 99999 : 10;
          user.remainingToday = isOwner ? 99999 : 10;
          user.lastResetDate = today;
          user.updatedAt = now.toISOString();
          
          await db.collection('users').doc(uid).set({
            dailyLimit: user.dailyLimit,
            remainingToday: user.remainingToday,
            lastResetDate: today,
            updatedAt: now.toISOString()
          }, { merge: true });
        }
        return user;
      }

      // Create new user if not exists
      const email = authData?.email || '';
      const displayName = authData?.name || '';
      const photoURL = authData?.picture || '';
      const isOwner = this.isAdminEmail(email);
      const role = isOwner ? 'admin' : 'user';
      const planId = 'free';
      const dailyLimit = isOwner ? 99999 : 10;

      const newUser: FirestoreUser = {
        uid,
        email,
        displayName,
        photoURL,
        role,
        planId,
        subscriptionStatus: 'active',
        dailyLimit,
        remainingToday: dailyLimit,
        lastResetDate: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.collection('users').doc(uid).set(newUser);
      console.log(`[UsersService] Created user profile for UID: ${uid}`);
      return newUser;
    } catch (err) {
      console.error(`[UsersService] Error fetching/creating user ${uid}:`, err);
      return null;
    }
  }

  /**
   * Update user plan (retained for signature compatibility, no-op).
   */
  static async updateUserPlan(uid: string, planId: string, subscriptionStatus: string = 'active'): Promise<FirestoreUser | null> {
    return this.getOrCreateUser(uid);
  }

  /**
   * Decrement remaining today uses for user.
   */
  static async consumeUsage(uid: string): Promise<boolean> {
    if (!db) return false;
    try {
      const user = await this.getOrCreateUser(uid);
      if (!user) return false;

      // Admins bypass limit
      if (user.role === 'admin' || (user.email && this.isAdminEmail(user.email))) return true;

      if (user.remainingToday <= 0) {
        return false;
      }

      await db.collection('users').doc(uid).set({
        remainingToday: user.remainingToday - 1,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return true;
    } catch (err) {
      console.error(`[UsersService] Error consuming usage for user ${uid}:`, err);
      return false;
    }
  }
}
