import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Format-valid placeholder key used during static build/export when env vars
 * have not been supplied to the build container. Firebase Auth verifies the key
 * starts with 'AIzaSy' and is at least 39 characters.
 */
const BUILD_DUMMY_KEY = "AIzaSyDummyKeyForStaticPrerendering1234";

const rawApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const isRealKey = Boolean(rawApiKey && rawApiKey.trim().length > 10 && !rawApiKey.includes("DummyKey"));

const apiKey = isRealKey ? rawApiKey!.trim() : BUILD_DUMMY_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "realme-mdjf0";

const firebaseConfig: FirebaseOptions = {
  apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
};

export const isFirebaseConfigured = isRealKey;

if (!isFirebaseConfigured && typeof window !== "undefined") {
  console.warn(
    "[ventaya] Firebase environment variables missing. Ensure NEXT_PUBLIC_FIREBASE_* are configured in your deployment settings."
  );
}

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Firestore uses the default in-memory cache.
 * Cached on globalThis for fast-refresh stability.
 */
const globalForFirebase = globalThis as unknown as {
  __ventayaDb?: Firestore;
  __ventayaAuth?: Auth;
};

const db: Firestore = globalForFirebase.__ventayaDb ?? getFirestore(app);
const auth: Auth = globalForFirebase.__ventayaAuth ?? getAuth(app);

if (process.env.NODE_ENV !== "production") {
  globalForFirebase.__ventayaDb = db;
  globalForFirebase.__ventayaAuth = auth;
}

export { app, auth, db };
