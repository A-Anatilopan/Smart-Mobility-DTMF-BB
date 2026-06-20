"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type {
  MonitoraggioNoleggioUtente,
  RiepilogoMonitoraggioOperatore,
} from "@/types/noleggio";
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
  esito?: string;
  monitoraggio?: MonitoraggioNoleggioUtente & {
    prenotazione: (MonitoraggioNoleggioUtente["prenotazione"] & {
      mezzo?: MezzoSintetico;
    }) | null;
    corsa: (MonitoraggioNoleggioUtente["corsa"] & {
      mezzo?: MezzoSintetico;
    }) | null;
  };
};

type SospensioneApiResponse = {
  errore?: string;
  messaggio?: string;
  esito?: string;
  utente?: {
    id: number;
    nome: string;
    cognome: string;
    email: string;
    ruolo: string;
    stato: string;
  } | null;
  monitoraggio?: MonitoraggioRicerca;
};

type AzioneAccountOperatore = "sospendi" | "riattiva";

type MonitoraggioAttivoApiResponse = {
  errore?: string;
  messaggio?: string;
  monitoraggi?: Array<
    RiepilogoMonitoraggioOperatore & {
      prenotazione: (RiepilogoMonitoraggioOperatore["prenotazione"] & {
        mezzo?: MezzoSintetico;
      }) | null;
      corsa: (RiepilogoMonitoraggioOperatore["corsa"] & {
        mezzo?: MezzoSintetico;
      }) | null;
    }
  >;
};

type BloccoRemotoApiResponse = {
  errore?: string;
  messaggio?: string;
  corsa?: MonitoraggioNoleggioUtente["corsa"] | null;
};

type MonitoraggioRicerca = MonitoraggioApiResponse["monitoraggio"] | null;
type MonitoraggioAttivoConMezzo = NonNullable<
  MonitoraggioAttivoApiResponse["monitoraggi"]
>[number];

type MonitoraggioNoleggioUtenteProps = {
  monitoraggiAttiviIniziali: MonitoraggioAttivoConMezzo[];
};

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

function calcolaDettaglioCorsaLive(
  corsa: NonNullable<MonitoraggioNoleggioUtente["corsa"]>,
  adesso: number,
) {
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
}

