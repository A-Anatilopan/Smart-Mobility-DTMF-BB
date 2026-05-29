import type { Metadata } from "next";
import AttivazioneAmministrazioneForm from "@/components/auth/AttivazioneAmministrazioneForm";

// Metadati pubblici della pagina di attivazione per la Pubblica Amministrazione.
export const metadata: Metadata = {
  title: "Attivazione Pubblica Amministrazione | E-Smart Mobility",
  description:
    "Attiva l'account istituzionale E-Smart Mobility e imposta una nuova password personale.",
};

export default function AttivaAmministrazionePage() {
  return (
    // Pagina pubblica dedicata ai profili istituzionali che devono completare l'attivazione.
    <main className="flex min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.16),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur md:min-h-[720px] md:flex-row">
        {/* Colonna introduttiva con contesto istituzionale non tecnico. */}
        <section className="flex flex-1 flex-col justify-between bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
              E-Smart Mobility
            </span>
            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Attiva il tuo accesso istituzionale.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300">
                Completa l&apos;attivazione del profilo istituzionale per
                accedere agli strumenti di monitoraggio della mobilita urbana
                con una password personale.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-teal-200">
                Codice personale
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Usa il codice identificativo associato al profilo
                istituzionale.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-teal-200">
                Accesso dedicato
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Dopo l&apos;attivazione potrai entrare nell&apos;area riservata
                di monitoraggio usando la nuova password.
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
                Usa l&apos;email istituzionale associata al profilo e il codice
                identificativo ricevuto. Dopo la conferma potrai scegliere una
                password personale.
              </p>
            </div>

            <AttivazioneAmministrazioneForm />
          </div>
        </section>
      </div>
    </main>
  );
}
