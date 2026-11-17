import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Share-image routes read these fonts from disk at request time.
  outputFileTracingIncludes: { "/api/**": ["./assets/fonts/**"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
