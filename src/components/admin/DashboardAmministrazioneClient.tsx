"use client";

import { useEffect, useState } from "react";
import MappaServizioMock from "@/components/mappa/MappaServizioMock";
import type { AreaServizio, Mezzo } from "@/types/mobilita";

type DashboardAmministrazioneClientProps = {
  aree: AreaServizio[];
  mezziIniziali: Mezzo[];
};

type FlottaAdminApiResponse = {
  errore?: string;
  mezzi?: Mezzo[];
};

// Questa vista client aggiorna periodicamente il campione flotta cosi la PA
// vede in tempo reale disponibilita, prenotazioni, uso, pausa e manutenzione.
export default function DashboardAmministrazioneClient({
  aree,
  mezziIniziali,
}: DashboardAmministrazioneClientProps) {
  const [mezzi, setMezzi] = useState(mezziIniziali);

  useEffect(() => {
    let annullato = false;

    async function aggiornaFlotta() {
      try {
        const response = await fetch("/api/admin/flotta", {
          method: "GET",
          cache: "no-store",
        });

        const result =
          (await response.json().catch(() => null)) as FlottaAdminApiResponse | null;

        if (!response.ok || !result?.mezzi || annullato) {
          return;
        }

        setMezzi(result.mezzi);
      } catch {
        // Manteniamo l'ultimo stato valido se il refresh fallisce.
      }
    }

    const intervallo = window.setInterval(() => {
      void aggiornaFlotta();
    }, 5000);

    return () => {
      annullato = true;
      window.clearInterval(intervallo);
    };
  }, []);

  const mezziDisponibili = mezzi.filter((mezzo) => mezzo.stato === "DISPONIBILE");
  const mezziBatteriaBassa = mezzi.filter((mezzo) => mezzo.batteria <= 25);

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Inizio
            </span>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Quadro iniziale del servizio di mobilita urbana.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Questa home istituzionale resta dedicata alla mappa e al quadro
                iniziale del servizio, mentre le letture piu dettagliate sono
                distribuite nelle sezioni dedicate del menu.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Mezzi nel campione
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {mezzi.length}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Mezzi disponibili
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {mezziDisponibili.length}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Batteria bassa
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {mezziBatteriaBassa.length}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Aree coperte
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {aree.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <MappaServizioMock
        aree={aree}
        mezzi={mezzi}
        modalita="amministrazione"
        mostraPuntiChiave={false}
      />
    </section>
  );
}
