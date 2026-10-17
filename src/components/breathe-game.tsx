'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * A small, genuinely calming interaction: bubbles drift up, you pop them.
 *
 * Kept from the original build because it does something rare on a landing
 * page: it lets a visitor feel the product's promise before signing up.
 * Rewritten to drive motion from a single rAF loop rather than two setInterval
 * timers racing each other, which made the old version stutter.
 */

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  drift: number;
  speed: number;
  hue: number;
}

const MAX_BUBBLES = 14;

export function BreatheGame({ className }: { className?: string }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [popped, setPopped] = useState(0);
  const [started, setStarted] = useState(false);
  const frame = useRef<number | null>(null);
  const nextId = useRef(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const spawn = useCallback((): Bubble => {
    nextId.current += 1;
    return {
      id: nextId.current,
      x: 8 + Math.random() * 84,
      y: 108,
      size: 26 + Math.random() * 42,
      drift: (Math.random() - 0.5) * 0.05,
      speed: 0.055 + Math.random() * 0.05,
      hue: Math.random() > 0.5 ? 348 : 345,
    };
  }, []);

  useEffect(() => {
    if (!started) return;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 48);
      last = now;

      setBubbles((prev) => {
        const moved = prev
          .map((b) => ({
            ...b,
            y: b.y - b.speed * dt * 0.1,
            x: b.x + b.drift * dt * 0.1,
          }))
          .filter((b) => b.y > -18);

        return moved.length < MAX_BUBBLES && Math.random() < 0.035
          ? [...moved, spawn()]
          : moved;
      });

      frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [started, spawn]);

  const pop = (id: number) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setPopped((p) => p + 1);
  };

  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden border border-foreground/20 bg-bone-deep',
        className
      )}
    >
      {!started ? (
        <button
          onClick={() => setStarted(true)}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-3"
        >
          <span className="animate-breathe flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25">
            <span className="h-10 w-10 rounded-full bg-primary/30" />
          </span>
          <span className="font-headline text-2xl">Take sixty seconds</span>
          <span className="text-sm text-muted-foreground group-hover:text-foreground">
            Tap to begin
          </span>
        </button>
      ) : (
        <>
          <AnimatePresence>
            {bubbles.map((b) => (
              <motion.button
                key={b.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                onClick={() => pop(b.id)}
                aria-label="Pop bubble"
                className="absolute rounded-full backdrop-blur-sm"
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: b.size,
                  height: b.size,
                  background: `hsl(${b.hue} 70% 62% / 0.20)`,
                  border: `1px solid hsl(${b.hue} 70% 60% / 0.45)`,
                  boxShadow: `inset 0 -6px 14px hsl(${b.hue} 70% 70% / 0.25)`,
                }}
              />
            ))}
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-4 text-sm">
            <span className="text-muted-foreground">
              Breathe out as each one goes
            </span>
            <span className="rounded-full bg-background/80 px-3 py-1 font-medium tabular-nums">
              {popped}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
