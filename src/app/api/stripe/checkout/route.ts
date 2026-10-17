import { NextResponse } from 'next/server';
import { getStripe, appUrl } from '@/lib/stripe';
import { getAdmin } from '@/lib/firebase-admin';
import { requireUser, EntitlementError } from '@/lib/guard';
import {
  PLANS,
  stripePriceFor,
  TRIAL_DAYS,
  type BillingInterval,
  type PlanId,
} from '@/lib/plans';

export const runtime = 'nodejs';

interface CheckoutBody {
  idToken?: string;
  planId?: PlanId;
  interval?: BillingInterval;
  /** Seat count for organization plans. */
  seats?: number;
  organizationId?: string;
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const admin = getAdmin();

  if (!stripe || !admin) {
    return NextResponse.json(
      {
        error:
          'Billing is not configured on this deployment yet. Add STRIPE_SECRET_KEY and Firebase Admin credentials.',
      },
      { status: 503 }
    );
  }

  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { idToken, planId, interval = 'month', seats, organizationId } = body;

  if (!planId || !PLANS[planId]) {
    return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });
  }

  const plan = PLANS[planId];
  if (planId === 'free' || planId === 'enterprise') {
    return NextResponse.json(
      { error: 'That plan is not purchasable online.' },
      { status: 400 }
    );
  }

  let uid: string;
  try {
    uid = await requireUser(idToken);
  } catch (e) {
    const msg = e instanceof EntitlementError ? e.message : 'Not signed in.';
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const priceId = stripePriceFor(planId, interval);
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for ${plan.name} (${interval}).` },
      { status: 503 }
    );
  }

  // Validate seat counts server-side: the client can send anything.
  let quantity = 1;
  if (plan.audience === 'organization') {
    quantity = Math.floor(seats ?? plan.minSeats ?? 1);
    if (!Number.isFinite(quantity) || quantity < (plan.minSeats ?? 1)) {
      return NextResponse.json(
        { error: `${plan.name} starts at ${plan.minSeats} seats.` },
        { status: 400 }
      );
    }
    if (plan.maxSeats && quantity > plan.maxSeats) {
      return NextResponse.json(
        {
          error: `${plan.name} covers up to ${plan.maxSeats} seats. Talk to sales for more.`,
        },
        { status: 400 }
      );
    }
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organization.' },
        { status: 400 }
      );
    }
  }

  const userRef = admin.db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data() ?? {};

  // Reuse the Stripe customer so a user never ends up with duplicates.
  let customerId: string | undefined = userData.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userData.email ?? undefined,
      name: userData.name ?? undefined,
      metadata: { uid },
    });
    customerId = customer.id;
    await userRef.set({ stripeCustomerId: customerId }, { merge: true });
  }

  const isOrg = plan.audience === 'organization';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity }],
      // Metadata is how the webhook knows who to credit. Set on both the
      // session and the subscription so either event can resolve it.
      metadata: { uid, planId, organizationId: organizationId ?? '', seats: String(quantity) },
      subscription_data: {
        metadata: { uid, planId, organizationId: organizationId ?? '', seats: String(quantity) },
        ...(isOrg ? {} : { trial_period_days: TRIAL_DAYS }),
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: appUrl(
        isOrg
          ? '/organization/dashboard?checkout=success'
          : '/dashboard?checkout=success'
      ),
      cancel_url: appUrl('/pricing?checkout=cancelled'),
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[ventaya] checkout session failed:', e);
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 500 }
    );
  }
}
