'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * The steady field: a spring lattice you can grab, pull and throw.
 *
 * Cerebrium lets you spin a shield. This does something the product can
 * actually stand behind: you disturb the fabric, waves travel outward through
 * the coupling between neighbours, and it always returns to rest. Disturbance
 * and recovery is the entire pitch, so the hero argues it rather than
 * describing it.
 *
 * The simulation is a discrete wave medium. Each node is pulled toward its rest
 * position by a spring, and coupled to its four neighbours by their *relative*
 * displacement, which is what lets a ripple propagate instead of each point
 * twitching alone. Velocity is damped every step so energy always drains away.
 *
 * Canvas 2D and typed arrays: this runs behind a headline and must never cost
 * more than it is worth.
 */

const SPACING = 46;
const SPRING = 0.022; // pull back toward rest
// Explicit integration is only stable while the summed neighbour coupling
// stays well under 0.5. Four neighbours at 0.19 came to 0.76, which diverged
// to Infinity the moment a drag pushed real energy in, and the canvas went
// blank. 4 x 0.1 = 0.4 leaves headroom.
const COUPLING = 0.05;
const DAMPING = 0.945; // energy drained per step
const GRAB_RADIUS = 210;
const MAX_DISP = 260; // hard ceiling on displacement, belt and braces
const MAX_VEL = 60;

