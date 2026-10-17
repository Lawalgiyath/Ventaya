import type { Metadata } from 'next';
import ResourceDirectory from '@/components/resource-directory';
import { SiteHeader, SiteFooter } from '@/components/marketing-shell';

export const metadata: Metadata = {
  title: 'Crisis resources',
  description:
    'Free, confidential crisis and mental health support lines, grouped by country.',
};

export default function ResourcesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="ruled relative overflow-hidden border-b border-foreground/15">
          <div className="mx-auto max-w-4xl px-5 py-16 text-center">
            <h1 className="font-headline text-4xl md:text-5xl">
              You don&rsquo;t have to sort this out alone
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Real people, trained to listen, free to reach. Available whether or
              not you use Ventaya.
            </p>
          </div>
        </section>
        <div className="mx-auto max-w-4xl px-5 pb-24 pt-10">
          <ResourceDirectory />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
