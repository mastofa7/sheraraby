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
        let needsUpdate = false;

        // Force 'admin' role if the email matches the owner email
        const calculatedRole = (user.email && this.isAdminEmail(user.email)) ? 'admin' : (user.role || 'user');
        if (user.role !== calculatedRole) {
          user.role = calculatedRole;
          needsUpdate = true;
        }

        // Force flat dailyLimit values (99999 for admin, 10 for normal user)
        const expectedLimit = user.role === 'admin' ? 99999 : 10;
        if (user.dailyLimit !== expectedLimit) {
          user.dailyLimit = expectedLimit;
          user.remainingToday = expectedLimit;
          needsUpdate = true;
        }

        // Force planId to 'free'
        if (user.planId !== 'free') {
          user.planId = 'free';
          needsUpdate = true;
        }

        // Auto-reset remaining usage if it's a new day
        if (user.lastResetDate !== today) {
          user.remainingToday = user.dailyLimit;
          user.lastResetDate = today;
          user.updatedAt = now.toISOString();
          needsUpdate = true;
        }

        if (needsUpdate) {
          await db.collection('users').doc(uid).set(user, { merge: true });
        }
        return user;
      }

      // Create new user if not exists
      const email = authData?.email || '';
      const displayName = authData?.name || '';
      const photoURL = authData?.picture || '';
      const role = this.isAdminEmail(email) ? 'admin' : 'user';
      const planId = 'free';
      const dailyLimit = role === 'admin' ? 99999 : 10;

      const newUser: FirestoreUser = {
        uid,
        email,
        displayName,
        photoURL,
        role,
        planId,
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
   * Decrement remaining today uses for user.
   */
  static async consumeUsage(uid: string): Promise<boolean> {
    if (!db) return false;
    try {
      const user = await this.getOrCreateUser(uid);
      if (!user) return false;

      // Admins bypass limit
      if (user.role === 'admin') return true;

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
