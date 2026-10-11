/**
 * Firebase Client Configuration for React Native / Expo.
 * Configured with live project: trust-vault-escrow-app-fe60d
 */
export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export const firebaseConfig: FirebaseClientConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyANCBPXD6NUR_og6FQ_UwqLrYZJXr4G20U',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'trust-vault-escrow-app-fe60d.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'trust-vault-escrow-app-fe60d',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'trust-vault-escrow-app-fe60d.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '656433481497',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:656433481497:web:601603f12bdb10c4556788',
  measurementId: 'G-G5XEF8K07X',
};
