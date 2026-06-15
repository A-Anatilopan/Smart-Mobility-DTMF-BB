import type { Metadata } from "next";
import Link from "next/link";
import {
  trovaStoricoCorseTerminateUtente,
} from "@/lib/noleggio";
import { mezziMock } from "@/lib/mappa/mock-data";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

// La cronologia nasce come area dedicata allo storico recente, cosi la home
// utente puo restare focalizzata sulla scelta del mezzo e sul noleggio attivo.
export const metadata: Metadata = {
  title: "Cronologia | E-Smart Mobility",
  description:
    "Area riservata utente con storico delle corse concluse.",
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

function formattaImportoCent(cent: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cent / 100);
}

function formattaDurata(durataMillisecondi: number): string {
  const totaleSecondi = Math.max(Math.floor(durataMillisecondi / 1000), 0);
  const ore = Math.floor(totaleSecondi / 3600);
  const minuti = Math.floor((totaleSecondi % 3600) / 60);
  const secondi = totaleSecondi % 60;

  if (ore > 0) {
    return `${ore}h ${String(minuti).padStart(2, "0")}m ${String(secondi).padStart(2, "0")}s`;
  }

  return `${minuti}m ${String(secondi).padStart(2, "0")}s`;
}

export default async function DashboardCronologiaPage() {
  const utente = await richiediRuolo(RUOLI.UTENTE);
  const storicoCorse = await trovaStoricoCorseTerminateUtente(utente.id);
  const ultimaCorsaTerminata = storicoCorse[0] ?? null;
  const mezzoUltimaCorsa = ultimaCorsaTerminata
    ? mezziMock.find((mezzo) => mezzo.id === ultimaCorsaTerminata.mezzoId) ?? null
    : null;
  const storicoConMezzo = storicoCorse.map((corsa) => ({
    corsa,
    mezzo: mezziMock.find((mezzo) => mezzo.id === corsa.mezzoId) ?? null,
  }));

  return (
    <>
      <section className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)] sm:px-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Cronologia
          </p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Qui trovi i riepiloghi delle corse concluse.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Tutti i dettagli delle tue corse concluse sono disponibili qui, in
            uno spazio separato dalla home principale.
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                  Storico corse
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {ultimaCorsaTerminata
                    ? `${storicoCorse.length} cors${storicoCorse.length === 1 ? "a conclusa" : "e concluse"}`
                    : "Nessuna corsa conclusa"}
                </h2>
              </div>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Torna alla dashboard
              </Link>
            </div>

            {ultimaCorsaTerminata ? (
              <>
                <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Ultima corsa effettuata
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Questo e il riepilogo piu recente del tuo storico.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Qui sopra trovi sempre la corsa conclusa piu di recente, cosi
                    puoi ritrovare subito l&apos;ultimo noleggio senza cercarlo
                    nell&apos;elenco completo.
                  </p>

                  <div className="mt-4 space-y-2 text-sm text-slate-800">
                  <p>
                    <span className="font-semibold">Codice corsa:</span>{" "}
                    {ultimaCorsaTerminata.codice}
                  </p>
                  <p>
                    <span className="font-semibold">Mezzo:</span>{" "}
                    {mezzoUltimaCorsa
                      ? `${mezzoUltimaCorsa.modello} (${mezzoUltimaCorsa.codice})`
                      : ultimaCorsaTerminata.mezzoId}
                  </p>
                  <p>
                    <span className="font-semibold">Inizio:</span>{" "}
                    {formattaData(ultimaCorsaTerminata.iniziataAt)}
                  </p>
                  <p>
                    <span className="font-semibold">Termine:</span>{" "}
                    {formattaData(ultimaCorsaTerminata.terminataAt)}
                  </p>
                  <p>
                    <span className="font-semibold">Tempo di utilizzo:</span>{" "}
                    {formattaDurata(ultimaCorsaTerminata.durataUtilizzoMs)}
                  </p>
                  <p>
                    <span className="font-semibold">Tempo in pausa:</span>{" "}
                    {formattaDurata(ultimaCorsaTerminata.durataPausaMs)}
                  </p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Sblocco
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-950">
                        {formattaImportoCent(ultimaCorsaTerminata.costi.costoSbloccoCent)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Utilizzo
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-950">
                        {formattaImportoCent(ultimaCorsaTerminata.costi.costoUtilizzoCent)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Pausa
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-950">
                        {formattaImportoCent(ultimaCorsaTerminata.costi.costoPausaCent)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-950 bg-slate-950 px-4 py-3 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">
                        Totale
                      </p>
                      <p className="mt-1 text-base font-semibold">
                        {formattaImportoCent(ultimaCorsaTerminata.costi.costoTotaleCent)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                    Elenco completo
                  </p>
                  <div className="mt-4 space-y-3">
                    {storicoConMezzo.map(({ corsa, mezzo }, index) => (
                      <article
                        key={corsa.id}
                        className={`rounded-2xl border px-4 py-4 ${
                          index === 0
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-950">
                              {mezzo
                                ? `${mezzo.modello} (${mezzo.codice})`
                                : corsa.mezzoId}
                            </p>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                              Codice corsa {corsa.codice}
                            </p>
                          </div>
                          <div className="text-right text-sm text-slate-600">
                            <p>Terminata</p>
                            <p className="font-semibold text-slate-950">
                              {formattaData(corsa.terminataAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl bg-slate-50 px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Utilizzo
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-950">
                              {formattaDurata(corsa.durataUtilizzoMs)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Pausa
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-950">
                              {formattaDurata(corsa.durataPausaMs)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Totale
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-950">
                              {formattaImportoCent(corsa.costi.costoTotaleCent)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Iniziata
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-950">
                              {formattaData(corsa.iniziataAt)}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                Non hai ancora una corsa conclusa da consultare in questa area.
                Quando terminerai il tuo primo noleggio, il riepilogo comparira
                qui in modo separato rispetto alla home.
              </div>
            )}
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Vista utente
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>
                Qui puoi rileggere le corse che hai gia concluso senza appesantire
                la schermata principale.
              </p>
              <p>
                L&apos;ultima corsa resta in evidenza in alto, mentre sotto trovi
                l&apos;elenco completo dello storico recente.
              </p>
              <p>
                In questo modo la home resta dedicata alla scelta del mezzo e al
                noleggio attivo, mentre qui hai uno spazio piu ordinato per
                consultare il passato.
              </p>
            </div>
          </article>
      </section>
    </>
  );
}
