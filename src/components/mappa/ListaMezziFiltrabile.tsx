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
  condizioneServizioSelezionata?: FiltroCondizioneServizio;
  onCondizioneServizioChange?: (valore: FiltroCondizioneServizio) => void;
  onApriSegnalazioneMezzo?: (mezzo: Mezzo) => void;
};

export type FiltroCondizioneServizio =
  | "TUTTE"
  | "DISPONIBILI"
  | "PRENOTATI"
  | "IN_USO"
  | "IN_PAUSA"
  | "IN_OSSERVAZIONE"
  | "BATTERIA_BASSA"
  | "IN_MANUTENZIONE"
  | "NON_DISPONIBILI"
  | "CRITICI";

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

const LABEL_CONDIZIONE_SERVIZIO: Record<FiltroCondizioneServizio, string> = {
  TUTTE: "Tutte",
  DISPONIBILI: "Disponibili",
  PRENOTATI: "Prenotati",
  IN_USO: "In uso",
  IN_PAUSA: "In pausa",
  IN_OSSERVAZIONE: "In osservazione",
  BATTERIA_BASSA: "Batteria bassa",
  IN_MANUTENZIONE: "In manutenzione",
  NON_DISPONIBILI: "Esclusi dal servizio",
  CRITICI: "Richiedono attenzione",
};

// Testi diversi per ruolo: aiutano a leggere i risultati in modo piu naturale.
const TESTI_RUOLO = {
  utente: {
    descrizione:
      "Affina la ricerca per trovare piu velocemente il mezzo giusto per il tuo spostamento.",
    risultatiSingolare: "mezzo disponibile compatibile con la tua selezione",
    risultatiPlurale: "mezzi disponibili compatibili con la tua selezione",
    campione: "mezzi disponibili nel campione attuale",
  },
  operatore: {
    descrizione:
      "Usa i filtri per isolare rapidamente i mezzi da monitorare o da prendere in carico.",
    risultatiSingolare: "mezzo corrisponde ai filtri operativi",
    risultatiPlurale: "mezzi corrispondono ai filtri operativi",
    campione: "mezzi monitorati nel campione operativo",
  },
  amministrazione: {
    descrizione:
      "Usa i filtri per leggere in modo piu chiaro disponibilita, utilizzo e condizioni del campione flotta.",
    risultatiSingolare: "mezzo rientra nella condizione di servizio selezionata",
    risultatiPlurale: "mezzi rientrano nella condizione di servizio selezionata",
    campione: "mezzi osservati nel campione istituzionale",
  },
} as const;

function combaciaFiltroCondizioneServizio(
  mezzo: Mezzo,
  filtroCondizione: FiltroCondizioneServizio,
): boolean {
  if (filtroCondizione === "TUTTE") {
    return true;
  }

  if (filtroCondizione === "DISPONIBILI") {
    return mezzo.stato === "DISPONIBILE";
  }

  if (filtroCondizione === "PRENOTATI") {
    return mezzo.stato === "PRENOTATO";
  }

  if (filtroCondizione === "IN_USO") {
    return mezzo.stato === "IN_USO";
  }

  if (filtroCondizione === "IN_PAUSA") {
    return mezzo.stato === "IN_PAUSA";
  }

  if (filtroCondizione === "IN_OSSERVAZIONE") {
    return ["PRENOTATO", "IN_USO", "IN_PAUSA"].includes(mezzo.stato);
  }

  if (filtroCondizione === "BATTERIA_BASSA") {
    return mezzo.batteria <= 25;
  }

  if (filtroCondizione === "IN_MANUTENZIONE") {
    return mezzo.stato === "IN_MANUTENZIONE";
  }

  if (filtroCondizione === "NON_DISPONIBILI") {
    return mezzo.stato === "NON_DISPONIBILE";
  }

  return (
    mezzo.stato === "IN_MANUTENZIONE" ||
    mezzo.stato === "NON_DISPONIBILE" ||
    mezzo.batteria <= 25
  );
}

