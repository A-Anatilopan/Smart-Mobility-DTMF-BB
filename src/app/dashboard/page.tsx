import type { Metadata } from "next";
import DashboardUtenteNoleggioClient from "@/components/noleggio/DashboardUtenteNoleggioClient";
import {
  areeServizioMock,
  mezziMock,
  posizioneUtenteMappaMock,
} from "@/lib/mappa/mock-data";
import {
  trovaCorsaAttivaMezzo,
  trovaCorsaAttivaUtente,
  trovaUltimaCorsaTerminataUtente,
  trovaPrenotazioneAttivaMezzo,
  trovaPrenotazioneAttivaUtente,
} from "@/lib/noleggio";
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
  const [prenotazioneAttiva, corsaAttiva, ultimaCorsaTerminata] = await Promise.all([
    trovaPrenotazioneAttivaUtente(utente.id),
    trovaCorsaAttivaUtente(utente.id),
    trovaUltimaCorsaTerminataUtente(utente.id),
  ]);
  const mezziDisponibiliMock = mezziMock.filter(
    (mezzo) => mezzo.stato === "DISPONIBILE",
  );
  const verificheDisponibilita = await Promise.all(
    mezziDisponibiliMock.map(async (mezzo) => {
      const [prenotazioneAttivaMezzo, corsaAttivaMezzo] = await Promise.all([
        trovaPrenotazioneAttivaMezzo(mezzo.id),
        trovaCorsaAttivaMezzo(mezzo.id),
      ]);

      return {
        mezzo,
        impegnato: Boolean(prenotazioneAttivaMezzo || corsaAttivaMezzo),
      };
    }),
  );
  const mezziDisponibili = verificheDisponibilita
    .filter((verifica) => !verifica.impegnato)
    .map((verifica) => verifica.mezzo);
  const mezzoPrenotato = prenotazioneAttiva
    ? mezziMock.find((mezzo) => mezzo.id === prenotazioneAttiva.mezzoId) ?? null
    : null;
  const mezzoInCorsa = corsaAttiva
    ? mezziMock.find((mezzo) => mezzo.id === corsaAttiva.mezzoId) ?? null
    : null;
  const mezzoUltimaCorsaTerminata = ultimaCorsaTerminata
    ? mezziMock.find((mezzo) => mezzo.id === ultimaCorsaTerminata.mezzoId) ?? null
    : null;
  const mezziMappaUtente = [
    ...mezziDisponibili,
    ...(mezzoPrenotato ? [mezzoPrenotato] : []),
    ...(mezzoInCorsa ? [mezzoInCorsa] : []),
  ].filter(
    (mezzo, indice, lista) =>
      lista.findIndex((mezzoCorrente) => mezzoCorrente.id === mezzo.id) === indice,
  );

  return (
    <>
      <section className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)] sm:px-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Inizio
          </p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {utente.nome}, scegli il mezzo e parti quando vuoi.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Questa e la tua vista principale: qui trovi i mezzi disponibili,
            la tua posizione sulla mappa e lo stato del noleggio quando ne hai
            uno attivo.
          </p>
        </div>
      </section>

      {/* Questo wrapper client condivide lo stesso stato tra pannello e mappa,
          cosi il popup del mezzo puo riusare le stesse azioni del noleggio. */}
      <DashboardUtenteNoleggioClient
        aree={areeServizioMock}
        mezziMappa={mezziMappaUtente}
        mezziDisponibili={mezziDisponibili}
        posizioneUtente={posizioneUtenteMappaMock}
        prenotazioneAttivaIniziale={
          prenotazioneAttiva
            ? {
                ...prenotazioneAttiva,
                mezzo: mezzoPrenotato,
              }
            : null
        }
        corsaAttivaIniziale={
          corsaAttiva
            ? {
                ...corsaAttiva,
                mezzo: mezzoInCorsa,
              }
            : null
        }
        ultimaCorsaTerminataIniziale={
          ultimaCorsaTerminata
            ? {
                ...ultimaCorsaTerminata,
                mezzo: mezzoUltimaCorsaTerminata,
              }
            : null
        }
      />
    </>
  );
}
