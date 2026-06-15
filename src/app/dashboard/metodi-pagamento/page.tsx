import type { Metadata } from "next";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

// Questa sezione prepara il punto di accesso futuro ai metodi di pagamento
// senza mescolare ora il relativo flusso con la home della consultazione mezzi.
export const metadata: Metadata = {
  title: "Metodi di pagamento | E-Smart Mobility",
  description:
    "Area riservata utente per la futura gestione dei metodi di pagamento.",
};

export default async function DashboardMetodiPagamentoPage() {
  const utente = await richiediRuolo(RUOLI.UTENTE);

  return (
    <>
      <section className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)] sm:px-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Metodi di pagamento
          </p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {utente.nome}, qui gestirai i tuoi pagamenti.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Questa sezione e gia pronta come punto di accesso dedicato. Nei
            prossimi step potrai aggiungere, aggiornare e controllare i metodi
            di pagamento senza appesantire la home principale.
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Cosa troverai qui
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-950">
                Carte e metodi salvati
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Una vista semplice per controllare i metodi collegati al tuo
                account.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-950">
                Aggiornamento rapido
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Uno spazio separato per modificare i dati senza interferire con
                prenotazione e corsa.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Vista utente
          </p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>
              Qui avrai un&apos;area ordinata per tutto cio che riguarda i
              pagamenti, senza mischiare queste informazioni con la schermata
              della mappa.
            </p>
            <p>
              In questo modo la home resta focalizzata sul noleggio, mentre i
              dati economici trovano un posto piu chiaro e dedicato.
            </p>
          </div>
        </article>
      </section>
    </>
  );
}
