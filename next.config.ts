import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Phase 1: no remote images yet; media arrives in Phase 5.
  images: { remotePatterns: [] },
  // Wave 10 video diet: generated clips are content-stable, so cache
  // them immutably for a year. If a clip's bytes ever change, rename
  // the file (e.g. celebrate-v2.mp4) instead of overwriting it.
  async headers() {
    return [
      {
        source: '/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
