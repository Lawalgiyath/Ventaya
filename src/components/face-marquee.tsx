'use client';

import Image from 'next/image';
import { FACES } from '@/lib/images';
import { cn } from '@/lib/utils';

/**
 * An endless band of portraits.
 *
 * The list is rendered twice and translated by exactly -50%, so the loop is
 * seamless without measuring anything. Hovering pauses it, which turns a
 * decorative strip into something you can actually look at.
 */
export function FaceMarquee({
  reverse = false,
  slow = false,
  className,
}: {
  reverse?: boolean;
  slow?: boolean;
  className?: string;
}) {
  const strip = [...FACES, ...FACES];

  return (
    <div className={cn('marquee-paused relative overflow-hidden', className)}>
      <div
        className={cn(
          'flex w-max gap-3',
          slow ? 'animate-marquee-slow' : 'animate-marquee'
        )}
        style={reverse ? { animationDirection: 'reverse' } : undefined}
      >
        {strip.map((face, i) => (
          <figure
            key={`${face.src}-${i}`}
            className="arch relative h-52 w-36 shrink-0 sm:h-64 sm:w-44"
          >
            <Image
              src={face.src}
              alt={i < FACES.length ? face.alt : ''}
              aria-hidden={i >= FACES.length}
              width={face.width}
              height={face.height}
              sizes="176px"
              className="h-full w-full object-cover grayscale-[0.35] transition-[filter] duration-500 hover:grayscale-0"
            />
          </figure>
        ))}
      </div>

      {/* Feather the ends into the paper rather than cutting them off. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent sm:w-28" />
    </div>
  );
}

/** A single line of text, repeated, scrolling: a print ticker. */
export function TextMarquee({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const items = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div className={cn('relative overflow-hidden py-4', className)}>
      <div className="animate-marquee flex w-max items-center gap-8">
        {items.map((i) => (
          <span key={i} className="flex items-center gap-8" aria-hidden={i > 0}>
            <span className="font-headline text-2xl italic sm:text-3xl">{text}</span>
            <span className="text-primary">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
