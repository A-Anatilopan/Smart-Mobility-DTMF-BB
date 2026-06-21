"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type AzioniSegnalazioneOperatoreProps = {
  segnalazioneId: number;
  stato: string;
  operatoreCorrenteId: number;
  operatorePresaInCaricoId: number | null;
  operatorePresaInCaricoNome: string | null;
};

type RispostaAggiornamentoSegnalazione = {
  errore?: string;
  messaggio?: string;
};

type AzioneWorkflowRichiesta =
  | "PRENDI_IN_CARICO"
  | "PROGRAMMA_RITIRO"
  | "AVVIA_MANUTENZIONE"
  | "SEGNA_RISOLTA"
  | "PROGRAMMA_RIMESSA_IN_SERVIZIO"
  | "RIMETTI_IN_SERVIZIO";

// Questo pannello raccoglie le azioni minime del workflow operativo:
// prendere in carico una segnalazione aperta e poi chiuderla con riepilogo.
export default function AzioniSegnalazioneOperatore({
  segnalazioneId,
  stato,
  operatoreCorrenteId,
  operatorePresaInCaricoId,
  operatorePresaInCaricoNome,
}: AzioniSegnalazioneOperatoreProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errore, setErrore] = useState("");
  const [riepilogoRisoluzione, setRiepilogoRisoluzione] = useState("");
  const [mostraChiusura, setMostraChiusura] = useState(false);

  async function aggiornaSegnalazione(
    url: string,
    init?: RequestInit,
  ): Promise<boolean> {
    setErrore("");

    try {
      const response = await fetch(url, init);
      const result =
        (await response.json().catch(() => null)) as RispostaAggiornamentoSegnalazione | null;

      if (!response.ok) {
        setErrore(
          result?.errore ??
            "Non siamo riusciti ad aggiornare la segnalazione. Riprova tra poco.",
        );
        return false;
      }

      startTransition(() => {
        router.refresh();
      });
      return true;
    } catch {
      setErrore(
        "Non siamo riusciti ad aggiornare la segnalazione. Riprova tra poco.",
      );
      return false;
    }
  }

  async function aggiornaWorkflow(
    azione: AzioneWorkflowRichiesta,
    opzioni?: {
      riepilogoRisoluzione?: string;
    },
  ) {
    return aggiornaSegnalazione(
      `/api/operatori/segnalazioni/mezzi/${segnalazioneId}/workflow`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          azione,
          riepilogoRisoluzione: opzioni?.riepilogoRisoluzione ?? "",
        }),
      },
    );
  }

  async function handlePresaInCarico() {
    await aggiornaSegnalazione(
      `/api/operatori/segnalazioni/mezzi/${segnalazioneId}/workflow`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          azione: "PRENDI_IN_CARICO",
        }),
      },
    );
  }

  async function handleRisoluzione() {
    const chiusa = await aggiornaWorkflow("SEGNA_RISOLTA", {
      riepilogoRisoluzione,
    });

    if (chiusa) {
      setRiepilogoRisoluzione("");
      setMostraChiusura(false);
    }
  }

  if (stato === "APERTA") {
    return (
      <div className="w-full rounded-[1.35rem] border border-slate-200 bg-white/90 p-4 shadow-[0_14px_32px_-26px_rgba(15,23,42,0.28)]">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Presa in carico
          </p>
          <p className="text-sm leading-6 text-slate-600">
            Prendi in carico la segnalazione quando inizi davvero la verifica
            del mezzo, cosi il resto del team vede subito che il caso e gia in
            gestione.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePresaInCarico}
          disabled={isPending}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-300"
        >
          {isPending ? "Aggiorno..." : "Prendi in carico"}
        </button>

        {errore ? (
          <p className="mt-3 text-sm font-medium text-rose-700">{errore}</p>
        ) : null}
      </div>
    );
  }

  const casoAssegnatoAdAltroOperatore =
    stato !== "APERTA" &&
    operatorePresaInCaricoId !== null &&
    operatorePresaInCaricoId !== operatoreCorrenteId;

  if (casoAssegnatoAdAltroOperatore) {
    return (
      <div className="w-full rounded-[1.45rem] border border-amber-200 bg-[linear-gradient(180deg,_rgba(255,251,235,0.9)_0%,_rgba(255,255,255,0.96)_100%)] p-4 shadow-[0_16px_34px_-28px_rgba(245,158,11,0.35)]">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            Caso gia assegnato
          </span>
          <p className="text-sm leading-6 text-slate-700">
            Questa segnalazione e gia stata presa in carico da{" "}
            <span className="font-semibold text-slate-950">
              {operatorePresaInCaricoNome ?? "un altro operatore"}
            </span>
            . Da qui puoi leggerne lo stato, ma non puoi modificarne la
            gestione.
          </p>
        </div>
      </div>
    );
  }

  if (stato === "PRESA_IN_CARICO") {
    return (
      <div className="w-full rounded-[1.45rem] border border-emerald-100 bg-[linear-gradient(180deg,_rgba(236,253,245,0.8)_0%,_rgba(255,255,255,0.96)_100%)] p-4 shadow-[0_16px_34px_-28px_rgba(16,185,129,0.35)]">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            Caso in verifica
          </span>
          <p className="text-sm leading-6 text-slate-600">
            Hai gia preso in carico questa segnalazione. Quando decidi di
            togliere il mezzo dal servizio, puoi programmare il ritiro.
          </p>
          {operatorePresaInCaricoNome ? (
            <p className="text-sm font-medium text-emerald-800">
              Caso in carico a {operatorePresaInCaricoNome}.
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            void aggiornaWorkflow("PROGRAMMA_RITIRO");
          }}
          disabled={isPending}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-wait disabled:bg-emerald-300"
        >
          {isPending ? "Aggiorno..." : "Programma ritiro"}
        </button>

        {errore ? (
          <p className="mt-3 text-sm font-medium text-rose-700">{errore}</p>
        ) : null}
      </div>
    );
  }

  if (stato === "RITIRO_PROGRAMMATO") {
    return (
      <div className="w-full rounded-[1.45rem] border border-emerald-100 bg-[linear-gradient(180deg,_rgba(236,253,245,0.8)_0%,_rgba(255,255,255,0.96)_100%)] p-4 shadow-[0_16px_34px_-28px_rgba(16,185,129,0.35)]">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            Ritiro programmato
          </span>

          <div className="space-y-2">
            <p className="text-sm leading-6 text-slate-600">
              Il mezzo e fuori disponibilita e sta aspettando l&apos;inizio
              della manutenzione tecnica.
            </p>
            {operatorePresaInCaricoNome ? (
              <p className="text-sm font-medium text-emerald-800">
                Caso in carico a {operatorePresaInCaricoNome}.
              </p>
            ) : null}
          </div>

          {/* Il pulsante resta in un blocco dedicato per evitare che Safari/Turbopack
              lo nascondano quando il pannello azioni viene riaperto dopo un refresh. */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                void aggiornaWorkflow("AVVIA_MANUTENZIONE");
              }}
              disabled={isPending}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-wait disabled:bg-amber-300"
            >
              {isPending ? "Aggiorno..." : "Avvia manutenzione"}
            </button>
          </div>
        </div>

        {errore ? (
          <p className="mt-3 text-sm font-medium text-rose-700">{errore}</p>
        ) : null}
      </div>
    );
  }

  if (stato === "IN_MANUTENZIONE") {
    return (
      <div className="w-full rounded-[1.45rem] border border-rose-100 bg-[linear-gradient(180deg,_rgba(255,241,242,0.8)_0%,_rgba(255,255,255,0.96)_100%)] p-4 shadow-[0_16px_34px_-28px_rgba(244,63,94,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
            Manutenzione in corso
          </span>
          <button
            type="button"
            onClick={() => {
              setMostraChiusura((valore) => !valore);
              setErrore("");
            }}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {mostraChiusura ? "Chiudi modulo" : "Segna come risolta"}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Chiusura intervento
          </p>
          <p className="text-sm leading-6 text-slate-600">
            Quando il problema e stato sistemato, registra il riepilogo
            obbligatorio prima di passare alla fase successiva.
          </p>
        </div>

        {mostraChiusura ? (
          <div className="mt-4 rounded-[1.3rem] border border-rose-200 bg-white/90 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                Riepilogo risoluzione
              </p>
              <p className="text-sm leading-6 text-slate-600">
                Descrivi in breve cosa e stato fatto o sistemato sul mezzo.
              </p>
            </div>

            <textarea
              value={riepilogoRisoluzione}
              onChange={(event) => {
                setRiepilogoRisoluzione(event.target.value);
                if (errore) {
                  setErrore("");
                }
              }}
              rows={4}
              placeholder="Esempio: sostituito il blocco apertura e verificato il corretto funzionamento del mezzo."
              className="mt-3 w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRisoluzione}
                disabled={isPending}
                className="inline-flex w-full items-center justify-center rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-wait disabled:bg-rose-300"
              >
                {isPending ? "Salvo..." : "Conferma risoluzione"}
              </button>
            </div>
          </div>
        ) : null}

        {errore ? (
          <p className="mt-3 text-sm font-medium text-rose-700">{errore}</p>
        ) : null}
      </div>
    );
  }

  if (stato === "RISOLTA") {
    return (
      <div className="w-full rounded-[1.45rem] border border-sky-100 bg-[linear-gradient(180deg,_rgba(240,249,255,0.8)_0%,_rgba(255,255,255,0.96)_100%)] p-4 shadow-[0_16px_34px_-28px_rgba(14,165,233,0.28)]">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
            Problema risolto
          </span>
          <p className="text-sm leading-6 text-slate-600">
            Il problema risulta sistemato, ma il mezzo non torna ancora in
            servizio finche non programmi la rimessa finale.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void aggiornaWorkflow("PROGRAMMA_RIMESSA_IN_SERVIZIO");
          }}
          disabled={isPending}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-wait disabled:bg-sky-300"
        >
          {isPending ? "Aggiorno..." : "Programma rimessa in servizio"}
        </button>

        {errore ? (
          <p className="mt-3 text-sm font-medium text-rose-700">{errore}</p>
        ) : null}
      </div>
    );
  }

  if (stato === "RIMESSA_IN_SERVIZIO_PROGRAMMATA") {
    return (
      <div className="w-full rounded-[1.45rem] border border-violet-100 bg-[linear-gradient(180deg,_rgba(245,243,255,0.8)_0%,_rgba(255,255,255,0.96)_100%)] p-4 shadow-[0_16px_34px_-28px_rgba(139,92,246,0.28)]">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
            Rimessa programmata
          </span>
          <p className="text-sm leading-6 text-slate-600">
            Il mezzo e pronto per tornare disponibile, ma il rientro in
            servizio non e ancora stato confermato.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void aggiornaWorkflow("RIMETTI_IN_SERVIZIO");
          }}
          disabled={isPending}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:bg-violet-300"
        >
          {isPending ? "Aggiorno..." : "Rimetti in servizio"}
        </button>

        {errore ? (
          <p className="mt-3 text-sm font-medium text-rose-700">{errore}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50/90 px-4 py-3">
      <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
        Segnalazione chiusa
      </span>
    </div>
  );
}
