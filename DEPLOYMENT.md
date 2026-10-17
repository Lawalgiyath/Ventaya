# Ventaya — Production Deployment Guide

This guide walks you through deploying Ventaya (including SafeReport) to Vercel with a live Firebase backend.

---

## Prerequisites

- A [Vercel](https://vercel.com) account (free tier works)
- A [Firebase](https://console.firebase.google.com) project (`realme-mdjf0` is already configured in `.env`)
- A [Google AI Studio](https://aistudio.google.com) account for the Gemini API key
- Node.js ≥ 20 installed locally

---

## Step 1 — Firebase Admin Service Account Key

The database does **not work** without this. Reports appear to submit but nothing is saved.

1. Go to [Firebase Console](https://console.firebase.google.com) → select project `realme-mdjf0`
2. Click the ⚙️ gear icon → **Project settings**
3. Go to the **Service accounts** tab
4. Click **Generate new private key** → **Generate key**
5. A JSON file downloads. Open it and copy these three values:

```
project_id        → FIREBASE_ADMIN_PROJECT_ID
client_email      → FIREBASE_ADMIN_CLIENT_EMAIL
private_key       → FIREBASE_ADMIN_PRIVATE_KEY
```

> ⚠️ **Private key format for Vercel**: The private key contains real newlines. When pasting into Vercel's environment variable UI, paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. Vercel handles the formatting automatically when you use their dashboard. If using CLI or a `.env` file, replace each real newline with `\n` and wrap in double quotes:
> ```
> FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
> ```

---

## Step 2 — Enable Firestore

1. In Firebase Console → **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (our rules are already written)
4. Select a region close to Nigeria: **europe-west1** (Belgium) or **us-central1**

---

## Step 3 — Deploy Firestore Rules and Indexes

Install the Firebase CLI if you haven't:
```bash
npm install -g firebase-tools
firebase login
```

Deploy rules and indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

This deploys `firestore.rules` and `firestore.indexes.json` from your project root.

---

## Step 4 — Enable Firebase Authentication

1. Firebase Console → **Build** → **Authentication** → **Get started**
2. Enable these sign-in providers:
   - **Email/Password**
   - **Google** (for social login)
   - **Anonymous** (for guests — required for SafeReport anonymous mode)

---

## Step 5 — Rotate the Gemini API Key

The current key in `.env` was previously committed to git and must be treated as compromised.

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Delete the old key (`AQ.Ab8RN6Lz...`)
3. Click **Create API key** → **Create API key in new project** (or select existing)
4. Copy the new key — it starts with `AQ.`

---

## Step 6 — Deploy to Vercel

### Option A — Vercel Dashboard (recommended)

1. Push your code to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
3. Select your repo → Vercel auto-detects Next.js
4. Before clicking **Deploy**, click **Environment Variables** and add all variables below

### Option B — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Step 7 — Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables.

> **Tip**: In the Vercel dashboard, you can paste your entire `.env` file content into the **Name** field and it will auto-parse all variables at once.

### Required (app will not start without these)

| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | Your new Gemini key from Step 5 |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyA2aS3x6bhOVuw7IlapsWyGhfHyTqDpCms` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `realme-mdjf0.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `realme-mdjf0` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `realme-mdjf0.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `54699879695` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:54699879695:web:b24811842678e3c094227a` |
| `NEXT_PUBLIC_APP_URL` | `https://your-production-domain.vercel.app` |

### Required for SafeReport database (reports won't save without these)

| Variable | Value |
|----------|-------|
| `FIREBASE_ADMIN_PROJECT_ID` | From your service account JSON |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | From your service account JSON |
| `FIREBASE_ADMIN_PRIVATE_KEY` | From your service account JSON (with `\n` escapes) |

### Required for Stripe billing (set when ready for payments)

| Variable | Value |
|----------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` from Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Stripe Webhooks |
| `NEXT_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY` | `price_...` |
| `NEXT_PUBLIC_STRIPE_PRICE_PLUS_YEARLY` | `price_...` |
| `NEXT_PUBLIC_STRIPE_PRICE_TEAM_SEAT` | `price_...` |
| `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_SEAT` | `price_...` |

---

## Step 8 — Configure Stripe Webhooks (when ready)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Click **Add endpoint**
3. URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET`

---

## Step 9 — Verify Deployment

After deploying, check these URLs:

| URL | Expected |
|-----|----------|
| `https://your-domain.com` | Landing page loads |
| `https://your-domain.com/report` | SafeReport loads, not indexed by Google |
| `https://your-domain.com/login` | Login page loads |
| `https://your-domain.com/pricing` | Pricing page loads |

### Test SafeReport end-to-end:
1. Go to `/report`
2. Submit a test report (choose "Something else", skip all optional fields)
3. You should receive a `VTY-XXXXXX` case ID
4. Go to "Check case status" tab, enter the case ID
5. Your report should appear with AI triage summary and matched organisations

If step 3 fails with "We could not process your report", check that `FIREBASE_ADMIN_*` vars are set correctly in Vercel.

---

## Step 10 — Custom Domain (optional)

1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain (e.g. `ventaya.ng`)
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your new domain
5. Re-deploy

---

## Ongoing Maintenance

### Rotating keys
- **Gemini API key**: Replace `GEMINI_API_KEY` in Vercel env vars, re-deploy
- **Firebase Admin key**: Generate a new one in Firebase Console, update `FIREBASE_ADMIN_PRIVATE_KEY`

### Monitoring SafeReport
- Flagged reports (consistency score < 40): Query Firestore `reports` where `status == 'flagged'`
- Support unread messages: Query `report-chats` where `supportUnread > 0`
- No admin dashboard exists yet — use Firebase Console directly for now

### Firebase security
- Never commit `.env` to git
- Rotate your Firebase Admin key every 90 days
- Review Firestore rules before adding new collections

---

## Architecture Summary

```
Client (browser)
  ↓ Next.js Server Actions (always server-side)
    ↓ Zod validation
    ↓ Gemini AI (triage/classification)
    ↓ Firebase Admin SDK
      ↓ Firestore (reports, chats, usage, billing)

Firestore Rules → block ALL direct client access to /reports and /report-chats
```

The SafeReport database path is entirely server-side. No Firebase client SDK calls touch report data — only the Admin SDK running in Next.js server actions. A compromised browser session cannot read, write, or enumerate any reports.
