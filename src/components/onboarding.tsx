'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { CarouselApi } from '@/components/ui/carousel';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, BookHeart, LineChart, Sparkles, Target, Wind } from 'lucide-react';
import { IMAGES } from '@/lib/images';
import { SITE } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * Post-signup tour.
 *
 * Previously this pointed at `i.ibb.co` images. When that host was dropped from
 * next.config the whole route threw a 500, which broke signup entirely, since
 * signup redirects here. Every image now comes from the audited registry.
 */
const SLIDES = [
  {
    icon: Sparkles,
    eyebrow: '01 / Welcome',
    title: `Welcome to ${SITE.name}`,
    description: `${SITE.companion} turns how you feel into what you do next. Here is the whole thing in about thirty seconds.`,
    image: IMAGES.hero(900),
  },
  {
    icon: BookHeart,
    eyebrow: '02 / Understand yourself',
    title: 'Start with one honest answer',
    description:
      'A private assessment shapes what you are shown. Nobody else ever sees it, at your organization or anywhere else.',
    image: IMAGES.stillness(900),
  },
  {
    icon: Target,
    eyebrow: '03 / Goals',
    title: 'Decide what steady looks like',
    description:
      'Set goals in your own words and watch them move. Small and specific beats ambitious and vague.',
    image: IMAGES.perspective(900),
  },
  {
    icon: Wind,
    eyebrow: '04 / The Worry Jar',
    title: 'Put the two a.m. thought down',
    description:
      'Write the worry out and get it back reframed. Built for the spirals that do not warrant a whole journal entry.',
    image: IMAGES.meditation(900),
  },
  {
    icon: LineChart,
    eyebrow: '05 / You are set',
    title: 'Your first week starts now',
    description:
      'Log a mood, write a line, or just look around. The patterns show up faster than you would think.',
    image: IMAGES.release(900),
  },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  // The carousel API attaches a moment after paint. Clicks that land before
  // that were silently dropped, so the controls looked live but did nothing.
  // Remember the intent and apply it as soon as the API exists.
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  // Drive the carousel through its own API. The previous version queried the
  // DOM for `.embla__next` and read a `__embla` property that does not exist,
  // so the dot navigation silently did nothing.
  useEffect(() => {
    if (!api) return;
    const sync = () => setCurrent(api.selectedScrollSnap());
    sync();
    api.on('select', sync);
    return () => {
      api.off('select', sync);
    };
  }, [api]);

  useEffect(() => {
    if (!api || pendingIndex === null) return;
    api.scrollTo(pendingIndex);
    setPendingIndex(null);
  }, [api, pendingIndex]);

  const goTo = useCallback(
    (index: number) => {
      if (api) api.scrollTo(index);
      else setPendingIndex(index);
    },
    [api]
  );

  const isLast = current === SLIDES.length - 1;

  const next = useCallback(() => {
    if (isLast) {
      router.push('/dashboard');
      return;
    }
    goTo(Math.min(current + 1, SLIDES.length - 1));
  }, [current, goTo, isLast, router]);

  const progress = ((current + 1) / SLIDES.length) * 100;

  return (
    <div
      className="paper flex min-h-screen items-center justify-center bg-background p-4"
      data-carousel-ready={api ? 'true' : 'false'}
    >
      <div className="w-full max-w-2xl">
        <Carousel opts={{ align: 'start', loop: false }} setApi={setApi}>
          <CarouselContent>
            {SLIDES.map((slide) => {
              const Icon = slide.icon;
              return (
                <CarouselItem key={slide.eyebrow}>
                  <div className="border border-foreground/20 bg-card p-6 md:p-10">
                    <div className="leaf-sm relative h-56 w-full md:h-72">
                      <Image
                        src={slide.image.src}
                        alt={slide.image.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 42rem"
                        className="bg-muted object-cover"
                        priority={slide.eyebrow.startsWith('01')}
                      />
                    </div>

                    <span className="eyebrow mt-7 block text-primary">
                      {slide.eyebrow}
                    </span>
                    <div className="mt-3 flex items-start gap-3">
                      <Icon className="mt-1.5 h-6 w-6 shrink-0 text-primary" />
                      <h2 className="font-headline text-[clamp(1.6rem,4vw,2.4rem)] leading-tight">
                        {slide.title}
                      </h2>
                    </div>
                    <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                      {slide.description}
                    </p>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
          <div className="order-2 flex items-center justify-center gap-2 sm:order-1">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.eyebrow}
                onClick={() => goTo(i)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  current === i ? 'w-5 bg-primary' : 'w-2 bg-foreground/20'
                )}
                aria-label={`Go to step ${i + 1}`}
                aria-current={current === i}
              />
            ))}
          </div>

          <Progress value={progress} className="order-1 h-2 w-full flex-1 sm:order-2" />

          <Button onClick={next} size="lg" className="pill order-3 w-full sm:w-auto">
            {isLast ? 'Go to dashboard' : 'Next'}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="link-wipe eyebrow text-muted-foreground hover:text-foreground"
          >
            Skip the tour
          </button>
        </div>
      </div>
    </div>
  );
}
