/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../db';
import { FirestoreUser } from '../types';
import { addDevLog } from '../../src/backend-logic';

export class UsersService {
  // In-memory cache for user profiles to avoid redundant Firestore reads
  private static userCache = new Map<string, { user: FirestoreUser; timestamp: number }>();
  private static CACHE_TTL_MS = 15000; // 15 seconds cache TTL

  static clearCache(uid: string) {
    this.userCache.delete(uid);
  }

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
    const nowTimeMs = Date.now();
    const cached = this.userCache.get(uid);
    const today = new Date().toISOString().slice(0, 10);
    
    // Return cached user if it's within TTL and the day matches (for resetting limits)
    if (cached && (nowTimeMs - cached.timestamp < this.CACHE_TTL_MS) && cached.user.lastResetDate === today) {
      return cached.user;
    }

    try {
      const userDoc = await db.collection('users').doc(uid).get();
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
        
        // Cache the result
        this.userCache.set(uid, { user, timestamp: nowTimeMs });
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
      
      // Cache the newly created user
      this.userCache.set(uid, { user: newUser, timestamp: nowTimeMs });
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
      this.clearCache(uid); // Clear cache before read to guarantee we fetch from Firestore
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

      this.clearCache(uid); // Clear cache again after update so the next read fetches updated count
      return true;
    } catch (err) {
      console.error(`[UsersService] Error consuming usage for user ${uid}:`, err);
      return false;
    }
  }
}
