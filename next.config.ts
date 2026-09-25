import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Phase 1: no remote images yet; media arrives in Phase 5.
  images: { remotePatterns: [] },
};

export default nextConfig;
