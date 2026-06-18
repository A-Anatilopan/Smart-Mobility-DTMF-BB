"use client";

import { useEffect, useRef, useState } from "react";
import AreaServizioCard from "@/components/mappa/AreaServizioCard";
import ListaMezziFiltrabile from "@/components/mappa/ListaMezziFiltrabile";
import type { FiltroCondizioneServizio } from "@/components/mappa/ListaMezziFiltrabile";
import type { AreaServizio, Mezzo } from "@/types/mobilita";

type StatoFlottaAmministrazioneClientProps = {
  aree: AreaServizio[];
  mezziIniziali: Mezzo[];
};

type FlottaAdminApiResponse = {
  errore?: string;
  mezzi?: Mezzo[];
};

function calcolaPrioritaIntegrita(mezzo: Mezzo): number {
  if (mezzo.stato === "IN_MANUTENZIONE") {
    return 0;
  }

  if (mezzo.stato === "NON_DISPONIBILE") {
    return 1;
  }

  if (mezzo.batteria <= 25) {
    return 2;
  }

  return 3;
}

function ordinaPerIntegrita(mezzi: Mezzo[]): Mezzo[] {
  return [...mezzi].sort((mezzoA, mezzoB) => {
    const prioritaA = calcolaPrioritaIntegrita(mezzoA);
    const prioritaB = calcolaPrioritaIntegrita(mezzoB);

    if (prioritaA !== prioritaB) {
      return prioritaA - prioritaB;
    }

    return mezzoA.batteria - mezzoB.batteria;
  });
}

function descriviMotivoCriticita(mezzo: Mezzo): string {
  if (mezzo.stato === "IN_MANUTENZIONE") {
    return "Richiede presidio tecnico e non e disponibile per il servizio.";
  }

  if (mezzo.stato === "NON_DISPONIBILE") {
    return "Risulta fuori servizio e richiede verifica amministrativa o operativa.";
  }

  return "La batteria e sotto soglia e il mezzo richiede attenzione prioritaria.";
}

function ricavaStileCriticita(mezzo: Mezzo): {
  contenitore: string;
  badge: string;
  pannello: string;
  accento: string;
} {
  if (mezzo.stato === "IN_MANUTENZIONE") {
    return {
      contenitore: "border-violet-200 bg-violet-50/70",
      badge: "border-violet-200 bg-violet-100 text-violet-800",
      pannello: "bg-white/90",
      accento: "bg-violet-500",
    };
  }

  if (mezzo.stato === "NON_DISPONIBILE") {
    return {
      contenitore: "border-slate-300 bg-slate-100/80",
      badge: "border-slate-300 bg-slate-200 text-slate-800",
      pannello: "bg-white/90",
      accento: "bg-slate-500",
    };
  }

  return {
    contenitore: "border-amber-200 bg-amber-50/70",
    badge: "border-amber-200 bg-amber-100 text-amber-800",
    pannello: "bg-white/90",
    accento: "bg-amber-500",
  };
}

