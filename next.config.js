const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
  images: {
    unoptimized: true,
    domains: ["images.igdb.com", "media.rawg.io", "api.rawg.io", "i.ytimg.com", "img.youtube.com"],
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "simple-icons": path.resolve("./lib/vendor/simple-icons"),
      "@iconify/react": path.resolve("./lib/vendor/iconify-react"),
    };
    return config;
  },
};

module.exports = nextConfig;
