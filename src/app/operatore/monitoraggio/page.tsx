import type { Metadata } from "next";
import MonitoraggioNoleggioUtente from "@/components/operatore/MonitoraggioNoleggioUtente";
import { mezziMock } from "@/lib/mappa/mock-data";
import { trovaRiepilogoMonitoraggioOperatore } from "@/lib/noleggio";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

export const metadata: Metadata = {
  title: "Gestione Utente e Corse | E-Smart Mobility",
  description:
    "Area operatore dedicata alla gestione utenti e al controllo di prenotazioni e corse.",
};

export default async function OperatoreMonitoraggioPage() {
  const utente = await richiediRuolo(RUOLI.OPERATORE);
  const monitoraggiAttivi = await trovaRiepilogoMonitoraggioOperatore(12);
  const monitoraggiAttiviConMezzo = monitoraggiAttivi.map((voce) => {
    const mezzoId = voce.corsa?.mezzoId ?? voce.prenotazione?.mezzoId ?? null;
    const mezzo = mezzoId
      ? mezziMock.find((mezzoCorrente) => mezzoCorrente.id === mezzoId) ?? null
      : null;

    return {
      ...voce,
      prenotazione: voce.prenotazione
        ? {
            ...voce.prenotazione,
            mezzo: mezzo
              ? {
                  id: mezzo.id,
                  codice: mezzo.codice,
                  tipo: mezzo.tipo,
                  modello: mezzo.modello,
                  areaServizioNome: mezzo.areaServizioNome,
                }
              : null,
          }
        : null,
      corsa: voce.corsa
        ? {
            ...voce.corsa,
            mezzo: mezzo
              ? {
                  id: mezzo.id,
                  codice: mezzo.codice,
                  tipo: mezzo.tipo,
                  modello: mezzo.modello,
                  areaServizioNome: mezzo.areaServizioNome,
                }
              : null,
          }
        : null,
    };
  });
  const corseAperte = monitoraggiAttiviConMezzo.filter(
    (voce) =>
      voce.statoMonitoraggio === "CORSA_ATTIVA" ||
      voce.statoMonitoraggio === "CORSA_IN_PAUSA",
  );
  const prenotazioniAperte = monitoraggiAttiviConMezzo.filter(
    (voce) => voce.statoMonitoraggio === "PRENOTAZIONE_ATTIVA",
  );

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
              Gestione Utente e Corse
            </span>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {utente.nome}, qui gestisci utenti e corse ancora aperte.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Questa vista unisce controllo puntuale dell&apos;account,
                sospensione utente e panoramica immediata di prenotazioni e
                corse ancora attive o in pausa.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-sky-200">
                Corse aperte
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {corseAperte.length}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-sky-200">
                Prenotazioni aperte
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {prenotazioniAperte.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <MonitoraggioNoleggioUtente
        monitoraggiAttiviIniziali={monitoraggiAttiviConMezzo}
      />
    </>
  );
}
