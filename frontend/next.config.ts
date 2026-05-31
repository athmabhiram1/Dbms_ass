import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // To silence the workspace root warning:
  experimental: {
    // turbopack: { root: "." } // we'll just ignore for now if not valid type
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