// Lista condivisa di filtri riutilizzabile nelle diverse viste del modulo M-02.
export default function ListaMezziFiltrabile({
  mezzi,
  modalita,
  messaggioVuoto,
  condizioneServizioSelezionata,
  onCondizioneServizioChange,
  onApriSegnalazioneMezzo,
}: ListaMezziFiltrabileProps) {
  const [ricerca, setRicerca] = useState("");
  const [tipoSelezionato, setTipoSelezionato] = useState<string>("TUTTI");
  const [statoSelezionato, setStatoSelezionato] = useState<string>("TUTTI");
  const [patenteSelezionata, setPatenteSelezionata] =
    useState<string>("TUTTE");
  const [areaSelezionata, setAreaSelezionata] = useState<string>("TUTTE");
  const [condizioneSelezionata, setCondizioneSelezionata] =
    useState<FiltroCondizioneServizio>("TUTTE");
  const condizioneServizioEffettiva =
    condizioneServizioSelezionata ?? condizioneSelezionata;

  const ricercaDifferita = useDeferredValue(ricerca);
  const tipiDisponibili = Array.from(new Set(mezzi.map((mezzo) => mezzo.tipo)));
  const statiDisponibili = Array.from(
    new Set(mezzi.map((mezzo) => mezzo.stato)),
  );
  const patentiDisponibili = Array.from(
    new Set(mezzi.map((mezzo) => mezzo.patenteRichiesta)),
  );
  const areeDisponibili = Array.from(
    new Set(mezzi.map((mezzo) => mezzo.areaServizioNome)),
  );
  const haFiltriAttivi =
    ricerca.trim().length > 0 ||
    tipoSelezionato !== "TUTTI" ||
    statoSelezionato !== "TUTTI" ||
    patenteSelezionata !== "TUTTE" ||
    areaSelezionata !== "TUTTE" ||
    condizioneServizioEffettiva !== "TUTTE";

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
    const combaciaArea =
      areaSelezionata === "TUTTE" || mezzo.areaServizioNome === areaSelezionata;
    const combaciaCondizioneServizio = combaciaFiltroCondizioneServizio(
      mezzo,
      condizioneServizioEffettiva,
    );

    if (modalita === "utente") {
      return combaciaRicerca && combaciaTipo && combaciaPatente;
    }

    if (modalita === "amministrazione") {
      return (
        combaciaRicerca &&
        combaciaTipo &&
        combaciaArea &&
        combaciaCondizioneServizio
      );
    }

    return combaciaRicerca && combaciaTipo && combaciaStato && combaciaArea;
  });

  const testoRisultati =
    mezziFiltrati.length === 1
      ? TESTI_RUOLO[modalita].risultatiSingolare
      : TESTI_RUOLO[modalita].risultatiPlurale;
  const riepilogoCampione = `${mezziFiltrati.length} di ${mezzi.length} ${TESTI_RUOLO[modalita].campione}`;

  // Ogni chip consente di rimuovere rapidamente un filtro senza azzerare l'intera ricerca.
  const filtriAttivi = [
    tipoSelezionato !== "TUTTI"
      ? {
          id: "tipo",
          label: `Tipo: ${tipoSelezionato}`,
          onRemove: () => setTipoSelezionato("TUTTI"),
        }
      : null,
    modalita === "utente" && patenteSelezionata !== "TUTTE"
      ? {
          id: "patente",
          label: `Patente: ${patenteSelezionata}`,
          onRemove: () => setPatenteSelezionata("TUTTE"),
        }
      : null,
    modalita !== "utente" && statoSelezionato !== "TUTTI"
      ? {
          id: "stato",
          label: `Stato: ${LABEL_STATO[statoSelezionato as StatoMezzo]}`,
          onRemove: () => setStatoSelezionato("TUTTI"),
        }
      : null,
    modalita !== "utente" && areaSelezionata !== "TUTTE"
      ? {
          id: "area",
          label: `Area: ${areaSelezionata}`,
          onRemove: () => setAreaSelezionata("TUTTE"),
        }
      : null,
    modalita === "amministrazione" && condizioneServizioEffettiva !== "TUTTE"
      ? {
          id: "condizione-servizio",
          label: `Servizio: ${LABEL_CONDIZIONE_SERVIZIO[condizioneServizioEffettiva]}`,
          onRemove: () => {
            if (onCondizioneServizioChange) {
              onCondizioneServizioChange("TUTTE");
              return;
            }

            setCondizioneSelezionata("TUTTE");
          },
        }
      : null,
    ricerca.trim().length > 0
      ? {
          id: "ricerca",
          label: `Ricerca: ${ricerca.trim()}`,
          onRemove: () => setRicerca(""),
        }
      : null,
  ].filter(
    (filtro): filtro is { id: string; label: string; onRemove: () => void } =>
      filtro !== null,
  );

  // Ripristina i filtri iniziali senza costringere l'utente a cancellare ogni campo a mano.
  function resettaFiltri(): void {
    setRicerca("");
    setTipoSelezionato("TUTTI");
    setStatoSelezionato("TUTTI");
    setPatenteSelezionata("TUTTE");
    setAreaSelezionata("TUTTE");

    if (onCondizioneServizioChange) {
      onCondizioneServizioChange("TUTTE");
      return;
    }

    setCondizioneSelezionata("TUTTE");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)]">
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {mezziFiltrati.length} {testoRisultati}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              {TESTI_RUOLO[modalita].descrizione}
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              {riepilogoCampione}
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

        {filtriAttivi.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
            {filtriAttivi.map((filtro) => (
              <button
                key={filtro.id}
                type="button"
                onClick={filtro.onRemove}
                className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
              >
                <span>{filtro.label}</span>
                <span aria-hidden="true" className="text-[11px] leading-none">
                  x
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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
              {tipiDisponibili.map((tipo, index) => (
                <option key={`tipo-${tipo}-${index}`} value={tipo}>
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
                {patentiDisponibili.map((patente, index) => (
                  <option
                    key={`patente-${patente}-${index}`}
                    value={patente}
                  >
                    {LABEL_PATENTE[patente]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              {modalita === "operatore" ? (
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
                    {statiDisponibili.map((stato, index) => (
                      <option key={`stato-${stato}-${index}`} value={stato}>
                        {LABEL_STATO[stato]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="space-y-2">
                <label
                  htmlFor={`area-${modalita}`}
                  className="text-sm font-semibold text-slate-700"
                >
                  Area di servizio
                </label>
                <select
                  id={`area-${modalita}`}
                  value={areaSelezionata}
                  onChange={(event) => setAreaSelezionata(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                >
                  <option value="TUTTE">Tutte</option>
                  {areeDisponibili.map((area, index) => (
                    <option key={`area-${area}-${index}`} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {modalita === "amministrazione" ? (
                <div className="space-y-2">
                  <label
                    htmlFor={`condizione-servizio-${modalita}`}
                    className="text-sm font-semibold text-slate-700"
                  >
                    Condizione del servizio
                  </label>
                  <p className="text-xs leading-5 text-slate-500">
                    Raggruppa disponibilita, mezzi in uso e casi che richiedono
                    attenzione amministrativa.
                  </p>
                  <select
                    id={`condizione-servizio-${modalita}`}
                    value={condizioneServizioEffettiva}
                    onChange={(event) => {
                      const nuovoValore =
                        event.target.value as FiltroCondizioneServizio;

                      if (onCondizioneServizioChange) {
                        onCondizioneServizioChange(nuovoValore);
                        return;
                      }

                      setCondizioneSelezionata(nuovoValore);
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  >
                    {(
                      Object.entries(LABEL_CONDIZIONE_SERVIZIO) as Array<
                        [FiltroCondizioneServizio, string]
                      >
                    ).map(([valore, label]) => (
                      <option
                        key={`condizione-servizio-${modalita}-${valore}`}
                        value={valore}
                      >
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {mezziFiltrati.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {mezziFiltrati.map((mezzo) => (
            <MezzoCard
              key={mezzo.id}
              mezzo={mezzo}
              onApriSegnalazioneMezzo={
                modalita === "operatore" ? onApriSegnalazioneMezzo : undefined
              }
            />
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
