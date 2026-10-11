import {
  initializeApp,
  cert,
  applicationDefault,
  type App,
  getApps,
  deleteApp,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';
import type { Env } from '../../shared/config.js';

let initializedApp: App | null = null;
let isConfigured = false;

/**
 * Initializes the Firebase Admin SDK using either a service account JSON file
 * or individual environment variables (project ID, client email, private key).
 *
 * If no credentials are provided or valid, Firebase Admin operates in unconfigured mode
 * allowing stubs and mock fallbacks to handle operations seamlessly in development and tests.
 *
 * @param config - Application environment configuration
 * @returns The initialized Firebase Admin App instance, or null if unconfigured
 */
export function initFirebaseAdmin(config: Env): App | null {
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    initializedApp = existingApps[0];
    isConfigured = true;
    return initializedApp;
  }

  // Option 1: Service Account JSON file path
  if (config.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const resolvedPath = path.resolve(process.cwd(), config.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(resolvedPath)) {
      try {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        const serviceAccount = JSON.parse(fileContent) as ServiceAccount;
        initializedApp = initializeApp({
          credential: cert(serviceAccount),
          storageBucket: config.FIREBASE_STORAGE_BUCKET ?? (serviceAccount.projectId ? `${serviceAccount.projectId}.appspot.com` : undefined),
        });
        isConfigured = true;
        return initializedApp;
      } catch (err) {
        console.warn(`[FirebaseAdmin] Failed to load service account from ${resolvedPath}:`, err);
      }
    }
  }

  // Option 2: Environment variables
  if (config.FIREBASE_PROJECT_ID && config.FIREBASE_CLIENT_EMAIL && config.FIREBASE_PRIVATE_KEY) {
    try {
      const privateKey = config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      initializedApp = initializeApp({
        credential: cert({
          projectId: config.FIREBASE_PROJECT_ID,
          clientEmail: config.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        storageBucket: config.FIREBASE_STORAGE_BUCKET ?? `${config.FIREBASE_PROJECT_ID}.appspot.com`,
      });
      isConfigured = true;
      return initializedApp;
    } catch (err) {
      console.warn('[FirebaseAdmin] Failed to initialize using environment variables:', err);
    }
  }

  // Option 3: Default application credentials (if running in GCP or GOOGLE_APPLICATION_CREDENTIALS set)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    try {
      initializedApp = initializeApp({
        credential: applicationDefault(),
        storageBucket: config.FIREBASE_STORAGE_BUCKET,
      });
      isConfigured = true;
      return initializedApp;
    } catch (err) {
      console.warn('[FirebaseAdmin] Failed to initialize using GOOGLE_APPLICATION_CREDENTIALS:', err);
    }
  }

  isConfigured = false;
  return null;
}

/**
 * Checks whether Firebase Admin has been successfully configured with credentials.
 *
 * @returns True if Firebase Admin is active and authenticated, false otherwise
 */
export function isFirebaseConfigured(): boolean {
  return isConfigured && initializedApp !== null;
}

/**
 * Returns the initialized Firebase Admin App instance.
 *
 * @returns Firebase Admin App instance or null
 */
export function getFirebaseApp(): App | null {
  return initializedApp;
}

/**
 * Returns the Firebase Messaging service if configured.
 *
 * @returns Messaging instance or null
 */
export function getFirebaseMessaging(): Messaging | null {
  if (!initializedApp) return null;
  return getMessaging(initializedApp);
}

/**
 * Returns the Firebase Authentication service if configured.
 *
 * @returns Auth instance or null
 */
export function getFirebaseAuth(): Auth | null {
  if (!initializedApp) return null;
  return getAuth(initializedApp);
}

/**
 * Returns the Firebase Storage service if configured.
 *
 * @returns Storage instance or null
 */
export function getFirebaseStorage(): Storage | null {
  if (!initializedApp) return null;
  return getStorage(initializedApp);
}

/**
 * Resets the initialized Firebase Admin app (primarily for test cleanup).
 */
export async function resetFirebaseAdmin(): Promise<void> {
  if (initializedApp) {
    try {
      await deleteApp(initializedApp);
    } catch {
      // Ignored during shutdown/cleanup
    }
    initializedApp = null;
    isConfigured = false;
  }
}
