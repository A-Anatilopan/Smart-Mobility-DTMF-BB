"use client";

import { useState } from "react";
import MappaServizioMock from "@/components/mappa/MappaServizioMock";
import ModaleSegnalazioneMezzoOperatore from "@/components/segnalazioni/ModaleSegnalazioneMezzoOperatore";
import type { AreaServizio, Mezzo, PosizioneUtenteMappa } from "@/types/mobilita";

type MappaOperatoreSegnalazioniClientProps = {
  aree: AreaServizio[];
  mezzi: Mezzo[];
  posizioneUtente: PosizioneUtenteMappa | null;
};

// La home operatore mantiene la mappa come scorciatoia rapida per aprire una
// segnalazione direttamente dal mezzo osservato sul territorio.
export default function MappaOperatoreSegnalazioniClient({
  aree,
  mezzi,
  posizioneUtente,
}: MappaOperatoreSegnalazioniClientProps) {
  const [mezzoSelezionato, setMezzoSelezionato] = useState<Mezzo | null>(null);

  return (
    <>
      <MappaServizioMock
        aree={aree}
        mezzi={mezzi}
        modalita="operatore"
        posizioneUtente={posizioneUtente}
        mostraPuntiChiave={false}
        mostraPuntiInteresse={false}
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
