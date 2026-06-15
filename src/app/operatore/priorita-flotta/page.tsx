import type { Metadata } from "next";
import HeroSezioneOperatore from "@/components/operatore/HeroSezioneOperatore";
import PrioritaFlottaOperativa from "@/components/operatore/PrioritaFlottaOperativa";
import { mezziMock } from "@/lib/mappa/mock-data";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";

export const metadata: Metadata = {
  title: "Priorita Flotta | E-Smart Mobility",
  description:
    "Area operatore dedicata ai mezzi che richiedono attenzione prioritaria.",
};

export default async function OperatorePrioritaFlottaPage() {
  const mezziMonitorati = await risolviMezziConStatoDinamico(mezziMock);
  const mezziConBatteriaBassa = mezziMonitorati.filter(
    (mezzo) => mezzo.batteria <= 25,
  );
  const mezziNonDisponibili = mezziMonitorati.filter((mezzo) =>
    ["NON_DISPONIBILE", "IN_MANUTENZIONE"].includes(mezzo.stato),
  );

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
      />
    </>
  );
}
