"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AzioneWorkflowMezzoScarico,
  StatoGestioneMezzoScarico,
} from "@/lib/mezzi-scarichi";

type AzioniWorkflowMezzoScaricoProps = {
  gestioneId: number;
  stato: StatoGestioneMezzoScarico;
  operatoreCorrenteId: number;
  operatoreAssegnatoId: number;
  operatoreAssegnatoNome: string;
};

const AUTO_DISMISS_MS = 10000;

function risolviCtaWorkflow(
  stato: StatoGestioneMezzoScarico,
): { etichetta: string; azione: AzioneWorkflowMezzoScarico } | null {
  switch (stato) {
    case "RITIRO_PROGRAMMATO_MEZZO_SCARICO":
      return {
        etichetta: "Segna mezzo ritirato",
        azione: "SEGNA_MEZZO_RITIRATO",
      };
    case "MEZZO_RITIRATO":
      return {
        etichetta: "Avvia carica",
        azione: "AVVIA_CARICA",
      };
    case "IN_CARICA":
      return {
        etichetta: "Segna carica completata",
        azione: "SEGNA_CARICA_COMPLETATA",
      };
    case "CARICA_COMPLETATA":
      return {
        etichetta: "Programma rimessa",
        azione: "PROGRAMMA_RIMESSA",
      };
    case "RIMESSA_PROGRAMMATA":
      return {
        etichetta: "Completa rimessa",
        azione: "COMPLETA_RIMESSA",
      };
    case "RIMESSA_COMPLETATA":
      return null;
  }
}

// Il pannello client guida un solo passo per volta: evita errori operativi e
// mantiene chiaro quale sia la prossima azione consentita sul mezzo scarico.
export default function AzioniWorkflowMezzoScarico({
  gestioneId,
  stato,
  operatoreCorrenteId,
  operatoreAssegnatoId,
  operatoreAssegnatoNome,
}: AzioniWorkflowMezzoScaricoProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [messaggioErrore, setMessaggioErrore] = useState("");
  const [messaggioSuccesso, setMessaggioSuccesso] = useState("");

  const cta = risolviCtaWorkflow(stato);
  const inCaricoAdAltroOperatore = operatoreCorrenteId !== operatoreAssegnatoId;

  useEffect(() => {
    if (!messaggioErrore && !messaggioSuccesso) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessaggioErrore("");
      setMessaggioSuccesso("");
    }, AUTO_DISMISS_MS);

    return () => window.clearTimeout(timeoutId);
  }, [messaggioErrore, messaggioSuccesso]);

  async function handleAzioneWorkflow() {
    if (!cta) {
      return;
    }

    setIsPending(true);
    setMessaggioErrore("");
    setMessaggioSuccesso("");

    try {
      const response = await fetch(
        `/api/operatori/mezzi-scarichi/${gestioneId}/workflow`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            azione: cta.azione,
          }),
        },
      );

      const data = (await response.json().catch(() => null)) as
        | { errore?: string; messaggio?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.errore ??
            "Non e stato possibile aggiornare il workflow del mezzo scarico.",
        );
      }

      setMessaggioSuccesso(
        data?.messaggio ?? "Workflow aggiornato con successo.",
      );
      router.refresh();
    } catch (error) {
      setMessaggioErrore(
        error instanceof Error
          ? error.message
          : "Errore imprevisto. Riprova tra qualche istante.",
      );
    } finally {
      setIsPending(false);
    }
  }

  if (inCaricoAdAltroOperatore) {
    return (
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
        Questa gestione e in carico a {operatoreAssegnatoNome}. Da qui puoi
        leggerne lo stato, ma non puoi farla avanzare.
      </div>
    );
  }

  if (!cta) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-white/70 bg-white/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
        Prossimo passo
      </p>

      {(messaggioErrore || messaggioSuccesso) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
            messaggioErrore
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {messaggioErrore || messaggioSuccesso}
        </div>
      )}

      <button
        type="button"
        onClick={handleAzioneWorkflow}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-300"
      >
        {isPending ? "Aggiorno..." : cta.etichetta}
      </button>
    </div>
  );
}
