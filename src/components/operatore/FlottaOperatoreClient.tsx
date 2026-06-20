"use client";

import { useState } from "react";
import ListaMezziFiltrabile from "@/components/mappa/ListaMezziFiltrabile";
import ModaleSegnalazioneMezzoOperatore from "@/components/segnalazioni/ModaleSegnalazioneMezzoOperatore";
import type { Mezzo } from "@/types/mobilita";

type FlottaOperatoreClientProps = {
  mezzi: Mezzo[];
  ricercaIniziale?: string;
  statoIniziale?: string;
};

// Questo wrapper collega la lista flotta alla segnalazione operativa senza
// spostare la logica del filtro dentro la pagina server.
export default function FlottaOperatoreClient({
  mezzi,
  ricercaIniziale,
  statoIniziale,
}: FlottaOperatoreClientProps) {
  const [mezzoSelezionato, setMezzoSelezionato] = useState<Mezzo | null>(null);

  return (
    <>
      <ListaMezziFiltrabile
        mezzi={mezzi}
        modalita="operatore"
        messaggioVuoto="Prova a cambiare stato o tipo mezzo per ritrovare i veicoli che vuoi monitorare."
        ricercaIniziale={ricercaIniziale}
        statoIniziale={statoIniziale}
        onApriSegnalazioneMezzo={(mezzo) => {
          setMezzoSelezionato(mezzo);
        }}
      />

      {mezzoSelezionato ? (
        <ModaleSegnalazioneMezzoOperatore
          mezzo={mezzoSelezionato}
          onClose={() => {
            setMezzoSelezionato(null);
          }}
        />
      ) : null}
    </>
  );
}
