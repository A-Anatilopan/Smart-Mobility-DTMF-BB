import type { Mezzo } from "@/types/mobilita";

type PrioritaFlottaOperativaProps = {
  mezziConBatteriaBassa: Mezzo[];
  mezziNonDisponibili: Mezzo[];
};

// Questo blocco raccoglie le priorita operative minime della flotta, cosi la
// stessa vista puo essere riusata nella home operatore e nella pagina dedicata.
export default function PrioritaFlottaOperativa({
  mezziConBatteriaBassa,
  mezziNonDisponibili,
}: PrioritaFlottaOperativaProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Interventi prioritari
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          Mezzi che richiedono attenzione
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Qui l&apos;operatore individua rapidamente i mezzi con batteria bassa o
          fuori disponibilita, cosi da capire dove concentrare il presidio.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              Batteria bassa
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Mezzi sotto soglia
            </h3>
          </div>

          <div className="mt-5 space-y-3">
            {mezziConBatteriaBassa.map((mezzo) => (
              <div
                key={mezzo.id}
                className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {mezzo.modello} ({mezzo.codice})
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {mezzo.latitudine.toFixed(4)}, {mezzo.longitudine.toFixed(4)}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-amber-800">
                    {mezzo.batteria}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-rose-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
              Fuori servizio
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Mezzi non disponibili
            </h3>
          </div>

          <div className="mt-5 space-y-3">
            {mezziNonDisponibili.map((mezzo) => (
              <div
                key={mezzo.id}
                className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {mezzo.modello} ({mezzo.codice})
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Stato attuale: {mezzo.stato.toLowerCase().replaceAll("_", " ")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-rose-800">
                    {mezzo.batteria}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
