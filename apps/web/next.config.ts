import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@xandevo/shared'],
  experimental: {
    typedRoutes: true,
  },
  // ESLint is owned by the dedicated `lint` turbo task (eslint flat config +
  // eslint-config-next rules). Don't double-run it during `next build`.
  eslint: { ignoreDuringBuilds: true },
  // Type errors still fail the build.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
