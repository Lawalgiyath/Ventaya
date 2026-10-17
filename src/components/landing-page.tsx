'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  MessageCircle,
  Mail,
  Phone,
  Building2,
  HeartHandshake,
  Coins,
  Users,
  FileText,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteHeader, SiteFooter } from '@/components/marketing-shell';
import { BreatheGame } from '@/components/breathe-game';
import { FaceMarquee, TextMarquee } from '@/components/face-marquee';
import { RevealIndex, type IndexEntry } from '@/components/reveal-index';
import { Seal } from '@/components/brand';
import { Cursor } from '@/components/cursor';
import { SteadyField } from '@/components/steady-field';
import { IMAGES, QUOTE_FACES } from '@/lib/images';
import { cn } from '@/lib/utils';
import { SITE } from '@/lib/site';
import { PLANS, formatUsd, FREE_WEEKLY_AI_ACTIONS } from '@/lib/plans';

export default function LandingPage() {
  return (
    <div className="paper flex min-h-screen flex-col overflow-x-clip">
      <Cursor />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Ticker />
        <Thesis />
        <Index />
        <Specimen />
        <Pause />
        <Teams />
        <SafeReportSection />
        <OrganizationsSection />
        <GrantsFundingSection />
        <Voices />
        <Closing />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────────
   Type-led, not image-led. The headline is the composition; the photograph
   is cropped into an arch and set off-grid beneath it.                     */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);

  const hero = IMAGES.hero(1200);
  const still = IMAGES.stillness(700);

  return (
    <section ref={ref} className="relative border-b border-foreground/15">
      {/* The lattice needs real pointer events, so the content above it is
          pointer-transparent except for the parts you actually click. */}
      <SteadyField className="absolute inset-0" />

      <div className="pointer-events-none relative mx-auto max-w-[1400px] px-5 pb-0 pt-10 lg:px-10">
        {/* Masthead line, like a magazine cover */}
        <div className="rule pointer-events-auto flex flex-wrap items-center justify-between gap-3 border-t-0 pb-6">
          <span className="eyebrow text-primary">Issue 01 / Interiority</span>
          <span className="eyebrow hidden text-muted-foreground sm:inline">
            An AI companion for the inner weather
          </span>
        </div>

        <h1 className="font-headline text-[clamp(3.2rem,13.5vw,12rem)] leading-[0.84] tracking-[-0.03em]">
          <span className="block">Move</span>
          <span className="block pl-[8vw] italic text-primary">forward.</span>
          <span className="block text-right">Feel steady.</span>
        </h1>

        <div className="mt-10 grid gap-10 border-t border-foreground/15 pt-8 lg:grid-cols-12">
          <p className="dropcap pointer-events-auto col-span-full max-w-xl text-pretty text-[1.05rem] leading-[1.7] lg:col-span-5">
            Most wellness apps ask how you feel, draw you a chart, and stop.{' '}
            {SITE.name} is built for the sentence that comes after. What to do
            with a Monday that already feels heavy, what to make of the worry
            you keep circling back to at two in the morning.
          </p>

          <div className="col-span-full flex flex-col justify-between gap-8 lg:col-span-3">
            <div className="pointer-events-auto flex flex-wrap gap-3">
              <Button asChild size="lg" className="pill h-12 px-7 text-[0.95rem]">
                <Link href="/signup">
                  Start free
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="pill h-12 border-foreground/25 px-7 text-[0.95rem]"
              >
                <Link href="/for-teams">For teams</Link>
              </Button>
            </div>
            <p className="eyebrow text-muted-foreground">
              Free forever · {FREE_WEEKLY_AI_ACTIONS} AI sessions weekly · No card
            </p>
          </div>

          {/* Off-grid portrait, arch-cropped */}
          <motion.figure
            style={{ y }}
            className="pointer-events-auto col-span-full self-end lg:col-span-4"
          >
            <div className="leaf relative">
              <Image
                src={still.src}
                alt={still.alt}
                width={still.width}
                height={still.height}
                priority
                sizes="(max-width: 1024px) 100vw, 30vw"
                className="h-[340px] w-full object-cover lg:h-[380px]"
              />
            </div>
          </motion.figure>
        </div>

        {/* Full-bleed hero photograph, arched at the top */}
        <figure className="pointer-events-auto relative mt-12 lg:mt-16">
          <div className="arch-wide relative">
            <Image
              src={hero.src}
              alt={hero.alt}
              width={hero.width}
              height={hero.height}
              priority
              sizes="100vw"
              className="h-[46vh] w-full object-cover object-[center_35%] lg:h-[64vh]"
            />
          </div>

          {/* Rotating seal, overlapping the image edge */}
          <div className="absolute -top-12 right-4 hidden h-32 w-32 items-center justify-center rounded-full bg-primary text-primary-foreground lg:flex">
            <Seal className="h-full w-full" />
            <ArrowRight className="absolute h-5 w-5 -rotate-45" />
          </div>
        </figure>
      </div>
    </section>
  );
}

