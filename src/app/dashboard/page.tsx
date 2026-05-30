import type { Metadata } from "next";
import LogoutButton from "@/components/auth/LogoutButton";
import AreaServizioCard from "@/components/mappa/AreaServizioCard";
import ListaMezziFiltrabile from "@/components/mappa/ListaMezziFiltrabile";
import MappaServizioMock from "@/components/mappa/MappaServizioMock";
import {
  areeServizioMock,
  mezziMock,
  posizioneUtenteMappaMock,
} from "@/lib/mappa/mock-data";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

// La dashboard utente diventa il vero punto di accesso alle funzioni M-02 gia disponibili.
export const metadata: Metadata = {
  title: "Dashboard Utente | E-Smart Mobility",
  description:
    "Area riservata utente con consultazione mezzi disponibili e aree di servizio.",
};

export default async function DashboardUtentePage() {
  const utente = await richiediRuolo(RUOLI.UTENTE);
  const mezziDisponibili = mezziMock.filter(
    (mezzo) => mezzo.stato === "DISPONIBILE",
  );
  const conteggioPerTipo = {
    eBike: mezziDisponibili.filter((mezzo) => mezzo.tipo === "E-Bike").length,
    eScooter: mezziDisponibili.filter((mezzo) => mezzo.tipo === "E-Scooter")
      .length,
    eCar: mezziDisponibili.filter((mezzo) => mezzo.tipo === "E-Car").length,
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.14),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Hero riservato: conferma accesso e porta subito l'utente nella consultazione dei mezzi. */}
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-5">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
                Dashboard Utente
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Bentornato, {utente.nome}. Il tuo prossimo mezzo e gia qui.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300">
                  La tua area personale ora ti porta direttamente alla
                  consultazione dei mezzi disponibili e delle zone coperte dal
                  servizio, senza passaggi intermedi inutili.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-teal-200">
                  E-Bike disponibili
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {conteggioPerTipo.eBike}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-teal-200">
                  E-Scooter disponibili
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {conteggioPerTipo.eScooter}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-teal-200">
                  E-Car disponibili
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {conteggioPerTipo.eCar}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Riga profilo: mantiene il contesto riservato senza separare l'utente dalla funzione principale. */}
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.7fr]">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Profilo attivo
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {utente.nome} {utente.cognome}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              La tua sessione personale e attiva. Da questa area puoi esplorare
              i mezzi disponibili e prepararti ai prossimi flussi di noleggio.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Area riservata
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {utente.ruoloCanonico}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Questa interfaccia e dedicata agli utenti autenticati e mostra
              solo le informazioni utili alla scelta del mezzo.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.22)]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Sessione
              </p>
              <h2 className="text-lg font-semibold text-slate-950">Logout</h2>
              <p className="text-sm leading-6 text-slate-600">
                Puoi chiudere la sessione in sicurezza quando hai concluso.
              </p>
            </div>

            <div className="mt-4">
              <LogoutButton />
            </div>
          </article>
        </section>

        {/* Prima base cartografica M-02: usa i dati mock senza introdurre provider esterni. */}
        <MappaServizioMock
          aree={areeServizioMock}
          mezzi={mezziDisponibili}
          modalita="utente"
          posizioneUtente={posizioneUtenteMappaMock}
        />

        {/* Le aree coperte restano in evidenza per contestualizzare dove l'utente puo cercare il servizio. */}
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Aree coperte
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Dove puoi trovare il servizio
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              In questa fase vedi le principali zone gia servite, cosi puoi
              orientarti rapidamente prima di scegliere il mezzo piu adatto.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {areeServizioMock.map((area) => (
              <AreaServizioCard key={area.id} area={area} />
            ))}
          </div>
        </section>

        {/* La consultazione mezzi rimane il cuore della dashboard utente autenticata. */}
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Disponibili adesso
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Mezzi pronti per il tuo prossimo noleggio
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Qui trovi solo i mezzi attualmente disponibili, con le
              informazioni utili per confrontare modello, tipo, batteria,
              numero di posti e patente richiesta.
            </p>
          </div>

          <ListaMezziFiltrabile
            mezzi={mezziDisponibili}
            modalita="utente"
            messaggioVuoto="Prova a cambiare tipo mezzo o patente richiesta per visualizzare altre soluzioni disponibili."
          />
        </section>
      </div>
    </main>
  );
}
