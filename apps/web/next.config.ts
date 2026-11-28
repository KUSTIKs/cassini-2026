import type { NextConfig } from "next";

const config: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@firstreach/contracts"],
  experimental: {
    // Register CSV uploads go through a Server Action.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default config;
