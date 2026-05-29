import type { Metadata } from "next";
import AttivazioneOperatoreForm from "@/components/auth/AttivazioneOperatoreForm";

// Metadati pubblici della pagina di attivazione operatore.
export const metadata: Metadata = {
  title: "Attivazione Operatore | E-Smart Mobility",
  description:
    "Attiva il tuo account operatore E-Smart Mobility con il codice identificativo ricevuto.",
};

export default function AttivaOperatorePage() {
  return (
    // Pagina pubblica dedicata agli operatori che devono completare l'attivazione.
    <main className="flex min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.16),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur md:min-h-[720px] md:flex-row">
        {/* Colonna introduttiva con contesto operativo non tecnico. */}
        <section className="flex flex-1 flex-col justify-between bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
              E-Smart Mobility
            </span>
            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Attiva il tuo accesso operativo.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300">
                Completa l&apos;attivazione del profilo operatore per accedere
                agli strumenti dedicati alla gestione del servizio di mobilita.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-teal-200">
                Codice personale
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Usa il codice identificativo associato al tuo profilo
                operatore.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-teal-200">
                Accesso dedicato
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Dopo l&apos;attivazione potrai entrare nella tua area riservata
                di servizio.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-teal-200">
                Profilo protetto
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                L&apos;account rimane bloccato finche il codice non viene
                confermato correttamente.
              </p>
            </div>
          </div>
        </section>

        {/* Colonna operativa con il modulo di attivazione. */}
        <section className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-8 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
                Attivazione account
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Inserisci i dati ricevuti
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Usa l&apos;email associata al profilo operatore e il codice
                identificativo ricevuto per completare l&apos;attivazione.
              </p>
            </div>

            <AttivazioneOperatoreForm />
          </div>
        </section>
      </div>
    </main>
  );
}
