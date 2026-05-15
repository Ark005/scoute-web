import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://scoute.app/api/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      { hostname: "scoute.app" },
      { hostname: "217.28.223.106" },
      { hostname: "localhost" },
      { hostname: "upload.wikimedia.org" },
      { hostname: "commons.wikimedia.org" },
    ],
  },
};

export default nextConfig;
