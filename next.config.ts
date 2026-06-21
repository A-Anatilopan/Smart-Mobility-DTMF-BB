import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 mostra in sviluppo l'indicatore con la N e lo stato di compilazione
  // nell'angolo della pagina. Lo disattiviamo per evitare distrazioni durante i test.
  devIndicators: false,
  experimental: {
    // In questo progetto il dev server subisce cambi frequenti su App Router,
    // Prisma e componenti client/server. Disattiviamo la cache persistente di
    // Turbopack in sviluppo per evitare chunk obsoleti tra riavvii successivi.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
