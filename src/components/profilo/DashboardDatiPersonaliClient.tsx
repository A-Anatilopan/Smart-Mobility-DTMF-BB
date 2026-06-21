"use client";

import { useEffect, useState, useTransition } from "react";
import { patenteScaduta } from "@/lib/patenti";

type ProfiloUtenteView = {
  nome: string;
  cognome: string;
  email: string;
  dataNascita: string;
  codiceFiscale: string;
  numeroPatente: string | null;
  categoriaPatente: string | null;
  scadenzaPatente: string | null;
};

type MessaggioFeedback =
  | {
      tipo: "successo" | "errore";
      testo: string;
    }
  | null;

type Props = {
  profiloIniziale: ProfiloUtenteView;
};

type FormPatente = {
  numeroPatente: string;
  categoriaPatente: string;
  scadenzaPatente: string;
};

type StatoPatenteView = {
  etichetta: "Valida" | "Scaduta" | "Incompleta" | "Non inserita";
  descrizione: string;
  className: string;
};

const CATEGORIE_PATENTE = ["", "AM", "A1", "A2", "A", "B"] as const;

function creaFormPatente(profilo: ProfiloUtenteView): FormPatente {
  return {
    numeroPatente: profilo.numeroPatente ?? "",
    categoriaPatente: profilo.categoriaPatente ?? "",
    scadenzaPatente: profilo.scadenzaPatente ?? "",
  };
}

function formattaDataItaliana(dataIso: string): string {
  const [anno, mese, giorno] = dataIso.split("-");

  if (!anno || !mese || !giorno) {
    return dataIso;
  }

  return `${giorno}/${mese}/${anno}`;
}

function descriviPatente(profilo: ProfiloUtenteView): string {
  if (
    !profilo.numeroPatente ||
    !profilo.categoriaPatente ||
    !profilo.scadenzaPatente
  ) {
    return "Non inserita";
  }

  return `${profilo.categoriaPatente} - ${profilo.numeroPatente} | scadenza ${formattaDataItaliana(profilo.scadenzaPatente)}`;
}

