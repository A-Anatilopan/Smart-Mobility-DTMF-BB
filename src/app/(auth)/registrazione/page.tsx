import type { Metadata } from "next";
import RegistrazioneForm from "@/components/auth/RegistrazioneForm";

// Metadati pubblici della pagina di registrazione.
export const metadata: Metadata = {
  title: "Registrazione | E-Smart Mobility",
  description:
    "Crea un account E-Smart Mobility per accedere ai servizi di sharing della citta di Zootropolis.",
};

export default function RegistrazionePage() {
  return (
    // Contenitore principale con sfondo leggero e centratura verticale della card.
    <main className="flex min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.14),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur md:min-h-[720px] md:flex-row">
        {/* Colonna introduttiva con il messaggio di benvenuto del servizio. */}
        <section className="flex flex-1 flex-col justify-between bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
              E-Smart Mobility
            </span>
            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Registrati e prepara il tuo accesso alla mobilita condivisa.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300">
                Crea il tuo profilo personale per utilizzare i servizi di
                sharing mobility nella citta di Zootropolis. Se possiedi una
                patente, puoi inserirla gia durante la registrazione insieme
                alla sua data di scadenza.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-teal-200">
                Registrazione rapida
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Inserisci i dati essenziali in un unico modulo semplice e
                guidato.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-teal-200">
                Dati patente opzionali
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Completa subito anche numero, categoria e scadenza per guidare
                i mezzi che richiedono una patente valida.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-teal-200">
                Accesso sicuro
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Le tue credenziali vengono gestite con attenzione per proteggere
                l&apos;accesso al tuo account.
              </p>
            </div>
          </div>
        </section>

        {/* Colonna operativa che ospita titolo secondario e modulo di input. */}
        <section className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-8 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
                Crea il tuo account
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Dati personali
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                I campi contrassegnati con l&apos;asterisco sono obbligatori.
                Completa il modulo con i tuoi dati personali per creare il
                profilo.
              </p>
            </div>

            <RegistrazioneForm />
          </div>
        </section>
      </div>
    </main>
  );
}
