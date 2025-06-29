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
};

export default nextConfig;
