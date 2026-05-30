import type { AreaServizio } from "@/types/mobilita";

type AreaServizioCardProps = {
  area: AreaServizio;
};

// Ogni area viene mostrata come scheda sintetica di copertura del servizio.
export default function AreaServizioCard({ area }: AreaServizioCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.3)]">
      <div className="flex items-center gap-3">
        <span
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: area.colore }}
          aria-hidden="true"
        />
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">
          {area.nome}
        </h3>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        Perimetro di copertura del servizio con {area.punti.length} punti utili
        a descrivere l&apos;area realmente servita.
      </p>

      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Primo vertice del perimetro
        </p>
        <p className="mt-1 text-sm font-medium text-slate-950">
          {area.punti[0]?.latitudine.toFixed(4)},{" "}
          {area.punti[0]?.longitudine.toFixed(4)}
        </p>
      </div>
    </article>
  );
}
