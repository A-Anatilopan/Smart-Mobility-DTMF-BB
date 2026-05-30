import type { Metadata } from "next";
import LogoutButton from "@/components/auth/LogoutButton";
import AreaServizioCard from "@/components/mappa/AreaServizioCard";
import ListaMezziFiltrabile from "@/components/mappa/ListaMezziFiltrabile";
import { areeServizioMock, mezziMock } from "@/lib/mappa/mock-data";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

// Metadati della prima vista istituzionale dedicata alla Pubblica Amministrazione.
export const metadata: Metadata = {
  title: "Area Pubblica Amministrazione | E-Smart Mobility",
  description:
    "Area riservata della Pubblica Amministrazione per il monitoraggio iniziale del servizio e della copertura urbana.",
};

export default async function DashboardPubblicaAmministrazionePage() {
  const utente = await richiediRuolo(RUOLI.PUBBLICA_AMMINISTRAZIONE);
  const mezziDisponibili = mezziMock.filter(
    (mezzo) => mezzo.stato === "DISPONIBILE",
  );
  const mezziInManutenzione = mezziMock.filter(
    (mezzo) => mezzo.stato === "IN_MANUTENZIONE",
  );
  const mezziCritici = mezziMock.filter((mezzo) => mezzo.batteria <= 25);
  const distribuzioneTipi = [
    {
      label: "E-Bike",
      valore: mezziMock.filter((mezzo) => mezzo.tipo === "E-Bike").length,
    },
    {
      label: "E-Scooter",
      valore: mezziMock.filter((mezzo) => mezzo.tipo === "E-Scooter").length,
    },
    {
      label: "E-Car",
      valore: mezziMock.filter((mezzo) => mezzo.tipo === "E-Car").length,
    },
  ];
  const riepilogoStati = [
    {
      label: "Disponibili",
      valore: mezziDisponibili.length,
    },
    {
      label: "Prenotati / in uso / in pausa",
      valore: mezziMock.filter((mezzo) =>
        ["PRENOTATO", "IN_USO", "IN_PAUSA"].includes(mezzo.stato),
      ).length,
    },
    {
      label: "In manutenzione",
      valore: mezziInManutenzione.length,
    },
    {
      label: "Non disponibili",
      valore: mezziMock.filter((mezzo) => mezzo.stato === "NON_DISPONIBILE")
        .length,
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.14),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Hero istituzionale: mostra una lettura sintetica del servizio, non operativa nel dettaglio. */}
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-5">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Pubblica Amministrazione
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Quadro iniziale del servizio di mobilita urbana.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300">
                  Questa prima vista istituzionale raccoglie indicatori sintetici
                  sul servizio, sulla copertura urbana e sullo stato generale
                  della flotta, cosi da supportare monitoraggio e lettura pubblica.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-cyan-200">
                  Mezzi nel campione
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {mezziMock.length}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-cyan-200">
                  Mezzi disponibili
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {mezziDisponibili.length}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-cyan-200">
                  Mezzi con attenzione prioritaria
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {mezziCritici.length}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-cyan-200">
                  Aree coperte
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {areeServizioMock.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Profilo attivo e uscita sicura restano disponibili anche nella vista istituzionale. */}
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Profilo istituzionale
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Accesso confermato
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              La sessione attiva appartiene a un profilo della Pubblica
              Amministrazione. Questa area verra ampliata con report, indicatori
              sintetici e strumenti di osservazione del servizio.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Nome completo
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-950">
                  {utente.nome} {utente.cognome}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Ruolo
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-950">
                  {utente.ruoloCanonico}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.3)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Sessione
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Chiusura sicura dell&apos;area istituzionale
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Al termine della consultazione puoi uscire in modo sicuro e
              tornare alla pagina di accesso senza lasciare la sessione aperta.
            </p>

            <div className="mt-6">
              <LogoutButton />
            </div>
          </article>
        </section>

        {/* Questa sezione evita il dettaglio operativo del singolo mezzo e privilegia indicatori aggregati. */}
        <section className="grid gap-5 xl:grid-cols-2">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Distribuzione del campione
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Mezzi per tipologia
              </h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {distribuzioneTipi.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {item.valore}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Integrita del servizio
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Stato sintetico della flotta
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {riepilogoStati.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <p className="text-lg font-semibold text-slate-950">
                    {item.valore}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* La PA puo consultare il campione flotta con filtri sintetici per tipo e stato. */}
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Consultazione filtrata
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Lettura mirata del campione flotta
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Questa sezione consente una consultazione piu mirata del campione
              mezzi, utile per leggere rapidamente tipologie e stati del servizio.
            </p>
          </div>

          <ListaMezziFiltrabile
            mezzi={mezziMock}
            modalita="amministrazione"
            messaggioVuoto="Prova a modificare i filtri per continuare la lettura del campione flotta."
          />
        </section>

        {/* Le aree restano importanti anche per la PA, ma lette come copertura urbana del servizio. */}
        <section className="space-y-4 pb-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Copertura urbana
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Zone di servizio osservate
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Questa sezione rappresenta le principali aree del servizio in modo
              sintetico, utile per una lettura istituzionale della copertura del
              sistema prima della futura mappa interattiva.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {areeServizioMock.map((area) => (
              <AreaServizioCard key={area.id} area={area} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
