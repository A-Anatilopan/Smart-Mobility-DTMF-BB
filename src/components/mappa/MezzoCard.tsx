import type { Mezzo } from "@/types/mobilita";

type MezzoCardProps = {
  mezzo: Mezzo;
};

// Stili e testi compatti per mostrare subito lo stato operativo del mezzo.
const STATO_BADGE_STYLES: Record<Mezzo["stato"], string> = {
  DISPONIBILE: "border-emerald-200 bg-emerald-50 text-emerald-800",
  PRENOTATO: "border-amber-200 bg-amber-50 text-amber-800",
  IN_USO: "border-sky-200 bg-sky-50 text-sky-800",
  IN_PAUSA: "border-violet-200 bg-violet-50 text-violet-800",
  IN_MANUTENZIONE: "border-rose-200 bg-rose-50 text-rose-800",
  NON_DISPONIBILE: "border-slate-200 bg-slate-100 text-slate-700",
};

const STATO_LABELS: Record<Mezzo["stato"], string> = {
  DISPONIBILE: "Disponibile",
  PRENOTATO: "Prenotato",
  IN_USO: "In uso",
  IN_PAUSA: "In pausa",
  IN_MANUTENZIONE: "In manutenzione",
  NON_DISPONIBILE: "Non disponibile",
};

// La card espone in modo leggibile i dati minimi utili per utente e operatore.
export default function MezzoCard({ mezzo }: MezzoCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
            {mezzo.tipo}
          </p>
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">
              {mezzo.modello}
            </h3>
            <p className="text-sm text-slate-500">Codice mezzo: {mezzo.codice}</p>
          </div>
        </div>

        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATO_BADGE_STYLES[mezzo.stato]}`}
        >
          {STATO_LABELS[mezzo.stato]}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Batteria
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {mezzo.batteria}%
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Posti
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {mezzo.posti}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Patente richiesta
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {mezzo.patenteRichiesta}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Posizione
          </p>
          <p className="mt-1 text-sm font-medium text-slate-950">
            {mezzo.latitudine.toFixed(4)}, {mezzo.longitudine.toFixed(4)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Area di servizio
          </p>
          <p className="mt-1 text-sm font-medium text-slate-950">
            {mezzo.areaServizioNome}
          </p>
        </div>
      </div>
    </article>
  );
}