function formattaTempoResiduo(dataScadenza: Date | string, adesso: number): string {
  const residuo = Math.max(new Date(dataScadenza).getTime() - adesso, 0);

  if (residuo === 0) {
    return "Scaduta";
  }

  return formattaDurata(residuo);
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

function descriviStatoAccount(stato: string): {
  etichetta: string;
  descrizione: string;
  className: string;
} {
  if (stato === "SOSPESO") {
    return {
      etichetta: "Account sospeso",
      descrizione:
        "L'accesso e bloccato e tutte le sessioni dell'utente sono gia state chiuse.",
      className: "border-rose-200 bg-rose-50 text-rose-800",
    };
  }

  return {
    etichetta: "Account attivo",
    descrizione:
      "L'utente puo ancora accedere al servizio finche l'operatore non applica una sospensione.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
}

function valutaAzioneSospensione(
  monitoraggio: MonitoraggioRicerca,
): {
  consentita: boolean;
  azione: AzioneAccountOperatore;
  etichettaBottone: string;
  titolo: string;
  descrizione: string;
} {
  if (!monitoraggio) {
    return {
      consentita: false,
      azione: "sospendi",
      etichettaBottone: "Sospendi account",
      titolo: "Ricerca necessaria",
      descrizione:
        "Cerca prima un utente per capire se l'account puo essere sospeso.",
    };
  }

  if (!["Utente", "UTENTE"].includes(monitoraggio.utente.ruolo)) {
    return {
      consentita: false,
      azione: "sospendi",
      etichettaBottone: "Sospendi account",
      titolo: "Account non sospendibile da qui",
      descrizione:
        "Questa azione e riservata agli account utente del servizio e non alle aree operatore o amministrazione.",
    };
  }

  if (monitoraggio.utente.stato === "SOSPESO") {
    return {
      consentita: true,
      azione: "riattiva",
      etichettaBottone: "Riattiva account",
      titolo: "Account riattivabile",
      descrizione:
        "L'accesso e bloccato, ma l'operatore puo rimuovere la sospensione e riportare l'account allo stato attivo.",
    };
  }

  if (
    monitoraggio.statoMonitoraggio === "CORSA_ATTIVA" ||
    monitoraggio.statoMonitoraggio === "CORSA_IN_PAUSA"
  ) {
    return {
      consentita: false,
      azione: "sospendi",
      etichettaBottone: "Sospendi account",
      titolo: "Sospensione bloccata dalla corsa",
      descrizione:
        "Prima bisogna chiudere o risolvere la corsa aperta, altrimenti l'account non puo essere sospeso in modo coerente.",
    };
  }

  if (monitoraggio.statoMonitoraggio === "PRENOTAZIONE_ATTIVA") {
    return {
      consentita: true,
      azione: "sospendi",
      etichettaBottone: "Sospendi account",
      titolo: "Sospensione con annullamento prenotazione",
      descrizione:
        "Se sospendi l'account mentre la prenotazione e ancora aperta, il sistema annulla automaticamente la prenotazione prima di bloccare l'accesso.",
    };
  }

  return {
    consentita: true,
    azione: "sospendi",
    etichettaBottone: "Sospendi account",
    titolo: "Account sospendibile",
    descrizione:
      "Non risultano prenotazioni o corse aperte, quindi l'operatore puo sospendere l'accesso in sicurezza.",
  };
}

// Questa vista unisce ricerca mirata e panoramica attiva, cosi OP.05 non
// dipende solo da una email inserita a mano ma offre anche un quadro operativo.
export default function MonitoraggioNoleggioUtente({
  monitoraggiAttiviIniziali,
}: MonitoraggioNoleggioUtenteProps) {
  const [formData, setFormData] = useState<FormDataMonitoraggio>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [isRemoteBlocking, setIsRemoteBlocking] = useState(false);
  const [notaBloccoRemoto, setNotaBloccoRemoto] = useState("");
  const [corsaRemotaInCorsoId, setCorsaRemotaInCorsoId] = useState<number | null>(
    null,
  );
  const [noteBloccoRapido, setNoteBloccoRapido] = useState<
    Record<number, string>
  >({});
  const [messaggio, setMessaggio] = useState<StatoMessaggio>(null);
  const [monitoraggio, setMonitoraggio] = useState<MonitoraggioRicerca>(null);
  const [monitoraggiAttivi, setMonitoraggiAttivi] = useState(
    monitoraggiAttiviIniziali,
  );
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
              result?.messaggio ?? "Stato noleggio recuperato con successo.",
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

  const aggiornaMonitoraggiAttivi = useCallback(async () => {
    try {
      const response = await fetch("/api/noleggio/monitoraggio/attivi", {
        method: "GET",
      });

      const result =
        (await response.json().catch(() => null)) as
          | MonitoraggioAttivoApiResponse
          | null;

      if (!response.ok) {
        return;
      }

      setMonitoraggiAttivi(result?.monitoraggi ?? []);
    } catch {
      // Manteniamo l'ultimo stato valido senza mostrare errori ripetuti durante
      // l'aggiornamento automatico della panoramica.
    }
  }, []);

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

  const mezzoDaMostrare =
    monitoraggio?.corsa?.mezzo ?? monitoraggio?.prenotazione?.mezzo;
  const statoAccount = useMemo(
    () =>
      monitoraggio ? descriviStatoAccount(monitoraggio.utente.stato) : null,
    [monitoraggio],
  );
  const azioneSospensione = useMemo(
    () => valutaAzioneSospensione(monitoraggio),
    [monitoraggio],
  );

  const corseAperte = useMemo(
    () =>
      monitoraggiAttivi.filter(
        (voce) =>
          voce.statoMonitoraggio === "CORSA_ATTIVA" ||
          voce.statoMonitoraggio === "CORSA_IN_PAUSA",
      ),
    [monitoraggiAttivi],
  );

  const prenotazioniAperte = useMemo(
    () =>
      monitoraggiAttivi.filter(
        (voce) => voce.statoMonitoraggio === "PRENOTAZIONE_ATTIVA",
      ),
    [monitoraggiAttivi],
  );

  const dettaglioCorsa = useMemo(() => {
    if (!monitoraggio?.corsa) {
      return null;
    }

    return calcolaDettaglioCorsaLive(monitoraggio.corsa, adesso);
  }, [adesso, monitoraggio]);

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
    const intervallo = window.setInterval(() => {
      void aggiornaMonitoraggiAttivi();
    }, 5000);

    return () => {
      window.clearInterval(intervallo);
    };
  }, [aggiornaMonitoraggiAttivi]);

  useEffect(() => {
    if (!monitoraggio?.corsa && corseAperte.length === 0) {
      return;
    }

    const intervallo = window.setInterval(() => {
      setAdesso(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervallo);
    };
  }, [corseAperte.length, monitoraggio]);

  async function handleAzioneAccount() {
    if (!monitoraggio) {
      return;
    }

    setMessaggio(null);
    setIsSuspending(true);

    try {
      const response = await fetch("/api/operatori/utenti/sospensione", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          utenteId: monitoraggio.utente.id,
          email: monitoraggio.utente.email,
          azione: azioneSospensione.azione,
        }),
      });

      const result =
        (await response.json().catch(() => null)) as SospensioneApiResponse | null;

      if (!response.ok) {
        if (result?.monitoraggio) {
          setMonitoraggio(result.monitoraggio);
        }

        setMessaggio({
          tipo: "errore",
          testo:
            result?.errore ??
            "Operazione account non riuscita. Controlla lo stato corrente e riprova.",
        });
        return;
      }

      if (monitoraggio.utente.email) {
        await eseguiRicerca(monitoraggio.utente.email, false);
      }

      await aggiornaMonitoraggiAttivi();

      setMessaggio({
        tipo: "successo",
        testo:
          result?.messaggio ??
          "Operazione account completata con successo.",
      });
    } catch {
      setMessaggio({
        tipo: "errore",
        testo:
          "Impossibile contattare il server in questo momento. Riprova tra poco.",
      });
    } finally {
      setIsSuspending(false);
    }
  }

  async function eseguiBloccoRemotoCorsa(input: {
    corsaId: number;
    emailUtente: string;
    notaOperatore: string;
  }) {
    const notaPulita = input.notaOperatore.trim();

    if (notaPulita.length < 10) {
      setMessaggio({
        tipo: "errore",
        testo:
          "Inserisci una nota operativa piu chiara prima di chiudere la corsa da remoto.",
      });
      return;
    }

    setMessaggio(null);
    setIsRemoteBlocking(true);
    setCorsaRemotaInCorsoId(input.corsaId);

    try {
      const response = await fetch(
        `/api/operatori/corse/${input.corsaId}/blocco-remoto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notaOperatore: notaPulita,
          }),
        },
      );

      const result =
        (await response.json().catch(() => null)) as BloccoRemotoApiResponse | null;

      if (!response.ok) {
        setMessaggio({
          tipo: "errore",
          testo:
            result?.errore ??
            "Blocco remoto non riuscito. Controlla lo stato della corsa e riprova.",
        });
        return;
      }

      setNotaBloccoRemoto("");
      setNoteBloccoRapido((currentValue) => ({
        ...currentValue,
        [input.corsaId]: "",
      }));
      await eseguiRicerca(input.emailUtente, false);
      await aggiornaMonitoraggiAttivi();

      setMessaggio({
        tipo: "successo",
        testo:
          result?.messaggio ??
          "Corsa chiusa da remoto con successo.",
      });
    } catch {
      setMessaggio({
        tipo: "errore",
        testo:
          "Impossibile contattare il server in questo momento. Riprova tra poco.",
      });
    } finally {
      setIsRemoteBlocking(false);
      setCorsaRemotaInCorsoId(null);
    }
  }

  async function handleBloccoRemotoCorsa() {
    if (!monitoraggio?.corsa) {
      return;
    }

    await eseguiBloccoRemotoCorsa({
      corsaId: monitoraggio.corsa.id,
      emailUtente: monitoraggio.utente.email,
      notaOperatore: notaBloccoRemoto,
    });
  }

  return (
    <section className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Gestione utente
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Cerca un utente specifico
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Usa questa ricerca quando devi controllare lo stato noleggio di
              una persona e capire subito se l&apos;account puo essere sospeso.
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
                  Monitoraggio attivo su{" "}
                  <span className="font-semibold">{ultimaEmailMonitorata}</span>
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
                disabled={isSubmitting || isSuspending}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Ricerca in corso..." : "Verifica stato noleggio"}
              </button>

              <button
                type="button"
                disabled={isSubmitting || isSuspending || !ultimaEmailMonitorata}
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
          {!monitoraggio || !statoDescrittivo ? (
            <div className="flex h-full min-h-[320px] flex-col justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Dettaglio utente
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Nessuna ricerca ancora eseguita
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Dopo la ricerca qui vedrai subito stato attuale, mezzo coinvolto
                e dettagli principali utili al controllo operativo.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div
                className={`rounded-3xl border px-5 py-4 ${statoDescrittivo.className}`}
              >
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
                  <p className="mt-2 text-sm text-slate-500">
                    Ruolo: {monitoraggio.utente.ruolo}
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

              {statoAccount ? (
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div
                    className={`rounded-3xl border px-5 py-4 ${statoAccount.className}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                      Stato account
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">
                      {statoAccount.etichetta}
                    </h3>
                    <p className="mt-2 text-sm leading-6">
                      {statoAccount.descrizione}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Sospensione account
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                      {azioneSospensione.titolo}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {azioneSospensione.descrizione}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void handleAzioneAccount();
                      }}
                      disabled={
                        isSubmitting ||
                        isSuspending ||
                        !monitoraggio ||
                        !azioneSospensione.consentita
                      }
                      className={`mt-4 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 ${
                        azioneSospensione.azione === "riattiva"
                          ? "bg-emerald-600 hover:bg-emerald-500"
                          : "bg-rose-600 hover:bg-rose-500"
                      }`}
                    >
                      {isSuspending
                        ? azioneSospensione.azione === "riattiva"
                          ? "Riattivazione in corso..."
                          : "Sospensione in corso..."
                        : azioneSospensione.etichettaBottone}
                    </button>
                  </div>
                </div>
              ) : null}

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
                          {formattaImportoCent(dettaglioCorsa.costoSbloccoCent)}{" "}
                          sblocco,{" "}
                          {formattaImportoCent(dettaglioCorsa.costoUtilizzoCent)}{" "}
                          utilizzo,{" "}
                          {formattaImportoCent(dettaglioCorsa.costoPausaCent)} pausa
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 rounded-3xl border border-slate-200 bg-white/85 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Blocco remoto assistito
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                      Chiudi la corsa a distanza solo quando serve assistenza
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Usa questa azione quando l&apos;utente non riesce a
                      completare la chiusura del noleggio dal proprio flusso.
                      Il mezzo verra bloccato da remoto, la corsa si chiudera e
                      l&apos;intervento restera tracciato con la nota operativa.
                    </p>

                    <div className="mt-4 space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-700"
                        htmlFor="nota-blocco-remoto"
                      >
                        Nota operativa
                      </label>
                      <textarea
                        id="nota-blocco-remoto"
                        value={notaBloccoRemoto}
                        onChange={(event) =>
                          setNotaBloccoRemoto(event.target.value)
                        }
                        className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        placeholder="Spiega in breve perche stai chiudendo la corsa da remoto."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        void handleBloccoRemotoCorsa();
                      }}
                      disabled={isSubmitting || isRemoteBlocking || isSuspending}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isRemoteBlocking
                        ? "Blocco remoto in corso..."
                        : "Blocca da remoto e chiudi corsa"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Gestione Utente e Corse
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Panoramica dei noleggi aperti
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Qui controlli subito chi ha un mezzo prenotato e chi sta ancora
              usando il servizio, senza dover partire ogni volta da una ricerca
              manuale.
            </p>
          </div>

          <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Corse aperte
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {corseAperte.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Prenotazioni aperte
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {prenotazioniAperte.length}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <article className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Corse attive o in pausa
            </p>
            {corseAperte.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-white/70 px-4 py-5 text-sm leading-6 text-slate-600">
                In questo momento non risultano corse attive o in pausa.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {corseAperte.map((voce) => {
                  if (!voce.corsa) {
                    return null;
                  }

                  const dettaglioLive = calcolaDettaglioCorsaLive(
                    voce.corsa,
                    adesso,
                  );

                  return (
                    <div
                      key={`corsa-${voce.corsa.id ?? voce.utente.id}`}
                      className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {voce.utente.nome} {voce.utente.cognome}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {voce.utente.email}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                          {voce.statoMonitoraggio === "CORSA_IN_PAUSA"
                            ? "In pausa"
                            : "Corsa attiva"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Mezzo
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {voce.corsa.mezzo
                              ? `${voce.corsa.mezzo.modello} (${voce.corsa.mezzo.codice})`
                              : voce.corsa.mezzoId}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Inizio
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {formattaData(voce.corsa.iniziataAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Area
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {voce.corsa.mezzo?.areaServizioNome ?? "Non disponibile"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Utilizzo corrente
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {formattaDurata(dettaglioLive.durataUtilizzoStimata)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          Assistenza remota
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Se l&apos;utente non riesce a chiudere la corsa,
                          puoi bloccare il mezzo da remoto e terminare il
                          noleggio direttamente da questa lista.
                        </p>
                        <div className="mt-3 space-y-2">
                          <label
                            className="text-sm font-semibold text-slate-700"
                            htmlFor={`nota-blocco-rapido-${voce.corsa.id}`}
                          >
                            Nota operativa
                          </label>
                          <textarea
                            id={`nota-blocco-rapido-${voce.corsa.id}`}
                            value={noteBloccoRapido[voce.corsa.id] ?? ""}
                            onChange={(event) =>
                              setNoteBloccoRapido((currentValue) => ({
                                ...currentValue,
                                [voce.corsa!.id]: event.target.value,
                              }))
                            }
                            className="min-h-[96px] w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                            placeholder="Descrivi in breve perche stai chiudendo la corsa da remoto."
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            void eseguiBloccoRemotoCorsa({
                              corsaId: voce.corsa!.id,
                              emailUtente: voce.utente.email,
                              notaOperatore:
                                noteBloccoRapido[voce.corsa!.id] ?? "",
                            });
                          }}
                          disabled={
                            isSubmitting ||
                            isSuspending ||
                            isRemoteBlocking
                          }
                          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {isRemoteBlocking &&
                          corsaRemotaInCorsoId === voce.corsa.id
                            ? "Blocco remoto in corso..."
                            : "Blocca da remoto e chiudi corsa"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              Prenotazioni aperte
            </p>
            {prenotazioniAperte.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-white/70 px-4 py-5 text-sm leading-6 text-slate-600">
                In questo momento non risultano prenotazioni aperte.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {prenotazioniAperte.map((voce) => (
                  <div
                    key={`prenotazione-${voce.prenotazione?.id ?? voce.utente.id}`}
                    className="rounded-2xl border border-amber-100 bg-white/80 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {voce.utente.nome} {voce.utente.cognome}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {voce.utente.email}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                        Prenotazione attiva
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Mezzo
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {voce.prenotazione?.mezzo
                            ? `${voce.prenotazione.mezzo.modello} (${voce.prenotazione.mezzo.codice})`
                            : voce.prenotazione?.mezzoId}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Scadenza
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {formattaData(voce.prenotazione?.scadeAt ?? null)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Tempo residuo
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {voce.prenotazione?.scadeAt
                            ? formattaTempoResiduo(
                                voce.prenotazione.scadeAt,
                                adesso,
                              )
                            : "Non disponibile"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Area
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {voce.prenotazione?.mezzo?.areaServizioNome ??
                            "Non disponibile"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </section>
  );
}
