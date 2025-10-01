import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: process.env.IMAGE_PROTOCOL || "https",   // fallback to https
        hostname: process.env.IMAGE_HOSTNAME || "localhost",
        port: process.env.IMAGE_PORT || "",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
