"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AnagraficaUtenteAmministrazione,
  StatoPatenteAmministrazione,
} from "@/lib/anagrafiche-amministrazione";

type AnagraficheAmministrazioneClientProps = {
  anagraficheIniziali: AnagraficaUtenteAmministrazione[];
};

type AnagraficheAdminApiResponse = {
  errore?: string;
  anagrafica?: AnagraficaUtenteAmministrazione;
  anagrafiche?: AnagraficaUtenteAmministrazione[];
};

const LABEL_STATI_PATENTE: Record<StatoPatenteAmministrazione, string> = {
  VALIDA: "Valida",
  SCADUTA: "Scaduta",
  ASSENTE: "Assente",
  INCOMPLETA: "Incompleta",
};

const LABEL_STATI_ACCOUNT: Record<string, string> = {
  ATTIVO: "Attivo",
  DA_ATTIVARE: "Da attivare",
  SOSPESO: "Sospeso",
};

function formattaDataItaliana(dataIso: string | null): string {
  if (!dataIso) {
    return "Non disponibile";
  }

  const [anno, mese, giorno] = dataIso.split("-");

  if (!anno || !mese || !giorno) {
    return dataIso;
  }

  return `${giorno}/${mese}/${anno}`;
}

function descriviPatente(
  anagrafica: AnagraficaUtenteAmministrazione,
): string {
  if (
    !anagrafica.patente.numero ||
    !anagrafica.patente.categoria ||
    !anagrafica.patente.scadenza
  ) {
    return LABEL_STATI_PATENTE[anagrafica.patente.stato];
  }

  return `${anagrafica.patente.categoria} - ${anagrafica.patente.numero} - scadenza ${formattaDataItaliana(anagrafica.patente.scadenza)}`;
}

