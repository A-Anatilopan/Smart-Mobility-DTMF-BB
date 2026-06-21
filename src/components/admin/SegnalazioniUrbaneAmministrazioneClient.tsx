"use client";

import { useMemo, useState } from "react";
import {
  CATEGORIE_SEGNALAZIONE_URBANA,
  STATI_SEGNALAZIONE_URBANA,
  type CategoriaSegnalazioneUrbana,
  type SegnalazioneUrbanaDominio,
  type StatoSegnalazioneUrbana,
} from "@/types/segnalazioni-urbane";

type SegnalazioniUrbaneAmministrazioneClientProps = {
  segnalazioniIniziali: SegnalazioneUrbanaDominio[];
};

type SegnalazioniUrbaneApiResponse = {
  errore?: string;
  messaggio?: string;
  segnalazione?: SegnalazioneUrbanaDominio;
  segnalazioni?: SegnalazioneUrbanaDominio[];
};

type FormSegnalazioneUrbana = {
  categoria: CategoriaSegnalazioneUrbana;
  titolo: string;
  descrizione: string;
  indirizzo: string;
  latitudine: string;
  longitudine: string;
};

type FiltroStatoSegnalazioneUrbana = StatoSegnalazioneUrbana | "TUTTE";

const LABEL_CATEGORIE_URBANE: Record<CategoriaSegnalazioneUrbana, string> = {
  ILLUMINAZIONE: "Illuminazione",
  SEGNALETICA: "Segnaletica",
  MANTO_STRADALE: "Manto stradale",
  AREA_DI_SOSTA: "Area di sosta",
  OSTACOLO_URBANO: "Ostacolo urbano",
  ALTRO: "Altro",
};

const LABEL_STATI_URBANI: Record<StatoSegnalazioneUrbana, string> = {
  APERTA: "Aperta",
  IN_VALUTAZIONE: "In valutazione",
  PIANIFICATA: "Pianificata",
  RISOLTA: "Risolta",
};

const FORM_INIZIALE: FormSegnalazioneUrbana = {
  categoria: "ILLUMINAZIONE",
  titolo: "",
  descrizione: "",
  indirizzo: "",
  latitudine: "",
  longitudine: "",
};

function formattaDataOraItaliana(valore: Date | string): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valore));
}

function descriviPosizioneSegnalazione(
  segnalazione: SegnalazioneUrbanaDominio,
): string | null {
  if (segnalazione.indirizzo) {
    return segnalazione.indirizzo;
  }

  if (segnalazione.posizione) {
    return `${segnalazione.posizione.latitudine.toFixed(5)}, ${segnalazione.posizione.longitudine.toFixed(5)}`;
  }

  return null;
}

function creaLinkPosizioneSegnalazione(
  segnalazione: SegnalazioneUrbanaDominio,
): string | null {
  if (!segnalazione.posizione) {
    return null;
  }

  const params = new URLSearchParams({
    latitudine: segnalazione.posizione.latitudine.toString(),
    longitudine: segnalazione.posizione.longitudine.toString(),
    focus: "segnalazione",
  });

  return `/admin?${params.toString()}#mappa-servizio-amministrazione`;
}

function ricavaStileStato(
  stato: StatoSegnalazioneUrbana,
): {
  badge: string;
  bordo: string;
  sfondo: string;
} {
  if (stato === "RISOLTA") {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
      bordo: "border-emerald-200",
      sfondo: "bg-emerald-50/50",
    };
  }

  if (stato === "PIANIFICATA") {
    return {
      badge: "border-violet-200 bg-violet-50 text-violet-800",
      bordo: "border-violet-200",
      sfondo: "bg-violet-50/50",
    };
  }

  if (stato === "IN_VALUTAZIONE") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      bordo: "border-amber-200",
      sfondo: "bg-amber-50/50",
    };
  }

  return {
    badge: "border-cyan-200 bg-cyan-50 text-cyan-800",
    bordo: "border-cyan-200",
    sfondo: "bg-cyan-50/50",
  };
}

