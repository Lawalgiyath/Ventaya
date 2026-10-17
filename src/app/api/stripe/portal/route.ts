import { NextResponse } from 'next/server';
import { getStripe, appUrl } from '@/lib/stripe';
import { getAdmin } from '@/lib/firebase-admin';
import { requireUser, EntitlementError } from '@/lib/guard';

export const runtime = 'nodejs';

/**
 * Stripe Billing Portal: lets customers update cards, change seat counts,
 * download invoices, and cancel without us building any of it.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const admin = getAdmin();

  if (!stripe || !admin) {
    return NextResponse.json(
      { error: 'Billing is not configured on this deployment yet.' },
      { status: 503 }
    );
  }

  let idToken: string | undefined;
  let returnPath = '/dashboard';
  try {
    const body = await req.json();
    idToken = body.idToken;
    if (typeof body.returnPath === 'string' && body.returnPath.startsWith('/')) {
      returnPath = body.returnPath;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  let uid: string;
  try {
    uid = await requireUser(idToken);
  } catch (e) {
    const msg = e instanceof EntitlementError ? e.message : 'Not signed in.';
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const userSnap = await admin.db.collection('users').doc(uid).get();
  const userData = userSnap.data() ?? {};

  // An org leader manages the org's subscription, not their personal one.
  let customerId: string | undefined = userData.stripeCustomerId;
  if (userData.isLeader && userData.organizationId) {
    const orgSnap = await admin.db
      .collection('organizations')
      .doc(userData.organizationId)
      .get();
    customerId = orgSnap.data()?.stripeCustomerId ?? customerId;
  }

  if (!customerId) {
    return NextResponse.json(
      { error: 'No billing account yet. Subscribe first.' },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: appUrl(returnPath),
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[ventaya] billing portal failed:', e);
    return NextResponse.json(
      { error: 'Could not open the billing portal.' },
      { status: 500 }
    );
  }
}
