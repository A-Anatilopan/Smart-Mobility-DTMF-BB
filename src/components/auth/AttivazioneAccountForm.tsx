"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

// Dati minimi richiesti per attivare un profilo gia creato nel sistema.
type AttivazioneAccountFormData = {
  email: string;
  codiceAttivazione: string;
};

// Configurazione testuale e tecnica per riusare il form su ruoli diversi.
type AttivazioneAccountFormProps = {
  apiEndpoint: string;
  emailLabel: string;
  emailPlaceholder: string;
  codicePlaceholder: string;
  messaggioSuccessoFallback: string;
};

// Messaggio mostrato dopo validazione locale o risposta del server.
type StatoMessaggio =
  | { tipo: "successo"; testo: string }
  | { tipo: "errore"; testo: string }
  | null;

// Risposta minima restituita dalle API di attivazione account.
type AttivazioneAccountApiResponse = {
  errore?: string;
  messaggio?: string;
};

// Valori iniziali usati all'apertura della pagina e dopo attivazione riuscita.
const INITIAL_FORM_DATA: AttivazioneAccountFormData = {
  email: "",
  codiceAttivazione: "",
};

// Validazione locale leggera: evita chiamate API quando mancano dati essenziali.
function validaForm(data: AttivazioneAccountFormData): string | null {
  if (!data.email.trim() || !data.codiceAttivazione.trim()) {
    return "Inserisci email e codice identificativo per continuare.";
  }

  return null;
}

export default function AttivazioneAccountForm({
  apiEndpoint,
  emailLabel,
  emailPlaceholder,
  codicePlaceholder,
  messaggioSuccessoFallback,
}: AttivazioneAccountFormProps) {
  // Stati locali per input controllati, caricamento e feedback visibile.
  const [formData, setFormData] =
    useState<AttivazioneAccountFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messaggio, setMessaggio] = useState<StatoMessaggio>(null);

  // Manteniamo l'aggiornamento dei campi centralizzato e normalizziamo il codice.
  function aggiornaCampo(
    campo: keyof AttivazioneAccountFormData,
    valore: string,
  ): void {
    setFormData((currentData) => ({
      ...currentData,
      [campo]: campo === "codiceAttivazione" ? valore.toUpperCase() : valore,
    }));
  }

  // Invia email e codice all'endpoint configurato dalla pagina specifica.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessaggio(null);

    const erroreValidazione = validaForm(formData);

    if (erroreValidazione) {
      setMessaggio({ tipo: "errore", testo: erroreValidazione });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          codiceAttivazione: formData.codiceAttivazione.trim(),
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | AttivazioneAccountApiResponse
        | null;

      if (!response.ok) {
        setMessaggio({
          tipo: "errore",
          testo:
            result?.errore ??
            "Attivazione non completata. Controlla i dati e riprova.",
        });
        return;
      }

      setFormData(INITIAL_FORM_DATA);
      setMessaggio({
        tipo: "successo",
        testo: result?.messaggio ?? messaggioSuccessoFallback,
      });
    } catch {
      setMessaggio({
        tipo: "errore",
        testo:
          "Impossibile contattare il server in questo momento. Verifica che l'applicazione sia avviata e riprova.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Campi essenziali per riconoscere l'account e validare il codice. */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="email"
            >
              {emailLabel} *
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(event) => aggiornaCampo("email", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder={emailPlaceholder}
              required
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="codiceAttivazione"
            >
              Codice identificativo *
            </label>
            <input
              id="codiceAttivazione"
              type="text"
              autoComplete="one-time-code"
              value={formData.codiceAttivazione}
              onChange={(event) =>
                aggiornaCampo("codiceAttivazione", event.target.value)
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 uppercase tracking-[0.08em] text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder={codicePlaceholder}
              maxLength={20}
              required
            />
          </div>
        </div>

        {/* Feedback accessibile per confermare l'esito dell'attivazione. */}
        {messaggio ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              messaggio.tipo === "successo"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
            aria-live="polite"
          >
            {messaggio.testo}
          </div>
        ) : null}

        {/* Il pulsante resta disabilitato durante l'invio per evitare doppi click. */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Attivazione in corso..." : "Attiva account"}
        </button>
      </form>

      {/* Link diretto alla pagina di accesso dopo aver completato l'attivazione. */}
      <p className="text-center text-sm leading-6 text-slate-600">
        Account gia attivo?{" "}
        <Link
          href="/login"
          className="font-semibold text-teal-700 transition hover:text-teal-600"
        >
          Accedi
        </Link>
      </p>
    </div>
  );
}
