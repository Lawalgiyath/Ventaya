import { test, expect } from '@playwright/test';
import Stripe from 'stripe';

/**
 * Webhook signature handling.
 *
 * The route reads the body with `req.text()` and hands those exact bytes to
 * `constructEvent`. These tests pin that contract, including the failure mode
 * that catches most people: parsing the JSON first and re-serializing it.
 */

const SECRET = 'whsec_test_secret_for_signature_verification_only';
const stripe = new Stripe('sk_test_dummy', { apiVersion: '2026-08-26.dahlia' });

function sign(payload: string) {
  return stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
}

const EVENT = {
  id: 'evt_1',
  object: 'event',
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_1', subscription: 'sub_1' } },
};

test.describe('stripe signature verification', () => {
  test('the raw body verifies', () => {
    const raw = JSON.stringify(EVENT);
    const event = stripe.webhooks.constructEvent(raw, sign(raw), SECRET);
    expect(event.id).toBe('evt_1');
    expect(event.type).toBe('checkout.session.completed');
  });

  test('re-serializing the body breaks verification', () => {
    // This is the bug: `await req.json()` then `JSON.stringify(...)`. Even
    // when the object is identical, key order and spacing may not be, and the
    // signature is over bytes.
    const raw = '{"id":"evt_1",  "type":"checkout.session.completed"}';
    const header = sign(raw);
    const reSerialized = JSON.stringify(JSON.parse(raw));

    expect(() =>
      stripe.webhooks.constructEvent(reSerialized, header, SECRET)
    ).toThrow(/signature/i);
  });

  test('a tampered payload is rejected', () => {
    const raw = JSON.stringify(EVENT);
    const header = sign(raw);
    const tampered = JSON.stringify({ ...EVENT, id: 'evt_attacker' });

    expect(() =>
      stripe.webhooks.constructEvent(tampered, header, SECRET)
    ).toThrow(/signature/i);
  });

  test('a signature from a different secret is rejected', () => {
    const raw = JSON.stringify(EVENT);
    const header = stripe.webhooks.generateTestHeaderString({
      payload: raw,
      secret: 'whsec_a_completely_different_secret_value',
    });

    expect(() => stripe.webhooks.constructEvent(raw, header, SECRET)).toThrow(
      /signature/i
    );
  });
});

test.describe('live endpoint', () => {
  test('refuses an unsigned request', async ({ request }) => {
    const res = await request.post('/api/stripe/webhook', {
      data: { id: 'evt_x', type: 'checkout.session.completed' },
    });
    // 503 without credentials configured, 400 with them. Never 200, and never
    // a 500 from an unhandled throw.
    expect([400, 503]).toContain(res.status());
  });
});
