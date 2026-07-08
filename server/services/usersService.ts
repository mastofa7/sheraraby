/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../db';
import { FirestoreUser } from '../types';
import { PlansService } from './plansService';
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
        
        // 1. Check if subscription is expired (Atomic Downgrade to Free)
        if (user.planId !== 'free' && user.renewalDate && new Date(user.renewalDate) < now) {
          console.log(`[UsersService] Subscription expired for user ${uid}. Auto-downgrading to free.`);
          user.planId = 'free';
          user.subscriptionStatus = 'expired';
          user.dailyLimit = 10;
          user.remainingToday = 10;
          user.updatedAt = now.toISOString();
          
          await db.collection('users').doc(uid).set(user, { merge: true });

          // Record inside subscriptions collection
          const subDocId = `sub_exp_${Date.now()}`;
          await db.collection('subscriptions').doc(subDocId).set({
            subscriptionId: subDocId,
            uid: uid,
            planId: 'free',
            status: 'expired',
            startDate: now.toISOString(),
            endDate: now.toISOString(),
            renewalDate: now.toISOString(),
            paymentProvider: 'system',
            paymentReference: 'auto_downgrade',
            autoRenew: false
          });

          // Log inside admin / dev logs panel
          addDevLog('subscription_expiration', null, `انتهت صلاحية اشتراك المستخدم ${user.email || uid} وتمت إعادته تلقائياً للباقة المجانية (١٠ استخدامات يومياً).`);
        } else if (user.lastResetDate !== today) {
          // Auto-reset remaining usage if it's a new day
          user.remainingToday = user.dailyLimit;
          user.lastResetDate = today;
          user.updatedAt = now.toISOString();
          
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
      
      const planDetails = await PlansService.getPlan(planId);
      const dailyLimit = planDetails ? planDetails.limit : 10;

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
   * Update user plan and adjust daily limits.
   */
  static async updateUserPlan(uid: string, planId: string, subscriptionStatus: string = 'active'): Promise<FirestoreUser | null> {
    if (!db) return null;
    try {
      const user = await this.getOrCreateUser(uid);
      if (!user) return null;

      const planDetails = await PlansService.getPlan(planId);
      const dailyLimit = planDetails ? planDetails.limit : 10;

      const renewalDate = planId !== 'free'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const updatedFields: Partial<FirestoreUser> = {
        planId,
        subscriptionStatus,
        dailyLimit,
        // Reset remaining count to match new tier limit
        remainingToday: dailyLimit,
        updatedAt: new Date().toISOString()
      };

      if (renewalDate) {
        updatedFields.renewalDate = renewalDate;
      } else {
        // If downgrading to free, remove or nullify renewalDate
        updatedFields.renewalDate = '';
      }

      await db.collection('users').doc(uid).set(updatedFields, { merge: true });
      console.log(`[UsersService] Updated user ${uid} to plan: ${planId}`);
      return { ...user, ...updatedFields } as FirestoreUser;
    } catch (err) {
      console.error(`[UsersService] Error updating plan for user ${uid}:`, err);
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
