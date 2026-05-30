"use client";

import { useDeferredValue, useState } from "react";
import type {
  CategoriaPatenteRichiesta,
  Mezzo,
  StatoMezzo,
  TipoMezzo,
} from "@/types/mobilita";
import MezzoCard from "@/components/mappa/MezzoCard";

type ModalitaFiltri = "utente" | "operatore" | "amministrazione";

type ListaMezziFiltrabileProps = {
  mezzi: Mezzo[];
  modalita: ModalitaFiltri;
  messaggioVuoto: string;
};

const LABEL_TIPO: Record<TipoMezzo, string> = {
  "E-Bike": "E-Bike",
  "E-Scooter": "E-Scooter",
  "E-Car": "E-Car",
};

const LABEL_STATO: Record<StatoMezzo, string> = {
  DISPONIBILE: "Disponibile",
  PRENOTATO: "Prenotato",
  IN_USO: "In uso",
  IN_PAUSA: "In pausa",
  IN_MANUTENZIONE: "In manutenzione",
  NON_DISPONIBILE: "Non disponibile",
};

const LABEL_PATENTE: Record<CategoriaPatenteRichiesta, string> = {
  Nessuna: "Nessuna",
  AM: "AM",
  A1: "A1",
  A2: "A2",
  A: "A",
  B: "B",
};

// Lista condivisa di filtri riutilizzabile nelle diverse viste del modulo M-02.
export default function ListaMezziFiltrabile({
  mezzi,
  modalita,
  messaggioVuoto,
}: ListaMezziFiltrabileProps) {
  const [ricerca, setRicerca] = useState("");
  const [tipoSelezionato, setTipoSelezionato] = useState<string>("TUTTI");
  const [statoSelezionato, setStatoSelezionato] = useState<string>("TUTTI");
  const [patenteSelezionata, setPatenteSelezionata] =
    useState<string>("TUTTE");

  const ricercaDifferita = useDeferredValue(ricerca);
  const tipiDisponibili = Array.from(new Set(mezzi.map((mezzo) => mezzo.tipo)));
  const statiDisponibili = Array.from(
    new Set(mezzi.map((mezzo) => mezzo.stato)),
  );
  const patentiDisponibili = Array.from(
    new Set(mezzi.map((mezzo) => mezzo.patenteRichiesta)),
  );
  const haFiltriAttivi =
    ricerca.trim().length > 0 ||
    tipoSelezionato !== "TUTTI" ||
    statoSelezionato !== "TUTTI" ||
    patenteSelezionata !== "TUTTE";

  const mezziFiltrati = mezzi.filter((mezzo) => {
    const query = ricercaDifferita.trim().toLowerCase();
    const combaciaRicerca =
      query.length === 0 ||
      mezzo.modello.toLowerCase().includes(query) ||
      mezzo.codice.toLowerCase().includes(query);
    const combaciaTipo =
      tipoSelezionato === "TUTTI" || mezzo.tipo === tipoSelezionato;
    const combaciaStato =
      statoSelezionato === "TUTTI" || mezzo.stato === statoSelezionato;
    const combaciaPatente =
      patenteSelezionata === "TUTTE" ||
      mezzo.patenteRichiesta === patenteSelezionata;

    if (modalita === "utente") {
      return combaciaRicerca && combaciaTipo && combaciaPatente;
    }

    return combaciaRicerca && combaciaTipo && combaciaStato;
  });

  // Ripristina i filtri iniziali senza costringere l'utente a cancellare ogni campo a mano.
  function resettaFiltri(): void {
    setRicerca("");
    setTipoSelezionato("TUTTI");
    setStatoSelezionato("TUTTI");
    setPatenteSelezionata("TUTTE");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)]">
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {mezziFiltrati.length}{" "}
              {mezziFiltrati.length === 1 ? "mezzo trovato" : "mezzi trovati"}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              Affina la consultazione usando i filtri disponibili per questa
              vista.
            </p>
          </div>

          <button
            type="button"
            onClick={resettaFiltri}
            disabled={!haFiltriAttivi}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
          >
            Reset filtri
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <label
              htmlFor={`ricerca-${modalita}`}
              className="text-sm font-semibold text-slate-700"
            >
              Cerca mezzo
            </label>
            <input
              id={`ricerca-${modalita}`}
              type="text"
              value={ricerca}
              onChange={(event) => setRicerca(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder="Cerca per modello o codice"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor={`tipo-${modalita}`}
              className="text-sm font-semibold text-slate-700"
            >
              Tipo mezzo
            </label>
            <select
              id={`tipo-${modalita}`}
              value={tipoSelezionato}
              onChange={(event) => setTipoSelezionato(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            >
              <option value="TUTTI">Tutti</option>
              {tipiDisponibili.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {LABEL_TIPO[tipo]}
                </option>
              ))}
            </select>
          </div>

          {modalita === "utente" ? (
            <div className="space-y-2">
              <label
                htmlFor={`patente-${modalita}`}
                className="text-sm font-semibold text-slate-700"
              >
                Patente richiesta
              </label>
              <select
                id={`patente-${modalita}`}
                value={patenteSelezionata}
                onChange={(event) => setPatenteSelezionata(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              >
                <option value="TUTTE">Tutte</option>
                {patentiDisponibili.map((patente) => (
                  <option key={patente} value={patente}>
                    {LABEL_PATENTE[patente]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label
                htmlFor={`stato-${modalita}`}
                className="text-sm font-semibold text-slate-700"
              >
                Stato del mezzo
              </label>
              <select
                id={`stato-${modalita}`}
                value={statoSelezionato}
                onChange={(event) => setStatoSelezionato(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              >
                <option value="TUTTI">Tutti</option>
                {statiDisponibili.map((stato) => (
                  <option key={stato} value={stato}>
                    {LABEL_STATO[stato]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {mezziFiltrati.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {mezziFiltrati.map((mezzo) => (
            <MezzoCard key={mezzo.id} mezzo={mezzo} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-[0_18px_50px_-28px_rgba(15,23,42,0.22)]">
          <p className="text-lg font-semibold text-slate-950">
            Nessun mezzo corrisponde ai filtri selezionati
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {messaggioVuoto}
          </p>
        </div>
      )}
    </div>
  );
}
