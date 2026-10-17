import { test, expect, type Page } from '@playwright/test';

/**
 * Signed-in product surface.
 *
 * These run against the real Firebase project using anonymous ("guest") auth,
 * which is the lightest footprint that still exercises the true auth, Firestore
 * and entitlement paths. Each test creates its own throwaway guest user.
 */

// These sign in against live Firebase and hit routes the dev server compiles on
// demand, so they need more headroom than the 45s default. Without this the
// test itself expired before signInAsGuest could finish its own retries.
test.beforeEach(({}, testInfo) => {
  testInfo.setTimeout(120_000);
});

/** Errors that indicate something actually broke, ignoring known dev noise. */
function collectErrors(page: Page) {
  const errors: string[] = [];
  const keep = (t: string) => {
    // Firestore logs benign connection chatter in dev.
    if (/Failed to load resource|net::ERR_ABORTED/i.test(t)) return;
    errors.push(t);
  };
  page.on('console', (m) => m.type() === 'error' && keep(m.text()));
  page.on('pageerror', (e) => keep(e.message));
  return errors;
}

/**
 * Sign in as a guest and land on the dashboard.
 *
 * The click is retried once: on a cold dev server the button can be painted
 * before React has attached its handler, and the first click is then a no-op.
 */
async function signInAsGuest(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const guest = page.getByRole('button', { name: /continue as guest/i });
  await expect(guest).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(800); // let hydration attach handlers

  // The dev server compiles /dashboard on first request, which can take a
  // while under parallel workers, and a click landing before hydration is a
  // no-op. Retry, but only if we genuinely have not navigated.
  for (let attempt = 0; attempt < 2; attempt++) {
    if (page.url().includes('/dashboard')) break;
    await guest.click().catch(() => {});
    try {
      await page.waitForURL('**/dashboard**', { timeout: 30_000 });
      break;
    } catch {
      if (attempt === 1) throw new Error('guest sign-in never reached /dashboard');
    }
  }

  // Wait for the auth context to settle rather than a fixed delay.
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({
    timeout: 40_000,
  });
}

/**
 * Assert at least one match is actually visible.
 *
 * The usage meter is rendered twice: once in the desktop sidebar and once
 * above the mobile tab strip. Exactly one is visible per viewport, so
 * `.first()` can land on the hidden copy.
 */
async function expectSomeVisible(page: Page, pattern: RegExp, timeout = 20_000) {
  await expect
    .poll(
      async () => {
        const all = page.getByText(pattern);
        const n = await all.count();
        for (let i = 0; i < n; i++) {
          if (await all.nth(i).isVisible().catch(() => false)) return true;
        }
        return false;
      },
      { timeout }
    )
    .toBe(true);
}

/**
 * Open a dashboard section.
 *
 * Desktop renders a sidebar of buttons; mobile renders a horizontally
 * scrolling tab strip instead, so a selector for one does not find the other.
 */
async function openSection(page: Page, name: string) {
  const tab = page.getByRole('tab', { name, exact: true }).first();
  if (await tab.isVisible().catch(() => false)) {
    await tab.scrollIntoViewIfNeeded();
    await tab.click();
    return;
  }
  await page.getByRole('button', { name, exact: true }).first().click();
}

test.describe('guest access', () => {
  test('signs in and reaches the dashboard', async ({ page }) => {
    const errors = collectErrors(page);
    await signInAsGuest(page);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    expect(errors.join('\n')).toBe('');
  });

  test('every sidebar section opens without error', async ({ page }) => {
    const errors = collectErrors(page);
    await signInAsGuest(page);

    const sections = [
      'Dashboard',
      'Daily Planner',
      'Assessment',
      'Journal',
      'Goals & Content',
      'Be Inspired',
      'History',
      'Resources',
    ];

    for (const name of sections) {
      await openSection(page, name);
      await page.waitForTimeout(900);
      // Something must actually render in the panel.
      const body = await page.locator('main').innerText();
      expect(body.trim().length, `${name} rendered empty`).toBeGreaterThan(40);
    }

    expect(errors.join('\n')).toBe('');
  });
});

