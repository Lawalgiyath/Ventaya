'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/brand';
import { useTheme } from '@/components/theme-provider';
import { useApp } from '@/context/app-context';
import { SITE } from '@/lib/site';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/#how', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/for-teams', label: 'For teams' },
  { href: '/#organizations', label: 'Partnerships' },
  { href: '/#grants', label: 'Grants' },
  { href: '/report', label: 'SafeReport', highlight: true },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-[1.15rem] w-[1.15rem]" />
      ) : (
        <Moon className="h-[1.15rem] w-[1.15rem]" />
      )}
    </Button>
  );
}

export function SiteHeader() {
  const { user } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-b border-foreground/15 bg-background/95 backdrop-blur-[2px]'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 lg:px-10">
        <Link href="/" aria-label={`${SITE.name} home`}>
          <Wordmark className="text-base" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-2 text-sm transition-colors',
                (item as { highlight?: boolean }).highlight
                  ? 'font-semibold text-primary hover:text-primary/80'
                  : 'link-wipe text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <Button asChild size="sm" className="pill px-5">
              <Link href={user.isLeader ? '/organization/dashboard' : '/dashboard'}>
                Open app
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="pill px-5">
                <Link href="/signup">Start free</Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col p-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
            >
              Sign in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-foreground/15 bg-bone-deep">
      <div className="mx-auto max-w-[1400px] px-5 py-14 lg:px-10">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Wordmark className="text-base" />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              {SITE.description}
            </p>
          </div>

          <div>
            <h4 className="eyebrow text-primary">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/pricing" className="link-wipe hover:text-foreground">Pricing</Link></li>
              <li><Link href="/for-teams" className="link-wipe hover:text-foreground">For teams</Link></li>
              <li><Link href="/report" className="link-wipe hover:text-foreground font-semibold text-primary">SafeReport</Link></li>
              <li><Link href="/signup" className="link-wipe hover:text-foreground">Get started</Link></li>
              <li><Link href="/login" className="link-wipe hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="eyebrow text-primary">Partnerships & Grants</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#organizations" className="link-wipe hover:text-foreground">Women&apos;s Organizations</Link></li>
              <li><Link href="/#grants" className="link-wipe hover:text-foreground">Grant Funding</Link></li>
              <li>
                <a
                  href={SITE.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-wipe hover:text-foreground font-medium text-foreground"
                >
                  WhatsApp: {SITE.whatsappNumber}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.contactEmail}`} className="link-wipe hover:text-foreground">
                  Direct: {SITE.contactEmail}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="eyebrow text-primary">Support & Helplines</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/resources" className="link-wipe hover:text-foreground">
                  Crisis resources
                </Link>
              </li>
              <li>
                <a href="tel:112" className="link-wipe hover:text-foreground">
                  Emergency: 112
                </a>
              </li>
              <li>
                <a href="tel:08002002020" className="link-wipe hover:text-foreground">
                  NAPTIP: 0800 200 2020
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.supportEmail}`} className="link-wipe hover:text-foreground">
                  Contact support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-foreground/15 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {SITE.name}. Not a substitute for
            professional medical care.
          </p>
          <p>
            In immediate danger? Call your local emergency number or see{' '}
            <Link href="/resources" className="underline hover:text-foreground">
              crisis resources
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
