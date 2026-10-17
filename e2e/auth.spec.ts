import { test, expect, type Page } from '@playwright/test';

/**
 * Email signup and login against live Firebase.
 *
 * This path was completely broken and no test covered it: signup redirects to
 * /onboarding, and /onboarding threw a 500 because it still referenced an image
 * host that had been removed from next.config. Guest sign-in goes straight to
 * /dashboard, so the existing suite sailed past it.
 *
 * Each test registers a throwaway account.
 */

test.beforeEach(({}, testInfo) => {
  testInfo.setTimeout(150_000);
});

const PASSWORD = 'VentayaTest!2026';

function throwawayEmail() {
  return `ventaya.test.${Date.now()}.${Math.floor(Math.random() * 1e6)}@gmail.com`;
}

function collectErrors(page: Page) {
  const errors: string[] = [];
  const keep = (t: string) => {
    if (/Failed to load resource|net::ERR_ABORTED/i.test(t)) return;
    errors.push(t);
  };
  page.on('console', (m) => m.type() === 'error' && keep(m.text()));
  page.on('pageerror', (e) => keep(e.message));
  return errors;
}

async function signUp(page: Page, email: string) {
  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await expect(page.getByPlaceholder('John Doe')).toBeVisible({ timeout: 45_000 });
  await page.waitForTimeout(600); // let hydration attach handlers

  await page.getByPlaceholder('John Doe').fill('Test Person');
  await page.getByPlaceholder('name@example.com').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /^Sign Up$/ }).click();
}

test.describe('onboarding route', () => {
  test('renders instead of throwing a server error', async ({ page }) => {
    // The regression itself: a removed image host made this route 500, which
    // silently broke every signup.
    const response = await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
    expect(response?.status(), '/onboarding must not error').toBeLessThan(400);
    await expect(
      page.getByRole('heading', { name: /welcome to ventaya/i })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('every onboarding image loads', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (r) => {
      if (r.request().resourceType() === 'image' && r.status() >= 400) {
        failed.push(`${r.status()} ${r.url()}`);
      }
    });
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    expect(failed, `broken images:\n${failed.join('\n')}`).toHaveLength(0);
  });

  test('the carousel advances and can be skipped', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /^Next/ })).toBeVisible({
      timeout: 30_000,
    });

    // Dot navigation used to be inert twice over: it once queried a DOM
    // property that does not exist, and then clicks landing before the
    // carousel API attached were dropped. An early click must still apply.
    await page.getByRole('button', { name: /go to step 3/i }).click();
    await expect
      .poll(
        async () =>
          page
            .getByRole('button', { name: /go to step 3/i })
            .getAttribute('aria-current'),
        { timeout: 20_000 }
      )
      .toBe('true');

    await page.getByRole('button', { name: /skip the tour/i }).click();
    await page.waitForURL('**/dashboard**', { timeout: 45_000 });
  });
});

test.describe('email account lifecycle', () => {
  test('signs up, sees onboarding, and reaches the dashboard', async ({ page }) => {
    const errors = collectErrors(page);
    await signUp(page, throwawayEmail());

    await page.waitForURL('**/onboarding', { timeout: 60_000 });
    await expect(
      page.getByRole('heading', { name: /welcome to ventaya/i })
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: /skip the tour/i }).click();
    await page.waitForURL('**/dashboard**', { timeout: 45_000 });
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({
      timeout: 45_000,
    });

    expect(errors.join('\n')).toBe('');
  });

  test('a registered account can log out and log back in', async ({ page }) => {
    const email = throwawayEmail();
    await signUp(page, email);
    await page.waitForURL('**/onboarding', { timeout: 60_000 });
    await page.getByRole('button', { name: /skip the tour/i }).click();
    await page.waitForURL('**/dashboard**', { timeout: 45_000 });

    // Log out.
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    const logout = page.getByRole('button', { name: /^log out$/i }).first();
    await expect(logout).toBeVisible({ timeout: 45_000 });
    await logout.click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^log out$/i })
      .click();
    await page.waitForURL((u) => !u.pathname.startsWith('/profile'), {
      timeout: 45_000,
    });

    // And back in with the same credentials.
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible({
      timeout: 45_000,
    });
    await page.waitForTimeout(600);
    await page.getByPlaceholder('name@example.com').fill(email);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: /log in with email/i }).click();

    await page.waitForURL('**/dashboard**', { timeout: 60_000 });
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({
      timeout: 45_000,
    });
  });

  test('a wrong password is reported, not swallowed', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible({
      timeout: 45_000,
    });
    await page.waitForTimeout(600);

    await page.getByPlaceholder('name@example.com').fill('nobody.ventaya@gmail.com');
    await page.locator('input[type="password"]').fill('definitely-not-the-password');
    await page.getByRole('button', { name: /log in with email/i }).click();

    await expect(page.getByText(/login failed|invalid|incorrect|try again/i).first()).toBeVisible({
      timeout: 45_000,
    });
    await expect(page).toHaveURL(/\/login/);
  });
});
