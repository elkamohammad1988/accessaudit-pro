/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship raw TS; let Next transpile them.
  transpilePackages: ["@accessaudit/shared", "@accessaudit/database"],
  typedRoutes: true,
  // ESLint deferred during the scaffold (registry was flaky). Re-enable by adding
  // eslint + eslint-config-next and removing this flag.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