function ricavaStilePatente(stato: StatoPatenteAmministrazione): string {
  if (stato === "VALIDA") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (stato === "SCADUTA") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (stato === "INCOMPLETA") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function descriviStatoPatente(stato: StatoPatenteAmministrazione): string {
  if (stato === "VALIDA") {
    return "La patente risulta completa e ancora valida alla data odierna.";
  }

  if (stato === "SCADUTA") {
    return "La patente e presente ma la data di scadenza risulta superata.";
  }

  if (stato === "INCOMPLETA") {
    return "Sono presenti solo alcuni dati patente e il profilo richiede verifica.";
  }

  return "Nel profilo non risultano ancora dati patente registrati.";
}

function descriviStatoAccount(stato: string): string {
  return LABEL_STATI_ACCOUNT[stato] ?? stato;
}

// La consultazione resta client-side in questo step per tenere immediata la
// lettura istituzionale senza introdurre ancora endpoint dedicati di ricerca.
export default function AnagraficheAmministrazioneClient({
  anagraficheIniziali,
}: AnagraficheAmministrazioneClientProps) {
  const [anagrafiche, setAnagrafiche] = useState(anagraficheIniziali);
  const [query, setQuery] = useState("");
  const [statoAccountFiltro, setStatoAccountFiltro] = useState<string | "TUTTI">(
    "TUTTI",
  );
  const [statoPatenteFiltro, setStatoPatenteFiltro] = useState<
    StatoPatenteAmministrazione | "TUTTE"
  >("TUTTE");
  const [anagraficaSelezionataId, setAnagraficaSelezionataId] = useState<
    number | null
  >(anagraficheIniziali[0]?.id ?? null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [erroreAggiornamento, setErroreAggiornamento] = useState<string | null>(
    null,
  );
  const [isRefreshingDettaglio, setIsRefreshingDettaglio] = useState(false);
  const [erroreDettaglio, setErroreDettaglio] = useState<string | null>(null);
  const [anagraficaDettaglio, setAnagraficaDettaglio] =
    useState<AnagraficaUtenteAmministrazione | null>(
      anagraficheIniziali[0] ?? null,
    );

  const anagraficheFiltrate = useMemo(() => {
    const queryNormalizzata = query.trim().toLowerCase();

    return anagrafiche.filter((anagrafica) => {
      const matchStatoAccount =
        statoAccountFiltro === "TUTTI" ||
        anagrafica.statoAccount === statoAccountFiltro;
      const matchStato =
        statoPatenteFiltro === "TUTTE" ||
        anagrafica.patente.stato === statoPatenteFiltro;
      const matchQuery =
        queryNormalizzata === "" ||
        anagrafica.nome.toLowerCase().includes(queryNormalizzata) ||
        anagrafica.cognome.toLowerCase().includes(queryNormalizzata) ||
        anagrafica.email.toLowerCase().includes(queryNormalizzata) ||
        anagrafica.codiceFiscale.toLowerCase().includes(queryNormalizzata) ||
        (anagrafica.patente.numero ?? "")
          .toLowerCase()
          .includes(queryNormalizzata);

      return matchStatoAccount && matchStato && matchQuery;
    });
  }, [anagrafiche, query, statoAccountFiltro, statoPatenteFiltro]);

  const riepilogo = useMemo(
    () => ({
      totale: anagrafiche.length,
      valide: anagrafiche.filter(
        (anagrafica) => anagrafica.patente.stato === "VALIDA",
      ).length,
      scadute: anagrafiche.filter(
        (anagrafica) => anagrafica.patente.stato === "SCADUTA",
      ).length,
      assenti: anagrafiche.filter(
        (anagrafica) => anagrafica.patente.stato === "ASSENTE",
      ).length,
      incomplete: anagrafiche.filter(
        (anagrafica) => anagrafica.patente.stato === "INCOMPLETA",
      ).length,
    }),
    [anagrafiche],
  );

  async function aggiornaAnagrafiche(): Promise<void> {
    setIsRefreshing(true);
    setErroreAggiornamento(null);

    try {
      const response = await fetch("/api/admin/anagrafiche", {
        method: "GET",
        cache: "no-store",
      });

      const result =
        (await response.json().catch(() => null)) as AnagraficheAdminApiResponse | null;

      if (!response.ok || !result?.anagrafiche) {
        setErroreAggiornamento(
          result?.errore ??
            "Non e stato possibile aggiornare l'elenco delle anagrafiche.",
        );
        return;
      }

      setAnagrafiche(result.anagrafiche);
    } catch {
      setErroreAggiornamento(
        "Non e stato possibile aggiornare l'elenco delle anagrafiche.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function caricaDettaglioAnagrafica(
    utenteId: number,
    opzioni?: {
      silenzioso?: boolean;
      azzeraErrore?: boolean;
    },
  ): Promise<AnagraficaUtenteAmministrazione | null> {
    const silenzioso = opzioni?.silenzioso ?? false;
    const azzeraErrore = opzioni?.azzeraErrore ?? false;

    if (!silenzioso) {
      setIsRefreshingDettaglio(true);
      setErroreDettaglio(null);
    } else if (azzeraErrore) {
      setErroreDettaglio(null);
    }

    try {
      const response = await fetch(`/api/admin/anagrafiche?utenteId=${utenteId}`, {
        method: "GET",
        cache: "no-store",
      });

      const result =
        (await response.json().catch(() => null)) as AnagraficheAdminApiResponse | null;

      if (!response.ok || !result?.anagrafica) {
        setErroreDettaglio(
          result?.errore ??
            "Non e stato possibile aggiornare il dettaglio selezionato.",
        );

        if (response.status === 404) {
          setAnagrafiche((corrente) =>
            corrente.filter(
              (anagrafica) =>
                anagrafica.id !== utenteId,
            ),
          );
          setAnagraficaDettaglio(null);
        }

        return null;
      }

      setErroreDettaglio(null);
      setAnagraficaDettaglio(result.anagrafica);
      setAnagrafiche((corrente) =>
        corrente.map((anagrafica) =>
          anagrafica.id === result.anagrafica!.id
            ? result.anagrafica!
            : anagrafica,
        ),
      );
      return result.anagrafica;
    } catch {
      setErroreDettaglio(
        "Non e stato possibile aggiornare il dettaglio selezionato.",
      );
      return null;
    } finally {
      if (!silenzioso) {
        setIsRefreshingDettaglio(false);
      }
    }
  }

  const anagraficaSelezionataEffettivaId =
    anagraficheFiltrate.length === 0
      ? null
      : anagraficheFiltrate.some(
            (anagrafica) => anagrafica.id === anagraficaSelezionataId,
          )
        ? anagraficaSelezionataId
        : (anagraficheFiltrate[0]?.id ?? null);

  const anagraficaSelezionataBase =
    anagraficheFiltrate.find(
      (anagrafica) => anagrafica.id === anagraficaSelezionataEffettivaId,
    ) ?? null;

  const anagraficaSelezionata =
    anagraficaDettaglio?.id === anagraficaSelezionataEffettivaId
      ? anagraficaDettaglio
      : anagraficaSelezionataBase;

  useEffect(() => {
    if (!anagraficaSelezionataEffettivaId) {
      return;
    }

    const utenteIdSelezionato = anagraficaSelezionataEffettivaId;
    let annullata = false;

    async function sincronizzaDettaglio() {
      const dettaglio = await caricaDettaglioAnagrafica(utenteIdSelezionato, {
        silenzioso: true,
        azzeraErrore: true,
      });

      if (annullata) {
        return;
      }

      if (!dettaglio && anagraficaSelezionataBase) {
        setAnagraficaDettaglio(anagraficaSelezionataBase);
      }

    }

    void sincronizzaDettaglio();

    return () => {
      annullata = true;
    };
  }, [anagraficaSelezionataEffettivaId, anagraficaSelezionataBase]);

  async function aggiornaAnagraficaSelezionata(): Promise<void> {
    if (!anagraficaSelezionataEffettivaId) {
      return;
    }

    await caricaDettaglioAnagrafica(anagraficaSelezionataEffettivaId);
  }

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Anagrafiche
            </span>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Qui consulti utenti registrati e stato delle patenti.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                La sezione tiene insieme identita del profilo, dati anagrafici e
                validita della patente in una lettura amministrativa semplice e
                immediata.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Utenti censiti
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {riepilogo.totale}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Patenti valide
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {riepilogo.valide}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Patenti scadute
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {riepilogo.scadute}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Patenti assenti
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {riepilogo.assenti}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Patenti incomplete
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {riepilogo.incomplete}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Consultazione utenti
            </p>
            <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
              Ricerca anagrafica e patente
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Filtra per stato patente oppure cerca rapidamente per nominativo,
              email, codice fiscale o numero patente.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void aggiornaAnagrafiche()}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? "Aggiornamento..." : "Aggiorna elenco"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.1fr_0.65fr_0.65fr]">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Ricerca rapida</span>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca per nome, cognome, email, codice fiscale o patente"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Stato account</span>
            <select
              value={statoAccountFiltro}
              onChange={(event) =>
                setStatoAccountFiltro(event.target.value as string | "TUTTI")
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            >
              <option value="TUTTI">Tutti gli account</option>
              <option value="ATTIVO">Attivo</option>
              <option value="DA_ATTIVARE">Da attivare</option>
              <option value="SOSPESO">Sospeso</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Stato patente</span>
            <select
              value={statoPatenteFiltro}
              onChange={(event) =>
                setStatoPatenteFiltro(
                  event.target.value as StatoPatenteAmministrazione | "TUTTE",
                )
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            >
              <option value="TUTTE">Tutti gli stati</option>
              <option value="VALIDA">Valida</option>
              <option value="SCADUTA">Scaduta</option>
              <option value="ASSENTE">Assente</option>
              <option value="INCOMPLETA">Incompleta</option>
            </select>
          </label>
        </div>

        <div className="mt-4">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            Visualizzate: {anagraficheFiltrate.length}
          </span>
        </div>

        {erroreAggiornamento ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {erroreAggiornamento}
          </div>
        ) : null}

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-3">
            {anagraficheFiltrate.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm leading-6 text-slate-600">
                Nessuna anagrafica corrisponde ai filtri attivi.
              </div>
            ) : (
              anagraficheFiltrate.map((anagrafica) => {
                const selezionata =
                  anagrafica.id === anagraficaSelezionataEffettivaId;

                return (
                  <button
                    key={anagrafica.id}
                    type="button"
                    onClick={() => setAnagraficaSelezionataId(anagrafica.id)}
                    className={`w-full rounded-3xl border px-5 py-5 text-left shadow-[0_18px_50px_-30px_rgba(15,23,42,0.18)] transition ${
                      selezionata
                        ? "border-cyan-300 bg-cyan-50/70"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                            Account {descriviStatoAccount(anagrafica.statoAccount)}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${ricavaStilePatente(anagrafica.patente.stato)}`}
                          >
                            {LABEL_STATI_PATENTE[anagrafica.patente.stato]}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-slate-950">
                            {anagrafica.nome} {anagrafica.cognome}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {anagrafica.email}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm font-medium text-slate-500">
                        Nato il {formattaDataItaliana(anagrafica.dataNascita)}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Codice fiscale
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-950">
                          {anagrafica.codiceFiscale}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3 lg:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Patente
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-950">
                          {descriviPatente(anagrafica)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.18)]">
            {anagraficaSelezionata ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                      Scheda selezionata
                    </p>
                    <h4 className="text-3xl font-semibold tracking-tight text-slate-950">
                      {anagraficaSelezionata.nome} {anagraficaSelezionata.cognome}
                    </h4>
                    <p className="text-sm leading-6 text-slate-600">
                      Qui la Pubblica Amministrazione legge in modo puntuale i
                      dati anagrafici del profilo e la situazione patente
                      associata.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void aggiornaAnagraficaSelezionata()}
                    disabled={isRefreshingDettaglio}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRefreshingDettaglio
                      ? "Aggiornamento..."
                      : "Aggiorna scheda"}
                  </button>
                </div>

                {erroreDettaglio ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    {erroreDettaglio}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                    Account {descriviStatoAccount(anagraficaSelezionata.statoAccount)}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${ricavaStilePatente(anagraficaSelezionata.patente.stato)}`}
                  >
                    {LABEL_STATI_PATENTE[anagraficaSelezionata.patente.stato]}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Email
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-950">
                      {anagraficaSelezionata.email}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Data di nascita
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-950">
                      {formattaDataItaliana(anagraficaSelezionata.dataNascita)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Codice fiscale
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-950">
                      {anagraficaSelezionata.codiceFiscale}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                      Stato patente
                    </p>
                    <p className="text-lg font-semibold text-slate-950">
                      {LABEL_STATI_PATENTE[anagraficaSelezionata.patente.stato]}
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      {descriviStatoPatente(anagraficaSelezionata.patente.stato)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Numero patente
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-950">
                        {anagraficaSelezionata.patente.numero ?? "Non presente"}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Categoria
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-950">
                          {anagraficaSelezionata.patente.categoria ?? "Non presente"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Scadenza
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-950">
                          {formattaDataItaliana(
                            anagraficaSelezionata.patente.scadenza,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-6 text-sm leading-6 text-slate-600">
                Seleziona un&apos;anagrafica per vedere il dettaglio completo del
                profilo e della patente.
              </div>
            )}
          </aside>
        </div>
      </section>
    </section>
  );
}
