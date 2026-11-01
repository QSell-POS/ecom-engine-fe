import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Docker image runs .next/standalone/server.js, which carries only the
  // traced files it needs — no node_modules install in the final stage.
  // Vercel packages its own output, so skip it there.
  output: process.env.VERCEL ? undefined : "standalone",

  images: {
    // Product, brand and category images are served from Cloudflare R2. Set
    // R2_PUBLIC_HOST to that bucket's public hostname to allow next/image.
    remotePatterns: process.env.R2_PUBLIC_HOST
      ? [{ protocol: "https", hostname: process.env.R2_PUBLIC_HOST }]
      : [],
  },

  async headers() {
    return [
      {
        // Nginx buffers proxied responses by default, which would hold back
        // streamed RSC payloads until the render finished.
        source: "/:path*{/}?",
        headers: [{ key: "X-Accel-Buffering", value: "no" }],
      },
    ];
  },
};

export default nextConfig;
