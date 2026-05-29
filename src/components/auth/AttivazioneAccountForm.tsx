"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

// Il form lavora in due schermate: prima conferma il codice, poi imposta la password.
type FaseFormAttivazione = "codice" | "password";

// Dati conservati tra le due schermate del flusso di attivazione.
type AttivazioneAccountFormData = {
  email: string;
  codiceAttivazione: string;
  nuovaPassword: string;
  confermaNuovaPassword: string;
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
  prossimaFase?: "password";
};

// Valori iniziali usati all'apertura della pagina.
const INITIAL_FORM_DATA: AttivazioneAccountFormData = {
  email: "",
  codiceAttivazione: "",
  nuovaPassword: "",
  confermaNuovaPassword: "",
};

// Validazione locale della prima schermata: evita chiamate API senza dati minimi.
function validaSchermataCodice(data: AttivazioneAccountFormData): string | null {
  if (!data.email.trim() || !data.codiceAttivazione.trim()) {
    return "Inserisci email e codice identificativo per continuare.";
  }

  return null;
}

// Validazione locale della seconda schermata: la password viene controllata prima dell'invio.
function validaSchermataPassword(
  data: AttivazioneAccountFormData,
): string | null {
  if (!data.nuovaPassword || !data.confermaNuovaPassword) {
    return "Inserisci e conferma la nuova password.";
  }

  if (data.nuovaPassword.length < 8) {
    return "La nuova password deve contenere almeno 8 caratteri.";
  }

  if (data.nuovaPassword !== data.confermaNuovaPassword) {
    return "La nuova password e la conferma non coincidono.";
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
  const router = useRouter();

  // Stati locali per schermata corrente, input controllati, caricamento e feedback.
  const [faseForm, setFaseForm] = useState<FaseFormAttivazione>("codice");
  const [formData, setFormData] =
    useState<AttivazioneAccountFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
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

  // Torna alla schermata codice mantenendo email e codice visibili all'utente.
  function tornaAllaVerificaCodice(): void {
    setMessaggio(null);
    setFaseForm("codice");
    setFormData((currentData) => ({
      ...currentData,
      nuovaPassword: "",
      confermaNuovaPassword: "",
    }));
  }

  // Invia la fase corrente all'endpoint configurato dalla pagina specifica.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessaggio(null);

    const erroreValidazione =
      faseForm === "codice"
        ? validaSchermataCodice(formData)
        : validaSchermataPassword(formData);

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
          fase:
            faseForm === "codice"
              ? "verifica-codice"
              : "completa-attivazione",
          nuovaPassword:
            faseForm === "password" ? formData.nuovaPassword : undefined,
          confermaNuovaPassword:
            faseForm === "password"
              ? formData.confermaNuovaPassword
              : undefined,
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

      if (faseForm === "codice") {
        setFaseForm("password");
        setMessaggio({
          tipo: "successo",
          testo:
            result?.messaggio ??
            "Codice confermato. Ora scegli una password personale.",
        });
        return;
      }

      setMessaggio({
        tipo: "successo",
        testo: result?.messaggio ?? messaggioSuccessoFallback,
      });
      setIsRedirecting(true);

      // Piccolo ritardo intenzionale: permette di leggere il feedback prima del login.
      window.setTimeout(() => {
        router.replace("/login");
      }, 1200);
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
        {faseForm === "codice" ? (
          <div className="space-y-5">
            {/* Prima schermata: riconosce l'account tramite email e codice ricevuto. */}
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
        ) : (
          <div className="space-y-5">
            {/* Seconda schermata: dopo il codice valido viene richiesta solo la password personale. */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
              Codice confermato per{" "}
              <span className="font-semibold">{formData.email}</span>.
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                Scegli la tua password
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                Inserisci una password personale. Da questo momento sara quella
                da usare per accedere all&apos;area riservata.
              </p>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-slate-700"
                htmlFor="nuovaPassword"
              >
                Nuova password *
              </label>
              <input
                id="nuovaPassword"
                type="password"
                autoComplete="new-password"
                value={formData.nuovaPassword}
                onChange={(event) =>
                  aggiornaCampo("nuovaPassword", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                placeholder="Almeno 8 caratteri"
                minLength={8}
                required
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-slate-700"
                htmlFor="confermaNuovaPassword"
              >
                Conferma password *
              </label>
              <input
                id="confermaNuovaPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confermaNuovaPassword}
                onChange={(event) =>
                  aggiornaCampo("confermaNuovaPassword", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                placeholder="Ripeti la nuova password"
                minLength={8}
                required
              />
            </div>
          </div>
        )}

        {/* Feedback accessibile per confermare l'esito della fase corrente. */}
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

        <div className="space-y-3">
          {/* Il pulsante resta disabilitato durante invio o reindirizzamento. */}
          <button
            type="submit"
            disabled={isSubmitting || isRedirecting}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isRedirecting
              ? "Apertura pagina di accesso..."
              : isSubmitting
                ? "Attendere..."
                : faseForm === "codice"
                  ? "Conferma codice"
                  : "Salva password e accedi"}
          </button>

          {faseForm === "password" && !isRedirecting ? (
            <button
              type="button"
              onClick={tornaAllaVerificaCodice}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Modifica codice
            </button>
          ) : null}
        </div>
      </form>

      {/* Link diretto alla pagina di accesso per chi ha gia completato il flusso. */}
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
