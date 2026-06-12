import type { Mezzo } from "@/types/mobilita";
import type { RiconsegnaMezzoOperatore } from "@/types/noleggio";

type RiconsegnaConMezzo = RiconsegnaMezzoOperatore & {
  mezzo: Mezzo | null;
};

type StoricoRiconsegneMezziProps = {
  riconsegne: RiconsegnaConMezzo[];
};

function formattaData(data: Date | string | null): string {
  if (!data) {
    return "Non disponibile";
  }

  return new Date(data).toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formattaCoordinate(valore: number | null | undefined): string {
  if (typeof valore !== "number") {
    return "Non disponibile";
  }

  return valore.toFixed(5);
}

export default function StoricoRiconsegneMezzi({
  riconsegne,
}: StoricoRiconsegneMezziProps) {
  return (
    <section className="space-y-4">
      {/* Questa sezione collega finalmente la chiusura corsa alla lettura
          operativa: l'operatore vede dove i mezzi sono stati lasciati. */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Riconsegne recenti
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          Ultime posizioni di fine corsa
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Ogni scheda mostra il mezzo appena lasciato, l&apos;utente associato e
          le coordinate finali registrate alla chiusura della corsa.
        </p>
      </div>

      {riconsegne.length === 0 ? (
        <article className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.22)]">
          <p className="text-lg font-semibold text-slate-950">
            Nessuna riconsegna disponibile
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Appena verra terminata una corsa con posizione finale registrata, la
            troverai qui per il controllo operativo.
          </p>
        </article>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {riconsegne.map((riconsegna) => (
            <article
              key={riconsegna.corsa.id}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Mezzo riconsegnato
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {riconsegna.mezzo?.modello ?? riconsegna.corsa.mezzoId}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {riconsegna.mezzo?.codice ?? riconsegna.corsa.mezzoId}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Corsa terminata
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Utente
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {riconsegna.utente.nome} {riconsegna.utente.cognome}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {riconsegna.utente.email}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Chiusura corsa
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {formattaData(riconsegna.corsa.terminataAt)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Codice {riconsegna.corsa.codice}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Latitudine finale
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {formattaCoordinate(
                      riconsegna.corsa.posizioneFine?.latitudine,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Longitudine finale
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {formattaCoordinate(
                      riconsegna.corsa.posizioneFine?.longitudine,
                    )}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
