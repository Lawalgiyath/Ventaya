# Ventaya

**Move forward. Feel steady.**

An AI wellbeing companion that turns how you feel into what you do next ,
guided journalling, mood insight, and a daily plan that adapts to you. Sold to
individuals and to teams.

Originally built as *Realme* by Dr Mrs Jaiyeoba, Lawal Giyath, Jaiyeoba Tomilola
and Adekunle Abdulazeez.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| AI | Google Gemini via Genkit |
| Auth & data | Firebase Auth + Firestore |
| Billing | Stripe (subscriptions + per-seat) |
| UI | Tailwind + shadcn/ui + Framer Motion |

## Getting started

```bash
npm install
cp .env.example .env    # then fill in the values
npm run dev             # http://localhost:9002
```

The app runs without Stripe or Firebase Admin credentials: billing surfaces
render a "not configured" state and AI entitlements go unenforced, which is the
right behaviour for local development.

## Commands

```bash
npm run dev         # dev server on :9002
npm run build       # production build (type errors are NOT suppressed)
npm run typecheck   # tsc --noEmit
npm run test:e2e    # Playwright end-to-end suite
npm run genkit:dev  # Genkit developer UI for the AI flows
```

## Business model

Pricing lives in exactly one place: [`src/lib/plans.ts`](src/lib/plans.ts).
Nothing else hardcodes a price.

**Individuals**
- Free: mood tracking, journalling, goals, 3 AI sessions per week
- Plus: $12/mo or $89/yr, unlimited AI, 7-day card-required trial

**Organizations** (per seat, per month)
- Team: $8, 10–49 seats
- Business: $6, 50–499 seats, adds aggregate insights and CSV export
- Enterprise: custom, 500+ seats

## Design system

Editorial, not SaaS. The 2026 defaults that mark a page as machine-made are an
indigo primary, Inter, a bento grid, glassmorphism and radial gradients; none of
those appear here.

| | |
|---|---|
| Palette | Four colours only: ink, bone, rose `348 83% 61%`, oxblood |
| Display | Bodoni Moda, a didone with high thick/thin contrast |
| Text | Archivo grotesk |
| Backgrounds | Printed textures: letterpress grain, halftone dots, ruled grid, barber stripe. No gradients. |
| Shape | Decided per element: `.arch` for tall portraits, `.arch-wide` for wide images, `.leaf`, `.pill`. Not one global radius. |
| Copy | No em dashes. An end-to-end test fails the build if one appears in visible copy. |

The hero canvas (`src/components/weather-field.tsx`) holds a charge where the
pointer has been and releases it slowly, so the field carries a trace of your
passage. The idea is borrowed from Cerebrium's shield, which "briefly remembers
every interaction" rather than snapping off, and it argues the product's case
directly: what you felt does not vanish the moment you stop feeling it, and it
does settle.

## Architecture notes

**Entitlements are enforced on the server.** Components must call the guarded
actions in [`src/app/actions/ai.ts`](src/app/actions/ai.ts), never import
`src/ai/flows/*` directly: the flows have no idea who is calling them. The gate
lives in [`src/lib/guard.ts`](src/lib/guard.ts) and usage is metered per ISO
week.

**Organization insights are aggregate-only.** Leaders never receive member
names, emails or individual mood histories; the client cannot query them at all.
Aggregation happens in [`src/app/api/org/insights/route.ts`](src/app/api/org/insights/route.ts),
and results are withheld entirely below five active members so no one can be
identified by elimination.

**The Stripe webhook is the only writer of paid entitlements.** It verifies
signatures against the raw request body and records every event id, because
Stripe delivers at-least-once and retries.

## Security

`.env` is gitignored. If you are picking this repo up from its original
history: the Gemini API key that was committed in `7880405` must be treated as
compromised and rotated.
