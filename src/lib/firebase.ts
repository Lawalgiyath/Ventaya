import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // Fail loudly in dev rather than throwing an opaque Firebase error later.
  console.error(
    "[ventaya] Firebase env vars are missing. Copy .env.example to .env and fill in the NEXT_PUBLIC_FIREBASE_* values."
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Firestore uses the default in-memory cache.
 *
 * IndexedDB persistence was tried here and had to be removed: with
 * `persistentLocalCache` + `persistentMultipleTabManager`, signing in threw
 * `FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state` and the app hung
 * before reaching the dashboard. Offline caching is a convenience; a crash on
 * the login path is not a fair trade for it.
 *
 * The instance is cached on globalThis because Next.js fast refresh re-runs
 * this module, and a second Firestore instance for the same app is exactly
 * what provokes that assertion.
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
