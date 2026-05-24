import LogoutButton from "@/components/auth/LogoutButton";

type HighlightCard = {
  titolo: string;
  descrizione: string;
};

type AreaRiservataShellProps = {
  badge: string;
  titolo: string;
  descrizione: string;
  nomeCompleto: string;
  ruolo: string;
  highlights: HighlightCard[];
};

// Layout condiviso delle dashboard base di Sprint 1.
// Mantiene stile coerente tra le tre aree riservate senza duplicare markup.
export default function AreaRiservataShell({
  badge,
  titolo,
  descrizione,
  nomeCompleto,
  ruolo,
  highlights,
}: AreaRiservataShellProps) {
  return (
    <main className="flex min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur md:min-h-[720px] md:flex-row">
        {/* Colonna introduttiva con il contesto dell'area riservata. */}
        <section className="flex flex-1 flex-col justify-between bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
              {badge}
            </span>
            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {titolo}
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300">
                {descrizione}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {highlights.map((highlight) => (
              <div
                key={highlight.titolo}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm font-semibold text-teal-200">
                  {highlight.titolo}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {highlight.descrizione}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Colonna operativa con i dati base dell'utente autenticato. */}
        <section className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-2xl space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
                Area riservata
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Accesso confermato
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                La sessione e attiva e i dati principali del profilo sono stati
                caricati correttamente.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Nome completo
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-950">
                  {nomeCompleto}
                </p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Ruolo
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-950">
                  {ruolo}
                </p>
              </article>
            </div>

            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-950">
                  Logout
                </h3>
                <p className="text-sm leading-6 text-slate-600">
                  Puoi chiudere la sessione in modo sicuro da questa area e
                  tornare alla pagina di accesso quando hai concluso.
                </p>
              </div>

              {/* Il bottone client gestisce la chiamata alla route di logout
                  e il ritorno al login senza duplicare codice nelle dashboard. */}
              <LogoutButton />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
