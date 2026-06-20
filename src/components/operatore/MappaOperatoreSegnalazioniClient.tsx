"use client";

import { useState } from "react";
import MappaServizioMock from "@/components/mappa/MappaServizioMock";
import ModaleSessioneOperativaMezzo from "@/components/operatore/ModaleSessioneOperativaMezzo";
import ModaleSegnalazioneMezzoOperatore from "@/components/segnalazioni/ModaleSegnalazioneMezzoOperatore";
import type { SessioneOperativaMezzoCard } from "@/components/mappa/mappa-servizio.types";
import type { AreaServizio, Mezzo, PosizioneUtenteMappa } from "@/types/mobilita";

type MappaOperatoreSegnalazioniClientProps = {
  aree: AreaServizio[];
  mezzi: Mezzo[];
  posizioneUtente: PosizioneUtenteMappa | null;
  sessioniOperativeAttive: Record<string, SessioneOperativaMezzoCard>;
};

// La home operatore mantiene la mappa come scorciatoia rapida per aprire una
// segnalazione direttamente dal mezzo osservato sul territorio.
export default function MappaOperatoreSegnalazioniClient({
  aree,
  mezzi,
  posizioneUtente,
  sessioniOperativeAttive,
}: MappaOperatoreSegnalazioniClientProps) {
  const [mezzoSelezionato, setMezzoSelezionato] = useState<Mezzo | null>(null);
  const [mezzoSessioneOperativa, setMezzoSessioneOperativa] =
    useState<Mezzo | null>(null);

  return (
    <>
      <MappaServizioMock
        aree={aree}
        mezzi={mezzi}
        modalita="operatore"
        posizioneUtente={posizioneUtente}
        mostraPuntiChiave={false}
        mostraPuntiInteresse={false}
        sessioniOperativeAttive={sessioniOperativeAttive}
        onApriSegnalazioneMezzo={(mezzo) => {
          setMezzoSelezionato(mezzo);
        }}
        onApriSessioneOperativaMezzo={(mezzo) => {
          setMezzoSessioneOperativa(mezzo);
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

      {mezzoSessioneOperativa ? (
        <ModaleSessioneOperativaMezzo
          mezzo={mezzoSessioneOperativa}
          sessioneAttiva={
            sessioniOperativeAttive[mezzoSessioneOperativa.id] ?? null
          }
          onClose={() => {
            setMezzoSessioneOperativa(null);
          }}
        />
      ) : null}
    </>
  );
}
