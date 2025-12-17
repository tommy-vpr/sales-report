import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ngrok-free.app",
      },
      // add other domains you need here
    ],
  },
};

export default nextConfig;
