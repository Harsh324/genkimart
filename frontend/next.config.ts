import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'http',                // or 'https' if you switch later
        hostname: 'genkimart.neovara.uk',
        port: '',                        // no port
        pathname: '/media/**',           // paths you allow
      },
    ],
  },
};



export default nextConfig;
