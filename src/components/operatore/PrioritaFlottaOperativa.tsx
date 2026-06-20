import Link from "next/link";
import type { Mezzo } from "@/types/mobilita";
import type { MezzoConRiepilogoSegnalazioniAperte } from "@/types/segnalazioni";

type PrioritaFlottaOperativaProps = {
  mezziConBatteriaBassa: Mezzo[];
  mezziNonDisponibili: Mezzo[];
  mezziConSegnalazioniAperte: MezzoConRiepilogoSegnalazioniAperte[];
};

function formattaDataSegnalazione(valore: Date | string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valore));
}

// Questo blocco raccoglie le priorita operative minime della flotta, cosi la
// stessa vista puo essere riusata nella home operatore e nella pagina dedicata.
export default function PrioritaFlottaOperativa({
  mezziConBatteriaBassa,
  mezziNonDisponibili,
  mezziConSegnalazioniAperte,
}: PrioritaFlottaOperativaProps) {
  const totaleSegnalazioniAperte = mezziConSegnalazioniAperte.reduce(
    (totale, voce) => totale + voce.riepilogo.totaleSegnalazioniAperte,
    0,
  );
  const totaleSegnalazioniInCarico = mezziConSegnalazioniAperte.reduce(
    (totale, voce) => totale + voce.riepilogo.totaleSegnalazioniInGestione,
    0,
  );
  const ultimoAggiornamento = mezziConSegnalazioniAperte[0]?.riepilogo
    .ultimaSegnalazioneAt;

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

      <div className="grid gap-5 xl:grid-cols-3">
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

        <article className="rounded-[1.75rem] border border-sky-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Segnalazioni aperte
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Riepilogo rapido
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              Le anomalie aperte vivono ora in una sezione dedicata, mentre qui
              resta solo una lettura sintetica del carico attuale.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                Mezzi coinvolti
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {mezziConSegnalazioniAperte.length}
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                Segnalazioni attive
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {totaleSegnalazioniAperte + totaleSegnalazioniInCarico}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Ultimo aggiornamento rilevato
            </p>
            <p className="text-sm font-semibold text-slate-950">
              {ultimoAggiornamento
                ? formattaDataSegnalazione(ultimoAggiornamento)
                : "Nessuna segnalazione aperta"}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              Apri la sezione dedicata per leggere i dettagli per mezzo e
              preparare i prossimi passaggi di gestione.
            </p>
          </div>

          <div className="mt-4">
            <Link
              href="/operatore/segnalazioni"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Apri sezione segnalazioni
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
