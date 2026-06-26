import type { NextConfig } from "next";

// The frame sequence (~27 MB of WebP) and the poster/video are immutable
// content assets — serve them with an aggressive, long-lived cache so a
// returning visitor never re-downloads the ride and repeat visits are instant.
const IMMUTABLE = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/frames/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/poster.jpg",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/rider.mp4",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
    ];
  },
};

export default nextConfig;
