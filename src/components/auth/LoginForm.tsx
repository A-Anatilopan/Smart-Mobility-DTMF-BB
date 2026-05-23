"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

// Struttura dei dati essenziali richiesti per l'accesso.
type LoginFormData = {
  email: string;
  password: string;
};

// Messaggio mostrato all'utente dopo validazione locale o risposta del server.
type StatoMessaggio =
  | { tipo: "successo"; testo: string }
  | { tipo: "errore"; testo: string }
  | null;

// Valori iniziali usati all'apertura della pagina e dopo un login riuscito.
const INITIAL_FORM_DATA: LoginFormData = {
  email: "",
  password: "",
};

// La validazione locale evita richieste inutili al backend quando mancano dati minimi.
function validaForm(data: LoginFormData): string | null {
  if (!data.email.trim() || !data.password) {
    return "Inserisci email e password per continuare.";
  }

  return null;
}

export default function LoginForm() {
  // Gli stati locali servono per controllare input, caricamento e feedback utente.
  const [formData, setFormData] = useState<LoginFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messaggio, setMessaggio] = useState<StatoMessaggio>(null);

  // Manteniamo l'aggiornamento dei campi centralizzato per semplificare il componente.
  function aggiornaCampo(campo: keyof LoginFormData, valore: string): void {
    setFormData((currentData) => ({
      ...currentData,
      [campo]: valore,
    }));
  }

  // Il submit dialoga con la route di login gia esistente e mostra l'esito all'utente.
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { errore?: string; messaggio?: string }
        | null;

      if (!response.ok) {
        setMessaggio({
          tipo: "errore",
          testo:
            result?.errore ?? "Accesso non riuscito. Riprova tra qualche istante.",
        });
        return;
      }

      setFormData(INITIAL_FORM_DATA);
      setMessaggio({
        tipo: "successo",
        testo:
          result?.messaggio ??
          "Login effettuato con successo. La tua sessione e stata avviata correttamente.",
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
        {/* Blocco principale con le credenziali richieste per il login. */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="email"
            >
              Email *
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(event) => aggiornaCampo("email", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder="mario.rossi@email.it"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="password"
            >
              Password *
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(event) =>
                aggiornaCampo("password", event.target.value)
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder="Inserisci la tua password"
              required
            />
          </div>
        </div>

        {/* Il messaggio compare solo quando c'e un errore o una conferma da mostrare. */}
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
          {isSubmitting ? "Accesso in corso..." : "Accedi"}
        </button>
      </form>

      {/* Link di supporto per chi arriva qui senza aver ancora creato un account. */}
      <p className="text-center text-sm leading-6 text-slate-600">
        Non hai ancora un account?{" "}
        <Link
          href="/registrazione"
          className="font-semibold text-teal-700 transition hover:text-teal-600"
        >
          Registrati
        </Link>
      </p>
    </div>
  );
}
