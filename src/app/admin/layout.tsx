import type { ReactNode } from "react";
import LogoutButton from "@/components/auth/LogoutButton";
import MenuDashboardAmministrazione from "@/components/admin/MenuDashboardAmministrazione";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

type DashboardAmministrazioneLayoutProps = {
  children: ReactNode;
};

// Il layout dedicato riallinea la PA al livello di ordine gia raggiunto da
// utente e operatore, cosi le future storie restano piu facili da estendere.
export default async function DashboardAmministrazioneLayout({
  children,
}: DashboardAmministrazioneLayoutProps) {
  const utente = await richiediRuolo(RUOLI.PUBBLICA_AMMINISTRAZIONE);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.14),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8">
            <div className="space-y-4">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Pubblica Amministrazione
              </span>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Bentornato, {utente.nome}. L&apos;area istituzionale e pronta.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Qui puoi passare dal quadro generale del servizio ai report
                aggregati, mantenendo separate consultazione urbana e lettura
                istituzionale dei dati.
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
              Accesso come {utente.ruoloCanonico}. Puoi consultare il servizio e
              chiudere la sessione in modo sicuro quando hai concluso.
            </p>

            <div className="mt-4">
              <LogoutButton />
            </div>
          </article>
        </section>

        <MenuDashboardAmministrazione />

        {children}
      </div>
    </main>
  );
}
