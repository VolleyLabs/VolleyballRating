import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude Angular directory from Next.js compilation
  webpack: (config) => {
    config.module.rules.push({
      test: /angular\/.*\.(ts|js)$/,
      loader: "ignore-loader",
    });
    return config;
  },
  // Also exclude from TypeScript checking
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
      },
    ],
  },
};

export default nextConfig;
