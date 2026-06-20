import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // In questo progetto il dev server subisce cambi frequenti su App Router,
    // Prisma e componenti client/server. Disattiviamo la cache persistente di
    // Turbopack in sviluppo per evitare chunk obsoleti tra riavvii successivi.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
