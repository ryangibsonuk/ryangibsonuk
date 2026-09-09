import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node:sqlite"],
  async redirects() {
    return [
      { source: "/control-panel", destination: "/teammates", permanent: false },
    ];
  },
};

export default nextConfig;
