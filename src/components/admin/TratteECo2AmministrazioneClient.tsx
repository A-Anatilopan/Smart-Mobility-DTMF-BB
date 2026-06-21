"use client";

import { useEffect, useState } from "react";
import {
  FILTRI_TIPO_MEZZO_TRATTE_CO2,
  type ReportTratteCo2Amministrazione,
  type FiltroTipoMezzoTratteCo2,
} from "@/lib/tratte-co2-amministrazione";

type Props = {
  reportIniziale: ReportTratteCo2Amministrazione;
};

type ApiResponse = {
  errore?: string;
  report?: ReportTratteCo2Amministrazione;
};

const COLORI_TIPO = {
  "E-Bike": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "E-Scooter": "border-cyan-200 bg-cyan-50 text-cyan-800",
  "E-Car": "border-violet-200 bg-violet-50 text-violet-800",
} as const;

// Questa UI apre AP.04 e AP.05 con una lettura sintetica ma gia reale:
// tratte piu ricorrenti e stima ambientale restano nella stessa vista PA.
export default function TratteECo2AmministrazioneClient({
  reportIniziale,
}: Props) {
  const [report, setReport] = useState(reportIniziale);
  const [filtroTipoMezzo, setFiltroTipoMezzo] =
    useState<FiltroTipoMezzoTratteCo2>(reportIniziale.filtroTipoMezzo);
  const [isAggiornamentoInCorso, setIsAggiornamentoInCorso] = useState(false);

  useEffect(() => {
    let annullato = false;

    async function aggiornaReport() {
      setIsAggiornamentoInCorso(true);

      try {
        const query =
          filtroTipoMezzo === "TUTTI"
            ? "/api/admin/tratte-e-co2"
            : `/api/admin/tratte-e-co2?tipoMezzo=${encodeURIComponent(filtroTipoMezzo)}`;
        const response = await fetch(query, {
          method: "GET",
          cache: "no-store",
        });

        const result = (await response.json().catch(() => null)) as
          | ApiResponse
          | null;

        if (!response.ok || !result?.report || annullato) {
          return;
        }

        setReport(result.report);
      } catch {
        // Manteniamo l'ultimo snapshot valido se il refresh temporaneo fallisce.
      } finally {
        if (!annullato) {
          setIsAggiornamentoInCorso(false);
        }
      }
    }

    // Al cambio filtro riallineiamo subito la vista, senza aspettare il
    // refresh periodico successivo che renderebbe la UI visibilmente lenta.
    void aggiornaReport();
    const intervallo = window.setInterval(() => {
      void aggiornaReport();
    }, 5000);

    return () => {
      annullato = true;
      window.clearInterval(intervallo);
    };
  }, [filtroTipoMezzo]);

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
        <div className="space-y-5">
          <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
            Tratte e CO2
          </span>
          <div className="space-y-4">
            <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Qui osservi i percorsi piu ricorrenti e l&apos;impatto ambientale.
            </h2>
            <p className="max-w-3xl text-base leading-7 text-slate-300">
              La vista incrocia le corse concluse con le coordinate registrate e
              costruisce una prima lettura istituzionale delle tratte urbane piu
              usate e del risparmio CO2 stimato.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {FILTRI_TIPO_MEZZO_TRATTE_CO2.map((filtro) => {
                const attivo = filtro === filtroTipoMezzo;

                return (
                  <button
                    key={filtro}
                    type="button"
                    onClick={() => {
                      if (filtro === filtroTipoMezzo) {
                        return;
                      }

                      setIsAggiornamentoInCorso(true);
                      setFiltroTipoMezzo(filtro);
                    }}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      attivo
                        ? "border-cyan-300 bg-cyan-300/20 text-cyan-100"
                        : "border-white/20 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {filtro === "TUTTI" ? "Flotta completa" : filtro}
                  </button>
                );
              })}
            </div>
            {isAggiornamentoInCorso ? (
              <p className="text-sm font-medium text-cyan-100">
                Aggiornamento dati in corso...
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section
        className={`grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-4 ${
          isAggiornamentoInCorso ? "opacity-75" : "opacity-100"
        }`}
      >
        {report.indicatori.map((indicatore, indice) => (
          <article
            key={indicatore.label}
            className={`rounded-[1.5rem] px-5 py-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.24)] ${
              indice === 2
                ? "border border-emerald-200 bg-emerald-50"
                : "border border-slate-200 bg-white"
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                indice === 2 ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {indicatore.label}
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {indicatore.valore}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {indicatore.descrizione}
            </p>
          </article>
        ))}
      </section>

      <section
        className={`grid gap-5 transition-opacity xl:grid-cols-[1.2fr_0.8fr] ${
          isAggiornamentoInCorso ? "opacity-75" : "opacity-100"
        }`}
      >
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Tratte osservate
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Percorsi piu utilizzati
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Le tratte vengono aggregate dai punti di inizio e fine corsa,
              associati ai luoghi urbani piu vicini del dataset corrente.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {report.tratteFrequenti.length > 0 ? (
              report.tratteFrequenti.map((tratta) => (
                <article
                  key={tratta.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-950">
                        {tratta.partenza} -&gt; {tratta.arrivo}
                      </p>
                      <p className="text-sm text-slate-600">
                        {tratta.corseConcluse} corse concluse | tipologia prevalente:{" "}
                        {tratta.tipologiaPrevalente}
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800">
                      Top tratta
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Distanza media
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {tratta.distanzaMediaKm} km
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Durata media
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {tratta.durataMediaMin} min
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-sm leading-6 text-slate-600">
                Non ci sono ancora corse terminate con coordinate complete
                sufficienti per costruire una lettura delle tratte.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Impatto ambientale
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Risparmio CO2 stimato
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              La stima e distinta per tipologia di mezzo e usa coefficienti
              simulati coerenti con il contesto didattico del progetto.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {report.distribuzioneRisparmioCo2.map((item) => (
              <div
                key={item.tipo}
                className={`rounded-[1.5rem] border px-4 py-4 ${COLORI_TIPO[item.tipo]}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em]">
                    {item.tipo}
                  </p>
                  <p className="text-2xl font-semibold">
                    {item.kgRisparmiati} kg
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Nota metodologica
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {report.notaMetodologica}
            </p>
          </div>
        </article>
      </section>

      <section
        className={`grid gap-5 transition-opacity xl:grid-cols-[0.9fr_1.1fr] ${
          isAggiornamentoInCorso ? "opacity-75" : "opacity-100"
        }`}
      >
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Nodi urbani
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Luoghi piu coinvolti
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Questo riquadro evidenzia i punti della citta che compaiono piu
              spesso come origine o destinazione delle corse osservate.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {report.nodiUrbaniRicorrenti.length > 0 ? (
              report.nodiUrbaniRicorrenti.map((nodo) => (
                <article
                  key={nodo.nome}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-950">
                        {nodo.nome}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Coinvolgimenti totali: {nodo.totaleCoinvolgimenti}
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800">
                      Hotspot
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Partenze
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {nodo.partenzeCoinvolte}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Arrivi
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {nodo.arriviCoinvolti}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-sm leading-6 text-slate-600">
                I nodi urbani compariranno qui appena saranno disponibili corse
                terminate con coordinate valide.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Lettura amministrativa
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Cosa sta raccontando il campione
            </h2>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Tratte
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Le tratte ricorrenti aiutano a capire quali assi urbani stanno
                concentrando piu utilizzo e dove potrebbe servire piu presenza
                di mezzi.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Ambiente
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                La stima CO2 non e certificativa, ma offre una misura leggibile
                dell&apos;impatto potenziale del servizio in chiave sostenibile.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Dato disponibile oggi
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Questa vista usa il campione reale delle corse concluse gia
                salvate dal sistema. Crescendo lo storico, cresceranno anche
                precisione, varieta delle tratte e significativita degli hotspot.
              </p>
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
