/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../db';
import { FirestoreSubscription } from '../types';
import { UsersService } from './usersService';

export class SubscriptionsService {
  /**
   * Create a new subscription for a user and link it to their user profile.
   */
  static async createSubscription(params: {
    uid: string;
    planId: string;
    paymentProvider: string;
    paymentReference: string;
  }): Promise<FirestoreSubscription | null> {
    if (!db) return null;
    try {
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const now = new Date();
      const end = new Date();
      end.setDate(now.getDate() + 30); // 30-day billing period

      const newSubscription: FirestoreSubscription = {
        subscriptionId,
        uid: params.uid,
        planId: params.planId,
        status: 'active',
        startDate: now.toISOString(),
        endDate: end.toISOString(),
        renewalDate: end.toISOString(),
        paymentProvider: params.paymentProvider,
        paymentReference: params.paymentReference,
        autoRenew: true
      };

      // 1. Store subscription record
      await db.collection('subscriptions').doc(subscriptionId).set(newSubscription);

      // 2. Update linked user profile plan tier & status
      await UsersService.updateUserPlan(params.uid, params.planId, 'active');

      console.log(`[SubscriptionsService] Created subscription: ${subscriptionId} for UID: ${params.uid}`);
      return newSubscription;
    } catch (err) {
      console.error('[SubscriptionsService] Error creating subscription:', err);
      return null;
    }
  }

  /**
   * Retrieve a subscription by ID.
   */
  static async getSubscription(subscriptionId: string): Promise<FirestoreSubscription | null> {
    if (!db) return null;
    try {
      const doc = await db.collection('subscriptions').doc(subscriptionId).get();
      if (doc.exists) {
        return doc.data() as FirestoreSubscription;
      }
      return null;
    } catch (err) {
      console.error(`[SubscriptionsService] Error fetching subscription ${subscriptionId}:`, err);
      return null;
    }
  }

  /**
   * Find the active subscription for a specific user.
   */
  static async getUserActiveSubscription(uid: string): Promise<FirestoreSubscription | null> {
    if (!db) return null;
    try {
      const snap = await db.collection('subscriptions')
        .where('uid', '==', uid)
        .where('status', '==', 'active')
        .get();
      
      let activeSub: FirestoreSubscription | null = null;
      snap.forEach((doc: any) => {
        const sub = doc.data() as FirestoreSubscription;
        if (!activeSub || new Date(sub.endDate) > new Date(activeSub.endDate)) {
          activeSub = sub;
        }
      });
      return activeSub;
    } catch (err) {
      console.error(`[SubscriptionsService] Error fetching active subscription for user ${uid}:`, err);
      return null;
    }
  }

  /**
   * Cancel auto-renew for a subscription.
   */
  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!db) return false;
    try {
      await db.collection('subscriptions').doc(subscriptionId).set({
        autoRenew: false,
        status: 'cancelled'
      }, { merge: true });
      return true;
    } catch (err) {
      console.error(`[SubscriptionsService] Error cancelling subscription ${subscriptionId}:`, err);
      return false;
    }
  }

  /**
   * Fetch all subscriptions in the system.
   */
  static async getAllSubscriptions(): Promise<FirestoreSubscription[]> {
    if (!db) return [];
    try {
      const snap = await db.collection('subscriptions').get();
      const subscriptions: FirestoreSubscription[] = [];
      snap.forEach((doc: any) => {
        subscriptions.push(doc.data() as FirestoreSubscription);
      });
      return subscriptions;
    } catch (err) {
      console.error('[SubscriptionsService] Error fetching all subscriptions:', err);
      return [];
    }
  }
}
