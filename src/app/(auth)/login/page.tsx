import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

// Metadati pubblici della pagina di accesso.
export const metadata: Metadata = {
  title: "Login | E-Smart Mobility",
  description:
    "Accedi a E-Smart Mobility per utilizzare i servizi di sharing della citta di Zootropolis.",
};

type LoginPageProps = {
  searchParams: Promise<{
    sospeso?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const messaggioSistema =
    query.sospeso === "1"
      ? {
          tipo: "errore" as const,
          testo:
            "Il tuo account e stato sospeso da un operatore. La sessione e stata chiusa automaticamente.",
        }
      : null;

  return (
    // Contenitore principale con impostazione coerente alla pagina di registrazione.
    <main className="flex min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.16),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur md:min-h-[720px] md:flex-row">
        {/* Colonna descrittiva che introduce il valore della pagina di accesso. */}
        <section className="flex flex-1 flex-col justify-between bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
              E-Smart Mobility
            </span>
            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Accedi e riprendi i tuoi spostamenti in citta.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300">
                Entra nel tuo profilo personale per consultare i servizi di
                mobilita condivisa disponibili a Zootropolis.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-teal-200">
                Accesso rapido
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Bastano email e password per avviare la tua sessione personale.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-teal-200">
                Controllo credenziali
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Il sistema verifica automaticamente i dati inseriti prima di
                autorizzare l&apos;accesso.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-teal-200">
                Sessione protetta
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                L&apos;accesso viene gestito in modo sicuro per proteggere il tuo
                account.
              </p>
            </div>
          </div>
        </section>

        {/* Colonna operativa con il modulo di login vero e proprio. */}
        <section className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-8 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
                Bentornato
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Accedi al tuo account
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Inserisci le credenziali con cui ti sei registrato. I campi
                contrassegnati con l&apos;asterisco sono obbligatori.
              </p>
            </div>

            <LoginForm messaggioSistema={messaggioSistema} />
          </div>
        </section>
      </div>
    </main>
  );
}