// Questa vista sposta fuori dalla home la lettura dettagliata della flotta,
// cosi la dashboard iniziale della PA resta piu pulita e piu istituzionale.
export default function StatoFlottaAmministrazioneClient({
  aree,
  mezziIniziali,
}: StatoFlottaAmministrazioneClientProps) {
  const [mezzi, setMezzi] = useState(mezziIniziali);
  const [condizioneServizioAttiva, setCondizioneServizioAttiva] =
    useState<FiltroCondizioneServizio>("TUTTE");
  const [ultimoAggiornamento, setUltimoAggiornamento] = useState<Date>(
    () => new Date(),
  );
  const [aggiornamentoInCorso, setAggiornamentoInCorso] = useState(false);
  const [erroreAggiornamento, setErroreAggiornamento] = useState(false);
  const [evidenziaConsultazione, setEvidenziaConsultazione] = useState(false);
  const sezioneConsultazioneRef = useRef<HTMLElement | null>(null);
  const timeoutEvidenziazioneRef = useRef<number | null>(null);

  // Rende trasparente alla PA quando il campione e stato sincronizzato davvero.
  async function aggiornaFlotta(): Promise<void> {
    setAggiornamentoInCorso(true);

    try {
      const response = await fetch("/api/admin/flotta", {
        method: "GET",
        cache: "no-store",
      });

      const result =
        (await response.json().catch(() => null)) as FlottaAdminApiResponse | null;

      if (!response.ok || !result?.mezzi) {
        setErroreAggiornamento(true);
        return;
      }

      setMezzi(result.mezzi);
      setUltimoAggiornamento(new Date());
      setErroreAggiornamento(false);
    } catch {
      setErroreAggiornamento(true);
    } finally {
      setAggiornamentoInCorso(false);
    }
  }

  useEffect(() => {
    let annullato = false;

    const intervallo = window.setInterval(() => {
      if (!annullato) {
        void aggiornaFlotta();
      }
    }, 5000);

    return () => {
      annullato = true;
      window.clearInterval(intervallo);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutEvidenziazioneRef.current !== null) {
        window.clearTimeout(timeoutEvidenziazioneRef.current);
      }
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

  const mezziDisponibili = mezzi.filter(
    (mezzo) => mezzo.stato === "DISPONIBILE",
  ).length;
  const mezziInOsservazione = mezzi.filter((mezzo) =>
    ["PRENOTATO", "IN_USO", "IN_PAUSA"].includes(mezzo.stato),
  ).length;
  const mezziPerConsultazione = ordinaPerIntegrita(mezzi);
  const mezziCriticiOrdinati = mezziPerConsultazione
    .filter(
      (mezzo) =>
        mezzo.stato === "IN_MANUTENZIONE" ||
        mezzo.stato === "NON_DISPONIBILE" ||
        mezzo.batteria <= 25,
    );

  const riepilogoStati = [
    {
      label: "Disponibili",
      valore: mezziDisponibili,
      descrizione:
        "Mezzi immediatamente utilizzabili nel campione operativo attuale.",
    },
    {
      label: "Batteria bassa",
      valore: mezzi.filter((mezzo) => mezzo.batteria <= 25).length,
      descrizione:
        "Veicoli sotto soglia energetica che richiedono attenzione prioritaria.",
    },
    {
      label: "In manutenzione",
      valore: mezzi.filter((mezzo) => mezzo.stato === "IN_MANUTENZIONE").length,
      descrizione:
        "Mezzi già presi in carico per lavorazioni o verifiche tecniche.",
    },
    {
      label: "In osservazione",
      valore: mezziInOsservazione,
      descrizione:
        "Mezzi prenotati, in uso o in pausa da monitorare nel servizio attivo.",
    },
    {
      label: "Non disponibili",
      valore: mezzi.filter((mezzo) => mezzo.stato === "NON_DISPONIBILE").length,
      descrizione:
        "Mezzi temporaneamente esclusi dal servizio, con causa da dettagliare nei successivi flussi di segnalazione e presa in carico.",
    },
  ];
  const timestampAggiornamento = new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(ultimoAggiornamento);
  const scorciatoieKpi = [
    {
      label: "Mezzi disponibili",
      valore: mezziDisponibili,
      filtro: "DISPONIBILI" as FiltroCondizioneServizio,
      className:
        "border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15",
      classNameAttiva:
        "border-cyan-200 bg-cyan-300/20 ring-2 ring-cyan-200/70",
    },
    {
      label: "In osservazione",
      valore: mezziInOsservazione,
      filtro: "IN_OSSERVAZIONE" as FiltroCondizioneServizio,
      className:
        "border-amber-300/20 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15",
      classNameAttiva:
        "border-amber-200 bg-amber-300/20 ring-2 ring-amber-200/70",
    },
    {
      label: "Batteria bassa",
      valore: mezzi.filter((mezzo) => mezzo.batteria <= 25).length,
      filtro: "BATTERIA_BASSA" as FiltroCondizioneServizio,
      className:
        "border-rose-300/20 bg-rose-300/10 text-rose-100 hover:bg-rose-300/15",
      classNameAttiva:
        "border-rose-200 bg-rose-300/20 ring-2 ring-rose-200/70",
    },
    {
      label: "In manutenzione",
      valore: mezzi.filter((mezzo) => mezzo.stato === "IN_MANUTENZIONE").length,
      filtro: "IN_MANUTENZIONE" as FiltroCondizioneServizio,
      className:
        "border-violet-300/20 bg-violet-300/10 text-violet-100 hover:bg-violet-300/15",
      classNameAttiva:
        "border-violet-200 bg-violet-300/20 ring-2 ring-violet-200/70",
    },
  ];

  function gestisciScorciatoiaCondizione(
    filtro: FiltroCondizioneServizio,
  ): void {
    setCondizioneServizioAttiva((corrente) =>
      corrente === filtro ? "TUTTE" : filtro,
    );

    sezioneConsultazioneRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setEvidenziaConsultazione(true);

    if (timeoutEvidenziazioneRef.current !== null) {
      window.clearTimeout(timeoutEvidenziazioneRef.current);
    }

    timeoutEvidenziazioneRef.current = window.setTimeout(() => {
      setEvidenziaConsultazione(false);
    }, 1800);
  }

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Stato flotta
            </span>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Qui analizzi integrita, disponibilita e criticita dei mezzi.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                La vista mette al centro il livello di salute della flotta,
                separando i mezzi stabili da quelli che richiedono attenzione
                o presidio amministrativo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 font-medium text-slate-200">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 rounded-full ${
                    erroreAggiornamento
                      ? "bg-rose-400"
                      : aggiornamentoInCorso
                        ? "bg-amber-300"
                        : "bg-emerald-400"
                  }`}
                />
                {erroreAggiornamento
                  ? "Snapshot valido mantenuto"
                  : aggiornamentoInCorso
                    ? "Aggiornamento in corso"
                    : "Dati sincronizzati"}
              </span>
              <span className="text-slate-400">
                Aggiornamento: {timestampAggiornamento}
              </span>
              <button
                type="button"
                onClick={() => void aggiornaFlotta()}
                disabled={aggiornamentoInCorso}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Aggiorna
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {scorciatoieKpi.map((item) => {
              const attiva = condizioneServizioAttiva === item.filtro;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => gestisciScorciatoiaCondizione(item.filtro)}
                  className={`rounded-3xl border p-5 text-left transition ${item.className} ${
                    attiva ? item.classNameAttiva : ""
                  }`}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {item.valore}
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-white/80">
                    {attiva
                      ? "Filtro attivo - clicca per rimuoverlo"
                      : "Clicca per filtrare la lettura"}
                  </p>
                </button>
              );
            })}
          </div>
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
              Quadro sintetico di integrita
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Qui la Pubblica Amministrazione puo distinguere rapidamente
              stabilita del servizio, mezzi critici e aree che richiedono
              approfondimento.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {riepilogoStati.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.descrizione}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-slate-950">
                    {item.valore}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Mezzi che richiedono attenzione
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Priorita di controllo nel campione flotta
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            L&apos;elenco mette in evidenza prima i mezzi in manutenzione o
            temporaneamente esclusi dal servizio, poi quelli con batteria sotto
            soglia, cosi la lettura amministrativa segue una priorita chiara.
          </p>
        </div>

        {mezziCriticiOrdinati.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-semibold text-emerald-800">
              Nessun mezzo critico nel campione corrente.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {mezziCriticiOrdinati.map((mezzo) => (
              <article
                key={mezzo.id}
                className={`rounded-3xl border p-5 ${ricavaStileCriticita(mezzo).contenitore}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 rounded-full ${ricavaStileCriticita(mezzo).accento}`}
                      />
                      Segnale prioritario
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {mezzo.tipo}
                    </p>
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                        {mezzo.modello}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Codice mezzo: {mezzo.codice}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${ricavaStileCriticita(mezzo).badge}`}
                  >
                    {mezzo.stato === "IN_MANUTENZIONE"
                      ? "In manutenzione"
                      : mezzo.stato === "NON_DISPONIBILE"
                        ? "Escluso dal servizio"
                        : "Batteria bassa"}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div
                    className={`rounded-2xl px-4 py-3 ${ricavaStileCriticita(mezzo).pannello}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Batteria
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">
                      {mezzo.batteria}%
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 ${ricavaStileCriticita(mezzo).pannello}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Stato attuale
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {mezzo.stato}
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 sm:col-span-2 ${ricavaStileCriticita(mezzo).pannello}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Zona
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-950">
                      {mezzo.areaServizioNome}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {mezzo.stato === "NON_DISPONIBILE"
                    ? "Mezzo temporaneamente escluso dal servizio, con causa da dettagliare nei successivi flussi di segnalazione e presa in carico."
                    : descriviMotivoCriticita(mezzo)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        ref={sezioneConsultazioneRef}
        className={`space-y-4 rounded-[1.75rem] px-2 py-2 transition ${
          evidenziaConsultazione
            ? "bg-cyan-50/80 ring-2 ring-cyan-200"
            : "bg-transparent ring-0"
        }`}
      >
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
          mezzi={mezziPerConsultazione}
          modalita="amministrazione"
          messaggioVuoto="Prova a modificare i filtri per continuare la lettura del campione flotta."
          condizioneServizioSelezionata={condizioneServizioAttiva}
          onCondizioneServizioChange={setCondizioneServizioAttiva}
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
