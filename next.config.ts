import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 배포용 standalone 번들
  output: "standalone",
};

export default nextConfig;
