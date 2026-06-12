"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { MonitoraggioNoleggioUtente } from "@/types/noleggio";
import {
  calcolaCostoPausaTotaleCent,
  calcolaCostoUtilizzoTotaleCent,
  COSTO_SBLOCCO_CENT,
} from "@/lib/tariffe-noleggio";

type FormDataMonitoraggio = {
  email: string;
};

type StatoMessaggio =
  | { tipo: "errore"; testo: string }
  | { tipo: "successo"; testo: string }
  | null;

type MezzoSintetico = {
  id: string;
  codice: string;
  tipo: string;
  modello: string;
  areaServizioNome: string;
} | null;

type MonitoraggioApiResponse = {
  errore?: string;
  messaggio?: string;
  monitoraggio?: MonitoraggioNoleggioUtente & {
    prenotazione: (MonitoraggioNoleggioUtente["prenotazione"] & {
      mezzo?: MezzoSintetico;
    }) | null;
    corsa: (MonitoraggioNoleggioUtente["corsa"] & {
      mezzo?: MezzoSintetico;
    }) | null;
  };
};

type MonitoraggioRicerca =
  | MonitoraggioApiResponse["monitoraggio"]
  | null;

const INITIAL_FORM_DATA: FormDataMonitoraggio = {
  email: "",
};

function validaForm(data: FormDataMonitoraggio): string | null {
  if (!data.email.trim()) {
    return "Inserisci l'email dell'utente da monitorare.";
  }

  return null;
}

function formattaData(data: Date | string | null): string {
  if (!data) {
    return "Non disponibile";
  }

  return new Date(data).toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formattaImportoCent(cent: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cent / 100);
}

function formattaDurata(durataMillisecondi: number): string {
  const totaleSecondi = Math.max(Math.floor(durataMillisecondi / 1000), 0);
  const ore = Math.floor(totaleSecondi / 3600);
  const minuti = Math.floor((totaleSecondi % 3600) / 60);
  const secondi = totaleSecondi % 60;

  if (ore > 0) {
    return `${ore}h ${String(minuti).padStart(2, "0")}m ${String(secondi).padStart(2, "0")}s`;
  }

  return `${minuti}m ${String(secondi).padStart(2, "0")}s`;
}

