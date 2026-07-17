/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { AsyncLocalStorage } from 'async_hooks';

let isFirebaseAdminInitialized = false;
let db: any = null;

// Context to propagate current request's user ID token to REST operations
export const dbContext = new AsyncLocalStorage<{ token?: string }>();

// Cache for Google Cloud service account token
let cachedServiceAccountToken: string | null = null;
let tokenExpiryTime = 0;

async function getServiceAccountToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedServiceAccountToken && tokenExpiryTime > now + 60000) {
    return cachedServiceAccountToken;
  }
  try {
    const res = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: { 'Metadata-Flavor': 'Google' }
    });
    if (res.ok) {
      const data: any = await res.json();
      cachedServiceAccountToken = data.access_token || null;
      if (data.expires_in) {
        tokenExpiryTime = Date.now() + data.expires_in * 1000;
      } else {
        tokenExpiryTime = Date.now() + 3500 * 1000;
      }
      return cachedServiceAccountToken;
    }
  } catch (err) {
    // Silent in local environment where metadata server doesn't exist
  }
  return null;
}

async function getAuthHeaders(config: any): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // 1. Check if we have a request-specific user token in AsyncLocalStorage context
  const store = dbContext.getStore();
  if (store && store.token) {
    headers['Authorization'] = `Bearer ${store.token}`;
    return headers;
  }

  // 2. Otherwise, check if we can fetch a Google Service Account token (Cloud Run environment)
  const saToken = await getServiceAccountToken();
  if (saToken) {
    headers['Authorization'] = `Bearer ${saToken}`;
  }

  return headers;
}

function parseFirestoreValue(valueObj: any): any {
  if (!valueObj) return null;
  if ('stringValue' in valueObj) return valueObj.stringValue;
  if ('integerValue' in valueObj) return parseInt(valueObj.integerValue);
  if ('doubleValue' in valueObj) return parseFloat(valueObj.doubleValue);
  if ('booleanValue' in valueObj) return valueObj.booleanValue;
  if ('timestampValue' in valueObj) return valueObj.timestampValue;
  if ('arrayValue' in valueObj) {
    const values = valueObj.arrayValue.values || [];
    return values.map((v: any) => parseFirestoreValue(v));
  }
  if ('mapValue' in valueObj) {
    const fields = valueObj.mapValue.fields || {};
    const obj: any = {};
    for (const [k, v] of Object.entries(fields)) {
      obj[k] = parseFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

function formatFirestoreValue(val: any): any {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(v => formatFirestoreValue(v))
      }
    };
  }
  if (typeof val === 'object') {
    const fields: any = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = formatFirestoreValue(v);
    }
    return {
      mapValue: { fields }
    };
  }
  return { nullValue: null };
}

async function getRestDocument(config: any, collection: string, docId: string): Promise<any> {
  try {
    const dbId = config.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/${collection}/${docId}?key=${config.apiKey}`;
    const headers = await getAuthHeaders(config);
    const res = await fetch(url, { headers });
    if (res.status === 404) return null;
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[RestFirestore] GET failed for ${collection}/${docId}: ${res.status} ${res.statusText} - ${errText}`);
      return null;
    }
    const doc: any = await res.json();
    const fields = doc.fields || {};
    const obj: any = {};
    for (const [key, val] of Object.entries(fields)) {
      obj[key] = parseFirestoreValue(val);
    }
    return obj;
  } catch (err) {
    console.error(`Error in getRestDocument for ${collection}/${docId}:`, err);
    return null;
  }
}

async function setRestDocument(config: any, collection: string, docId: string, data: any, options?: { merge?: boolean }) {
  try {
    const dbId = config.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/${collection}/${docId}?key=${config.apiKey}`;
    const fields: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val === null || val === undefined) continue;
      fields[key] = formatFirestoreValue(val);
    }
    
    let patchUrl = url;
    if (options?.merge) {
      const keys = Object.keys(data);
      const maskParams = keys.map(k => `updateMask.fieldPaths=${k}`).join('&');
      if (maskParams) {
        patchUrl = `${url}&${maskParams}`;
      }
    }

    const headers = await getAuthHeaders(config);
    const res = await fetch(patchUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[RestFirestore] PATCH failed for ${collection}/${docId}: ${res.status} ${res.statusText} - ${errText}`);
    }
  } catch (err) {
    console.error(`Error in setRestDocument:`, err);
  }
}

async function deleteRestDocument(config: any, collection: string, docId: string) {
  try {
    const dbId = config.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/${collection}/${docId}?key=${config.apiKey}`;
    const headers = await getAuthHeaders(config);
    const res = await fetch(url, { method: 'DELETE', headers });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[RestFirestore] DELETE failed for ${collection}/${docId}: ${res.status} ${res.statusText} - ${errText}`);
    }
  } catch (err) {
    console.error(`Error in deleteRestDocument:`, err);
  }
}

