import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@pulse/ui", "@pulse/schemas", "@pulse/types", "@pulse/api-types"],
};

export default nextConfig;
