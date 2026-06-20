import type { Metadata } from "next";
import HeroSezioneOperatore from "@/components/operatore/HeroSezioneOperatore";
import PrioritaFlottaOperativa from "@/components/operatore/PrioritaFlottaOperativa";
import { mezziMock } from "@/lib/mappa/mock-data";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";
import { recuperaRiepiloghiSegnalazioniApertePerMezzo } from "@/lib/segnalazioni-mezzo";

export const metadata: Metadata = {
  title: "Priorita Flotta | E-Smart Mobility",
  description:
    "Area operatore dedicata ai mezzi che richiedono attenzione prioritaria.",
};

export default async function OperatorePrioritaFlottaPage() {
  const mezziMonitorati = await risolviMezziConStatoDinamico(mezziMock);
  const riepiloghiSegnalazioni = await recuperaRiepiloghiSegnalazioniApertePerMezzo(
    mezziMonitorati.map((mezzo) => mezzo.id),
  );
  const riepiloghiPerMezzo = new Map(
    riepiloghiSegnalazioni.map((riepilogo) => [riepilogo.mezzoId, riepilogo]),
  );
  const mezziConBatteriaBassa = mezziMonitorati.filter(
    (mezzo) => mezzo.batteria <= 25,
  );
  const mezziNonDisponibili = mezziMonitorati.filter((mezzo) =>
    ["NON_DISPONIBILE", "IN_MANUTENZIONE"].includes(mezzo.stato),
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
        titolo="Qui emergono subito i mezzi da presidiare."
        descrizione="Batteria bassa e indisponibilita vivono in una sezione dedicata, cosi l'operatore puo concentrarsi subito sui casi piu urgenti."
      />

      <PrioritaFlottaOperativa
        mezziConBatteriaBassa={mezziConBatteriaBassa}
        mezziNonDisponibili={mezziNonDisponibili}
        mezziConSegnalazioniAperte={mezziConSegnalazioniAperte}
      />
    </>
  );
}
