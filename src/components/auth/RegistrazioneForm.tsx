"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

// Struttura centralizzata dei dati raccolti dal form di registrazione.
type RegistrazioneFormData = {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  dataNascita: string;
  codiceFiscale: string;
  numeroPatente: string;
  categoriaPatente: string;
};

// Messaggio di feedback mostrato all'utente dopo validazione o submit.
type StatoMessaggio =
  | { tipo: "successo"; testo: string }
  | { tipo: "errore"; testo: string }
  | null;

// Valori iniziali usati sia al primo render sia dopo una registrazione riuscita.
const INITIAL_FORM_DATA: RegistrazioneFormData = {
  nome: "",
  cognome: "",
  email: "",
  password: "",
  dataNascita: "",
  codiceFiscale: "",
  numeroPatente: "",
  categoriaPatente: "",
};

// Questa validazione intercetta gli errori piu immediati prima della chiamata API.
function validaForm(data: RegistrazioneFormData): string | null {
  if (
    !data.nome.trim() ||
    !data.cognome.trim() ||
    !data.email.trim() ||
    !data.password ||
    !data.dataNascita ||
    !data.codiceFiscale.trim()
  ) {
    return "Compila tutti i campi obbligatori prima di continuare.";
  }

  if (data.password.length < 8) {
    return "La password deve contenere almeno 8 caratteri.";
  }

  return null;
}

export default function RegistrazioneForm() {
  // Lo stato del form vive nel componente client per gestire input e submit.
  const [formData, setFormData] =
    useState<RegistrazioneFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messaggio, setMessaggio] = useState<StatoMessaggio>(null);

  // Uniformiamo alcuni campi in maiuscolo per mantenere un formato coerente.
  function aggiornaCampo(
    campo: keyof RegistrazioneFormData,
    valore: string,
  ): void {
    setFormData((currentData) => ({
      ...currentData,
      [campo]:
        campo === "codiceFiscale" || campo === "categoriaPatente"
          ? valore.toUpperCase()
          : valore,
    }));
  }

  // Il submit invia i dati al backend gia esistente e mostra l'esito all'utente.
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
      const response = await fetch("/api/auth/registrazione", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          cognome: formData.cognome.trim(),
          email: formData.email.trim(),
          password: formData.password,
          dataNascita: formData.dataNascita,
          codiceFiscale: formData.codiceFiscale.trim(),
          numeroPatente: formData.numeroPatente.trim(),
          categoriaPatente: formData.categoriaPatente.trim(),
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { errore?: string; messaggio?: string }
        | null;

      if (!response.ok) {
        setMessaggio({
          tipo: "errore",
          testo:
            result?.errore ??
            "Registrazione non completata. Riprova tra qualche istante.",
        });
        return;
      }

      setFormData(INITIAL_FORM_DATA);
      setMessaggio({
        tipo: "successo",
        testo:
          result?.messaggio ??
          "Registrazione completata con successo. Il tuo account e stato creato correttamente.",
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
        {/* Sezione anagrafica principale con i campi obbligatori del profilo. */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="nome"
            >
              Nome *
            </label>
            <input
              id="nome"
              type="text"
              autoComplete="given-name"
              value={formData.nome}
              onChange={(event) =>
                aggiornaCampo("nome", event.target.value)
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder="Mario"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="cognome"
            >
              Cognome *
            </label>
            <input
              id="cognome"
              type="text"
              autoComplete="family-name"
              value={formData.cognome}
              onChange={(event) =>
                aggiornaCampo("cognome", event.target.value)
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder="Rossi"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
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

          <div className="space-y-2 md:col-span-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="password"
            >
              Password *
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={(event) =>
                aggiornaCampo("password", event.target.value)
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
              htmlFor="dataNascita"
            >
              Data di nascita *
            </label>
            <input
              id="dataNascita"
              type="date"
              value={formData.dataNascita}
              onChange={(event) =>
                aggiornaCampo("dataNascita", event.target.value)
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="codiceFiscale"
            >
              Codice fiscale *
            </label>
            <input
              id="codiceFiscale"
              type="text"
              autoCapitalize="characters"
              value={formData.codiceFiscale}
              onChange={(event) =>
                aggiornaCampo("codiceFiscale", event.target.value)
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 uppercase text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder="RSSMRA95H15H501A"
              maxLength={16}
              required
            />
          </div>
        </div>

        {/* Sezione separata per i dati patente, mantenuti opzionali. */}
        <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50/80 p-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-amber-950">
              Dati patente
            </h2>
            <p className="text-sm text-amber-900/80">
              Compila questi campi solo se possiedi una patente di guida.
            </p>
          </div>

          <div className="mt-4 grid gap-5 md:grid-cols-2">
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
                value={formData.numeroPatente}
                onChange={(event) =>
                  aggiornaCampo("numeroPatente", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                placeholder="AB1234567"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-slate-700"
                htmlFor="categoriaPatente"
              >
                Categoria patente
              </label>
              <input
                id="categoriaPatente"
                type="text"
                autoCapitalize="characters"
                value={formData.categoriaPatente}
                onChange={(event) =>
                  aggiornaCampo("categoriaPatente", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 uppercase text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                placeholder="B"
                maxLength={20}
              />
            </div>
          </div>
        </div>

        {/* Il messaggio compare solo quando esiste un esito da comunicare. */}
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

        {/* Il pulsante viene disabilitato durante l'invio per evitare doppi submit. */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Registrazione in corso..." : "Crea account"}
        </button>
      </form>

      {/* Link di supporto per chi possiede gia un account e vuole accedere. */}
      <p className="text-center text-sm leading-6 text-slate-600">
        Hai gia un account?{" "}
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
