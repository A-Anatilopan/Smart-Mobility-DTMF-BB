import type { Metadata } from "next";
import MappaServizioMock from "@/components/mappa/MappaServizioMock";
import {
  areeServizioMock,
  mezziMock,
  posizioneUtenteMappaMock,
} from "@/lib/mappa/mock-data";

// Metadati pubblici della prima schermata del modulo M-02.
export const metadata: Metadata = {
  title: "Mezzi Disponibili | E-Smart Mobility",
  description:
    "Consulta i mezzi disponibili e le aree di servizio del sistema E-Smart Mobility.",
};

export default function MezziPage() {
  // La vista utente mostra solo i mezzi effettivamente disponibili al noleggio.
  const mezziDisponibili = mezziMock.filter(
    (mezzo) => mezzo.stato === "DISPONIBILE",
  );
  const conteggioPerTipo = {
    eBike: mezziDisponibili.filter((mezzo) => mezzo.tipo === "E-Bike").length,
    eScooter: mezziDisponibili.filter((mezzo) => mezzo.tipo === "E-Scooter")
      .length,
    eCar: mezziDisponibili.filter((mezzo) => mezzo.tipo === "E-Car").length,
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.15),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Hero introduttivo: presenta all'utente i mezzi consultabili in questa fase. */}
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-5">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
                E-Smart Mobility
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Scegli il mezzo giusto per i tuoi spostamenti in citta.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300">
                  Questa schermata iniziale ti permette di consultare i mezzi
                  attualmente disponibili, le loro caratteristiche principali e
                  le aree gia coperte dal servizio di mobilita condivisa.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-teal-200">
                  E-Bike disponibili
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {conteggioPerTipo.eBike}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-teal-200">
                  E-Scooter disponibili
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {conteggioPerTipo.eScooter}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-teal-200">
                  E-Car disponibili
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {conteggioPerTipo.eCar}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Base cartografica pubblica: mostra subito copertura e mezzi disponibili. */}
        <MappaServizioMock
          aree={areeServizioMock}
          mezzi={mezziDisponibili}
          modalita="utente"
          posizioneUtente={posizioneUtenteMappaMock}
        />
      </div>
    </main>
  );
}
