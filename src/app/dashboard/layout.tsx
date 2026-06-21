import type { ReactNode } from "react";
import LogoutButton from "@/components/auth/LogoutButton";
import MenuDashboardUtente from "@/components/noleggio/MenuDashboardUtente";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

type DashboardUtenteLayoutProps = {
  children: ReactNode;
};

// Questo layout raccoglie la navigazione dell'area utente in un solo punto,
// cosi Inizio, Cronologia e le prossime sezioni restano coerenti tra loro.
export default async function DashboardUtenteLayout({
  children,
}: DashboardUtenteLayoutProps) {
  const utente = await richiediRuolo(RUOLI.UTENTE);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.14),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8">
            <div className="space-y-4">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
                Vista Utente
              </span>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Bentornato, {utente.nome}. La tua area personale e pronta.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Qui puoi passare rapidamente dalla scelta del mezzo al riepilogo
                delle corse concluse, mantenendo ogni sezione ordinata e chiara.
              </p>
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Sessione attiva
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {utente.nome} {utente.cognome}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Da qui puoi aprire le varie sezioni della tua area e uscire in
              modo sicuro quando hai concluso.
            </p>

            <div className="mt-4">
              <LogoutButton />
            </div>
          </article>
        </section>

        <MenuDashboardUtente />

        {children}
      </div>
    </main>
  );
}
