import { cn } from '@/lib/utils';
import { SITE } from '@/lib/site';

/**
 * The Ventaya mark: a descent that resolves upward past where it began.
 *
 * No container, no rounded-square tile, no gradient chip. Just the stroke,
 * inheriting colour from its context so it sits on any ground.
 */
export function VentayaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 40"
      fill="none"
      className={cn('h-7 w-auto text-primary', className)}
      role="img"
      aria-label={`${SITE.name} logo`}
    >
      <path
        d="M4 6 L20 34 L44 2"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The terminal point: where the line ends up higher than it started. */}
      <circle cx="44" cy="2" r="3.6" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <VentayaMark className={cn('h-[0.78em] w-auto translate-y-[0.06em]', markClassName)} />
      <span className="font-headline text-[1.5em] font-medium leading-none tracking-[-0.01em]">
        {SITE.name}
      </span>
    </span>
  );
}

/**
 * Circular "seal" type, used as a slow-rotating stamp. A print device that
 * doesn't exist in the default component vocabulary.
 */
export function Seal({
  text = 'MOVE FORWARD · FEEL STEADY · ',
  className,
}: {
  text?: string;
  className?: string;
}) {
  const chars = text.split('');
  const step = 360 / chars.length;

  return (
    <div className={cn('relative aspect-square', className)} aria-hidden="true">
      <div className="animate-seal absolute inset-0">
        {chars.map((c, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 font-body text-[0.62rem] font-semibold uppercase"
            style={{
              transform: `rotate(${i * step}deg) translateY(-3.9em)`,
              transformOrigin: '0 0',
              letterSpacing: '0.06em',
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
