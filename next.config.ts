import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // pdf-parse uses some node internals that need special handling
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