function risolviStatoPatente(profilo: ProfiloUtenteView): StatoPatenteView {
  const haNumero = Boolean(profilo.numeroPatente);
  const haCategoria = Boolean(profilo.categoriaPatente);
  const haScadenza = Boolean(profilo.scadenzaPatente);

  if (!haNumero && !haCategoria && !haScadenza) {
    return {
      etichetta: "Non inserita",
      descrizione: "Non hai ancora registrato una patente nel profilo.",
      className: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (!haNumero || !haCategoria || !haScadenza) {
    return {
      etichetta: "Incompleta",
      descrizione:
        "Completa numero, categoria e scadenza per usare i mezzi che richiedono patente.",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (patenteScaduta(profilo.scadenzaPatente)) {
    return {
      etichetta: "Scaduta",
      descrizione:
        "La data di scadenza registrata risulta superata. Aggiornala prima del prossimo utilizzo.",
      className: "border-rose-200 bg-rose-50 text-rose-800",
    };
  }

  return {
    etichetta: "Valida",
    descrizione: `Patente ${profilo.categoriaPatente} valida fino al ${formattaDataItaliana(profilo.scadenzaPatente as string)}.`,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
}

async function leggiErroreRisposta(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { errore?: string };
    return data.errore ?? "Operazione non riuscita.";
  } catch {
    return "Operazione non riuscita.";
  }
}

// Questa UI mantiene separati i dati personali dalla home operativa, ma
// permette comunque di aggiornare la patente senza uscire dall'area utente.
export default function DashboardDatiPersonaliClient({
  profiloIniziale,
}: Props) {
  const [profilo, setProfilo] = useState<ProfiloUtenteView>(profiloIniziale);
  const [formPatente, setFormPatente] = useState<FormPatente>(() =>
    creaFormPatente(profiloIniziale),
  );
  const [feedback, setFeedback] = useState<MessaggioFeedback>(null);
  const [isPending, startTransition] = useTransition();
  const statoPatente = risolviStatoPatente(profilo);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 10_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [feedback]);

  function aggiornaCampo(
    chiave: keyof FormPatente,
    valore: string,
  ): void {
    setFormPatente((corrente) => ({
      ...corrente,
      [chiave]:
        chiave === "categoriaPatente" ? valore.toUpperCase() : valore,
    }));
  }

  function salvaPatente(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/account/profilo", {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numeroPatente: formPatente.numeroPatente,
            categoriaPatente: formPatente.categoriaPatente,
            scadenzaPatente: formPatente.scadenzaPatente,
          }),
        });

        if (!response.ok) {
          throw new Error(await leggiErroreRisposta(response));
        }

        const data = (await response.json()) as {
          messaggio: string;
          profilo: {
            numeroPatente: string | null;
            categoriaPatente: string | null;
            scadenzaPatente: string | null;
          };
        };

        setProfilo((corrente) => ({
          ...corrente,
          numeroPatente: data.profilo.numeroPatente,
          categoriaPatente: data.profilo.categoriaPatente,
          scadenzaPatente: data.profilo.scadenzaPatente,
        }));
        setFormPatente({
          numeroPatente: data.profilo.numeroPatente ?? "",
          categoriaPatente: data.profilo.categoriaPatente ?? "",
          scadenzaPatente: data.profilo.scadenzaPatente ?? "",
        });
        setFeedback({
          tipo: "successo",
          testo: data.messaggio,
        });
      } catch (error) {
        setFeedback({
          tipo: "errore",
          testo:
            error instanceof Error
              ? error.message
              : "Non siamo riusciti ad aggiornare la patente.",
        });
      }
    });
  }

  return (
    <>
      <section className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)] sm:px-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Dati personali
          </p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {profilo.nome}, qui tieni in ordine il tuo profilo.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            In questa sezione trovi i dati del tuo account in uno spazio
            separato dalla mappa, dalla corsa attiva e dalla cronologia, cosi
            ogni area resta chiara e facile da consultare.
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Dati Personali Profilo
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Nome
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {profilo.nome}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Cognome
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {profilo.cognome}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Email
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {profilo.email}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Data di nascita
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {formattaDataItaliana(profilo.dataNascita)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Codice fiscale
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {profilo.codiceFiscale}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Patente
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {descriviPatente(profilo)}
              </p>
            </div>

            {/* Questo riepilogo rende immediato se la patente e utilizzabile
                per il noleggio senza costringere l'utente a interpretare i campi. */}
            <div
              className={`rounded-2xl border px-4 py-4 sm:col-span-2 ${statoPatente.className}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                Stato patente
              </p>
              <p className="mt-2 text-base font-semibold">
                {statoPatente.etichetta}
              </p>
              <p className="mt-1 text-sm leading-6">
                {statoPatente.descrizione}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Patente di guida
          </p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>
              Se non hai ancora inserito la patente, puoi farlo qui. Se invece
              i dati cambiano, puoi aggiornarli senza toccare le altre sezioni
              del tuo account.
            </p>
            <p>
              Se svuoti numero, categoria e scadenza e poi salvi, la patente
              viene rimossa dal profilo.
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={salvaPatente}>
            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-slate-700"
                htmlFor="numeroPatente"
              >
                Numero patente
              </label>
              <input
                id="numeroPatente"
                type="text"
                autoComplete="off"
                value={formPatente.numeroPatente}
                onChange={(event) =>
                  aggiornaCampo("numeroPatente", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                placeholder="AB1234567"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-slate-700"
                htmlFor="categoriaPatente"
              >
                Categoria patente
              </label>
              <select
                id="categoriaPatente"
                value={formPatente.categoriaPatente}
                onChange={(event) =>
                  aggiornaCampo("categoriaPatente", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              >
                <option value="">Non inserita</option>
                {CATEGORIE_PATENTE.filter((categoria) => categoria !== "").map(
                  (categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-slate-700"
                htmlFor="scadenzaPatente"
              >
                Scadenza patente
              </label>
              <input
                id="scadenzaPatente"
                type="date"
                value={formPatente.scadenzaPatente}
                onChange={(event) =>
                  aggiornaCampo("scadenzaPatente", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </div>

            {feedback ? (
              <div
                className={`rounded-2xl border px-4 py-4 text-sm leading-6 ${
                  feedback.tipo === "successo"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p>{feedback.testo}</p>
                  <button
                    type="button"
                    onClick={() => setFeedback(null)}
                    className="shrink-0 rounded-full border border-current/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Salvataggio in corso..." : "Salva patente"}
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setFormPatente(creaFormPatente(profilo));
                  setFeedback(null);
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ripristina
              </button>
            </div>
          </form>
        </article>
      </section>
    </>
  );
}
