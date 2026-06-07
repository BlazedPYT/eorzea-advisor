/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produce a self-contained server bundle (.next/standalone) so Electron can
  // run the app offline-of-npm with a minimal node_modules tree.
  output: "standalone",
  // Ensure the bestiary data files ship with their serverless functions on web
  // hosts (Vercel etc.), where they're read from the filesystem at runtime.
  experimental: {
    outputFileTracingIncludes: {
      "/api/bestiary/search": ["./public/bestiary/**"],
      "/api/bestiary/entry": ["./public/bestiary/**"],
      "/api/bestiary/zones": ["./public/bestiary/**"],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "xivapi.com" },
      { protocol: "https", hostname: "*.xivapi.com" },
      { protocol: "https", hostname: "img2.finalfantasyxiv.com" },
      { protocol: "https", hostname: "lds-img.finalfantasyxiv.com" },
      { protocol: "https", hostname: "universalis-ffxiv.github.io" },
    ],
  },
};

export default nextConfig;
