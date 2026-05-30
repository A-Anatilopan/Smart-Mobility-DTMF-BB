"use client";

import dynamic from "next/dynamic";
import type { MappaServizioProps } from "@/components/mappa/mappa-servizio.types";

const MappaServizioLeaflet = dynamic(
  () => import("@/components/mappa/MappaServizioLeaflet"),
  {
    ssr: false,
    loading: () => (
      <section className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Mappa servizio
            </p>
            <h2 className="text-3xl font-semibold text-slate-950">
              Stiamo preparando la cartografia di Bari
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              La base mappa reale viene caricata dal provider cartografico e poi
              completata con aree, mezzi e posizione utente del progetto.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_70px_-36px_rgba(15,23,42,0.28)]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Cartografia reale
              </p>
              <p className="text-sm font-medium text-slate-700">
                OpenStreetMap su Bari
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              Caricamento
            </span>
          </div>

          <div className="flex aspect-[16/10] min-h-[480px] items-center justify-center bg-[linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] px-6 text-center">
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />
              <p className="text-sm font-medium text-slate-700">
                Caricamento della mappa reale in corso...
              </p>
            </div>
          </div>
        </div>
      </section>
    ),
  },
);

// Questo wrapper conserva lo stesso punto di ingresso usato dalle pagine del
// progetto, ma sposta il rendering della mappa reale solo lato client.
export default function MappaServizioMock(props: MappaServizioProps) {
  return <MappaServizioLeaflet {...props} />;
}
