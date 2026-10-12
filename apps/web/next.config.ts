import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reports load in the browser from the API, so routes render on demand (no Cache Components).
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
