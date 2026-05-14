import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@pulse/ui", "@pulse/schemas", "@pulse/types", "@pulse/api-types"],
  images: {
    remotePatterns: [
      // Twitter / X profile images
      { protocol: "https", hostname: "pbs.twimg.com" },
      // Instagram CDN
      { protocol: "https", hostname: "*.cdninstagram.com" },
      // Facebook / Meta CDN
      { protocol: "https", hostname: "*.fbcdn.net" },
      // LinkedIn CDN
      { protocol: "https", hostname: "media.licdn.com" },
      // YouTube / Google user content
      { protocol: "https", hostname: "*.googleusercontent.com" },
      // TikTok CDN
      { protocol: "https", hostname: "*.tiktokcdn.com" },
    ],
  },
};

export default nextConfig;