function descriviStatoMonitoraggio(
  stato: MonitoraggioNoleggioUtente["statoMonitoraggio"],
): {
  titolo: string;
  descrizione: string;
  className: string;
} {
  if (stato === "PRENOTAZIONE_ATTIVA") {
    return {
      titolo: "Prenotazione attiva",
      descrizione:
        "L'utente ha bloccato un mezzo ma non ha ancora iniziato la corsa.",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }

  if (stato === "CORSA_ATTIVA") {
    return {
      titolo: "Corsa attiva",
      descrizione:
        "Il mezzo e in utilizzo e l'operatore puo seguirne lo stato corrente.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    };
  }

  if (stato === "CORSA_IN_PAUSA") {
    return {
      titolo: "Corsa in pausa",
      descrizione:
        "La corsa e sospesa temporaneamente e il mezzo resta associato all'utente.",
      className: "border-sky-200 bg-sky-50 text-sky-900",
    };
  }

  return {
    titolo: "Nessun noleggio attivo",
    descrizione:
      "Al momento l'utente non ha una prenotazione aperta e non sta usando un mezzo.",
    className: "border-slate-200 bg-slate-50 text-slate-900",
  };
}

export default function MonitoraggioNoleggioUtente() {
  // Gli stati locali permettono all'operatore di cercare rapidamente un utente
  // e leggere subito il risultato del monitoraggio senza ricaricare la pagina.
  const [formData, setFormData] = useState<FormDataMonitoraggio>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messaggio, setMessaggio] = useState<StatoMessaggio>(null);
  const [monitoraggio, setMonitoraggio] = useState<MonitoraggioRicerca>(null);
  const [ultimaEmailMonitorata, setUltimaEmailMonitorata] = useState("");
  const [ultimoAggiornamento, setUltimoAggiornamento] = useState<Date | null>(null);
  const [adesso, setAdesso] = useState(() => Date.now());

  function aggiornaCampo(campo: keyof FormDataMonitoraggio, valore: string) {
    setFormData((currentData) => ({
      ...currentData,
      [campo]: valore,
    }));
  }

  const eseguiRicerca = useCallback(
    async (email: string, aggiornaMessaggioSuccesso: boolean) => {
      setMessaggio(null);
      setIsSubmitting(true);

      try {
        const response = await fetch("/api/noleggio/monitoraggio/utenti", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        });

        const result =
          (await response.json().catch(() => null)) as MonitoraggioApiResponse | null;

        if (!response.ok) {
          setMonitoraggio(null);
          setMessaggio({
            tipo: "errore",
            testo:
              result?.errore ??
              "Monitoraggio non disponibile in questo momento. Riprova tra poco.",
          });
          return;
        }

        setMonitoraggio(result?.monitoraggio ?? null);
        setUltimaEmailMonitorata(email);
        setUltimoAggiornamento(new Date());

        if (aggiornaMessaggioSuccesso) {
          setMessaggio({
            tipo: "successo",
            testo:
              result?.messaggio ??
              "Stato noleggio recuperato con successo.",
          });
        }
      } catch {
        setMonitoraggio(null);
        setMessaggio({
          tipo: "errore",
          testo:
            "Impossibile contattare il server in questo momento. Verifica che l'applicazione sia avviata e riprova.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = formData.email.trim();
    const erroreValidazione = validaForm({ email });

    if (erroreValidazione) {
      setMessaggio({ tipo: "errore", testo: erroreValidazione });
      return;
    }

    await eseguiRicerca(email, true);
  }

  const statoDescrittivo = useMemo(
    () =>
      monitoraggio
        ? descriviStatoMonitoraggio(monitoraggio.statoMonitoraggio)
        : null,
    [monitoraggio],
  );

  const mezzoDaMostrare = monitoraggio?.corsa?.mezzo ?? monitoraggio?.prenotazione?.mezzo;
  const dettaglioCorsa = useMemo(() => {
    if (!monitoraggio?.corsa) {
      return null;
    }

    const corsa = monitoraggio.corsa;
    const durataUtilizzoStimata =
      corsa.durataUtilizzoMs +
      (corsa.stato === "ATTIVA"
        ? Math.max(adesso - new Date(corsa.ultimaRipresaAt).getTime(), 0)
        : 0);
    const durataPausaStimata =
      corsa.durataPausaMs +
      (corsa.stato === "IN_PAUSA" && corsa.pausaIniziataAt
        ? Math.max(adesso - new Date(corsa.pausaIniziataAt).getTime(), 0)
        : 0);
    const costoSbloccoCent = COSTO_SBLOCCO_CENT;
    const costoUtilizzoCent =
      calcolaCostoUtilizzoTotaleCent(durataUtilizzoStimata);
    const costoPausaCent = calcolaCostoPausaTotaleCent(durataPausaStimata);

    return {
      durataUtilizzoStimata,
      durataPausaStimata,
      costoSbloccoCent,
      costoUtilizzoCent,
      costoPausaCent,
      costoTotaleCent:
        costoSbloccoCent + costoUtilizzoCent + costoPausaCent,
    };
  }, [adesso, monitoraggio]);

  // Dopo una ricerca valida teniamo il monitoraggio in aggiornamento automatico.
  useEffect(() => {
    if (!ultimaEmailMonitorata) {
      return;
    }

    const intervallo = window.setInterval(() => {
      void eseguiRicerca(ultimaEmailMonitorata, false);
    }, 5000);

    return () => {
      window.clearInterval(intervallo);
    };
  }, [eseguiRicerca, ultimaEmailMonitorata]);

  useEffect(() => {
    if (!monitoraggio?.corsa) {
      return;
    }

    const intervallo = window.setInterval(() => {
      setAdesso(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervallo);
    };
  }, [monitoraggio]);

  return (
    <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
        {/* Il form iniziale riduce il flusso al minimo necessario: l'operatore
            inserisce l'email utente e riceve subito lo stato del noleggio. */}
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Monitoraggio noleggio
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Cerca un utente
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Inserisci l&apos;email dell&apos;utente per verificare se ha una
            prenotazione aperta oppure una corsa attiva.
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="monitoraggio-email"
            >
              Email utente
            </label>
            <input
              id="monitoraggio-email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(event) => aggiornaCampo("email", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              placeholder="utente@email.it"
              required
            />
          </div>

          {ultimaEmailMonitorata ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p>
                Monitoraggio attivo su <span className="font-semibold">{ultimaEmailMonitorata}</span>
              </p>
              <p className="mt-1 text-slate-600">
                Ultimo aggiornamento: {formattaData(ultimoAggiornamento)}
              </p>
            </div>
          ) : null}

          {messaggio ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                messaggio.tipo === "successo"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
              aria-live="polite"
            >
              {messaggio.testo}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Ricerca in corso..." : "Verifica stato noleggio"}
            </button>

            <button
              type="button"
              disabled={isSubmitting || !ultimaEmailMonitorata}
              onClick={() => {
                if (ultimaEmailMonitorata) {
                  void eseguiRicerca(ultimaEmailMonitorata, true);
                }
              }}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Aggiorna adesso
            </button>
          </div>
        </form>
      </article>

      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
        {/* Il pannello risultato resta semplice: mostra prima lo stato globale,
            poi il dettaglio essenziale di utente, mezzo e tempi del noleggio. */}
        {!monitoraggio || !statoDescrittivo ? (
          <div className="flex h-full min-h-[320px] flex-col justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Stato utente
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Nessuna ricerca ancora eseguita
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Dopo la ricerca qui compariranno lo stato del noleggio e i
              dettagli principali utili al monitoraggio operativo.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className={`rounded-3xl border px-5 py-4 ${statoDescrittivo.className}`}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">
                Stato corrente
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {statoDescrittivo.titolo}
              </h2>
              <p className="mt-2 text-sm leading-6">
                {statoDescrittivo.descrizione}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Utente monitorato
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-950">
                  {monitoraggio.utente.nome} {monitoraggio.utente.cognome}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {monitoraggio.utente.email}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Mezzo coinvolto
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-950">
                  {mezzoDaMostrare
                    ? `${mezzoDaMostrare.modello} (${mezzoDaMostrare.codice})`
                    : "Nessun mezzo attivo"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {mezzoDaMostrare
                    ? `${mezzoDaMostrare.tipo} · ${mezzoDaMostrare.areaServizioNome}`
                    : "Non ci sono mezzi associati in questo momento."}
                </p>
              </div>
            </div>

            {monitoraggio.prenotazione ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Prenotazione
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Apertura
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {formattaData(monitoraggio.prenotazione.prenotataAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Scadenza
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {formattaData(monitoraggio.prenotazione.scadeAt)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {monitoraggio.corsa ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Corsa
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Inizio corsa
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {formattaData(monitoraggio.corsa.iniziataAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Inizio pausa
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {formattaData(monitoraggio.corsa.pausaIniziataAt)}
                    </p>
                  </div>
                </div>

                {monitoraggio.corsa.posizioneInizio ? (
                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-950">
                      Posizione iniziale registrata
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {monitoraggio.corsa.posizioneInizio.latitudine.toFixed(5)}
                      {", "}
                      {monitoraggio.corsa.posizioneInizio.longitudine.toFixed(5)}
                    </p>
                  </div>
                ) : null}

                {dettaglioCorsa ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">
                        Tempo di utilizzo
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formattaDurata(dettaglioCorsa.durataUtilizzoStimata)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">
                        Tempo in pausa
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formattaDurata(dettaglioCorsa.durataPausaStimata)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">
                        Costo attuale
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formattaImportoCent(dettaglioCorsa.costoTotaleCent)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">
                        Dettaglio costo
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formattaImportoCent(dettaglioCorsa.costoSbloccoCent)} sblocco,{" "}
                        {formattaImportoCent(dettaglioCorsa.costoUtilizzoCent)} utilizzo,{" "}
                        {formattaImportoCent(dettaglioCorsa.costoPausaCent)} pausa
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </article>
    </section>
  );
}
