import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Build errors are no longer suppressed. They were hiding 22 real type errors.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  serverExternalPackages: [
    'genkit',
    '@genkit-ai/googleai',
    '@genkit-ai/core',
    '@genkit-ai/next',
    'firebase-admin',
  ],
  images: {
    remotePatterns: [
      // Editorial photography used across the marketing site.
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'plus.unsplash.com', pathname: '/**' },
      // Deterministic generated avatars (keyless, free).
      { protocol: 'https', hostname: 'api.dicebear.com', pathname: '/**' },
      // Profile photos from Google sign-in.
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
