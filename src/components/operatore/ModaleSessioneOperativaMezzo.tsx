"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import type { Mezzo } from "@/types/mobilita";
import {
  MOTIVI_SESSIONE_OPERATIVA_MEZZO,
  type MotivoSessioneOperativaMezzo,
} from "@/types/operazioni-mezzo";

type SessioneOperativaAttivaCard = {
  id: number;
  codice: string;
  motivo: string;
  noteApertura: string | null;
  noteChiusura: string | null;
  apertaAt: string;
  operatore: {
    id: number;
    nome: string;
    cognome: string;
    email: string;
  };
};

type ModaleSessioneOperativaMezzoProps = {
  mezzo: Mezzo;
  sessioneAttiva?: SessioneOperativaAttivaCard | null;
  onClose: () => void;
};

type MessaggioOperazione =
  | {
      tipo: "successo" | "errore";
      testo: string;
    }
  | null;

type RispostaApi = {
  errore?: string;
  messaggio?: string;
};

const LABEL_MOTIVO: Record<MotivoSessioneOperativaMezzo, string> = {
  RIPOSIZIONAMENTO: "Riposizionamento strategico",
  RITIRO_PER_MANUTENZIONE: "Ritiro per manutenzione",
  TRASFERIMENTO_DEPOSITO: "Trasferimento in deposito",
  VERIFICA_TECNICA: "Verifica tecnica sul posto",
  ALTRO: "Altro",
};

function normalizzaNote(valore: string): string {
  return valore.trim().slice(0, 500);
}

