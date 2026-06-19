"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Mezzo } from "@/types/mobilita";
import {
  CATEGORIE_SEGNALAZIONE_MEZZO,
  type CategoriaSegnalazioneMezzo,
} from "@/types/segnalazioni";

type ModaleSegnalazioneMezzoUtenteProps = {
  mezzo: Mezzo;
  onClose: () => void;
};

type MessaggioSegnalazione =
  | {
      tipo: "successo" | "errore";
      testo: string;
      codiceSegnalazione?: string;
    }
  | null;

type RispostaSegnalazioneApi = {
  errore?: string;
  messaggio?: string;
  segnalazione?: {
    codice?: string;
  };
};

const LABEL_CATEGORIE: Record<CategoriaSegnalazioneMezzo, string> = {
  DANNO_VISIBILE: "Danno visibile",
  BLOCCO_APERTURA: "Blocco apertura",
  BLOCCO_CHIUSURA: "Blocco chiusura",
  PROBLEMA_FRENI: "Problema freni",
  ALTRO: "Altro",
};

function validaFormSegnalazione(input: {
  categoria: CategoriaSegnalazioneMezzo;
  descrizione: string;
}): string | null {
  const descrizione = input.descrizione.trim();

  if (!descrizione) {
    return "Inserisci una descrizione valida del problema riscontrato.";
  }

  if (input.categoria === "ALTRO" && descrizione.length < 10) {
    return "Per la categoria selezionata descrivi il problema con almeno 10 caratteri utili.";
  }

  if (descrizione.length < 5) {
    return "Descrivi il problema con almeno 5 caratteri utili.";
  }

  return null;
}

// Questo modale apre il contesto corretto della segnalazione senza spostare
// l'utente fuori dalla mappa e conferma subito il mezzo selezionato.
export default function ModaleSegnalazioneMezzoUtente({
  mezzo,
  onClose,
}: ModaleSegnalazioneMezzoUtenteProps) {
  const [categoria, setCategoria] =
    useState<CategoriaSegnalazioneMezzo>("DANNO_VISIBILE");
  const [descrizione, setDescrizione] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messaggio, setMessaggio] = useState<MessaggioSegnalazione>(null);
  const [successoInviato, setSuccessoInviato] = useState(false);

  const testoAiutoCategoria = useMemo(() => {
    if (categoria === "ALTRO") {
      return "Per questa categoria descrivi il problema nel modo piu chiaro possibile.";
    }

    return "Scegli la categoria che descrive meglio il problema riscontrato.";
  }, [categoria]);

  useEffect(() => {
    if (!successoInviato) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onClose();
    }, 10000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [onClose, successoInviato]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const erroreValidazione = validaFormSegnalazione({
      categoria,
      descrizione,
    });

    if (erroreValidazione) {
      setMessaggio({
        tipo: "errore",
        testo: erroreValidazione,
      });
      return;
    }

    setIsSubmitting(true);
    setMessaggio(null);

    try {
      const response = await fetch("/api/segnalazioni/mezzi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mezzoId: mezzo.id,
          mezzoCodice: mezzo.codice,
          categoria,
          descrizione,
        }),
      });

      const result =
        (await response.json().catch(() => null)) as RispostaSegnalazioneApi | null;

      if (!response.ok) {
        setMessaggio({
          tipo: "errore",
          testo:
            result?.errore ??
            "Non siamo riusciti a inviare la segnalazione. Riprova tra qualche istante.",
        });
        return;
      }

      setMessaggio({
        tipo: "successo",
        testo:
          result?.messaggio ??
          "Segnalazione inviata con successo.",
        codiceSegnalazione: result?.segnalazione?.codice,
      });
      setSuccessoInviato(true);
    } catch {
      setMessaggio({
        tipo: "errore",
        testo:
          "Non siamo riusciti a inviare la segnalazione. Riprova tra qualche istante. Se il problema continua, aggiorna la pagina e riprova.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const messaggioClassName =
    messaggio?.tipo === "successo"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-6">
      <div className="relative z-[5001] max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_36px_100px_-42px_rgba(15,23,42,0.48)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Segnala un problema
            </p>
            <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
              Indica cosa non va in questo mezzo.
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              La segnalazione restera collegata a questo mezzo, cosi l&apos;area
              operativa potra prenderla in carico senza chiederti di reinserire
              i dati principali.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
            aria-label="Chiudi modale segnalazione"
          >
            ×
          </button>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-teal-100 bg-teal-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
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
                Tipo
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {mezzo.tipo}
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

        {messaggio ? (
          <div className={`mt-5 rounded-[1.5rem] border px-5 py-4 ${messaggioClassName}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {messaggio.tipo === "successo"
                    ? "Segnalazione registrata"
                    : "Invio non riuscito"}
                </p>
                <p className="text-sm leading-6">{messaggio.testo}</p>
                {messaggio.codiceSegnalazione ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                    Codice segnalazione: {messaggio.codiceSegnalazione}
                  </p>
                ) : null}
                {messaggio.tipo === "successo" ? (
                  <p className="text-xs leading-5">
                    Questa finestra si chiudera automaticamente tra pochi secondi, ma puoi chiuderla subito con la X.
                  </p>
                ) : null}
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

        {!successoInviato ? (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
              <label
                htmlFor="categoria-segnalazione-mezzo"
                className="text-sm font-semibold text-slate-950"
              >
                Categoria del problema
              </label>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {testoAiutoCategoria}
              </p>
              <select
                id="categoria-segnalazione-mezzo"
                value={categoria}
                onChange={(event) =>
                  setCategoria(event.target.value as CategoriaSegnalazioneMezzo)
                }
                disabled={isSubmitting}
                className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
              >
                {CATEGORIE_SEGNALAZIONE_MEZZO.map((categoriaCorrente) => (
                  <option key={categoriaCorrente} value={categoriaCorrente}>
                    {LABEL_CATEGORIE[categoriaCorrente]}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
              <label
                htmlFor="descrizione-segnalazione-mezzo"
                className="text-sm font-semibold text-slate-950"
              >
                Descrizione
              </label>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Descrivi in poche parole cosa hai notato o cosa non ha funzionato.
              </p>
              <textarea
                id="descrizione-segnalazione-mezzo"
                value={descrizione}
                onChange={(event) => setDescrizione(event.target.value)}
                disabled={isSubmitting}
                rows={5}
                placeholder="Esempio: la chiusura non scatta correttamente e il mezzo non si blocca."
                className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {categoria === "ALTRO"
                  ? "Con questa categoria e importante descrivere il problema in modo piu dettagliato."
                  : "Una descrizione chiara aiuta il servizio a intervenire piu velocemente."}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
              >
                {isSubmitting ? "Invio in corso..." : "Invia segnalazione"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Chiudi adesso
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
