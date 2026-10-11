import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  type Auth,
  // @ts-ignore - getReactNativePersistence is available in react-native entrypoint
  getReactNativePersistence,
} from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '../constants/firebaseConfig';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    if (typeof getReactNativePersistence === 'function') {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } else {
      auth = getAuth(app);
    }
  } else {
    app = getApp();
    auth = getAuth(app);
  }
  storage = getStorage(app);
} catch (error) {
  console.warn('[Firebase Client] Initialization warning:', error);
}

/**
 * Checks if the Firebase client is configured with real project credentials.
 */
export function isFirebaseLive(): boolean {
  return (
    Boolean(firebaseConfig.apiKey) &&
    !firebaseConfig.apiKey.includes('DemoKey') &&
    firebaseConfig.projectId !== 'trust-vault-escrow'
  );
}

export { app, auth, storage };
