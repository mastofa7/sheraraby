/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FirestoreUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string; // 'admin' | 'user'
  planId: string; // 'free' | 'member' | 'premium'
  subscriptionStatus: string; // 'active' | 'inactive' | 'cancelled'
  dailyLimit: number;
  remainingToday: number;
  lastResetDate: string; // 'YYYY-MM-DD'
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  renewalDate?: string; // ISO String
}

export interface FirestoreSubscription {
  subscriptionId: string;
  uid: string;
  planId: string;
  status: string; // 'active' | 'inactive' | 'expired'
  startDate: string; // ISO String
  endDate: string; // ISO String
  renewalDate: string; // ISO String
  paymentProvider: string; // 'paymob' | 'simulated' | etc.
  paymentReference: string;
  autoRenew: boolean;
}

export interface FirestorePayment {
  paymentId: string;
  uid: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  provider: string; // 'paymob' | 'simulated'
  status: string; // 'success' | 'failed' | 'pending'
  transactionId: string;
  createdAt: string; // ISO String
}

export interface FirestorePlan {
  planId: string; // 'free' | 'member' | 'premium'
  name: string;
  limit: number; // 10 | 100 | 500
  price: string;
  features: string[];
}

export interface FirestoreUsageLog {
  uid: string;
  date: string; // 'YYYY-MM-DD'
  requestsUsed: number;
  lastRequest: string; // ISO String
}
