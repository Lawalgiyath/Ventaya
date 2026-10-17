import 'server-only';

import Stripe from 'stripe';

/**
 * Server-side Stripe client.
 *
 * Returns null when the secret key is absent, so the app boots and every
 * billing surface can render a clear "billing not configured yet" state
 * instead of crashing at import time.
 */

let cached: Stripe | null | undefined;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;

  if (!isStripeConfigured()) {
    console.warn(
      '[ventaya] STRIPE_SECRET_KEY missing. Checkout and billing portal are ' +
        'disabled. See .env.example.'
    );
    cached = null;
    return cached;
  }

  cached = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // Pin the API version so a Stripe-side upgrade can't silently change
    // webhook payload shapes underneath us.
    apiVersion: '2026-08-26.dahlia',
    typescript: true,
    appInfo: { name: 'Ventaya', url: 'https://ventaya.com' },
  });
  return cached;
}

export function appUrl(path = ''): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  return `${base.replace(/\/$/, '')}${path}`;
}
