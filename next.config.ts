import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/silhouettes/:file*.png",
        headers: [{ key: "Content-Type", value: "image/svg+xml" }],
      },
    ];
  },
};

export default nextConfig;
