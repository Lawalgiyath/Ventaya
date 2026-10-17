import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getAdmin } from '@/lib/firebase-admin';
import type { PlanId } from '@/lib/plans';
import { PLANS } from '@/lib/plans';

/**
 * Stripe webhook: the only thing that may grant a paid entitlement.
 *
 * Two rules govern this file:
 *  1. Read the body with `req.text()`, never `req.json()`. Signature
 *     verification runs against the exact raw bytes; parsing first is the
 *     single most common cause of "signature verification failed".
 *  2. Be idempotent. Delivery is at-least-once and Stripe retries on any
 *     non-2xx, so every event id is recorded and replays are skipped.
 */

export const runtime = 'nodejs';
// Never cache a webhook.
export const dynamic = 'force-dynamic';

const HANDLED = new Set<Stripe.Event.Type>([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
]);

export async function POST(req: Request) {
  const stripe = getStripe();
  const admin = getAdmin();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !admin || !secret) {
    console.warn('[ventaya] webhook hit but billing is not configured');
    return NextResponse.json({ error: 'Billing not configured.' }, { status: 503 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  // RAW body: must not be parsed before this point.
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (e) {
    console.error('[ventaya] webhook signature verification failed:', e);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  if (!HANDLED.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  // --- Idempotency -------------------------------------------------------
  const eventRef = admin.db.collection('stripe_events').doc(event.id);
  const seen = await eventRef.get();
  if (seen.exists) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleEvent(event, stripe, admin);
  } catch (e) {
    console.error(`[ventaya] webhook handler failed for ${event.type}:`, e);
    // Non-2xx tells Stripe to retry; the event is not marked processed.
    return NextResponse.json({ error: 'Handler failed.' }, { status: 500 });
  }

  await eventRef.set({
    type: event.type,
    processedAt: new Date().toISOString(),
  });

  return NextResponse.json({ received: true });
}

type Admin = NonNullable<ReturnType<typeof getAdmin>>;

async function handleEvent(event: Stripe.Event, stripe: Stripe, admin: Admin) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!session.subscription) return;
      const sub = await stripe.subscriptions.retrieve(
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id
      );
      await applySubscription(sub, admin, session.metadata ?? {});
      return;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await applySubscription(sub, admin, sub.metadata ?? {});
      return;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (!customerId) return;
      await markPastDue(customerId, admin);
      return;
    }
  }
}

/**
 * Write the entitlement implied by a subscription onto the user or the org.
 * This is the only place `plan` and `subscriptionStatus` are ever set.
 */
async function applySubscription(
  sub: Stripe.Subscription,
  admin: Admin,
  fallbackMeta: Record<string, string>
) {
  const meta = { ...fallbackMeta, ...(sub.metadata ?? {}) };
  const uid = meta.uid;
  const organizationId = meta.organizationId || '';
  const planId = (meta.planId as PlanId) || 'plus';

  if (!uid) {
    console.error('[ventaya] subscription has no uid in metadata:', sub.id);
    return;
  }

  const plan = PLANS[planId];
  const status = sub.status;
  const active = status === 'active' || status === 'trialing';

  const item = sub.items.data[0];
  const seats = item?.quantity ?? 1;
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null;

  const common = {
    subscriptionId: sub.id,
    subscriptionStatus: status,
    currentPeriodEnd: periodEnd,
    stripeCustomerId:
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    updatedAt: new Date().toISOString(),
  };

  if (plan?.audience === 'organization' && organizationId) {
    await admin.db
      .collection('organizations')
      .doc(organizationId)
      .set(
        {
          ...common,
          // A cancelled org falls back to no plan, not to a paid one.
          plan: active ? planId : null,
          seatsPurchased: active ? seats : 0,
        },
        { merge: true }
      );
    return;
  }

  await admin.db
    .collection('users')
    .doc(uid)
    .set(
      {
        ...common,
        plan: active ? planId : 'free',
      },
      { merge: true }
    );
}

/** Flag a lapsed payment so the UI can prompt before access is lost. */
async function markPastDue(customerId: string, admin: Admin) {
  const users = await admin.db
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (!users.empty) {
    await users.docs[0].ref.set(
      { subscriptionStatus: 'past_due' },
      { merge: true }
    );
    return;
  }

  const orgs = await admin.db
    .collection('organizations')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (!orgs.empty) {
    await orgs.docs[0].ref.set(
      { subscriptionStatus: 'past_due' },
      { merge: true }
    );
  }
}
