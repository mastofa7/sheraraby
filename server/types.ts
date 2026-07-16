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
  planId: string; // 'free'
  dailyLimit: number;
  remainingToday: number;
  lastResetDate: string; // 'YYYY-MM-DD'
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface FirestoreUsageLog {
  uid: string;
  date: string; // 'YYYY-MM-DD'
  requestsUsed: number;
  lastRequest: string; // ISO String
}
