import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BarChart3, Lock, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteHeader, SiteFooter } from '@/components/marketing-shell';
import { PricingTables } from '@/components/pricing-tables';
import { IMAGES } from '@/lib/images';
import { SITE } from '@/lib/site';
import { PLANS, formatUsd, MIN_COHORT_FOR_INSIGHTS } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'For teams',
  description: `Give your whole team an AI wellbeing companion from ${formatUsd(
    PLANS.business.priceMonthly
  )} per person per month, with an anonymity guarantee that holds up.`,
};

const PILLARS = [
  {
    icon: Lock,
    title: 'Anonymous by construction',
    body: `Entries, moods and assessments are never exposed to anyone at the organization. Not to admins, not on export, not on request.`,
  },
  {
    icon: Users,
    title: 'A five-person floor',
    body: `Aggregate insight stays hidden until at least ${MIN_COHORT_FOR_INSIGHTS} members are active. Below that, small numbers make people identifiable by elimination.`,
  },
  {
    icon: BarChart3,
    title: 'Signal, not surveillance',
    body: 'Leaders see direction of travel and themes: rising strain in a period, engagement trends, and concrete things to do about it.',
  },
];

export default function ForTeamsPage() {
  const hero = IMAGES.teamWin(1000);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="ruled relative overflow-hidden border-b border-foreground/15">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
            <div>
              <span className="eyebrow inline-flex items-center gap-2 text-primary">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Wellbeing your team will actually open
              </span>
              <h1 className="mt-6 font-headline text-[clamp(2.5rem,6vw,4rem)] leading-[1.04]">
                The EAP nobody uses,{' '}
                <span className="italic text-primary">replaced</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Traditional assistance programmes sit unused because reaching for
                one means admitting something is wrong. {SITE.name} is something
                people open on an ordinary Tuesday, which is exactly why it is
                there on the bad ones.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 px-6 text-base">
                  <Link href="/organization/signup">
                    Start a team
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                  <a href={`mailto:${SITE.salesEmail}`}>Talk to sales</a>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                From {formatUsd(PLANS.business.priceMonthly)} per person per month
              </p>
            </div>

            <div className="leaf">
              <Image
                src={hero.src}
                alt={hero.alt}
                width={hero.width}
                height={hero.height}
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="border-b border-foreground/15 bg-bone-deep">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <div className="max-w-2xl">
              <h2 className="font-headline text-4xl md:text-5xl">
                Why people trust it with the truth
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                A wellbeing tool only works if staff believe it is safe. So we
                made that structural rather than a promise in a policy document.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {PILLARS.map((p) => (
                <div key={p.title} className="border-t border-foreground/20 pt-6">
                  <p.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 font-headline text-2xl">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24">
          <div className="mb-14 max-w-2xl">
            <h2 className="font-headline text-4xl md:text-5xl">Team pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Per person, per month. Cancel or change seats at any time.
            </p>
          </div>
          <PricingTables defaultAudience="organization" />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
