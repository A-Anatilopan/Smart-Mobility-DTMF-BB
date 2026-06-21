"use client";

import { useEffect, useState, useTransition } from "react";

type MetodoPagamentoView = {
  id: number;
  tipo: string;
  circuito: string;
  intestatario: string;
  ultime4: string;
  scadenzaMese: number;
  scadenzaAnno: number;
  alias: string | null;
  tokenMock: string;
  stato: string;
  predefinito: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type MessaggioFeedback = {
  tipo: "successo" | "errore";
  testo: string;
};

type Props = {
  nomeUtente: string;
  metodiIniziali: MetodoPagamentoView[];
};

type FormState = {
  circuito: string;
  intestatario: string;
  numeroCarta: string;
  scadenzaMese: string;
  scadenzaAnno: string;
  alias: string;
  impostaComePredefinito: boolean;
};

const CIRCUITI = [
  "VISA",
  "MASTERCARD",
  "AMEX",
  "PAGOBANCOMAT",
  "ALTRO",
] as const;

function creaFormVuoto(): FormState {
  return {
    circuito: "VISA",
    intestatario: "",
    numeroCarta: "",
    scadenzaMese: "",
    scadenzaAnno: "",
    alias: "",
    impostaComePredefinito: false,
  };
}

function formattaScadenza(mese: number, anno: number) {
  return `${String(mese).padStart(2, "0")}/${String(anno).slice(-2)}`;
}

function descriviMetodoPagamento(metodo: MetodoPagamentoView) {
  return metodo.alias?.trim().length
    ? metodo.alias
    : `${metodo.circuito} •••• ${metodo.ultime4}`;
}

async function leggiErroreRisposta(response: Response) {
  try {
    const data = (await response.json()) as { errore?: string };
    return data.errore ?? "Operazione non riuscita.";
  } catch {
    return "Operazione non riuscita.";
  }
}

// Questa UI client mantiene la sezione pagamenti reattiva senza costringere
// l'utente a ricaricare la pagina dopo ogni aggiunta, rimozione o cambio del
// metodo predefinito.
export default function DashboardMetodiPagamentoClient({
  nomeUtente,
  metodiIniziali,
}: Props) {
  const [metodi, setMetodi] = useState<MetodoPagamentoView[]>(metodiIniziali);
  const [form, setForm] = useState<FormState>(creaFormVuoto);
  const [feedback, setFeedback] = useState<MessaggioFeedback | null>(null);
  const [isPending, startTransition] = useTransition();

  const metodoPredefinito =
    metodi.find((metodo) => metodo.predefinito) ?? null;

  const puoNoleggiare = metodi.length > 0;

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

  function aggiornaCampo<K extends keyof FormState>(
    chiave: K,
    valore: FormState[K],
  ) {
    setForm((corrente) => ({
      ...corrente,
      [chiave]: valore,
    }));
  }

  async function ricaricaMetodi() {
    const response = await fetch("/api/pagamenti/metodi", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await leggiErroreRisposta(response));
    }

    const data = (await response.json()) as { metodi: MetodoPagamentoView[] };
    setMetodi(data.metodi);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/pagamenti/metodi", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          throw new Error(await leggiErroreRisposta(response));
        }

        await ricaricaMetodi();
        setForm(creaFormVuoto());
        setFeedback({
          tipo: "successo",
          testo: "Metodo di pagamento salvato correttamente.",
        });
      } catch (error) {
        setFeedback({
          tipo: "errore",
          testo:
            error instanceof Error
              ? error.message
              : "Non siamo riusciti a salvare il metodo di pagamento.",
        });
      }
    });
  }

  function impostaPredefinito(metodoId: number) {
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/pagamenti/metodi/${metodoId}/predefinito`,
          {
            method: "PATCH",
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(await leggiErroreRisposta(response));
        }

        await ricaricaMetodi();
        setFeedback({
          tipo: "successo",
          testo: "Metodo predefinito aggiornato con successo.",
        });
      } catch (error) {
        setFeedback({
          tipo: "errore",
          testo:
            error instanceof Error
              ? error.message
              : "Non siamo riusciti ad aggiornare il metodo predefinito.",
        });
      }
    });
  }

  function eliminaMetodo(metodo: MetodoPagamentoView) {
    const conferma = window.confirm(
      `Vuoi eliminare ${descriviMetodoPagamento(metodo)}?`,
    );

    if (!conferma) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/pagamenti/metodi/${metodo.id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(await leggiErroreRisposta(response));
        }

        await ricaricaMetodi();
        setFeedback({
          tipo: "successo",
          testo: "Metodo di pagamento eliminato dal tuo account.",
        });
      } catch (error) {
        setFeedback({
          tipo: "errore",
          testo:
            error instanceof Error
              ? error.message
              : "Non siamo riusciti a eliminare il metodo di pagamento.",
        });
      }
    });
  }

  return (
    <>
      <section className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)] sm:px-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Metodi di pagamento
          </p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {nomeUtente}, qui gestisci i tuoi pagamenti.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Salva i tuoi metodi in una sezione separata dalla mappa, cosi la
            home resta dedicata al noleggio e questa area tiene ordinata tutta
            la parte economica.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Metodi salvati
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            {metodi.length}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-teal-200 bg-teal-50 px-5 py-5 shadow-[0_18px_45px_-30px_rgba(13,148,136,0.28)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Metodo principale
          </p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
            {metodoPredefinito
              ? descriviMetodoPagamento(metodoPredefinito)
              : "Non ancora scelto"}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Pronto per il noleggio
          </p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
            {puoNoleggiare ? "Si, puoi proseguire" : "Serve un metodo attivo"}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-5 shadow-[0_18px_45px_-30px_rgba(217,119,6,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Regola importante
          </p>
          <p className="mt-3 text-sm leading-6 text-amber-950">
            Per prenotare o iniziare una corsa devi avere almeno un metodo di
            pagamento attivo.
          </p>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Aggiungi un metodo
            </p>
            <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
              Salva un nuovo riferimento di pagamento.
            </h3>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              Inserisci i dati essenziali per preparare l&apos;addebito
              automatico delle corse. Il sistema conserva solo le informazioni
              strettamente utili e non salva il numero completo della carta.
            </p>
          </div>

          {feedback ? (
            <div
              className={`mt-6 rounded-[1.5rem] border px-5 py-4 text-sm leading-6 ${
                feedback.tipo === "successo"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium">{feedback.testo}</p>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="rounded-full border border-current px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-80 transition hover:opacity-100"
                >
                  Chiudi
                </button>
              </div>
            </div>
          ) : null}

          <form className="mt-6 space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-900">
                  Circuito
                </span>
                <select
                  value={form.circuito}
                  onChange={(event) =>
                    aggiornaCampo("circuito", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-400"
                  disabled={isPending}
                >
                  {CIRCUITI.map((circuito) => (
                    <option key={circuito} value={circuito}>
                      {circuito}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-900">
                  Intestatario
                </span>
                <input
                  type="text"
                  value={form.intestatario}
                  onChange={(event) =>
                    aggiornaCampo("intestatario", event.target.value)
                  }
                  placeholder="Nome e cognome"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-400"
                  disabled={isPending}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1.2fr_0.4fr_0.4fr]">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-900">
                  Numero carta
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.numeroCarta}
                  onChange={(event) =>
                    aggiornaCampo("numeroCarta", event.target.value)
                  }
                  placeholder="1234 5678 9012 3456"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-400"
                  disabled={isPending}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-900">
                  Mese
                </span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.scadenzaMese}
                  onChange={(event) =>
                    aggiornaCampo("scadenzaMese", event.target.value)
                  }
                  placeholder="MM"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-400"
                  disabled={isPending}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-900">
                  Anno
                </span>
                <input
                  type="number"
                  min="2026"
                  max="2046"
                  value={form.scadenzaAnno}
                  onChange={(event) =>
                    aggiornaCampo("scadenzaAnno", event.target.value)
                  }
                  placeholder="AAAA"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-400"
                  disabled={isPending}
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-900">
                Nome rapido opzionale
              </span>
              <input
                type="text"
                value={form.alias}
                onChange={(event) => aggiornaCampo("alias", event.target.value)}
                placeholder="Esempio: Carta personale"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-400"
                disabled={isPending}
              />
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <input
                type="checkbox"
                checked={form.impostaComePredefinito}
                onChange={(event) =>
                  aggiornaCampo(
                    "impostaComePredefinito",
                    event.target.checked,
                  )
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                disabled={isPending}
              />
              <span className="text-sm leading-6 text-slate-700">
                Imposta subito questo metodo come riferimento principale per le
                prossime corse.
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Salvataggio in corso..." : "Salva metodo"}
              </button>
              <p className="text-sm leading-6 text-slate-500">
                Le ultime quattro cifre e la scadenza restano sufficienti per
                riconoscere il metodo nella tua area utente.
              </p>
            </div>
          </form>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Metodi salvati
            </p>
            <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
              Controlla quelli gia disponibili.
            </h3>
            <p className="text-sm leading-7 text-slate-600">
              Qui puoi vedere quale metodo e principale, sceglierne un altro per
              le prossime corse oppure rimuovere quelli che non usi piu.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {metodi.length > 0 ? (
              metodi.map((metodo) => (
                <article
                  key={metodo.id}
                  className={`rounded-[1.5rem] border px-4 py-4 ${
                    metodo.predefinito
                      ? "border-teal-200 bg-teal-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-950">
                          {descriviMetodoPagamento(metodo)}
                        </p>
                        {metodo.predefinito ? (
                          <span className="rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
                            Principale
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-600">
                        Intestatario {metodo.intestatario}
                      </p>
                    </div>

                    <div className="text-right text-sm text-slate-600">
                      <p>Scadenza</p>
                      <p className="font-semibold text-slate-950">
                        {formattaScadenza(
                          metodo.scadenzaMese,
                          metodo.scadenzaAnno,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!metodo.predefinito ? (
                      <button
                        type="button"
                        onClick={() => impostaPredefinito(metodo.id)}
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Imposta come principale
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => eliminaMetodo(metodo)}
                      disabled={isPending}
                      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Elimina
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-sm leading-6 text-slate-600">
                Non hai ancora salvato nessun metodo di pagamento. Aggiungine
                uno qui accanto per preparare prenotazioni e corse future.
              </div>
            )}
          </div>
        </article>
      </section>
    </>
  );
}
