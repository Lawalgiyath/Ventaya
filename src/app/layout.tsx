import type { Metadata, Viewport } from 'next';
import { Archivo, Bodoni_Moda } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/context/app-context';
import { ThemeProvider, ThemeScript } from '@/components/theme-provider';
import { SITE } from '@/lib/site';

// Archivo is a grotesk with actual character in its wide/tight range: chosen
// specifically to avoid the Inter/Geist default.
const body = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

// Bodoni Moda is a didone: extreme thick/thin contrast, unmistakably editorial.
// Optical sizing keeps the hairlines from vanishing at display sizes.
const display = Bodoni_Moda({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    'mental health',
    'AI wellness coach',
    'mood tracking',
    'guided journaling',
    'employee wellbeing',
    'workplace mental health',
  ],
  openGraph: {
    type: 'website',
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2EBE0' },
    { media: '(prefers-color-scheme: dark)', color: '#16100F' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${body.variable} ${display.variable}`}>
      <head>
        <ThemeScript />
      </head>
      {/*
        Browser extensions write attributes onto <body> before React hydrates.
        Grammarly adds data-gr-ext-installed and data-new-gr-c-s-check-loaded,
        which React then reports as a hydration mismatch it "won't patch up".
        Nothing we render is affected, so the warning is suppressed at the one
        element extensions actually touch. <html> already needs it for the
        pre-paint theme script.
      */}
      <body className="font-body antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
