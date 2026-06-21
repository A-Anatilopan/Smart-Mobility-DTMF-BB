import type { Metadata } from "next";
import GestioneMezziScarichiOperatore from "@/components/operatore/GestioneMezziScarichiOperatore";
import HeroSezioneOperatore from "@/components/operatore/HeroSezioneOperatore";
import {
  recuperaGestioniMezziScarichiAttive,
  recuperaMezziScarichiDaGestire,
  recuperaStoricoGestioniMezziScarichiChiuse,
} from "@/lib/mezzi-scarichi";
import { richiediRuolo } from "@/lib/session";
import { RUOLI } from "@/lib/ruoli";

export const metadata: Metadata = {
  title: "Gestione Mezzi Scarichi | E-Smart Mobility",
  description:
    "Area operatore dedicata al ritiro, alla ricarica e alla rimessa dei mezzi scarichi.",
};

// Questa pagina separa il ciclo dei mezzi scarichi dalla vista prioritaria
// generale, cosi l'operatore lavora su un flusso logistico dedicato e piu
// leggibile quando il numero dei mezzi aumenta.
export default async function OperatoreMezziScarichiPage() {
  const [operatoreCorrente, mezziDaGestire, gestioniAttive, gestioniChiuse] =
    await Promise.all([
      richiediRuolo(RUOLI.OPERATORE),
      recuperaMezziScarichiDaGestire(),
      recuperaGestioniMezziScarichiAttive(),
      recuperaStoricoGestioniMezziScarichiChiuse(),
    ]);

  return (
    <>
      <HeroSezioneOperatore
        soprattitolo="Gestione mezzi scarichi"
        titolo="Qui segui ritiro, ricarica e rimessa dei mezzi fuori servizio."
        descrizione="Questa sezione raccoglie solo i mezzi scarichi: separa il lavoro logistico dal resto della flotta e mantiene chiaro quando un mezzo e pronto a rientrare in città."
      />

      <GestioneMezziScarichiOperatore
        operatoreCorrenteId={operatoreCorrente.id}
        mezziDaGestire={mezziDaGestire}
        gestioniAttive={gestioniAttive}
        gestioniChiuse={gestioniChiuse}
      />
    </>
  );
}
