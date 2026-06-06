/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produce a self-contained server bundle (.next/standalone) so Electron can
  // run the app offline-of-npm with a minimal node_modules tree.
  output: "standalone",
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
