import type { Metadata } from "next";
import MappaOperatoreSegnalazioniClient from "@/components/operatore/MappaOperatoreSegnalazioniClient";
import RiepilogoSessioniOperativeAttive from "@/components/operatore/RiepilogoSessioniOperativeAttive";
import {
  areeServizioMock,
  posizioneOperatoreMappaMock,
} from "@/lib/mappa/mock-data";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/session";
import { RUOLI } from "@/lib/ruoli";

// Metadati della prima vista operatore del modulo M-02.
export const metadata: Metadata = {
  title: "Area Operatore | E-Smart Mobility",
  description:
    "Area operatore di E-Smart Mobility per il monitoraggio iniziale della flotta e delle aree di servizio.",
};

export default async function DashboardOperatorePage() {
  const [operatore, mezziMonitorati, sessioniOperativeAttiveDb] = await Promise.all([
    richiediRuolo(RUOLI.OPERATORE),
    risolviMezziConStatoDinamico(),
    prisma.sessioneOperativaMezzo.findMany({
      where: {
        stato: "ATTIVA",
        modalita: "LOCALE",
      },
      select: {
        id: true,
        codice: true,
        mezzoId: true,
        mezzoCodice: true,
        motivo: true,
        noteApertura: true,
        noteChiusura: true,
        apertaAt: true,
        operatore: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            email: true,
          },
        },
      },
      orderBy: {
        apertaAt: "desc",
      },
    }),
  ]);
  const mezziConBatteriaBassa = mezziMonitorati.filter(
    (mezzo) => mezzo.batteria <= 25,
  );
  const mezziInMovimentoOAttivi = mezziMonitorati.filter((mezzo) =>
    ["PRENOTATO", "IN_USO", "IN_PAUSA"].includes(mezzo.stato),
  );
  const mezziInManutenzione = mezziMonitorati.filter(
    (mezzo) => mezzo.stato === "IN_MANUTENZIONE",
  );
  const sessioniOperativeAttive = Object.fromEntries(
    sessioniOperativeAttiveDb.map((sessione) => [
      sessione.mezzoId,
      {
        ...sessione,
        apertaAt: sessione.apertaAt.toISOString(),
      },
    ]),
  );
  const sessioniOperativeRiepilogo = sessioniOperativeAttiveDb.map(
    (sessione) => {
      const mezzo = mezziMonitorati.find(
        (mezzoCorrente) => mezzoCorrente.id === sessione.mezzoId,
      );

      return {
        id: sessione.id,
        codice: sessione.codice,
        mezzoId: sessione.mezzoId,
        mezzoCodice: sessione.mezzoCodice,
        mezzoModello: mezzo?.modello ?? sessione.mezzoCodice,
        statoMezzoCorrente: mezzo?.stato ?? "NON_DISPONIBILE",
        motivo: sessione.motivo,
        noteApertura: sessione.noteApertura,
        noteChiusura: sessione.noteChiusura,
        apertaAt: sessione.apertaAt.toISOString(),
        operatore: sessione.operatore,
      };
    },
  );

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
              Inizio
            </span>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Qui hai la vista generale della flotta operativa.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Questa home resta il punto di partenza per leggere rapidamente
                mappa, stato dei mezzi e primi segnali utili al presidio sul
                territorio.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-sky-200">
                Mezzi monitorati
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {mezziMonitorati.length}
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
      <RiepilogoSessioniOperativeAttive
        sessioni={sessioniOperativeRiepilogo}
        operatoreCorrenteId={operatore.id}
      />
      {/* La home mostra solo orientamento rapido e mappa generale: i dettagli
          operativi vivono nelle sezioni dedicate del menu. */}
      <MappaOperatoreSegnalazioniClient
        aree={areeServizioMock}
        mezzi={mezziMonitorati}
        posizioneUtente={posizioneOperatoreMappaMock}
        sessioniOperativeAttive={sessioniOperativeAttive}
      />
    </>
  );
}
