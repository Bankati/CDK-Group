import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/** Adresses IP de l'ordinateur sur le Wi-Fi : permet d'ouvrir le serveur de dev depuis un téléphone. */
const lanIps = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i!.address);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Photo produit compressée dans le navigateur (≈ 200 Ko) : 2 Mo laisse de la marge.
    serverActions: { bodySizeLimit: "2mb" },
  },
  images: { formats: ["image/avif", "image/webp"] },
  allowedDevOrigins: lanIps,
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
