import Link from 'next/link';
import { ArrowLeft, Home, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="paper flex min-h-[80vh] flex-col items-center justify-center px-5 py-24 text-center">
      <span className="eyebrow text-primary">404: Not Found</span>
      <h1 className="mt-4 font-headline text-[clamp(2.5rem,7vw,5rem)] leading-[0.95]">
        The sentence you were
        <br />
        <span className="italic text-primary">looking for is not here.</span>
      </h1>
      <p className="mt-6 max-w-md text-pretty text-muted-foreground leading-relaxed">
        The page may have moved, expired, or never existed. Return to steady ground.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button asChild size="lg" className="pill h-12 bg-primary px-7 text-primary-foreground hover:bg-primary/90">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="pill h-12 border-foreground/25 px-7">
          <Link href="/report">
            <ShieldAlert className="mr-2 h-4 w-4" />
            SafeReport
          </Link>
        </Button>
      </div>
    </div>
  );
}
