import type { Metadata } from "next";
import HeroSezioneOperatore from "@/components/operatore/HeroSezioneOperatore";
import SegnalazioniAperteOperatore from "@/components/operatore/SegnalazioniAperteOperatore";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";
import {
  recuperaRiepiloghiSegnalazioniApertePerMezzo,
  recuperaSegnalazioniAttivePerMezzo,
  recuperaSegnalazioniChiuseRecenti,
} from "@/lib/segnalazioni-mezzo";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

export const metadata: Metadata = {
  title: "Segnalazioni | E-Smart Mobility",
  description:
    "Area operatore dedicata alla lettura e alla gestione delle segnalazioni aperte sui mezzi.",
};

// Questa pagina diventa il punto unico di consultazione delle anomalie aperte,
// separando la gestione dal riepilogo rapido mostrato in Priorita flotta.
export default async function OperatoreSegnalazioniPage() {
  const operatoreCorrente = await richiediRuolo(RUOLI.OPERATORE);
  const mezziMonitorati = await risolviMezziConStatoDinamico();
  const mezzoIds = mezziMonitorati.map((mezzo) => mezzo.id);
  const [
    riepiloghiSegnalazioni,
    segnalazioniAttive,
    segnalazioniChiuseRecenti,
  ] = await Promise.all([
    recuperaRiepiloghiSegnalazioniApertePerMezzo(mezzoIds),
    recuperaSegnalazioniAttivePerMezzo(mezzoIds),
    recuperaSegnalazioniChiuseRecenti(mezzoIds),
  ]);
  const riepiloghiPerMezzo = new Map(
    riepiloghiSegnalazioni.map((riepilogo) => [riepilogo.mezzoId, riepilogo]),
  );
  const segnalazioniPerMezzo = new Map<string, typeof segnalazioniAttive>();

  for (const segnalazione of segnalazioniAttive) {
    const elenco = segnalazioniPerMezzo.get(segnalazione.mezzoId) ?? [];
    elenco.push(segnalazione);
    segnalazioniPerMezzo.set(segnalazione.mezzoId, elenco);
  }

  const mezziConSegnalazioniAperte = mezziMonitorati
    .filter((mezzo) => riepiloghiPerMezzo.has(mezzo.id))
    .map((mezzo) => ({
      mezzo: {
        id: mezzo.id,
        codice: mezzo.codice,
        modello: mezzo.modello,
        tipo: mezzo.tipo,
        stato: mezzo.stato,
        batteria: mezzo.batteria,
        areaServizioNome: mezzo.areaServizioNome,
      },
      riepilogo: riepiloghiPerMezzo.get(mezzo.id)!,
      segnalazioniAttive: segnalazioniPerMezzo.get(mezzo.id) ?? [],
    }))
    .sort((a, b) => {
      const totaleA =
        a.riepilogo.totaleSegnalazioniAperte +
        a.riepilogo.totaleSegnalazioniInGestione;
      const totaleB =
        b.riepilogo.totaleSegnalazioniAperte +
        b.riepilogo.totaleSegnalazioniInGestione;

      if (totaleB !== totaleA) {
        return totaleB - totaleA;
      }

      return (
        new Date(b.riepilogo.ultimaSegnalazioneAt).getTime() -
        new Date(a.riepilogo.ultimaSegnalazioneAt).getTime()
      );
    });

  const mezziPerId = new Map(mezziMonitorati.map((mezzo) => [mezzo.id, mezzo]));
  const cronologiaSegnalazioniChiuse = segnalazioniChiuseRecenti
    .map((segnalazione) => {
      const mezzo = mezziPerId.get(segnalazione.mezzoId);

      if (!mezzo) {
        return null;
      }

      return {
        segnalazione,
        mezzo: {
          id: mezzo.id,
          codice: mezzo.codice,
          modello: mezzo.modello,
          tipo: mezzo.tipo,
          areaServizioNome: mezzo.areaServizioNome,
        },
      };
    })
    .filter((voce): voce is NonNullable<typeof voce> => voce !== null);

  return (
    <>
      <HeroSezioneOperatore
        soprattitolo="Segnalazioni"
        titolo="Qui gestisci le segnalazioni aperte della flotta."
        descrizione="In questa sezione trovi le anomalie divise per mezzo, con uno spazio unico per prenderle in carico, seguirle e chiuderle senza confondere il lavoro operativo con le altre viste."
      />

      <SegnalazioniAperteOperatore
        mezziConSegnalazioniAperte={mezziConSegnalazioniAperte}
        cronologiaSegnalazioniChiuse={cronologiaSegnalazioniChiuse}
        operatoreCorrenteId={operatoreCorrente.id}
      />
    </>
  );
}
