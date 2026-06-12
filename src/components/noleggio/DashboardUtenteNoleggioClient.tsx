"use client";

import MappaServizioMock from "@/components/mappa/MappaServizioMock";
import PrenotazioneMezziDisponibili from "@/components/noleggio/PrenotazioneMezziDisponibili";
import {
  useNoleggioUtente,
  type CorsaAttivaConMezzo,
  type CorsaTerminataConMezzo,
  type PrenotazioneAttivaConMezzo,
} from "@/components/noleggio/useNoleggioUtente";
import type {
  AreaServizio,
  Mezzo,
  PosizioneUtenteMappa,
} from "@/types/mobilita";

type DashboardUtenteNoleggioClientProps = {
  aree: AreaServizio[];
  mezziMappa: Mezzo[];
  mezziDisponibili: Mezzo[];
  posizioneUtente: PosizioneUtenteMappa | null;
  prenotazioneAttivaIniziale: PrenotazioneAttivaConMezzo | null;
  corsaAttivaIniziale: CorsaAttivaConMezzo | null;
  ultimaCorsaTerminataIniziale: CorsaTerminataConMezzo | null;
};

// Questo wrapper condivide lo stesso hook tra pannello e mappa, cosi i popup
// dei marker e la dashboard reagiscono allo stesso stato del noleggio.
export default function DashboardUtenteNoleggioClient({
  aree,
  mezziMappa,
  mezziDisponibili,
  posizioneUtente,
  prenotazioneAttivaIniziale,
  corsaAttivaIniziale,
  ultimaCorsaTerminataIniziale,
}: DashboardUtenteNoleggioClientProps) {
  const noleggioUtente = useNoleggioUtente({
    prenotazioneAttivaIniziale,
    corsaAttivaIniziale,
    ultimaCorsaTerminataIniziale,
  });

  return (
    <>
      <MappaServizioMock
        aree={aree}
        mezzi={mezziMappa}
        modalita="utente"
        posizioneUtente={posizioneUtente}
        noleggioUtente={noleggioUtente}
      />

      {/* Il pannello riepiloga lo stato del noleggio, ma l'interazione
          principale resta sulla mappa tramite popup del marker. */}
      <PrenotazioneMezziDisponibili
        mezziDisponibili={mezziDisponibili}
        noleggioUtente={noleggioUtente}
      />
    </>
  );
}
