import 'server-only';

import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

/**
 * Admin SDK: used by webhooks and server-side gates, which must write
 * entitlement fields that Firestore rules deliberately forbid the client
 * from touching. If the client could grant itself `plan: 'plus'`, billing
 * would be decorative.
 *
 * Returns null when credentials are absent so the app still boots in dev;
 * callers must handle that and fail closed.
 */

let cached: { app: App; db: Firestore; auth: Auth } | null | undefined;

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}

export function getAdmin() {
  if (cached !== undefined) return cached;

  if (!isAdminConfigured()) {
    console.warn(
      '[ventaya] Firebase Admin credentials missing. Billing webhooks and ' +
        'server-side entitlement checks are disabled. See .env.example.'
    );
    cached = null;
    return cached;
  }

  const app =
    getApps().find((a) => a.name === 'ventaya-admin') ??
    initializeApp(
      {
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
          // Private keys arrive from env with escaped newlines.
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(
            /\\n/g,
            '\n'
          ),
        }),
      },
      'ventaya-admin'
    );

  cached = { app, db: getFirestore(app), auth: getAuth(app) };
  return cached;
}
