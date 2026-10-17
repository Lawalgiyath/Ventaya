import { test, expect, type Page } from '@playwright/test';

/**
 * Public marketing surface.
 *
 * These run without Firebase or Stripe credentials, so they cover exactly what
 * a first-time visitor sees: which is also what has to be right before any
 * money can be made.
 */

/** Fails the test if the page logs an error or a request 404s. */
function collectFailures(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

test.describe('landing page', () => {
  test('renders the hero and both conversion paths', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /move forward/i })
    ).toBeVisible();
    await expect(page.getByText(/feel steady/i).first()).toBeVisible();

    // Both revenue lines must be reachable from the hero.
    await expect(page.getByRole('link', { name: /start free/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /for teams/i }).first()).toBeVisible();
  });

  test('is branded Ventaya with no leftover Realme strings', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Ventaya/);
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/realme/i);
  });

  test('every image actually loads', async ({ page }) => {
    // The previous build shipped avatars pointing at a retired Unsplash
    // endpoint, so this guards the exact bug that shipped before.
    const failed: string[] = [];
    page.on('response', (r) => {
      if (r.request().resourceType() === 'image' && r.status() >= 400) {
        failed.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2500);

    expect(failed, `broken images:\n${failed.join('\n')}`).toHaveLength(0);

    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((i) => i.complete && i.naturalWidth === 0)
        .map((i) => i.currentSrc || i.src)
    );
    expect(broken, `images with no pixels:\n${broken.join('\n')}`).toHaveLength(0);
  });

  test('loads without console errors', async ({ page }) => {
    const errors = collectFailures(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(errors.join('\n')).toBe('');
  });

  test('the breathing exercise is playable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const start = page.getByRole('button', { name: /tap to begin/i });
    await start.scrollIntoViewIfNeeded();
    await start.click();
    // Bubbles spawn on a rAF loop; give it a moment to produce one.
    await expect(page.getByRole('button', { name: /pop bubble/i }).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});

test.describe('pricing', () => {
  test('shows both consumer tiers with real prices', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.getByRole('heading', { name: /pricing that stays/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Free', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Plus', exact: true })).toBeVisible();
    // Default interval is yearly.
    await expect(page.getByText('$89').first()).toBeVisible();

    await page.getByRole('button', { name: /^monthly$/i }).click();
    await expect(page.getByText('$12').first()).toBeVisible();
  });

  test('team pricing recalculates with the seat slider', async ({ page }) => {
    await page.goto('/pricing');
    await page.getByRole('button', { name: /for my team/i }).click();

    // Starts at 50 seats → Business at $6/seat = $300/mo.
    await expect(page.getByText('$300/mo')).toBeVisible();

    // Drop to 10 seats → Team at $8/seat = $80/mo.
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /fewer seats/i }).click();
    }
    await expect(page.getByText('$80/mo')).toBeVisible();
    await expect(page.getByText(/recommended plan:/i)).toContainText('Team');
  });

  test('answers the question that blocks B2B deals', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/can my employer see what i write/i)).toBeVisible();
  });
});

test.describe('crisis resources', () => {
  test('surfaces emergency guidance without scrolling past content', async ({ page }) => {
    await page.goto('/resources');
    await expect(page.getByText(/if you are in immediate danger/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /^call \d+$/i })).toBeVisible();
  });

  test('switches directory by country', async ({ page }) => {
    await page.goto('/resources');
    await page.getByLabel(/choose your country/i).click();
    await page.getByRole('option', { name: 'United Kingdom' }).click();
    await expect(page.getByText('Samaritans')).toBeVisible();
    await expect(page.getByText('116 123')).toBeVisible();
  });
});

test.describe('for teams', () => {
  test('leads with the anonymity guarantee', async ({ page }) => {
    await page.goto('/for-teams');
    await expect(page.getByRole('heading', { name: /the eap nobody uses/i })).toBeVisible();
    await expect(page.getByText(/anonymous by construction/i)).toBeVisible();
    await expect(page.getByText(/five-person floor/i)).toBeVisible();
  });
});

