"use client";

import { useEffect, useState } from "react";
import type { ReportAggregatoAmministrazione } from "@/lib/reportistica-amministrazione";

type ReportAggregatiAmministrazioneClientProps = {
  reportIniziale: ReportAggregatoAmministrazione;
};

type ReportAdminApiResponse = {
  errore?: string;
  report?: ReportAggregatoAmministrazione;
};

function normalizzaReportAggregato(
  report: ReportAggregatoAmministrazione,
): ReportAggregatoAmministrazione {
  return {
    ...report,
    dettaglioMezziBatteriaBassa: report.dettaglioMezziBatteriaBassa ?? [],
    dettaglioMezziInManutenzione: report.dettaglioMezziInManutenzione ?? [],
    distribuzioneCorsePerTipo: report.distribuzioneCorsePerTipo ?? [],
    indicatoriPrincipali: report.indicatoriPrincipali ?? [],
    statoServizio: report.statoServizio ?? [],
    zoneCoperte: report.zoneCoperte ?? [],
  };
}

type BarraGraficoProps = {
  coloreBarra: string;
  descrizione?: string;
  etichetta: string;
  massimo: number;
  valore: number;
};

function estraiNumeroIntero(valore: string): number {
  const numero = Number.parseInt(valore.replace(/[^\d-]/g, ""), 10);
  return Number.isNaN(numero) ? 0 : numero;
}

function BarraGrafico({
  coloreBarra,
  descrizione,
  etichetta,
  massimo,
  valore,
}: BarraGraficoProps) {
  const percentuale = massimo > 0 ? Math.max((valore / massimo) * 100, 8) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">{etichetta}</p>
          {descrizione ? (
            <p className="text-xs leading-5 text-slate-500">{descrizione}</p>
          ) : null}
        </div>
        <p className="text-lg font-semibold text-slate-950">{valore}</p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-[width]"
          style={{
            background: coloreBarra,
            width: `${percentuale}%`,
          }}
        />
      </div>
    </div>
  );
}

// La reportistica admin aggiorna periodicamente i dati cosi prenotazioni aperte,
// mezzi in movimento e indicatori sintetici restano allineati nel tempo.
export default function ReportAggregatiAmministrazioneClient({
  reportIniziale,
}: ReportAggregatiAmministrazioneClientProps) {
  const [report, setReport] = useState(() =>
    normalizzaReportAggregato(reportIniziale),
  );

  const distribuzioneConColori = report.distribuzioneCorsePerTipo.map((item, indice) => ({
    ...item,
    coloreBarra: ["#0f766e", "#0891b2", "#2563eb"][indice] ?? "#0f766e",
  }));
  const massimoDistribuzione = Math.max(
    ...distribuzioneConColori.map((item) => item.valore),
    0,
  );
  const statoServizioConConteggio = report.statoServizio.map((item, indice) => ({
    ...item,
    conteggio: estraiNumeroIntero(item.valore),
    coloreBarra:
      ["#0f766e", "#2563eb", "#f59e0b", "#ef4444", "#7c3aed"][indice] ??
      "#0f766e",
  }));
  const massimoStatoServizio = Math.max(
    ...statoServizioConConteggio.map((item) => item.conteggio),
    0,
  );

  useEffect(() => {
    let annullato = false;

    async function aggiornaReport() {
      try {
        const response = await fetch("/api/admin/report-aggregati", {
          method: "GET",
          cache: "no-store",
        });

        const result =
          (await response.json().catch(() => null)) as ReportAdminApiResponse | null;

        if (!response.ok || !result?.report || annullato) {
          return;
        }

        setReport(normalizzaReportAggregato(result.report));
      } catch {
        // Manteniamo l'ultimo snapshot valido se il refresh fallisce.
      }
    }

    const intervallo = window.setInterval(() => {
      void aggiornaReport();
    }, 5000);

    return () => {
      annullato = true;
      window.clearInterval(intervallo);
    };
  }, []);

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Report aggregati
            </span>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Qui leggi l&apos;andamento sintetico del servizio.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Questa prima sezione riunisce indicatori aggregati su corse,
                ricavi, pause e stato corrente della flotta, cosi la lettura
                istituzionale resta separata dalla consultazione della mappa.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="/api/admin/report-aggregati/export/csv"
                  className="inline-flex items-center justify-center rounded-full border border-cyan-300 bg-cyan-300/15 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/25"
                >
                  Esporta CSV
                </a>
                <a
                  href="/api/admin/report-aggregati/export/pdf"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Esporta PDF
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Corse concluse
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {report.indicatoriPrincipali[0]?.valore}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">
                Ricavo totale
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {report.indicatoriPrincipali[1]?.valore}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Distribuzione visiva
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Corse concluse per tipologia
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Questo confronto rende immediata la lettura delle tipologie di
              mezzo piu coinvolte nelle corse concluse del campione.
            </p>
          </div>

          <div className="mt-5 space-y-5">
            {distribuzioneConColori.map((item) => (
              <BarraGrafico
                key={item.label}
                coloreBarra={`linear-gradient(90deg, ${item.coloreBarra}, #67e8f9)`}
                etichetta={item.label}
                massimo={massimoDistribuzione}
                valore={item.valore}
              />
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Stato servizio
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Quadro numerico immediato
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Le barre aiutano a confrontare rapidamente disponibilita,
              prenotazioni aperte, mezzi in movimento, batteria bassa e
              manutenzione.
            </p>
          </div>

          <div className="mt-5 space-y-5">
            {statoServizioConConteggio.map((item) => (
              <BarraGrafico
                key={item.label}
                coloreBarra={`linear-gradient(90deg, ${item.coloreBarra}, #c4b5fd)`}
                descrizione={item.descrizione}
                etichetta={item.label}
                massimo={massimoStatoServizio}
                valore={item.conteggio}
              />
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Mobilita osservata
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Indicatori principali
            </h2>
          </div>

          <div className="mt-5 grid gap-4">
            {report.indicatoriPrincipali.map((indicatore) => (
              <div
                key={indicatore.label}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {indicatore.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {indicatore.valore}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {indicatore.descrizione}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Stato servizio
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Quadro corrente della flotta
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {report.statoServizio.map((indicatore) => (
              <div
                key={indicatore.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-950">
                    {indicatore.label}
                  </p>
                  <p className="text-lg font-semibold text-slate-950">
                    {indicatore.valore}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {indicatore.descrizione}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-800">
              Distribuzione corse concluse
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {report.distribuzioneCorsePerTipo.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-cyan-100 bg-white px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {item.valore}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Aree urbane coperte nel campione corrente: {report.areeCoperte}.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {report.zoneCoperte.map((zona) => (
                <span
                  key={zona}
                  className="inline-flex rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-semibold text-cyan-800"
                >
                  {zona}
                </span>
              ))}
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
