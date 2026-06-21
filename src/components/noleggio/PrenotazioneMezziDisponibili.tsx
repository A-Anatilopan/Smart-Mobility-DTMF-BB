"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Mezzo } from "@/types/mobilita";
import type {
  NoleggioUtenteController,
} from "@/components/noleggio/useNoleggioUtente";
import {
  calcolaCostoPausaTotaleCent,
  calcolaCostoUtilizzoTotaleCent,
  COSTO_SBLOCCO_CENT,
} from "@/lib/tariffe-noleggio";

type PrenotazioneMezziDisponibiliProps = {
  mezziDisponibili: Mezzo[];
  noleggioUtente: NoleggioUtenteController;
  haNoleggioAttivo: boolean;
};

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

function descriviPagamento(
  pagamento: {
    alias: string | null;
    circuito: string | null;
    ultime4: string | null;
  } | null | undefined,
): string {
  if (!pagamento) {
    return "Non disponibile";
  }

  if (pagamento.alias?.trim()) {
    return pagamento.alias;
  }

  if (pagamento.circuito && pagamento.ultime4) {
    return `${pagamento.circuito} •••• ${pagamento.ultime4}`;
  }

  return "Non disponibile";
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

export default function PrenotazioneMezziDisponibili({
  mezziDisponibili,
  noleggioUtente,
  haNoleggioAttivo,
}: PrenotazioneMezziDisponibiliProps) {
  const {
    prenotazioneAttiva,
    corsaAttiva,
    ultimaCorsaTerminata,
    riepilogoConclusioneAperto,
    chiudiRiepilogoConclusione,
  } = noleggioUtente;
  const [adesso, setAdesso] = useState(() => Date.now());

  useEffect(() => {
    if (!corsaAttiva) {
      return;
    }

    const intervallo = window.setInterval(() => {
      setAdesso(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervallo);
    };
  }, [corsaAttiva]);

  const dettaglioCorsaAttiva = useMemo(() => {
    if (!corsaAttiva) {
      return null;
    }

    const durataUtilizzoStimata =
      corsaAttiva.durataUtilizzoMs +
      (corsaAttiva.stato === "ATTIVA"
        ? Math.max(adesso - new Date(corsaAttiva.ultimaRipresaAt).getTime(), 0)
        : 0);
    const durataPausaStimata =
      corsaAttiva.durataPausaMs +
      (corsaAttiva.stato === "IN_PAUSA" && corsaAttiva.pausaIniziataAt
        ? Math.max(adesso - new Date(corsaAttiva.pausaIniziataAt).getTime(), 0)
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
  }, [adesso, corsaAttiva]);

  return (
    <section className="space-y-5">
      {riepilogoConclusioneAperto && ultimaCorsaTerminata ? (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-3xl rounded-[1.75rem] border border-emerald-200 bg-white p-6 shadow-[0_30px_90px_-38px_rgba(15,23,42,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Corsa conclusa
                </p>
                <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Il riepilogo finale e gia pronto.
                </h3>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  Hai terminato il noleggio con successo. Qui trovi subito tempo,
                  costi e mezzo usato, senza dover scorrere tutta la schermata.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  chiudiRiepilogoConclusione();
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Chiudi
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Mezzo
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {ultimaCorsaTerminata.mezzo
                    ? `${ultimaCorsaTerminata.mezzo.modello} (${ultimaCorsaTerminata.mezzo.codice})`
                    : ultimaCorsaTerminata.mezzoId}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Utilizzo
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {formattaDurata(ultimaCorsaTerminata.durataUtilizzoMs)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Pausa
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {formattaDurata(ultimaCorsaTerminata.durataPausaMs)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Metodo usato
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {descriviPagamento(ultimaCorsaTerminata.pagamento)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-950 bg-slate-950 px-4 py-3 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  Totale
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {formattaImportoCent(ultimaCorsaTerminata.costi.costoTotaleCent)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Flusso noleggio
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          {haNoleggioAttivo
            ? "Il tuo noleggio e adesso al centro della schermata"
            : "La mappa e il tuo punto di controllo"}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          {haNoleggioAttivo
            ? "Quando hai gia un mezzo associato, la dashboard si concentra solo sul noleggio corrente: vedi stato, tempi e costi senza distrazioni."
            : "Apri il popup del mezzo direttamente sulla mappa per prenotarlo, avviare la corsa, metterla in pausa o terminarla senza cambiare contesto."}
        </p>
      </div>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          {/* Il riquadro sinistro riassume lo stato corrente cosi l'utente
              capisce subito quale mezzo sta gestendo e cosa deve fare sulla mappa. */}
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Stato attuale
          </p>

          {corsaAttiva ? (
            <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 p-5">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                {corsaAttiva.stato === "IN_PAUSA"
                  ? "La tua corsa e in pausa"
                  : "Hai gia una corsa in corso"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {corsaAttiva.stato === "IN_PAUSA"
                  ? "Il mezzo resta associato al tuo account finche non riprenderai o terminerai la corsa. Apri il popup dello stesso mezzo sulla mappa per farlo ripartire o chiuderlo."
                  : "Apri il popup dello stesso mezzo sulla mappa per metterlo in pausa oppure terminare la corsa quando hai concluso."}
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-800">
                <p>
                  <span className="font-semibold">Codice corsa:</span>{" "}
                  {corsaAttiva.codice}
                </p>
                <p>
                  <span className="font-semibold">Stato:</span>{" "}
                  {corsaAttiva.stato === "IN_PAUSA" ? "In pausa" : "Attiva"}
                </p>
                <p>
                  <span className="font-semibold">Inizio:</span>{" "}
                  {formattaData(corsaAttiva.iniziataAt)}
                </p>
                <p>
                  <span className="font-semibold">Inizio pausa:</span>{" "}
                  {formattaData(corsaAttiva.pausaIniziataAt)}
                </p>
                <p>
                  <span className="font-semibold">Mezzo:</span>{" "}
                  {corsaAttiva.mezzo
                    ? `${corsaAttiva.mezzo.modello} (${corsaAttiva.mezzo.codice})`
                    : corsaAttiva.mezzoId}
                </p>
                <p>
                  <span className="font-semibold">Metodo associato:</span>{" "}
                  {descriviPagamento(corsaAttiva.pagamento)}
                </p>
              </div>

              {dettaglioCorsaAttiva ? (
                <div className="mt-5 rounded-2xl border border-sky-100 bg-white/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Costo {corsaAttiva.stato === "IN_PAUSA" ? "aggiornato" : "stimato"}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">
                        {formattaImportoCent(dettaglioCorsaAttiva.costoTotaleCent)}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600">
                      Sblocco, utilizzo e pause conteggiati sul tempo reale.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Sblocco
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-950">
                        {formattaImportoCent(dettaglioCorsaAttiva.costoSbloccoCent)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Utilizzo
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-950">
                        {formattaImportoCent(dettaglioCorsaAttiva.costoUtilizzoCent)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {formattaDurata(dettaglioCorsaAttiva.durataUtilizzoStimata)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Pausa
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-950">
                        {formattaImportoCent(dettaglioCorsaAttiva.costoPausaCent)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {formattaDurata(dettaglioCorsaAttiva.durataPausaStimata)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-950 bg-slate-950 px-4 py-3 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">
                        Totale
                      </p>
                      <p className="mt-1 text-base font-semibold">
                        {formattaImportoCent(dettaglioCorsaAttiva.costoTotaleCent)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : prenotazioneAttiva ? (
            <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                Prenotazione confermata
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Il mezzo selezionato e stato bloccato per te. Adesso puoi
                aprire il popup dello stesso mezzo sulla mappa e avviare la corsa.
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-800">
                <p>
                  <span className="font-semibold">Codice prenotazione:</span>{" "}
                  {prenotazioneAttiva.codice}
                </p>
                <p>
                  <span className="font-semibold">Scadenza:</span>{" "}
                  {formattaData(prenotazioneAttiva.scadeAt)}
                </p>
                <p>
                  <span className="font-semibold">Mezzo bloccato:</span>{" "}
                  {prenotazioneAttiva.mezzo
                    ? `${prenotazioneAttiva.mezzo.modello} (${prenotazioneAttiva.mezzo.codice})`
                    : prenotazioneAttiva.mezzoId}
                </p>
              </div>
            </div>
          ) : ultimaCorsaTerminata ? (
            <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                Ultima corsa salvata in cronologia
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Tramite questa sezione puoi accedere alla cronologia delle tue ultime corse.
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-800">
                <p>
                  <span className="font-semibold">Ultima chiusura registrata:</span>{" "}
                  {formattaData(ultimaCorsaTerminata.terminataAt)}
                </p>
                <p>
                  <span className="font-semibold">Mezzo usato:</span>{" "}
                  {ultimaCorsaTerminata.mezzo
                    ? `${ultimaCorsaTerminata.mezzo.modello} (${ultimaCorsaTerminata.mezzo.codice})`
                    : ultimaCorsaTerminata.mezzoId}
                </p>
                <p>
                  <span className="font-semibold">Addebito finale:</span>{" "}
                  {descriviPagamento(ultimaCorsaTerminata.pagamento)}
                </p>
              </div>
              <div className="mt-5">
                <Link
                  href="/dashboard/cronologia"
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Apri cronologia
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                {mezziDisponibili.length > 0
                  ? "Nessuna prenotazione attiva"
                  : "Nessun mezzo prenotabile adesso"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {mezziDisponibili.length > 0
                  ? "Apri uno dei mezzi disponibili sulla mappa e usa il popup per bloccarlo e iniziare il noleggio."
                  : "In questo momento i mezzi disponibili del campione risultano gia impegnati. Riprova piu tardi oppure libera un mezzo attualmente in uso."}
              </p>
            </div>
          )}

        </article>

        <div>
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              {haNoleggioAttivo ? "Cosa puoi fare adesso" : "Muoviti in tre passaggi"}
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              {haNoleggioAttivo ? (
                <>
                  <p>1. La mappa ti mostra solo il mezzo che stai gestendo in questo momento.</p>
                  <p>2. Apri il suo popup per riprendere la corsa, metterla in pausa oppure terminarla.</p>
                  <p>3. Tieni d&apos;occhio tempi e costi da questo pannello, senza distrarti con altri veicoli.</p>
                </>
              ) : (
                <>
                  <p>
                    1. Apri sulla mappa un mezzo disponibile vicino a te e guarda le sue informazioni.
                  </p>
                  <p>
                    2. Cliccandoci su, puoi prenotarlo oppure iniziare subito il noleggio.
                  </p>
                  <p>
                    3. Quando la corsa parte, questa schermata si aggiorna e segue il tuo noleggio passo dopo passo.
                  </p>
                </>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