test.describe('core features', () => {
  test('logging a mood is acknowledged and persists', async ({ page }) => {
    await signInAsGuest(page);

    await page.getByRole('button', { name: /^Calm$/ }).click();
    await expect(page.getByText(/embrace the calm/i)).toBeVisible({
      timeout: 15_000,
    });

    // Firestore keeps an open channel, so networkidle never settles here.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/embrace the calm/i)).toBeVisible({
      timeout: 40_000,
    });
  });

  test('a goal saves, persists and unlocks its achievement', async ({ page }) => {
    await signInAsGuest(page);

    await page.getByPlaceholder(/meditate for 5 minutes/i).fill('Walk for ten minutes');
    await page.getByRole('button', { name: /^\+?\s*Add$/i }).first().click();
    await expect(page.getByText('Walk for ten minutes')).toBeVisible({
      timeout: 15_000,
    });

    // Guests used to lose everything: updateUserData early-returned for
    // anonymous users, so the UI looked functional and saved nothing.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Walk for ten minutes')).toBeVisible({
      timeout: 40_000,
    });
    await expect(page.getByText(/unlocked [1-9]\d* of 10/i)).toBeVisible({
      timeout: 20_000,
    });
  });

  test('crisis resources are reachable from inside the app', async ({ page }) => {
    await signInAsGuest(page);
    await openSection(page, 'Resources');
    await expect(page.getByText(/if you are in immediate danger/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('988 Suicide & Crisis Lifeline')).toBeVisible();
  });

  test('the free plan usage meter is visible on every viewport', async ({ page }) => {
    // It used to live only in the desktop sidebar, so phone users never saw
    // their remaining allowance or the upgrade prompt.
    await signInAsGuest(page);
    await expectSomeVisible(page, /AI sessions/i);
    await expectSomeVisible(page, /of 3 left/i);
  });
});

test.describe('account', () => {
  test('profile shows plan and billing state', async ({ page }) => {
    await signInAsGuest(page);
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/plan & billing/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/^Free$/).first()).toBeVisible();
    await expect(page.getByText(/3 AI sessions \/ week/i)).toBeVisible();
  });

  test('a guest can log out from their profile', async ({ page }) => {
    // Log Out used to render only in the non-guest branch, leaving guests with
    // no way to leave guest mode from this page at all.
    await signInAsGuest(page);
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });

    const logout = page.getByRole('button', { name: /^log out$/i }).first();
    await expect(logout).toBeVisible({ timeout: 30_000 });
    await logout.click();

    // Confirm in the dialog.
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^log out$/i })
      .click();

    await page.waitForURL((u) => !u.pathname.startsWith('/profile'), {
      timeout: 30_000,
    });
  });

  test('guest profile no longer claims data is unsaved', async ({ page }) => {
    // Guest writes do persist now, so the old warning was simply wrong.
    await signInAsGuest(page);
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/keep your progress/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/your data is not being saved/i)).toHaveCount(0);
  });
});

test.describe('AI services', () => {
  test('an AI failure is surfaced and does not burn quota', async ({ page }) => {
    // With no valid GEMINI_API_KEY the model call fails. What matters is that
    // the user is told, and that a failed generation is not billed against the
    // free weekly allowance: recordUsage only runs after a success.
    await signInAsGuest(page);
    await expectSomeVisible(page, /3 of 3 left/i);

    await openSection(page, 'Journal');
    await page.locator('textarea').first().fill(
      'Third Sunday in a row I have felt this. Nothing is wrong exactly.'
    );
    await page.getByRole('button', { name: /submit to aya/i }).click();

    // Either a reflection renders, or a clear error appears. Silence is a bug.
    const settled = await Promise.race([
      page.getByText(/a calmer thought from aya|summary/i).first()
        .waitFor({ timeout: 120_000 }).then(() => 'response' as const),
      page.getByText(/something went wrong/i).first()
        .waitFor({ timeout: 120_000 }).then(() => 'error' as const),
    ]);

    if (settled === 'error') {
      await expect(page.getByText(/aya could not respond/i).first()).toBeVisible();
      // Quota untouched, because nothing was generated.
      await expectSomeVisible(page, /3 of 3 left/i);
    }
  });

  test('the sidebar uses the Ventaya mark, not a container tile', async ({ page }) => {
    await signInAsGuest(page);
    const mark = page.locator('svg[aria-label="Ventaya logo"]').first();
    await expect(mark).toBeAttached({ timeout: 20_000 });
    // The mark is a bare stroke; a filled rect would mean the old tile is back.
    expect(await mark.locator('rect').count()).toBe(0);
  });
});

test.describe('empty states', () => {
  test('a new account is told the mood chart is empty, not shown a blank box', async ({
    page,
  }) => {
    await signInAsGuest(page);
    await expect(page.getByText(/no moods logged yet/i)).toBeVisible({
      timeout: 20_000,
    });

    // Logging a mood replaces the empty state with the chart.
    await page.getByRole('button', { name: /^Calm$/ }).click();
    await expect(page.getByText(/no moods logged yet/i)).toHaveCount(0, {
      timeout: 20_000,
    });
  });
});