test.describe('theme', () => {
  test('dark mode toggles and persists across navigation', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const wasDark = await html.evaluate((el) => el.classList.contains('dark'));

    await page.getByRole('button', { name: /switch to (dark|light) mode/i }).first().click();
    await expect
      .poll(() => html.evaluate((el) => el.classList.contains('dark')))
      .toBe(!wasDark);

    await page.goto('/pricing');
    await expect
      .poll(() => html.evaluate((el) => el.classList.contains('dark')))
      .toBe(!wasDark);
  });
});

test.describe('regressions', () => {
  test('scroll-revealed sections actually become visible', async ({ page }) => {
    // These start at opacity 0 and are revealed by an intersection observer.
    // If that ever stops firing the content is invisible with no other symptom.
    await page.goto('/');
    for (let y = 0; y < 6000; y += 400) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(80);
    }

    await expect(
      page.getByRole('heading', { name: /journalling that answers back/i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /patterns over time/i })
    ).toBeVisible();
    await expect(page.getByText(/i had tried three mood trackers/i)).toBeVisible();
  });

  test('a signed-out visitor gets a call to action on the Free plan', async ({
    page,
  }) => {
    // Signed-out users resolve to the Free plan internally, which once made
    // this button render as a disabled "Your current plan".
    await page.goto('/pricing');
    const freeCard = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Free', exact: true }) })
      .last();
    const cta = freeCard.getByRole('button').last();
    await expect(cta).toBeEnabled();
    await expect(cta).toHaveText(/start free/i);
  });
});

test.describe('editorial design system', () => {
  test('the toolkit index reveals a photograph on hover', async ({ page }) => {
    await page.goto('/');
    const row = page.getByRole('heading', { name: /the worry jar/i });
    await row.scrollIntoViewIfNeeded();

    // The pointer-following plate is transparent until a row is entered.
    const plate = page.locator('[aria-hidden="true"]').filter({ has: page.locator('img') }).last();
    await row.hover();
    await expect.poll(async () => {
      return page.evaluate(() => {
        const el = document.querySelector('.arch img')?.closest('div[aria-hidden]');
        return el ? getComputedStyle(el).opacity : null;
      });
    }).not.toBe('0');
  });

  test('the portrait marquee is present and populated', async ({ page }) => {
    await page.goto('/');
    // Scroll the page rather than the element: the strip is in constant motion,
    // so scrollIntoViewIfNeeded never settles on it.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
    await page.waitForTimeout(800);

    const marquee = page.locator('.marquee-paused .animate-marquee').first();
    await expect(marquee).toBeAttached();
    // Rendered twice for a seamless loop, so expect a healthy number of frames.
    expect(await marquee.locator('img').count()).toBeGreaterThanOrEqual(12);
  });

  test('uses the rose palette, not the indigo default', async ({ page }) => {
    await page.goto('/');
    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    );
    expect(primary).toBe('348 83% 61%');
  });

  test('the logo mark has no background tile', async ({ page }) => {
    await page.goto('/');
    // The mark is a bare stroke; it must not sit on a filled rect.
    const rects = await page.locator('header svg rect').count();
    expect(rects).toBe(0);
  });
});

