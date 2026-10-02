// The Express API (server/) runs on its own port. Next.js forwards /api/* to it, so the app and the API share one address.
const API_URL = process.env.API_URL || "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