// Questa prima UI di AP.03 privilegia un flusso essenziale ma gia reale:
// inserimento della criticita urbana e lettura immediata dello storico recente.
export default function SegnalazioniUrbaneAmministrazioneClient({
  segnalazioniIniziali,
}: SegnalazioniUrbaneAmministrazioneClientProps) {
  const [form, setForm] = useState<FormSegnalazioneUrbana>(FORM_INIZIALE);
  const [segnalazioni, setSegnalazioni] = useState(segnalazioniIniziali);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [segnalazioneInAggiornamentoId, setSegnalazioneInAggiornamentoId] =
    useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<
    CategoriaSegnalazioneUrbana | "TUTTE"
  >("TUTTE");
  const [statoFiltro, setStatoFiltro] =
    useState<FiltroStatoSegnalazioneUrbana>("TUTTE");

  const riepilogo = useMemo(() => {
    const aperte = segnalazioni.filter(
      (segnalazione) => segnalazione.stato === "APERTA",
    ).length;
    const inValutazione = segnalazioni.filter(
      (segnalazione) => segnalazione.stato === "IN_VALUTAZIONE",
    ).length;
    const pianificate = segnalazioni.filter(
      (segnalazione) => segnalazione.stato === "PIANIFICATA",
    ).length;
    const risolte = segnalazioni.filter(
      (segnalazione) => segnalazione.stato === "RISOLTA",
    ).length;

    const conPosizione = segnalazioni.filter(
      (segnalazione) => segnalazione.posizione !== null || segnalazione.indirizzo,
    ).length;

    return {
      totale: segnalazioni.length,
      aperte,
      inValutazione,
      pianificate,
      risolte,
      conPosizione,
    };
  }, [segnalazioni]);

  // I filtri restano client-side in questo step: l'obiettivo e rendere piu
  // leggibile il presidio amministrativo senza introdurre ancora query server
  // piu complesse o paginazione.
  const segnalazioniFiltrate = useMemo(() => {
    const queryNormalizzata = query.trim().toLowerCase();

    return segnalazioni.filter((segnalazione) => {
      const matchCategoria =
        categoriaFiltro === "TUTTE" || segnalazione.categoria === categoriaFiltro;
      const matchStato =
        statoFiltro === "TUTTE" || segnalazione.stato === statoFiltro;
      const matchQuery =
        queryNormalizzata === "" ||
        segnalazione.codice.toLowerCase().includes(queryNormalizzata) ||
        segnalazione.titolo.toLowerCase().includes(queryNormalizzata) ||
        segnalazione.descrizione.toLowerCase().includes(queryNormalizzata) ||
        (segnalazione.indirizzo ?? "").toLowerCase().includes(queryNormalizzata);

      return matchCategoria && matchStato && matchQuery;
    });
  }, [categoriaFiltro, query, segnalazioni, statoFiltro]);

  function aggiornaCampo<K extends keyof FormSegnalazioneUrbana>(
    chiave: K,
    valore: FormSegnalazioneUrbana[K],
  ) {
    setForm((corrente) => ({
      ...corrente,
      [chiave]: valore,
    }));
  }

  async function ricaricaSegnalazioni() {
    setIsRefreshing(true);
    setErrore(null);

    try {
      const response = await fetch("/api/admin/segnalazioni-urbane?limite=12", {
        method: "GET",
        cache: "no-store",
      });

      const result =
        (await response.json().catch(() => null)) as SegnalazioniUrbaneApiResponse | null;

      if (!response.ok || !result?.segnalazioni) {
        setErrore(
          result?.errore ??
            "Non e stato possibile aggiornare l'elenco delle segnalazioni urbane.",
        );
        return;
      }

      setSegnalazioni(result.segnalazioni);
    } catch {
      setErrore(
        "Non e stato possibile aggiornare l'elenco delle segnalazioni urbane.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    setErrore(null);

    try {
      const response = await fetch("/api/admin/segnalazioni-urbane", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoria: form.categoria,
          titolo: form.titolo,
          descrizione: form.descrizione,
          indirizzo: form.indirizzo,
          latitudine: form.latitudine,
          longitudine: form.longitudine,
        }),
      });

      const result =
        (await response.json().catch(() => null)) as SegnalazioniUrbaneApiResponse | null;

      if (!response.ok || !result?.segnalazione) {
        setErrore(
          result?.errore ??
            "Non e stato possibile registrare la segnalazione urbana.",
        );
        return;
      }

      setSegnalazioni((corrente) => [result.segnalazione!, ...corrente].slice(0, 12));
      setForm(FORM_INIZIALE);
      setQuery("");
      setCategoriaFiltro("TUTTE");
      setStatoFiltro("TUTTE");
      setFeedback(
        result.messaggio ?? "Segnalazione urbana registrata con successo.",
      );
    } catch {
      setErrore("Non e stato possibile registrare la segnalazione urbana.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function aggiornaStatoSegnalazione(
    segnalazioneId: number,
    nuovoStato: StatoSegnalazioneUrbana,
  ) {
    setSegnalazioneInAggiornamentoId(segnalazioneId);
    setFeedback(null);
    setErrore(null);

    try {
      const response = await fetch(
        `/api/admin/segnalazioni-urbane/${segnalazioneId}/stato`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stato: nuovoStato,
          }),
        },
      );

      const result =
        (await response.json().catch(() => null)) as SegnalazioniUrbaneApiResponse | null;

      if (!response.ok || !result?.segnalazione) {
        setErrore(
          result?.errore ??
            "Non e stato possibile aggiornare lo stato della segnalazione urbana.",
        );
        return;
      }

      setSegnalazioni((corrente) =>
        corrente.map((segnalazione) =>
          segnalazione.id === segnalazioneId ? result.segnalazione! : segnalazione,
        ).sort(
          (segnalazioneA, segnalazioneB) =>
            new Date(segnalazioneB.updatedAt).getTime() -
            new Date(segnalazioneA.updatedAt).getTime(),
        ),
      );
      setFeedback(
        result.messaggio ??
          "Stato della segnalazione urbana aggiornato con successo.",
      );
    } catch {
      setErrore(
        "Non e stato possibile aggiornare lo stato della segnalazione urbana.",
      );
    } finally {
      setSegnalazioneInAggiornamentoId(null);
    }
  }

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Segnalazioni urbane
            </span>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Qui registri criticita del territorio e priorita urbane.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                La sezione raccoglie segnalazioni istituzionali su strade,
                segnaletica, illuminazione e ostacoli urbani, mantenendo
                separate le anomalie del territorio da quelle dei mezzi.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Segnalazioni recenti
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {riepilogo.totale}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">Aperte</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {riepilogo.aperte}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Con posizione
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {riepilogo.conPosizione}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Nuova segnalazione
            </p>
            <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
              Registra una criticita urbana
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Inserisci titolo, categoria e contesto territoriale. Le coordinate
              restano opzionali in questo primo step.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Categoria</span>
                <select
                  value={form.categoria}
                  onChange={(event) =>
                    aggiornaCampo(
                      "categoria",
                      event.target.value as CategoriaSegnalazioneUrbana,
                    )
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                >
                  {CATEGORIE_SEGNALAZIONE_URBANA.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {LABEL_CATEGORIE_URBANE[categoria]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Titolo</span>
                <input
                  type="text"
                  value={form.titolo}
                  onChange={(event) => aggiornaCampo("titolo", event.target.value)}
                  placeholder="Es. Illuminazione assente in area pedonale"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Descrizione</span>
              <textarea
                value={form.descrizione}
                onChange={(event) =>
                  aggiornaCampo("descrizione", event.target.value)
                }
                placeholder="Descrivi con chiarezza il problema osservato e il suo impatto sul territorio."
                rows={5}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Indirizzo o riferimento urbano</span>
              <input
                type="text"
                value={form.indirizzo}
                onChange={(event) => aggiornaCampo("indirizzo", event.target.value)}
                placeholder="Es. Corso Vittorio Emanuele II, altezza civico 84"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Latitudine opzionale</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.latitudine}
                  onChange={(event) =>
                    aggiornaCampo("latitudine", event.target.value)
                  }
                  placeholder="41.11710"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Longitudine opzionale</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.longitudine}
                  onChange={(event) =>
                    aggiornaCampo("longitudine", event.target.value)
                  }
                  placeholder="16.87190"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>
            </div>

            {feedback ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                {feedback}
              </div>
            ) : null}

            {errore ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                {errore}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Registrazione..." : "Registra segnalazione"}
              </button>

              <button
                type="button"
                onClick={() => setForm(FORM_INIZIALE)}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ripristina campi
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Elenco recente
              </p>
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                Segnalazioni urbane registrate di recente
              </h3>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Questa lista conferma subito l&apos;acquisizione della criticita
                e prepara le prossime evoluzioni della sezione.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void ricaricaSegnalazioni()}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? "Aggiornamento..." : "Aggiorna elenco"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.3fr_0.9fr_0.8fr]">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Ricerca rapida</span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cerca per codice, titolo, descrizione o indirizzo"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Categoria</span>
              <select
                value={categoriaFiltro}
                onChange={(event) =>
                  setCategoriaFiltro(
                    event.target.value as CategoriaSegnalazioneUrbana | "TUTTE",
                  )
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="TUTTE">Tutte le categorie</option>
                {CATEGORIE_SEGNALAZIONE_URBANA.map((categoria) => (
                  <option key={`filtro-categoria-${categoria}`} value={categoria}>
                    {LABEL_CATEGORIE_URBANE[categoria]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Stato</span>
              <select
                value={statoFiltro}
                onChange={(event) =>
                  setStatoFiltro(
                    event.target.value as FiltroStatoSegnalazioneUrbana,
                  )
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="TUTTE">Tutti gli stati</option>
                {STATI_SEGNALAZIONE_URBANA.map((stato) => (
                  <option key={`filtro-stato-${stato}`} value={stato}>
                    {LABEL_STATI_URBANI[stato]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              Visualizzate: {segnalazioniFiltrate.length}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {segnalazioniFiltrate.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm leading-6 text-slate-600">
                {segnalazioni.length === 0
                  ? "Non ci sono ancora segnalazioni urbane registrate in questa sezione."
                  : "Nessuna segnalazione corrisponde ai filtri attivi. Prova a modificarli per ampliare la lettura."}
              </div>
            ) : (
              segnalazioniFiltrate.map((segnalazione) => {
                const posizione = descriviPosizioneSegnalazione(segnalazione);
                const linkPosizione = creaLinkPosizioneSegnalazione(segnalazione);
                const stileStato = ricavaStileStato(segnalazione.stato);

                return (
                  <article
                    key={segnalazione.id}
                    className={`rounded-3xl border px-5 py-5 ${stileStato.bordo} ${stileStato.sfondo}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-800">
                            {LABEL_CATEGORIE_URBANE[segnalazione.categoria]}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${stileStato.badge}`}>
                            {LABEL_STATI_URBANI[segnalazione.stato]}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-slate-950">
                            {segnalazione.titolo}
                          </h4>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {segnalazione.codice}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm font-medium text-slate-500">
                        {formattaDataOraItaliana(segnalazione.createdAt)}
                      </p>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-700">
                      {segnalazione.descrizione}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Segnalata da
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-950">
                          {segnalazione.amministrazione.nome}{" "}
                          {segnalazione.amministrazione.cognome}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Posizione o riferimento
                        </p>
                        {posizione ? (
                          <div className="mt-1 space-y-1">
                            <p className="text-sm font-medium text-slate-950">
                              {posizione}
                            </p>
                            {linkPosizione ? (
                              <a
                                href={linkPosizione}
                                className="text-xs font-semibold text-cyan-700 hover:text-cyan-800"
                              >
                                Apri posizione nella mappa del servizio
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm font-medium text-slate-950">
                            Non specificato
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-white px-4 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Aggiorna stato
                          </p>
                          <p className="text-sm leading-6 text-slate-600">
                            Porta la criticita in valutazione, pianificala oppure chiudila come risolta.
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:min-w-[240px] sm:flex-row">
                          <select
                            value={segnalazione.stato}
                            onChange={(event) => {
                              void aggiornaStatoSegnalazione(
                                segnalazione.id,
                                event.target.value as StatoSegnalazioneUrbana,
                              );
                            }}
                            disabled={segnalazioneInAggiornamentoId === segnalazione.id}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {STATI_SEGNALAZIONE_URBANA.map((stato) => (
                              <option key={`stato-${segnalazione.id}-${stato}`} value={stato}>
                                {LABEL_STATI_URBANI[stato]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