async function addRestDocument(config: any, collection: string, data: any) {
  try {
    const dbId = config.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/${collection}?key=${config.apiKey}`;
    const fields: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val === null || val === undefined) continue;
      fields[key] = formatFirestoreValue(val);
    }
    const headers = await getAuthHeaders(config);
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[RestFirestore] POST failed for ${collection}: ${res.status} ${res.statusText} - ${errText}`);
      return { id: Math.random().toString(36).substring(7) };
    }
    const doc: any = await res.json();
    return { id: doc.name.split('/').pop() };
  } catch (err) {
    console.error(`Error in addRestDocument:`, err);
    return { id: Math.random().toString(36).substring(7) };
  }
}

async function fetchRestDocuments(config: any, collection: string, queryConstraints: any[] = []): Promise<any[]> {
  try {
    const dbId = config.firestoreDatabaseId || '(default)';
    const headers = await getAuthHeaders(config);
    if (queryConstraints.length === 0) {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/${collection}?key=${config.apiKey}&pageSize=1000`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[RestFirestore] GET failed for ${collection}: ${res.status} - ${errText}`);
        return [];
      }
      const data: any = await res.json();
      if (!data.documents) return [];
      return data.documents.map((doc: any) => {
        const fields = doc.fields || {};
        const obj: any = { id: doc.name.split('/').pop() };
        for (const [key, val] of Object.entries(fields)) {
          obj[key] = parseFirestoreValue(val);
        }
        return obj;
      });
    }

    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents:runQuery?key=${config.apiKey}`;
    const opMap: Record<string, string> = {
      '==': 'EQUAL',
      '<': 'LESS_THAN',
      '<=': 'LESS_THAN_OR_EQUAL',
      '>': 'GREATER_THAN',
      '>=': 'GREATER_THAN_OR_EQUAL',
      'array-contains': 'ARRAY_CONTAINS'
    };

    let filters: any = null;
    if (queryConstraints.length === 1) {
      const { field, op, val } = queryConstraints[0];
      filters = {
        fieldFilter: {
          field: { fieldPath: field },
          op: opMap[op] || 'EQUAL',
          value: formatFirestoreValue(val)
        }
      };
    } else if (queryConstraints.length > 1) {
      filters = {
        compositeFilter: {
          op: 'AND',
          filters: queryConstraints.map(({ field, op, val }) => ({
            fieldFilter: {
              field: { fieldPath: field },
              op: opMap[op] || 'EQUAL',
              value: formatFirestoreValue(val)
            }
          }))
        }
      };
    }

    const queryBody: any = {
      structuredQuery: {
        from: [{ collectionId: collection }]
      }
    };
    if (filters) {
      queryBody.structuredQuery.where = filters;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(queryBody)
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[RestFirestore] runQuery failed for ${collection}: ${res.status} - ${errText}`);
      return [];
    }
    const results: any = await res.json();
    if (!Array.isArray(results)) return [];

    const documents: any[] = [];
    results.forEach((item: any) => {
      if (item.document) {
        const doc = item.document;
        const fields = doc.fields || {};
        const obj: any = { id: doc.name.split('/').pop() };
        for (const [key, val] of Object.entries(fields)) {
          obj[key] = parseFirestoreValue(val);
        }
        documents.push(obj);
      }
    });
    return documents;
  } catch (err) {
    console.error(`Error in fetchRestDocuments for ${collection}:`, err);
    return [];
  }
}

class RestCollection {
  constructor(private config: any, private collectionName: string, private queryConstraints: any[] = []) {}

  where(field: string, op: string, val: any) {
    return new RestCollection(this.config, this.collectionName, [...this.queryConstraints, { field, op, val }]);
  }

  doc(docId: string) {
    return new RestDoc(this.config, this.collectionName, docId);
  }

  async add(data: any) {
    return addRestDocument(this.config, this.collectionName, data);
  }

  async get() {
    const docs = await fetchRestDocuments(this.config, this.collectionName, this.queryConstraints);
    return {
      forEach: (callback: (doc: any) => void) => {
        docs.forEach(doc => {
          callback({
            id: doc.id,
            data: () => doc
          });
        });
      },
      size: docs.length,
      docs: docs.map(doc => ({
        id: doc.id,
        data: () => doc
      }))
    };
  }
}

class RestDoc {
  constructor(private config: any, private collectionName: string, private docId: string) {}

  async get() {
    const data = await getRestDocument(this.config, this.collectionName, this.docId);
    return {
      exists: data !== null,
      data: () => data,
      id: this.docId
    };
  }

  async set(data: any, options?: { merge?: boolean }) {
    return setRestDocument(this.config, this.collectionName, this.docId, data, options);
  }

  async update(data: any) {
    return this.set(data, { merge: true });
  }

  async delete() {
    return deleteRestDocument(this.config, this.collectionName, this.docId);
  }
}

class RestFirestore {
  constructor(private config: any) {}
  collection(name: string) {
    return new RestCollection(this.config, name);
  }
}

try {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    db = new RestFirestore(firebaseConfig);
    isFirebaseAdminInitialized = true;
  }
} catch (err) {
  console.error('[Shared Firestore] Initialization failed:', err);
}

export { db, isFirebaseAdminInitialized };