/* ── Ticker ─────────────────────────────────────────────────────────────── */

function Ticker() {
  return (
    <div className="border-b border-foreground/15 bg-oxblood text-oxblood-foreground">
      <TextMarquee text="What now, not just what happened" />
    </div>
  );
}

/* ── Thesis ─────────────────────────────────────────────────────────────── */

function Thesis() {
  const img = IMAGES.perspective(800);

  return (
    <section className="relative border-b border-foreground/15">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
        <div className="lg:col-span-2">
          <span className="eyebrow text-primary">01</span>
        </div>

        <blockquote className="lg:col-span-7">
          <p className="font-headline text-[clamp(1.9rem,4.2vw,3.4rem)] leading-[1.12]">
            Tracking your mood tells you{' '}
            <span className="text-muted-foreground">what</span> happened.
            <br />
            The harder, more useful question is{' '}
            <span className="italic text-primary">what now</span>.
          </p>
          <footer className="mt-8 max-w-md text-pretty leading-relaxed text-muted-foreground">
            Every entry, mood and goal is read together, so the patterns you are
            living inside become something you can actually see, and act on
            before the week turns.
          </footer>
        </blockquote>

        <figure className="lg:col-span-3">
          <div className="arch-down">
            <Image
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              sizes="(max-width: 1024px) 100vw, 24vw"
              className="h-[300px] w-full object-cover lg:h-[360px]"
            />
          </div>
          <figcaption className="eyebrow mt-3 text-muted-foreground">
            Fig. 01 / Perspective
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ── Index of features ──────────────────────────────────────────────────── */

const ENTRIES: IndexEntry[] = [
  {
    n: '01',
    title: 'Journalling that answers back',
    body: `Write a line or a page. ${SITE.companion} reflects what it actually hears: the tension underneath, the thing you keep circling. Then it offers a way through rather than a summary of it.`,
    image: IMAGES.meditation(600),
  },
  {
    n: '02',
    title: 'The Worry Jar',
    body: 'Put a worry down and get it back reframed. Built for the two-in-the-morning spirals that do not warrant a whole journal entry.',
    image: IMAGES.release(600),
  },
  {
    n: '03',
    title: 'A day, planned around you',
    body: 'Tell it what you are carrying and what has to get done. It returns a structure for the hours, meals included, that respects the state you are actually in.',
    image: IMAGES.stillness(600),
  },
  {
    n: '04',
    title: 'Patterns over time',
    body: 'Mood, goals and entries charted together, so a drift becomes obvious while it is still a drift and not yet a problem.',
    image: IMAGES.perspective(600),
  },
];

function Index() {
  return (
    <section id="features" className="border-b border-foreground/15">
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow text-primary">02 / The toolkit</span>
            <h2 className="mt-4 font-headline text-[clamp(2.4rem,6vw,5rem)] leading-[0.95]">
              Everything in
              <br />
              <span className="italic">one place</span>
            </h2>
          </div>
          <p className="eyebrow max-w-xs text-muted-foreground">
            Hover to look closer
          </p>
        </div>

        <RevealIndex entries={ENTRIES} />
      </div>
    </section>
  );
}

/* Specimen ------------------------------------------------------------------
   Cerebrium proves itself by putting a real terminal on the page instead of
   describing the platform. The equivalent here is showing exactly what Aya
   gives back, because "AI wellness companion" means nothing until you have
   read one.                                                                 */

function Specimen() {
  return (
    <section className="border-b border-foreground/15 bg-bone-deep">
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow text-primary">03 / Specimen</span>
            <h2 className="mt-4 font-headline text-[clamp(2.2rem,5vw,4rem)] leading-[0.98]">
              What it actually
              <br />
              <span className="italic">gives back</span>
            </h2>
          </div>
          <p className="eyebrow max-w-xs text-muted-foreground">
            One exchange, start to finish
          </p>
        </div>

        <div className="grid gap-px overflow-hidden border border-foreground/20 bg-foreground/20 lg:grid-cols-2">
          <div className="bg-background p-8 lg:p-12">
            <div className="flex items-center justify-between border-b border-foreground/15 pb-4">
              <span className="eyebrow text-muted-foreground">You wrote</span>
              <span className="eyebrow text-muted-foreground">11:48 pm</span>
            </div>
            <p className="mt-8 font-headline text-[clamp(1.3rem,2.2vw,1.75rem)] italic leading-[1.45]">
              &ldquo;Third Sunday in a row I have felt this. Nothing is actually
              wrong. I just get to the evening and there is this weight about
              tomorrow and I cannot talk myself out of it.&rdquo;
            </p>
          </div>

          <div className="bg-background p-8 lg:p-12">
            <div className="flex items-center justify-between border-b border-foreground/15 pb-4">
              <span className="eyebrow text-primary">
                {SITE.companion} returned
              </span>
              <span className="eyebrow text-muted-foreground">1.2s</span>
            </div>

            <dl className="mt-8 space-y-7">
              <div>
                <dt className="eyebrow text-muted-foreground">What I hear</dt>
                <dd className="mt-2 text-pretty leading-[1.65]">
                  This is anticipatory, not reactive. You are not upset about
                  Sunday. You are bracing for Monday, and the bracing has become
                  its own weekly event.
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-muted-foreground">The pattern</dt>
                <dd className="mt-2 text-pretty leading-[1.65]">
                  Your last four Sunday entries all mention tomorrow. None of
                  your Monday entries mention Sunday. The dread is doing more
                  damage than the day it is about.
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-primary">One thing to try</dt>
                <dd className="mt-2 text-pretty leading-[1.65]">
                  Move the first hard thing on Monday to Tuesday, and put one
                  small certain thing in its place. We are testing whether the
                  weight is about the workload or about not knowing where to
                  start.
                </dd>
              </div>
            </dl>

            <div className="mt-10 flex flex-wrap gap-2 border-t border-foreground/15 pt-6">
              {['Save to journal', 'Plan my Monday', 'Not quite right'].map(
                (label, i) => (
                  <span
                    key={label}
                    className={cn(
                      'pill border px-4 py-1.5 text-sm',
                      i === 0
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-foreground/25 text-muted-foreground'
                    )}
                  >
                    {label}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        <p className="eyebrow mt-6 text-muted-foreground">
          Illustrative of the format. Your own entries stay private and are never
          used to train anything.
        </p>
      </div>
    </section>
  );
}

/* ── Pause ──────────────────────────────────────────────────────────────── */

function Pause() {
  return (
    <section className="halftone relative border-b border-foreground/15">
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
        <div className="lg:col-span-5">
          <span className="eyebrow text-primary">04 / Try it now</span>
          <h2 className="mt-4 font-headline text-[clamp(2.2rem,5vw,4rem)] leading-[0.98]">
            Sixty seconds,
            <br />
            <span className="italic">no account</span>
          </h2>
          <p className="mt-6 max-w-sm text-pretty leading-relaxed text-muted-foreground">
            The same thing the app offers on a hard afternoon. Nothing is
            recorded, nothing is asked of you, and you can stop whenever.
          </p>

          <dl className="mt-10 space-y-0">
            {[
              ['Recorded', 'Nothing at all'],
              ['Works on', 'Any device'],
              ['Costs', 'Nothing, ever'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between border-t border-foreground/15 py-3"
              >
                <dt className="eyebrow text-muted-foreground">{k}</dt>
                <dd className="font-headline text-lg">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-7">
          <BreatheGame className="leaf-sm border-foreground/20" />
        </div>
      </div>
    </section>
  );
}

/* ── Teams ──────────────────────────────────────────────────────────────── */

function Teams() {
  const img = IMAGES.team(1100);
  const team = PLANS.team;

  return (
    <section className="border-b border-foreground/15 bg-oxblood text-oxblood-foreground">
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="eyebrow text-primary">05 / For organizations</span>
            <h2 className="mt-4 font-headline text-[clamp(2.3rem,5.5vw,4.4rem)] leading-[0.96]">
              Support your team
              <br />
              <span className="italic text-primary">without watching them</span>
            </h2>

            <p className="mt-7 max-w-md text-pretty leading-relaxed text-oxblood-foreground/75">
              Give everyone the full product for{' '}
              <span className="text-oxblood-foreground">
                {formatUsd(team.priceMonthly)} per person a month
              </span>
              . Leaders see the shape of how the team is doing, never a name
              attached to an entry.
            </p>

            <div className="mt-10 border-t border-oxblood-foreground/25 pt-6">
              <p className="eyebrow text-primary">The anonymity guarantee</p>
              <p className="mt-3 max-w-md text-pretty leading-relaxed text-oxblood-foreground/75">
                Individual entries are never visible to anyone at your
                organization. Aggregate insight is withheld entirely until at
                least five members are active, so no one can be identified by
                elimination.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="pill h-12 bg-primary px-7 text-primary-foreground hover:bg-primary/90"
              >
                <Link href="/organization/signup">Start a team</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="pill h-12 border-oxblood-foreground/35 bg-transparent px-7 text-oxblood-foreground hover:bg-oxblood-foreground/10 hover:text-oxblood-foreground"
              >
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>

          <figure className="lg:col-span-7">
            <div className="leaf">
              <Image
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="h-[320px] w-full object-cover lg:h-[520px]"
              />
            </div>
            <figcaption className="eyebrow mt-3 text-oxblood-foreground/55">
              Fig. 02 / Ordinary Tuesday
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ── Voices ─────────────────────────────────────────────────────────────── */

const QUOTES = [
  {
    quote:
      'I had tried three mood trackers and quit all of them. This is the first one that told me something about myself I did not already know.',
    name: 'Amara O.',
    role: 'Product designer',
    face: QUOTE_FACES.amara,
  },
  {
    quote:
      'We rolled it out to sixty people. The aggregate view caught a workload problem in one team a full quarter before it would have shown up in attrition.',
    name: 'Daniel R.',
    role: 'Head of People',
    face: QUOTE_FACES.daniel,
  },
  {
    quote:
      'The Worry Jar sounds silly right up until two in the morning, and then it is the most useful thing on my phone.',
    name: 'Maya L.',
    role: 'Nurse practitioner',
    face: QUOTE_FACES.maya,
  },
];

function Voices() {
  return (
    <section className="border-b border-foreground/15">
      <div className="mx-auto max-w-[1400px] px-5 pt-20 lg:px-10 lg:pt-28">
        <span className="eyebrow text-primary">09 / Voices</span>
        <h2 className="mt-4 max-w-3xl font-headline text-[clamp(2.2rem,5vw,4rem)] leading-[0.98]">
          What people say <span className="italic">once it sticks</span>
        </h2>

        <div className="mt-14 grid gap-x-10 gap-y-14 md:grid-cols-3">
          {QUOTES.map((q, i) => (
            <motion.figure
              key={q.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="border-t border-foreground/20 pt-6"
            >
              <span className="font-headline text-5xl leading-none text-primary">
                &ldquo;
              </span>
              <blockquote className="mt-2 text-pretty text-[1.05rem] leading-[1.65]">
                {q.quote}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Image
                  src={q.face.src}
                  alt={q.face.alt}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <span>
                  <span className="block font-headline text-lg leading-tight">
                    {q.name}
                  </span>
                  <span className="eyebrow text-muted-foreground">{q.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <FaceMarquee />
        <p className="eyebrow mx-auto max-w-[1400px] px-5 pb-14 pt-5 text-center text-muted-foreground lg:px-10">
          Illustrative examples from early testing. Names and photographs are
          representative, not real customers
        </p>
      </div>
    </section>
  );
}

/* ── Closing ────────────────────────────────────────────────────────────── */

function Closing() {
  return (
    <section className="relative overflow-hidden">
      <div className="stripe absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1400px] px-5 py-24 lg:px-10 lg:py-32">
        <h2 className="max-w-4xl font-headline text-[clamp(2.4rem,7vw,6rem)] leading-[0.92]">
          The next steady week begins with{' '}
          <span className="italic text-primary">one honest sentence.</span>
        </h2>

        <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-5 border-t border-foreground/20 pt-8">
          <Link
            href="/signup"
            className="group font-headline text-[clamp(1.6rem,3.4vw,2.6rem)]"
            data-cursor="grow"
          >
            <span className="link-wipe">Start free</span>
            <ArrowUpRight className="ml-1 inline h-7 w-7 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
          <Link
            href="/pricing"
            className="group font-headline text-[clamp(1.6rem,3.4vw,2.6rem)] text-muted-foreground"
            data-cursor="grow"
          >
            <span className="link-wipe">See pricing</span>
            <ArrowUpRight className="ml-1 inline h-7 w-7 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── SafeReport Section ───────────────────────────────────────────────────
   Integrated thoughtfully after Teams. Editorial tone with high dignity.  */

function SafeReportSection() {
  return (
    <section id="safereport" className="relative border-b border-foreground/15 bg-bone-deep">
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow text-primary">06 / Civic initiative</span>
            <h2 className="mt-4 font-headline text-[clamp(2.4rem,5.5vw,4.5rem)] leading-[0.96]">
              SafeReport.
              <br />
              <span className="italic text-primary">Confidential support</span> when you need it.
            </h2>
          </div>
          <p className="eyebrow max-w-sm text-muted-foreground">
            Zero account required. Zero judgment. 100% anonymous option.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="dropcap max-w-2xl text-pretty text-[1.05rem] leading-[1.7]">
              Experienced or witnessed sexual or gender-based violence? SafeReport provides
              a trauma-informed, secure space to document what happened and receive immediate
              connection to verified support organizations in Nigeria. Built with strict privacy
              guarantees, our system ensures you remain in complete control of your story.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="border border-foreground/15 bg-background p-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-headline text-lg">100% Anonymous</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  No name, phone number, or account required. You receive a private Case ID to check updates safely.
                </p>
              </div>

              <div className="border border-foreground/15 bg-background p-6">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-oxblood" />
                  <h3 className="font-headline text-lg">Urgent Triage</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Immediate guidance on the 72-hour forensic and medical window (PEP, emergency contraception, evidence preservation).
                </p>
              </div>

              <div className="border border-foreground/15 bg-background p-6">
                <div className="flex items-center gap-3">
                  <HeartHandshake className="h-5 w-5 text-primary" />
                  <h3 className="font-headline text-lg">Verified SARCs</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Direct referral matching to accredited referral centres across Nigeria, including Mirabel Centre, NAPTIP, and FIDA.
                </p>
              </div>

              <div className="border border-foreground/15 bg-background p-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-oxblood" />
                  <h3 className="font-headline text-lg">Safety Planning</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Interactive trauma-informed checklists, timestamped evidence notes, and direct encrypted support messaging.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="pill h-12 bg-primary px-7 text-primary-foreground hover:bg-primary/90">
                <Link href="/report">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Make a confidential report
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="pill h-12 border-foreground/25 px-7">
                <Link href="/report?tab=resources">
                  <Phone className="mr-2 h-4 w-4" />
                  View helplines & resources
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between border border-foreground/20 bg-background p-8 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between border-b border-foreground/15 pb-4">
                <span className="eyebrow text-oxblood font-semibold">Emergency Contacts (Nigeria)</span>
                <span className="eyebrow text-muted-foreground">Toll-free / 24/7</span>
              </div>

              <div className="mt-6 space-y-6">
                <div className="border-b border-foreground/10 pb-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">National Emergency Line</p>
                  <a href="tel:112" className="mt-1 block font-headline text-2xl text-primary hover:underline">
                    112
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">Police, ambulance, fire services nationwide.</p>
                </div>

                <div className="border-b border-foreground/10 pb-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">NAPTIP Toll-Free Helpline</p>
                  <a href="tel:08002002020" className="mt-1 block font-headline text-2xl text-primary hover:underline">
                    0800 200 2020
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">National Agency for the Prohibition of Trafficking in Persons.</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Mirabel Centre (LASUTH, Ikeja)</p>
                  <a href="tel:08000733273" className="mt-1 block font-headline text-2xl text-primary hover:underline">
                    0800 073 3273
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">Free medical treatment, forensic exams, and trauma counseling.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-foreground/15 pt-5">
              <p className="eyebrow text-muted-foreground">
                In immediate physical danger? Always call 112 first.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Organizations Section ────────────────────────────────────────────────
   Direct outreach for women's organizations, NGOs, shelters & care networks. */

function OrganizationsSection() {
  return (
    <section id="organizations" className="border-b border-foreground/15">
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="eyebrow text-primary">07 / Direct partnerships</span>
            <h2 className="mt-4 font-headline text-[clamp(2.3rem,5.5vw,4.4rem)] leading-[0.96]">
              Partner with us:
              <br />
              <span className="italic text-primary">Women's organizations</span> & NGOs
            </h2>

            <p className="mt-7 max-w-md text-pretty text-[1.05rem] leading-relaxed text-muted-foreground">
              Are you a women's rights NGO, crisis shelter, healthcare group, or community
              collective? Ventaya partners directly with organizations to deploy confidential
              reporting and trauma-informed wellbeing tools to the people you protect.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <Check className="mt-1 h-4 w-4 shrink-0 text-oxblood" />
                <p className="text-sm">
                  <strong className="text-foreground">Custom case routing:</strong> Route incoming crisis disclosures directly to your designated caseworkers.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="mt-1 h-4 w-4 shrink-0 text-oxblood" />
                <p className="text-sm">
                  <strong className="text-foreground">Subsidized access:</strong> Free and discounted tiers for community members, survivors, and grassroots field teams.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="mt-1 h-4 w-4 shrink-0 text-oxblood" />
                <p className="text-sm">
                  <strong className="text-foreground">Zero-surveillance architecture:</strong> Airtight privacy ensuring participant records are never compromised or monetized.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="pill h-12 bg-primary px-7 text-primary-foreground hover:bg-primary/90">
                <a
                  href={`https://wa.me/2348062679191?text=${encodeURIComponent("Hello Ventaya, we are an organization interested in partnering with you.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp us: 08062679191
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="pill h-12 border-foreground/25 px-7">
                <a href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Ventaya Organization Partnership Inquiry")}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email our team
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
            <div className="border border-foreground/15 bg-card p-8">
              <Building2 className="h-6 w-6 text-oxblood" />
              <h3 className="mt-5 font-headline text-2xl">Women's Rights NGOs</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Connect your helpline and legal advocacy team directly with survivors reporting through SafeReport. We facilitate verified handoffs with full survivor consent.
              </p>
              <div className="mt-6 border-t border-foreground/10 pt-4 text-xs text-muted-foreground">
                FIDA Nigeria, Mirabel Centre & local shelter integration
              </div>
            </div>

            <div className="border border-foreground/15 bg-card p-8">
              <Users className="h-6 w-6 text-primary" />
              <h3 className="mt-5 font-headline text-2xl">Community Shelters</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Offer residents daily emotional regulation, guided reflection, and crisis de-escalation tools built specifically to support trauma recovery.
              </p>
              <div className="mt-6 border-t border-foreground/10 pt-4 text-xs text-muted-foreground">
                Trauma-informed journaling and anxiety reframing
              </div>
            </div>

            <div className="border border-foreground/15 bg-card p-8 sm:col-span-2">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-headline text-2xl">Direct Collaboration Desk</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-lg leading-relaxed">
                    Need a bespoke implementation, pilot project, or staff training session? Reach out directly via WhatsApp or email for a prompt response.
                  </p>
                </div>
                <div className="shrink-0">
                  <a
                    href="https://wa.me/2348062679191"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-mono font-bold text-primary hover:underline text-base"
                  >
                    <MessageCircle className="h-5 w-5" />
                    +234 806 267 9191
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Grants & Funding Section ─────────────────────────────────────────────
   Seeking grants, donor funding & philanthropic impact investment.        */

function GrantsFundingSection() {
  return (
    <section id="grants" className="border-b border-foreground/15 bg-oxblood text-oxblood-foreground">
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="eyebrow text-primary">08 / Grant funding & impact</span>
            <h2 className="mt-4 font-headline text-[clamp(2.3rem,5.5vw,4.4rem)] leading-[0.96]">
              Seeking grants
              <br />
              <span className="italic text-primary">& philanthropic funding</span>
            </h2>

            <p className="mt-7 max-w-md text-pretty text-[1.05rem] leading-relaxed text-oxblood-foreground/80">
              We are actively applying for grants, donor backing, and philanthropic capital
              to ensure SafeReport and everyday mental health support remain free for women,
              youth, and vulnerable communities across Nigeria and sub-Saharan Africa.
            </p>

            <div className="mt-8 border-t border-oxblood-foreground/20 pt-6">
              <p className="eyebrow text-primary">Why grant funding matters</p>
              <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-oxblood-foreground/75">
                Mental healthcare and crisis response must never be gated behind an ability to pay.
                Your funding directly underwrites free AI wellness sessions, secure server infrastructure,
                and national referral partnerships with grassroots SARCs.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="pill h-12 bg-primary px-7 text-primary-foreground hover:bg-primary/90">
                <a
                  href={`https://wa.me/2348062679191?text=${encodeURIComponent("Hello Ventaya, we would like to discuss grant funding and philanthropic support.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp us: 08062679191
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="pill h-12 border-oxblood-foreground/35 bg-transparent px-7 text-oxblood-foreground hover:bg-oxblood-foreground/10 hover:text-oxblood-foreground"
              >
                <a href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Ventaya Grant Funding and Impact Discussion")}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email: {SITE.contactEmail}
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
            <div className="border border-oxblood-foreground/20 bg-background/5 p-8 backdrop-blur-sm">
              <Coins className="h-6 w-6 text-primary" />
              <h3 className="mt-5 font-headline text-2xl text-oxblood-foreground">Free Civic Protection</h3>
              <p className="mt-3 text-sm text-oxblood-foreground/75 leading-relaxed">
                Keeping SafeReport 100% free forever for survivors, including anonymous case tracking, emergency resource indexing, and safety checklists.
              </p>
              <div className="mt-6 border-t border-oxblood-foreground/15 pt-4 text-xs text-primary">
                Civic Health Impact
              </div>
            </div>

            <div className="border border-oxblood-foreground/20 bg-background/5 p-8 backdrop-blur-sm">
              <HeartHandshake className="h-6 w-6 text-primary" />
              <h3 className="mt-5 font-headline text-2xl text-oxblood-foreground">SARC Network Scale</h3>
              <p className="mt-3 text-sm text-oxblood-foreground/75 leading-relaxed">
                Expanding referral coverage to all 36 Nigerian states and training grassroots caseworkers on our secure digital intake workflows.
              </p>
              <div className="mt-6 border-t border-oxblood-foreground/15 pt-4 text-xs text-primary">
                National Geographic Scale
              </div>
            </div>

            <div className="border border-oxblood-foreground/20 bg-background/5 p-8 backdrop-blur-sm sm:col-span-2">
              <h3 className="font-headline text-2xl text-oxblood-foreground">Connect directly with the founding team</h3>
              <p className="mt-2 text-sm text-oxblood-foreground/75 max-w-xl leading-relaxed">
                We welcome discussions with global development foundations, gender equality funds, and mental health philanthropies. Request our impact memorandum and data privacy overview today.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-oxblood-foreground/15 pt-4 text-sm">
                <span className="text-oxblood-foreground/90">
                  Direct Line (WhatsApp or Call): <a href="tel:08062679191" className="font-mono font-bold text-primary hover:underline">08062679191</a>
                </span>
                <span className="text-oxblood-foreground/90">
                  Email: <a href={`mailto:${SITE.contactEmail}`} className="font-mono font-bold text-primary hover:underline">{SITE.contactEmail}</a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
