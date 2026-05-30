import type { Metadata } from "next";
import LogoutButton from "@/components/auth/LogoutButton";
import AreaServizioCard from "@/components/mappa/AreaServizioCard";
import ListaMezziFiltrabile from "@/components/mappa/ListaMezziFiltrabile";
import MappaServizioMock from "@/components/mappa/MappaServizioMock";
import MezzoCard from "@/components/mappa/MezzoCard";
import {
  areeServizioMock,
  mezziMock,
  posizioneOperatoreMappaMock,
} from "@/lib/mappa/mock-data";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

// Metadati della prima vista operatore del modulo M-02.
export const metadata: Metadata = {
  title: "Area Operatore | E-Smart Mobility",
  description:
    "Area operatore di E-Smart Mobility per il monitoraggio iniziale della flotta e delle aree di servizio.",
};

export default async function DashboardOperatorePage() {
  const utente = await richiediRuolo(RUOLI.OPERATORE);
  const mezziConBatteriaBassa = mezziMock.filter(
    (mezzo) => mezzo.batteria <= 25,
  );
  const mezziInMovimentoOAttivi = mezziMock.filter((mezzo) =>
    ["PRENOTATO", "IN_USO", "IN_PAUSA"].includes(mezzo.stato),
  );
  const mezziInManutenzione = mezziMock.filter(
    (mezzo) => mezzo.stato === "IN_MANUTENZIONE",
  );
  const mezziNonDisponibili = mezziMock.filter((mezzo) =>
    ["NON_DISPONIBILE", "IN_MANUTENZIONE"].includes(mezzo.stato),
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.14),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#e0f2fe_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Hero operatore: presenta una vista dedicata alla supervisione flotta. */}
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-5">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
                Area Operatore
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Supervisione iniziale della flotta condivisa.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300">
                  Questa prima vista operativa raccoglie lo stato dei mezzi, le
                  posizioni registrate e le principali aree di presidio, cosi da
                  dare all&apos;operatore un quadro chiaro della flotta.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-sky-200">
                  Mezzi monitorati
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {mezziMock.length}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-sky-200">
                  Mezzi attivi o in pausa
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {mezziInMovimentoOAttivi.length}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-sky-200">
                  Batteria bassa
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {mezziConBatteriaBassa.length}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-sky-200">
                  In manutenzione
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {mezziInManutenzione.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Profilo attivo e uscita sicura restano sempre disponibili nell'area operatore. */}
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Profilo operativo
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Accesso confermato
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              La sessione attiva appartiene a un operatore autorizzato. Questa
              area verra estesa con strumenti piu avanzati di presidio,
              monitoraggio e intervento sulla flotta.
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Sessione
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Chiusura sicura dell&apos;area operatore
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Al termine delle verifiche puoi uscire in modo sicuro e tornare
              alla pagina di accesso senza lasciare la sessione aperta.
            </p>

            <div className="mt-6">
              <LogoutButton />
            </div>
          </article>
        </section>

        {/* Base cartografica operativa: visualizza l'intero campione flotta su una mappa reale di Bari. */}
        <MappaServizioMock
          aree={areeServizioMock}
          mezzi={mezziMock}
          modalita="operatore"
          posizioneUtente={posizioneOperatoreMappaMock}
        />

        {/* Questa sezione mette in evidenza le priorita immediate prima della vista completa. */}
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Interventi prioritari
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Mezzi che richiedono attenzione
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Qui l&apos;operatore trova prima i mezzi con batteria bassa o fuori
              disponibilita, cosi da capire subito dove concentrare il presidio.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
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
                          {mezzo.latitudine.toFixed(4)},{" "}
                          {mezzo.longitudine.toFixed(4)}
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
          </div>
        </section>

        {/* La posizione dei mezzi con attivita in corso viene separata per una lettura operativa piu rapida. */}
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Mezzi in movimento e soste
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Posizioni da monitorare
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Questa sezione evidenzia i mezzi prenotati, in uso o in pausa, che
              sono i piu utili da seguire durante le attivita operative.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            {mezziInMovimentoOAttivi.map((mezzo) => (
              <MezzoCard key={mezzo.id} mezzo={mezzo} />
            ))}
          </div>
        </section>

        {/* Questa sezione usa il dataset completo per supportare stato, batteria e posizione dei mezzi. */}
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Flotta monitorata
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Mezzi e posizione operativa
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              La griglia mostra l&apos;intero campione di flotta con stato
              corrente, batteria e coordinate registrate, cosi da supportare le
              prime esigenze operative di controllo e presidio.
            </p>
          </div>

          <ListaMezziFiltrabile
            mezzi={mezziMock}
            modalita="operatore"
            messaggioVuoto="Prova a cambiare stato o tipo mezzo per ritrovare i veicoli che vuoi monitorare."
          />
        </section>

        {/* Le aree aiutano a leggere la distribuzione del servizio insieme alla mappa reale. */}
        <section className="space-y-4 pb-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Zone presidiate
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Aree di riferimento della flotta
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Questa sezione mostra le aree campione legate al servizio, utili
              per completare la lettura della distribuzione della flotta insieme
              alla vista cartografica reale.
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
