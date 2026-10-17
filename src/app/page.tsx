import LandingPage from '@/components/landing-page';

// AppProvider is supplied once by the root layout; wrapping again here would
// create a second, shadowing provider with its own separate auth state.
export default function Home() {
  return <LandingPage />;
}
