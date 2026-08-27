// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const appwriteRemotePattern = (() => {
  const raw = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || undefined,
    };
  } catch {
    return null;
  }
})();

module.exports = withPWA({
  output: "standalone",
  // allowedDevOrigins: ["192.168.1.102"],
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: appwriteRemotePattern ? [appwriteRemotePattern] : [],
    dangerouslyAllowLocalIP: true,
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  turbopack: {},
});
