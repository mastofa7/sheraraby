import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let headers: HeadersInit = {};
  if (init && init.headers) {
    if (init.headers instanceof Headers) {
      headers = new Headers(init.headers);
    } else if (Array.isArray(init.headers)) {
      headers = [...init.headers];
    } else {
      headers = { ...init.headers };
    }
  }

  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      if (headers instanceof Headers) {
        headers.set('Authorization', `Bearer ${token}`);
      } else if (Array.isArray(headers)) {
        // Find if Authorization already exists
        const authIdx = headers.findIndex(([k]) => k.toLowerCase() === 'authorization');
        if (authIdx !== -1) {
          headers[authIdx] = ['Authorization', `Bearer ${token}`];
        } else {
          headers.push(['Authorization', `Bearer ${token}`]);
        }
      } else {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    } catch (tokenErr) {
      console.error('Error fetching auth token:', tokenErr);
    }
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

