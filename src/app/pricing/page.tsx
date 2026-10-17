import type { Metadata } from 'next';
import { PricingTables } from '@/components/pricing-tables';
import { SiteHeader, SiteFooter } from '@/components/marketing-shell';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `Simple pricing for individuals and teams. Start free, upgrade when ${SITE.companion} becomes part of your routine.`,
};

const FAQ = [
  {
    q: 'Can my employer see what I write?',
    a: 'No. Journal entries, assessments and conversations are never shown to anyone at your organization. Leaders see aggregate trends only, and only once at least five members are active. Below that we show nothing at all.',
  },
  {
    q: 'What happens when my free sessions run out?',
    a: "Everything except AI features keeps working. Mood tracking, journalling, goals and the resource directory stay free forever. Your AI allowance resets every Monday.",
  },
  {
    q: 'Do I need a card to try Plus?',
    a: 'Yes, and you can cancel any time in the seven-day trial without being charged. We do this because it keeps the free tier genuinely free rather than crippled.',
  },
  {
    q: 'Can we pay by invoice or direct transfer?',
    a: 'Team and Business can be paid by card through self-serve checkout. For direct invoicing, Nigerian bank transfers, purchase orders or grant subsidies, message our desk directly on WhatsApp at 08062679191 or email lawalgiyath200716@gmail.com.',
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="ruled relative overflow-hidden border-b border-foreground/15">
          <div className="mx-auto max-w-6xl px-5 py-20 text-center">
            <h1 className="font-headline text-5xl leading-[1.05] md:text-6xl">
              Pricing that stays out of the way
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              Start free and keep the habit. Upgrade only when {SITE.companion}
              {' '}has earned a place in your day.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <PricingTables />
        </section>

        <section className="border-t bg-muted/20">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <h2 className="font-headline text-3xl">Questions</h2>
            <dl className="mt-8 space-y-8">
              {FAQ.map((item) => (
                <div key={item.q}>
                  <dt className="font-medium">{item.q}</dt>
                  <dd className="mt-2 text-muted-foreground">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
