/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../db';
import { FirestorePayment } from '../types';

export class PaymentsService {
  /**
   * Log a new payment record in Firestore.
   */
  static async createPayment(params: {
    uid: string;
    subscriptionId: string;
    amount: number;
    currency: string;
    provider: string;
    status: string;
    transactionId: string;
  }): Promise<FirestorePayment | null> {
    if (!db) return null;
    try {
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const newPayment: FirestorePayment = {
        paymentId,
        uid: params.uid,
        subscriptionId: params.subscriptionId,
        amount: params.amount,
        currency: params.currency,
        provider: params.provider,
        status: params.status,
        transactionId: params.transactionId,
        createdAt: new Date().toISOString()
      };

      await db.collection('payments').doc(paymentId).set(newPayment);
      console.log(`[PaymentsService] Logged payment: ${paymentId}`);
      return newPayment;
    } catch (err) {
      console.error('[PaymentsService] Error logging payment:', err);
      return null;
    }
  }

  /**
   * Retrieve a payment by ID.
   */
  static async getPayment(paymentId: string): Promise<FirestorePayment | null> {
    if (!db) return null;
    try {
      const doc = await db.collection('payments').doc(paymentId).get();
      if (doc.exists) {
        return doc.data() as FirestorePayment;
      }
      return null;
    } catch (err) {
      console.error(`[PaymentsService] Error fetching payment ${paymentId}:`, err);
      return null;
    }
  }

  /**
   * Fetch all payments for a specific user.
   */
  static async getUserPayments(uid: string): Promise<FirestorePayment[]> {
    if (!db) return [];
    try {
      const snap = await db.collection('payments').where('uid', '==', uid).get();
      const payments: FirestorePayment[] = [];
      snap.forEach((doc: any) => {
        payments.push(doc.data() as FirestorePayment);
      });
      return payments;
    } catch (err) {
      console.error(`[PaymentsService] Error fetching payments for user ${uid}:`, err);
      return [];
    }
  }

  /**
   * Fetch all payments across the system.
   */
  static async getAllPayments(): Promise<FirestorePayment[]> {
    if (!db) return [];
    try {
      const snap = await db.collection('payments').get();
      const payments: FirestorePayment[] = [];
      snap.forEach((doc: any) => {
        payments.push(doc.data() as FirestorePayment);
      });
      return payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (err) {
      console.error('[PaymentsService] Error fetching all payments:', err);
      return [];
    }
  }
}