export default function ModaleSessioneOperativaMezzo({
  mezzo,
  sessioneAttiva,
  onClose,
}: ModaleSessioneOperativaMezzoProps) {
  const router = useRouter();
  const [motivo, setMotivo] =
    useState<MotivoSessioneOperativaMezzo>("RIPOSIZIONAMENTO");
  const [noteApertura, setNoteApertura] = useState("");
  const [noteChiusura, setNoteChiusura] = useState("");
  const [messaggio, setMessaggio] = useState<MessaggioOperazione>(null);
  const [isPending, startTransition] = useTransition();

  const modalita = sessioneAttiva ? "chiusura" : "apertura";

  const titolo = useMemo(() => {
    return modalita === "apertura"
      ? "Apri una sessione operativa su questo mezzo."
      : "Chiudi la sessione operativa di questo mezzo.";
  }, [modalita]);

  const descrizione = useMemo(() => {
    return modalita === "apertura"
      ? "Usa questa azione quando devi spostare il mezzo sul territorio senza aprire un noleggio utente."
      : "Chiudi la sessione quando hai finito lo spostamento, cosi il mezzo torna allo stato corretto del servizio.";
  }, [modalita]);

  useEffect(() => {
    if (messaggio?.tipo !== "successo") {
      return;
    }

    const timeout = window.setTimeout(() => {
      onClose();
      startTransition(() => {
        router.refresh();
      });
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [messaggio, onClose, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessaggio(null);

    const endpoint = sessioneAttiva
      ? `/api/operatori/mezzi/${mezzo.id}/blocco`
      : `/api/operatori/mezzi/${mezzo.id}/sblocco`;

    const body = sessioneAttiva
      ? {
          noteChiusura: normalizzaNote(noteChiusura),
        }
      : {
          motivo,
          note: normalizzaNote(noteApertura),
        };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result =
        (await response.json().catch(() => null)) as RispostaApi | null;

      if (!response.ok) {
        setMessaggio({
          tipo: "errore",
          testo:
            result?.errore ??
            "L'operazione non e andata a buon fine. Riprova tra qualche istante.",
        });
        return;
      }

      setMessaggio({
        tipo: "successo",
        testo:
          result?.messaggio ??
          (sessioneAttiva
            ? "Sessione operativa chiusa con successo."
            : "Sessione operativa aperta con successo."),
      });
    } catch {
      setMessaggio({
        tipo: "errore",
        testo:
          "Non siamo riusciti a completare l'operazione. Riprova tra qualche istante.",
      });
    }
  }

  const messaggioClassName =
    messaggio?.tipo === "successo"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-6">
      <div className="relative z-[5001] max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_36px_100px_-42px_rgba(15,23,42,0.48)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              Sessione operativa mezzo
            </p>
            <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
              {titolo}
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              {descrizione}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
            aria-label="Chiudi modale sessione operativa"
          >
            ×
          </button>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-amber-100 bg-amber-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            Mezzo selezionato
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Modello
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {mezzo.modello}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Codice mezzo
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {mezzo.codice}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Stato attuale
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {mezzo.stato.replaceAll("_", " ")}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Area di servizio
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {mezzo.areaServizioNome}
              </p>
            </div>
          </div>
        </div>

        {sessioneAttiva ? (
          <div className="mt-5 rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
              Sessione attiva
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Codice sessione
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {sessioneAttiva.codice}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Motivo
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {sessioneAttiva.motivo.replaceAll("_", " ")}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Aperta da
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {sessioneAttiva.operatore.nome} {sessioneAttiva.operatore.cognome}
                </p>
                <p className="text-sm text-slate-600">
                  {sessioneAttiva.operatore.email}
                </p>
              </div>
              {sessioneAttiva.noteApertura ? (
                <div className="rounded-2xl bg-white px-4 py-3 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Nota apertura
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {sessioneAttiva.noteApertura}
                  </p>
                </div>
              ) : null}

              {sessioneAttiva.noteChiusura ? (
                <div className="rounded-2xl bg-white px-4 py-3 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Nota chiusura
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {sessioneAttiva.noteChiusura}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {messaggio ? (
          <div className={`mt-5 rounded-[1.5rem] border px-5 py-4 ${messaggioClassName}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {messaggio.tipo === "successo"
                    ? "Operazione completata"
                    : "Operazione non riuscita"}
                </p>
                <p className="text-sm leading-6">{messaggio.testo}</p>
              </div>

              <button
                type="button"
                onClick={() => setMessaggio(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-current/20 bg-white/70 text-lg font-semibold transition hover:bg-white"
                aria-label="Chiudi messaggio"
              >
                ×
              </button>
            </div>
          </div>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {!sessioneAttiva ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
              <label
                htmlFor="motivo-sessione-operativa"
                className="text-sm font-semibold text-slate-950"
              >
                Motivo operativo
              </label>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Indica perche stai sbloccando questo mezzo per lo spostamento sul territorio.
              </p>
              <select
                id="motivo-sessione-operativa"
                value={motivo}
                onChange={(event) =>
                  setMotivo(event.target.value as MotivoSessioneOperativaMezzo)
                }
                disabled={isPending}
                className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100"
              >
                {MOTIVI_SESSIONE_OPERATIVA_MEZZO.map((motivoCorrente) => (
                  <option key={motivoCorrente} value={motivoCorrente}>
                    {LABEL_MOTIVO[motivoCorrente]}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
            <label
              htmlFor="note-sessione-operativa"
              className="text-sm font-semibold text-slate-950"
            >
              {sessioneAttiva ? "Nota di chiusura" : "Nota opzionale"}
            </label>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {sessioneAttiva
                ? "Se necessario, lascia una breve nota finale sullo spostamento appena concluso."
                : "Se serve, aggiungi un dettaglio utile per ricordare lo spostamento in seguito."}
            </p>
            <textarea
              id="note-sessione-operativa"
              value={sessioneAttiva ? noteChiusura : noteApertura}
              onChange={(event) =>
                sessioneAttiva
                  ? setNoteChiusura(event.target.value)
                  : setNoteApertura(event.target.value)
              }
              disabled={isPending}
              rows={4}
              placeholder={
                sessioneAttiva
                  ? "Esempio: mezzo riposizionato vicino al campus."
                  : "Esempio: spostamento verso area con maggiore domanda."
              }
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100"
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`inline-flex min-w-[220px] items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                sessioneAttiva
                  ? "bg-slate-950 hover:bg-slate-800"
                  : "bg-amber-600 hover:bg-amber-500"
              }`}
            >
              {isPending
                ? "Attendi..."
                : sessioneAttiva
                  ? "Blocca e chiudi sessione"
                  : "Sblocca per intervento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
