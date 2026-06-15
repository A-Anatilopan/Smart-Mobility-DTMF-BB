import type { Metadata } from "next";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

// Questa pagina separa gia i dati del profilo dalla home operativa, cosi
// l'utente avra poi un punto unico per consultare le proprie informazioni.
export const metadata: Metadata = {
  title: "Dati personali | E-Smart Mobility",
  description:
    "Area riservata utente per la futura consultazione dei dati personali.",
};

export default async function DashboardDatiPersonaliPage() {
  const utente = await richiediRuolo(RUOLI.UTENTE);

  return (
    <>
      <section className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)] sm:px-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Dati personali
          </p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {utente.nome}, qui troverai il tuo profilo personale.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Questa sezione prepara uno spazio dedicato alle tue informazioni
            personali, cosi la home resta leggera e centrata sulla mobilita.
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Profilo attuale
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Nome
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {utente.nome}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Cognome
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {utente.cognome}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Email
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {utente.email}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Ruolo
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {utente.ruoloCanonico}
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
              Qui vedrai le informazioni del tuo account in uno spazio separato
              dalla mappa, dalla corsa attiva e dalla cronologia.
            </p>
            <p>
              Questo rende l&apos;esperienza piu ordinata: ogni sezione ha un
              obiettivo chiaro e non mescola dati personali con le operazioni
              quotidiane di noleggio.
            </p>
          </div>
        </article>
      </section>
    </>
  );
}
