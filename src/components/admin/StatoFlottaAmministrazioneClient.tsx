"use client";

import { useEffect, useState } from "react";
import AreaServizioCard from "@/components/mappa/AreaServizioCard";
import ListaMezziFiltrabile from "@/components/mappa/ListaMezziFiltrabile";
import type { AreaServizio, Mezzo } from "@/types/mobilita";

type StatoFlottaAmministrazioneClientProps = {
  aree: AreaServizio[];
  mezziIniziali: Mezzo[];
};

type FlottaAdminApiResponse = {
  errore?: string;
  mezzi?: Mezzo[];
};

// Questa vista sposta fuori dalla home la lettura dettagliata della flotta,
// cosi la dashboard iniziale della PA resta piu pulita e piu istituzionale.
export default function StatoFlottaAmministrazioneClient({
  aree,
  mezziIniziali,
}: StatoFlottaAmministrazioneClientProps) {
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
        // Manteniamo l'ultimo snapshot valido se il refresh fallisce.
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

  const distribuzioneTipi = [
    {
      label: "E-Bike",
      valore: mezzi.filter((mezzo) => mezzo.tipo === "E-Bike").length,
    },
    {
      label: "E-Scooter",
      valore: mezzi.filter((mezzo) => mezzo.tipo === "E-Scooter").length,
    },
    {
      label: "E-Car",
      valore: mezzi.filter((mezzo) => mezzo.tipo === "E-Car").length,
    },
  ];

  const riepilogoStati = [
    {
      label: "Disponibili",
      valore: mezzi.filter((mezzo) => mezzo.stato === "DISPONIBILE").length,
    },
    {
      label: "Prenotati",
      valore: mezzi.filter((mezzo) => mezzo.stato === "PRENOTATO").length,
    },
    {
      label: "In uso",
      valore: mezzi.filter((mezzo) => mezzo.stato === "IN_USO").length,
    },
    {
      label: "In pausa",
      valore: mezzi.filter((mezzo) => mezzo.stato === "IN_PAUSA").length,
    },
    {
      label: "Batteria bassa",
      valore: mezzi.filter((mezzo) => mezzo.batteria <= 25).length,
    },
    {
      label: "In manutenzione",
      valore: mezzi.filter((mezzo) => mezzo.stato === "IN_MANUTENZIONE").length,
    },
    {
      label: "Non disponibili",
      valore: mezzi.filter((mezzo) => mezzo.stato === "NON_DISPONIBILE").length,
    },
  ];

  return (
    <section className="space-y-5">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Stato flotta
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Qui leggi la distribuzione e lo stato attuale dei mezzi.
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Questa sezione raccoglie i dati che non devono appesantire la home
            iniziale della Pubblica Amministrazione.
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Distribuzione del campione
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Mezzi per tipologia
            </h2>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {distribuzioneTipi.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {item.valore}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Integrita del servizio
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Stato sintetico della flotta
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {riepilogoStati.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="text-lg font-semibold text-slate-950">
                  {item.valore}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Consultazione filtrata
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Lettura mirata del campione flotta
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Qui puoi leggere piu nel dettaglio il campione mezzi senza tenere
            tutto nella schermata iniziale.
          </p>
        </div>

        <ListaMezziFiltrabile
          mezzi={mezzi}
          modalita="amministrazione"
          messaggioVuoto="Prova a modificare i filtri per continuare la lettura del campione flotta."
        />
      </section>

      <section className="space-y-4 pb-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Copertura urbana
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Zone di servizio osservate
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Le aree restano disponibili anche qui per leggere la copertura del
            servizio insieme alla situazione corrente della flotta.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {aree.map((area) => (
            <AreaServizioCard key={area.id} area={area} />
          ))}
        </div>
      </section>
    </section>
  );
}
