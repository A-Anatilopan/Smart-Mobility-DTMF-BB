"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AzioneProgrammaRitiroMezzoScaricoProps = {
  mezzoId: string;
};

const AUTO_DISMISS_MS = 10000;

// Questo client component apre il primo vero gesto operativo di OP.09 senza
// trasformare l'intera pagina in client-side: invia il comando, mostra l'esito
// e aggiorna la sezione appena il workflow e stato creato.
export default function AzioneProgrammaRitiroMezzoScarico({
  mezzoId,
}: AzioneProgrammaRitiroMezzoScaricoProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [noteOperative, setNoteOperative] = useState("");
  const [messaggioErrore, setMessaggioErrore] = useState("");
  const [messaggioSuccesso, setMessaggioSuccesso] = useState("");

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

  async function handleProgrammaRitiro() {
    setIsPending(true);
    setMessaggioErrore("");
    setMessaggioSuccesso("");

    try {
      const response = await fetch("/api/operatori/mezzi-scarichi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mezzoId,
          noteOperative,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { errore?: string; messaggio?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.errore ??
            "Non e stato possibile programmare il ritiro del mezzo.",
        );
      }

      setMessaggioSuccesso(
        data?.messaggio ?? "Ritiro programmato con successo.",
      );
      setNoteOperative("");
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

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-white/70 bg-white/80 p-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
          Programma ritiro
        </p>
        <p className="text-sm leading-6 text-slate-600">
          Se serve, aggiungi una nota rapida per ricordare all&apos;operatore il
          contesto del recupero.
        </p>
      </div>

      <textarea
        value={noteOperative}
        onChange={(event) => setNoteOperative(event.target.value)}
        rows={3}
        placeholder="Esempio: mezzo vicino a stazione, ritiro da effettuare entro fine turno."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
      />

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
        onClick={handleProgrammaRitiro}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-300"
      >
        {isPending ? "Programmo..." : "Programma ritiro"}
      </button>
    </div>
  );
}
