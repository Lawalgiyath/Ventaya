'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Img } from '@/lib/images';

export interface IndexEntry {
  n: string;
  title: string;
  body: string;
  image: Img;
}

/**
 * An index of rules: hover a row and its photograph follows the pointer.
 *
 * This replaces the four-cards-in-a-grid reflex. On touch, where there is no
 * hover, every row shows its image inline instead, so nothing is hidden behind
 * an interaction that device cannot perform.
 */
export function RevealIndex({ entries }: { entries: IndexEntry[] }) {
  const [active, setActive] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const floater = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const box = wrap.current?.getBoundingClientRect();
    if (!box || !floater.current) return;
    floater.current.style.transform = `translate3d(${
      e.clientX - box.left - 130
    }px, ${e.clientY - box.top - 165}px, 0)`;
  };

  return (
    <div
      ref={wrap}
      className="relative"
      onMouseMove={onMove}
      onMouseLeave={() => setActive(null)}
    >
      <ul className="rule">
        {entries.map((entry, i) => (
          <li
            key={entry.n}
            onMouseEnter={() => setActive(i)}
            className="group relative border-b border-foreground/15"
          >
            <div className="grid items-baseline gap-x-6 gap-y-3 py-8 md:grid-cols-[auto_1fr_1.1fr] md:py-11">
              <span
                className={cn(
                  'font-headline text-3xl transition-colors duration-300 md:text-4xl',
                  active === i ? 'text-primary' : 'text-foreground/25'
                )}
              >
                {entry.n}
              </span>

              <h3
                className={cn(
                  'font-headline text-[1.75rem] leading-tight transition-transform duration-500 md:text-[2.4rem]',
                  'md:group-hover:translate-x-3'
                )}
              >
                {entry.title}
              </h3>

              <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
                {entry.body}
              </p>
            </div>

            {/* Touch fallback: the image lives in the row itself. */}
            <div className="leaf mb-8 md:hidden">
              <Image
                src={entry.image.src}
                alt={entry.image.alt}
                width={entry.image.width}
                height={entry.image.height}
                sizes="100vw"
                className="h-52 w-full object-cover"
              />
            </div>
          </li>
        ))}
      </ul>

      {/* Pointer-following plate, desktop only. */}
      <div
        ref={floater}
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0 top-0 z-20 hidden w-[260px] md:block',
          'transition-opacity duration-300',
          active === null ? 'opacity-0' : 'opacity-100'
        )}
      >
        <div className="arch shadow-[0_24px_60px_-18px_hsl(345_52%_20%_/_0.45)]">
          {entries.map((entry, i) => (
            <Image
              key={entry.n}
              src={entry.image.src}
              alt=""
              width={entry.image.width}
              height={entry.image.height}
              sizes="260px"
              className={cn(
                'h-[330px] w-full object-cover transition-opacity duration-300',
                active === i ? 'opacity-100' : 'absolute inset-0 opacity-0'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