export function SteadyField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cols = 0;
    let rows = 0;
    let width = 0;
    let height = 0;
    let originX = 0;
    let originY = 0;

    // Displacement from rest, not absolute position.
    let dx = new Float32Array(0);
    let dy = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let glow = new Float32Array(0);
    // Accelerations are staged separately; see step().
    let ax = new Float32Array(0);
    let ay = new Float32Array(0);

    let raf = 0;
    let running = true;
    let t = 0;
    let rose = '348 83% 61%';

    const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, down: false, inside: false };
    // Where the fabric was seized, in rest space. The patch around this point
    // travels with the hand until release.
    const grab = { x: 0, y: 0 };

    const readRose = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary')
        .trim();
      if (v) rose = v;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.max(2, Math.floor(width / SPACING) + 2);
      rows = Math.max(2, Math.floor(height / SPACING) + 2);
      // Centre the lattice so it never looks clipped on one side.
      originX = (width - (cols - 1) * SPACING) / 2;
      originY = (height - (rows - 1) * SPACING) / 2;

      const n = cols * rows;
      dx = new Float32Array(n);
      dy = new Float32Array(n);
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      glow = new Float32Array(n);
      ax = new Float32Array(n);
      ay = new Float32Array(n);
      readRose();
    };

    /**
     * One integration step.
     *
     * Accelerations for every node are computed first from the *current*
     * displacements, and only then integrated. Doing both in a single pass
     * updated dx[i] in place, so a node's left neighbour was already advanced
     * while its right neighbour was not. That asymmetry pumped energy into the
     * lattice and it never settled.
     */
    const step = () => {
      // Pass 1: accelerations, reading current state only.
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          let fx = -dx[i] * SPRING;
          let fy = -dy[i] * SPRING;

          if (gx > 0) {
            const j = i - 1;
            fx += (dx[j] - dx[i]) * COUPLING;
            fy += (dy[j] - dy[i]) * COUPLING;
          }
          if (gx < cols - 1) {
            const j = i + 1;
            fx += (dx[j] - dx[i]) * COUPLING;
            fy += (dy[j] - dy[i]) * COUPLING;
          }
          if (gy > 0) {
            const j = i - cols;
            fx += (dx[j] - dx[i]) * COUPLING;
            fy += (dy[j] - dy[i]) * COUPLING;
          }
          if (gy < rows - 1) {
            const j = i + cols;
            fx += (dx[j] - dx[i]) * COUPLING;
            fy += (dy[j] - dy[i]) * COUPLING;
          }

          ax[i] = fx;
          ay[i] = fy;
        }
      }

      // Pass 2: integrate.
      for (let i = 0; i < dx.length; i++) {
        let nvx = (vx[i] + ax[i]) * DAMPING;
        let nvy = (vy[i] + ay[i]) * DAMPING;
        let ndx = dx[i] + nvx;
        let ndy = dy[i] + nvy;

        // A single non-finite value would blank the whole canvas, since the
        // lattice is stroked as one path. Reset rather than propagate.
        if (!Number.isFinite(ndx) || !Number.isFinite(ndy)) {
          ndx = 0; ndy = 0; nvx = 0; nvy = 0;
        }

        vx[i] = nvx < -MAX_VEL ? -MAX_VEL : nvx > MAX_VEL ? MAX_VEL : nvx;
        vy[i] = nvy < -MAX_VEL ? -MAX_VEL : nvy > MAX_VEL ? MAX_VEL : nvy;
        dx[i] = ndx < -MAX_DISP ? -MAX_DISP : ndx > MAX_DISP ? MAX_DISP : ndx;
        dy[i] = ndy < -MAX_DISP ? -MAX_DISP : ndy > MAX_DISP ? MAX_DISP : ndy;

        glow[i] *= 0.955;
      }
    };

    /**
     * While held, a patch of fabric around the grab point travels with the
     * hand. Otherwise the pointer just brushes the surface.
     */
    const applyPointer = () => {
      if (!pointer.inside || still) return;

      if (pointer.down) {
        const offX = pointer.x - grab.x;
        const offY = pointer.y - grab.y;

        for (let gy = 0; gy < rows; gy++) {
          for (let gx = 0; gx < cols; gx++) {
            const i = gy * cols + gx;
            const rx = originX + gx * SPACING;
            const ry = originY + gy * SPACING;
            // Falloff measured in rest space so the grabbed patch stays
            // coherent however far it is dragged.
            const dist = Math.hypot(rx - grab.x, ry - grab.y);
            if (dist > GRAB_RADIUS) continue;

            const falloff = (1 - dist / GRAB_RADIUS) ** 2;
            const targetX = offX * falloff;
            const targetY = offY * falloff;
            // Ease toward the target and keep the resulting motion as
            // velocity, so releasing throws the fabric rather than dropping it.
            const stepX = (targetX - dx[i]) * 0.32;
            const stepY = (targetY - dy[i]) * 0.32;
            dx[i] += stepX;
            dy[i] += stepY;
            vx[i] = stepX;
            vy[i] = stepY;
            if (falloff > glow[i]) glow[i] = falloff;
          }
        }
        return;
      }

      const mx = pointer.x - pointer.px;
      const my = pointer.y - pointer.py;
      if (Math.hypot(mx, my) < 0.4) return;

      const radius = GRAB_RADIUS * 0.55;
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          const rx = originX + gx * SPACING;
          const ry = originY + gy * SPACING;
          const dist = Math.hypot(rx + dx[i] - pointer.x, ry + dy[i] - pointer.y);
          if (dist > radius) continue;
          const falloff = (1 - dist / radius) ** 2;
          vx[i] += mx * falloff * 0.2;
          vy[i] += my * falloff * 0.2;
          if (falloff > glow[i]) glow[i] = falloff;
        }
      }
    };

    const draw = () => {
      if (!running) return;
      t += 0.005;

      applyPointer();
      pointer.px = pointer.x;
      pointer.py = pointer.y;

      if (!still) {
        // One substep only. Two doubled the effective coupling per frame and
        // pushed the scheme past its stability limit, so a hard drag diverged.
        step();
      }

      ctx.clearRect(0, 0, width, height);

      // --- Lattice threads, drawn as one path per opacity band -------------
      // Batching into two passes keeps this to two stroke calls per frame.
      for (const band of [0, 1]) {
        ctx.beginPath();
        for (let gy = 0; gy < rows; gy++) {
          for (let gx = 0; gx < cols; gx++) {
            const i = gy * cols + gx;
            const e = Math.min(1, glow[i] + Math.hypot(dx[i], dy[i]) / 34);
            const hot = e > 0.22 ? 1 : 0;
            if (hot !== band) continue;

            const x = originX + gx * SPACING + dx[i];
            const y = originY + gy * SPACING + dy[i];

            if (gx < cols - 1) {
              const j = i + 1;
              ctx.moveTo(x, y);
              ctx.lineTo(
                originX + (gx + 1) * SPACING + dx[j],
                originY + gy * SPACING + dy[j]
              );
            }
            if (gy < rows - 1) {
              const j = i + cols;
              ctx.moveTo(x, y);
              ctx.lineTo(
                originX + gx * SPACING + dx[j],
                originY + (gy + 1) * SPACING + dy[j]
              );
            }
          }
        }
        ctx.strokeStyle = `hsl(${rose} / ${band ? 0.9 : 0.32})`;
        ctx.lineWidth = band ? 1.8 : 1;
        ctx.stroke();
      }

      // --- Nodes -----------------------------------------------------------
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          const disp = Math.hypot(dx[i], dy[i]);
          const e = Math.min(1, glow[i] + disp / 34);
          // Idle shimmer so the field is alive before anyone touches it.
          const breath = still ? 0.5 : 0.5 + 0.13 * Math.sin(t * 1.7 + gx * 0.32 + gy * 0.21);
          const alpha = Math.min(1, breath + e * 0.7);
          if (alpha < 0.06) continue;

          const x = originX + gx * SPACING + dx[i];
          const y = originY + gy * SPACING + dy[i];
          ctx.beginPath();
          ctx.arc(x, y, 1.9 + e * 3.4, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${rose} / ${alpha.toFixed(3)})`;
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onDown = (e: PointerEvent) => {
      const { x, y } = toLocal(e);
      pointer.x = x;
      pointer.y = y;
      pointer.px = x;
      pointer.py = y;
      pointer.down = true;
      pointer.inside = true;
      grab.x = x;
      grab.y = y;
      setTouched(true);
      canvas.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      const { x, y } = toLocal(e);
      pointer.x = x;
      pointer.y = y;
      pointer.inside =
        x >= -80 && y >= -80 && x <= width + 80 && y <= height + 80;
      if (pointer.down) setTouched(true);
    };

    const onUp = (e: PointerEvent) => {
      pointer.down = false;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    };

    resize();
    raf = requestAnimationFrame(draw);

    // Idle entirely when off-screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(draw);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const themeObserver = new MutationObserver(readRose);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    canvas.addEventListener('pointerdown', onDown);
    // Tracked on the window so a drag that leaves the canvas still reads.
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      themeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-testid="steady-field"
        className="h-full w-full touch-none"
        style={{ cursor: 'grab' }}
      />
      {/* Affordance, retired the moment it has been used. */}
      <span
        className={cn(
          'eyebrow pointer-events-none absolute bottom-4 right-4 text-primary/70 transition-opacity duration-700',
          touched ? 'opacity-0' : 'opacity-100'
        )}
      >
        Pull the field
      </span>
    </div>
  );
}
