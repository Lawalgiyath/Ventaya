'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A rose dot that trails the pointer and swells over anything interactive.
 *
 * Pointer-only: hidden entirely on touch and when reduced motion is requested,
 * and the real system cursor is never removed on those devices. Position is
 * written straight to the transform in a rAF loop rather than through React
 * state, so it doesn't re-render the tree sixty times a second.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || still) return;

    setEnabled(true);
    document.documentElement.classList.add('has-custom-cursor');

    const target = { x: -100, y: -100 };
    const eased = { x: -100, y: -100 };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;

      const el = e.target as HTMLElement | null;
      const interactive = el?.closest(
        'a, button, input, select, textarea, [role="button"], [data-cursor="grow"]'
      );
      ring.current?.classList.toggle('is-active', Boolean(interactive));
    };

    const tick = () => {
      eased.x += (target.x - eased.x) * 0.18;
      eased.y += (target.y - eased.y) * 0.18;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${eased.x}px, ${eased.y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ring}
        aria-hidden="true"
        className="ventaya-cursor-ring pointer-events-none fixed left-0 top-0 z-[9999] h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/60"
      />
      <div
        ref={dot}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 rounded-full bg-primary"
        style={{ marginLeft: '-3px', marginTop: '-3px' }}
      />
    </>
  );
}
