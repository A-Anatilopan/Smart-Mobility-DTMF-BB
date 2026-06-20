import Link from "next/link";

type SessioneOperativaRiepilogo = {
  id: number;
  codice: string;
  mezzoId: string;
  mezzoCodice: string;
  mezzoModello: string;
  statoMezzoCorrente: string;
  motivo: string;
  noteApertura: string | null;
  noteChiusura: string | null;
  apertaAt: string;
  operatore: {
    id: number;
    nome: string;
    cognome: string;
    email: string;
  };
};

type RiepilogoSessioniOperativeAttiveProps = {
  sessioni: SessioneOperativaRiepilogo[];
  operatoreCorrenteId: number;
};

function formattaDataOra(valore: string): string {
  return new Date(valore).toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formattaMotivo(motivo: string): string {
  return motivo
    .toLowerCase()
    .split("_")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

function formattaStato(stato: string): string {
  return stato
    .toLowerCase()
    .split("_")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

// Questa sezione rende immediata la lettura delle sessioni operative locali
// aperte, cosi l'operatore capisce subito quali mezzi sono gia in movimento.
export default function RiepilogoSessioniOperativeAttive({
  sessioni,
  operatoreCorrenteId,
}: RiepilogoSessioniOperativeAttiveProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Sessioni operative
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          Mezzi sbloccati per intervento
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Qui vedi in un colpo solo i mezzi che sono gia in spostamento
          operativo, chi li ha aperti e con quale motivazione.
        </p>
      </div>

      {sessioni.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm leading-6 text-slate-600">
          In questo momento non risultano sessioni operative locali aperte.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {sessioni.map((sessione) => (
            <article
              key={sessione.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              {sessione.operatore.id === operatoreCorrenteId ? (
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  In carico a te
                </span>
              ) : (
                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                  In carico a un altro operatore
                </span>
              )}

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Mezzo in intervento
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                    {sessione.mezzoModello}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {sessione.mezzoCodice}
                  </p>
                </div>

                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  {formattaStato(sessione.statoMezzoCorrente)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Motivo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {formattaMotivo(sessione.motivo)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Apertura
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {formattaDataOra(sessione.apertaAt)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Operatore
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {sessione.operatore.nome} {sessione.operatore.cognome}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {sessione.operatore.email}
                  </p>
                </div>
                {sessione.noteApertura ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Nota apertura
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {sessione.noteApertura}
                    </p>
                  </div>
                ) : null}

                {sessione.noteChiusura ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Nota chiusura
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {sessione.noteChiusura}
                    </p>
                  </div>
                ) : null}

                <div className="sm:col-span-2">
                  <Link
                    href={`/operatore/flotta?ricerca=${encodeURIComponent(sessione.mezzoCodice)}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                  >
                    Apri questo mezzo nella flotta
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
