import type { Metadata } from "next";
import HeroSezioneOperatore from "@/components/operatore/HeroSezioneOperatore";
import PrioritaFlottaOperativa from "@/components/operatore/PrioritaFlottaOperativa";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";
import { recuperaRiepiloghiSegnalazioniApertePerMezzo } from "@/lib/segnalazioni-mezzo";

export const metadata: Metadata = {
  title: "Priorita Flotta | E-Smart Mobility",
  description:
    "Area operatore dedicata ai mezzi che richiedono attenzione prioritaria.",
};

export default async function OperatorePrioritaFlottaPage() {
  const mezziMonitorati = await risolviMezziConStatoDinamico();
  const riepiloghiSegnalazioni = await recuperaRiepiloghiSegnalazioniApertePerMezzo(
    mezziMonitorati.map((mezzo) => mezzo.id),
  );
  const riepiloghiPerMezzo = new Map(
    riepiloghiSegnalazioni.map((riepilogo) => [riepilogo.mezzoId, riepilogo]),
  );
  const mezziConBatteriaBassa = mezziMonitorati.filter(
    (mezzo) => mezzo.batteria <= 25,
  );
  const mezziFuoriDisponibilita = mezziMonitorati.filter(
    (mezzo) => mezzo.stato === "NON_DISPONIBILE",
  );
  const mezziInManutenzione = mezziMonitorati.filter(
    (mezzo) => mezzo.stato === "IN_MANUTENZIONE",
  );
  const mezziConSegnalazioniAperte = mezziMonitorati
    .filter((mezzo) => riepiloghiPerMezzo.has(mezzo.id))
    .map((mezzo) => ({
      mezzo,
      riepilogo: riepiloghiPerMezzo.get(mezzo.id)!,
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

  return (
    <>
      <HeroSezioneOperatore
        soprattitolo="Priorita flotta"
        titolo="Qui emergono subito i mezzi da seguire sul piano manutentivo."
        descrizione="Questa vista separa i mezzi sotto osservazione da quelli gia fuori disponibilita o gia entrati in manutenzione, cosi il presidio operativo resta piu chiaro."
      />

      <PrioritaFlottaOperativa
        mezziConBatteriaBassa={mezziConBatteriaBassa}
        mezziFuoriDisponibilita={mezziFuoriDisponibilita}
        mezziInManutenzione={mezziInManutenzione}
        mezziConSegnalazioniAperte={mezziConSegnalazioniAperte}
      />
    </>
  );
}
