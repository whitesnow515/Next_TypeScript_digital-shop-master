/* eslint-disable import/no-extraneous-dependencies */
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  typescript: {
    "ignoreBuildErrors": true
  },
  poweredByHeader: false,
  swcMinify: true,
  trailingSlash: true,
  basePath: "",
  test: true,
  // The starter code load resources from `public` folder with `router.basePath` in React components.
  // So, the source code is "basePath-ready".
  // You can remove `basePath` if you don't need it.
  reactStrictMode: true,
  experimental: {
    // esmExternals: "loose",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  compiler: {
    emotion: true,
  },
  // this is used for dealing with the unmatching urls
  async rewrites() {
    return [
      {
        source: "/api/stock/:id/get/raw",
        destination: "/api/stock/:id/get?raw=true",
      },
      {
        source: "/stock/:id/raw",
        destination: "/api/stock/:id/get?raw=true",
      },
      {
        source: "/product",
        destination: "/products",
      },
      {
        source: "/products/:id",
        destination: "/product/:id",
      },
    ];
  },
});