test.describe('copy style', () => {
  const PAGES = ['/', '/pricing', '/for-teams', '/resources'];
  // Written as an escape so this file never itself contains the character.
  const EM_DASH = '\u2014';

  for (const path of PAGES) {
    test(`no em dashes in visible copy on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      const text = await page.locator('body').innerText();
      const offenders = text.split('\n').filter((l) => l.includes(EM_DASH));
      expect(offenders, `em dashes found:\n${offenders.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('inner weather field', () => {
  test('renders a canvas behind the hero', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeAttached();
    const box = await canvas.boundingBox();
    expect(box!.width).toBeGreaterThan(200);
  });

  test('never intercepts clicks on the hero controls', async ({ page }) => {
    // The field is decorative; if it caught pointer events it would swallow
    // the primary call to action.
    await page.goto('/');
    await page.getByRole('link', { name: /^start free/i }).first().click();
    await expect(page).toHaveURL(/\/signup/, { timeout: 45_000 });
  });
});

test.describe('specimen', () => {
  test('shows a real exchange rather than describing one', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { name: /what it actually/i });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
    await expect(page.getByText(/third sunday in a row/i)).toBeVisible();
    await expect(page.getByText(/what i hear/i)).toBeVisible();
    await expect(page.getByText(/one thing to try/i)).toBeVisible();
  });
});

test.describe('steady field', () => {
  // Chromium throttles requestAnimationFrame on unfocused pages, so a canvas
  // under test paints nothing while other workers hold focus. Every test here
  // brings its page to the front before measuring.
  /** Fingerprint of what the lattice has painted, used to detect motion. */
  async function signature(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const c = document.querySelector(
        '[data-testid="steady-field"]'
      ) as HTMLCanvasElement;
      const d = c.getContext('2d')!.getImageData(0, 0, 700, 500).data;
      let painted = 0;
      let weighted = 0;
      for (let i = 3; i < d.length; i += 4) {
        if (d[i] > 8) {
          painted++;
          weighted += (i / 4) * d[i];
        }
      }
      return { painted, centroid: weighted / Math.max(painted, 1) };
    });
  }

  test('paints a lattice across the hero', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.bringToFront();
    // The lattice is painted on rAF, so poll rather than guess at a delay.
    await expect
      .poll(async () => (await signature(page)).painted, { timeout: 20_000 })
      .toBeGreaterThan(2000);
  });

  test('deforms when dragged and settles back afterwards', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.bringToFront();
    await expect
      .poll(async () => (await signature(page)).painted, { timeout: 20_000 })
      .toBeGreaterThan(2000);
    const rest = await signature(page);

    await page.mouse.move(420, 300);
    await page.mouse.down();
    for (let i = 0; i <= 20; i++) {
      await page.mouse.move(420 + i * 12, 300 + i * 9);
      await page.waitForTimeout(16);
    }
    const held = await signature(page);
    await page.mouse.up();

    // Dragging must visibly move the fabric.
    const pulled = Math.abs(held.centroid - rest.centroid);
    expect(pulled, 'drag should displace the lattice').toBeGreaterThan(50);

    // And releasing must let it return: this is the whole argument of the page.
    await page.waitForTimeout(8000);
    const settled = await signature(page);
    const residual = Math.abs(settled.centroid - rest.centroid);
    expect(residual, 'field should return toward rest').toBeLessThan(pulled / 2);
  });

  test('is inert for visitors who ask for reduced motion', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.bringToFront();
    await expect
      .poll(async () => (await signature(page)).painted, { timeout: 20_000 })
      .toBeGreaterThan(2000);

    const before = await signature(page);
    await page.mouse.move(420, 300);
    await page.mouse.down();
    await page.mouse.move(700, 480);
    await page.mouse.up();
    await page.waitForTimeout(600);
    const after = await signature(page);

    expect(Math.abs(after.centroid - before.centroid)).toBeLessThan(2);
    await ctx.close();
  });
});

test.describe('hydration', () => {
  /** Console/page errors that indicate a React hydration mismatch. */
  function hydrationErrors(page: import('@playwright/test').Page) {
    const found: string[] = [];
    const keep = (t: string) => {
      if (/hydrat|didn't match|did not match/i.test(t)) found.push(t);
    };
    page.on('console', (m) => {
      if (m.type() === 'error') keep(m.text());
    });
    page.on('pageerror', (e) => keep(e.message));
    return found;
  }

  test('hydrates cleanly', async ({ page }) => {
    const errors = hydrationErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    expect(errors.join('\n')).toBe('');
  });

  test('survives an extension writing attributes onto body', async ({ page }) => {
    // Grammarly stamps data-gr-ext-installed and data-new-gr-c-s-check-loaded
    // onto <body> before React hydrates. Without suppressHydrationWarning there
    // this produces a mismatch React reports as unpatchable.
    await page.addInitScript(() => {
      const stamp = () => {
        if (document.body) {
          document.body.setAttribute('data-gr-ext-installed', '');
          document.body.setAttribute('data-new-gr-c-s-check-loaded', '14.1328.0');
          return true;
        }
        return false;
      };
      if (!stamp()) {
        // At document-start neither body nor documentElement exists yet, so a
        // MutationObserver cannot be attached. Poll until body appears, which
        // is long before React hydrates.
        const iv = setInterval(() => {
          if (stamp()) clearInterval(iv);
        }, 1);
      }
    });

    const errors = hydrationErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // The attributes really were present before hydration.
    await expect(page.locator('body')).toHaveAttribute('data-gr-ext-installed', '');
    expect(errors.join('\n')).toBe('');
  });
});
