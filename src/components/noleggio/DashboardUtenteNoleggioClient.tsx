"use client";

import { useState } from "react";
import MappaServizioMock from "@/components/mappa/MappaServizioMock";
import PrenotazioneMezziDisponibili from "@/components/noleggio/PrenotazioneMezziDisponibili";
import ModaleSegnalazioneMezzoUtente from "@/components/segnalazioni/ModaleSegnalazioneMezzoUtente";
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
  const [mezzoSegnalazioneSelezionato, setMezzoSegnalazioneSelezionato] =
    useState<Mezzo | null>(null);
  const noleggioUtente = useNoleggioUtente({
    prenotazioneAttivaIniziale,
    corsaAttivaIniziale,
    ultimaCorsaTerminataIniziale,
  });
  const mezzoPrenotato = noleggioUtente.prenotazioneAttiva?.mezzo ?? null;
  const mezzoInCorsa = noleggioUtente.corsaAttiva?.mezzo ?? null;
  const mezzoDaTenereInVista = mezzoInCorsa ?? mezzoPrenotato;
  const haNoleggioAttivo = Boolean(
    noleggioUtente.prenotazioneAttiva || noleggioUtente.corsaAttiva,
  );
  const mezziMappaUtente = mezzoDaTenereInVista
    ? mezziMappa.filter((mezzo) => mezzo.id === mezzoDaTenereInVista.id)
    : mezziMappa;

  return (
    <>
      <MappaServizioMock
        aree={aree}
        mezzi={mezziMappaUtente}
        modalita="utente"
        posizioneUtente={posizioneUtente}
        noleggioUtente={noleggioUtente}
        onApriSegnalazioneMezzo={(mezzo) => {
          setMezzoSegnalazioneSelezionato(mezzo);
        }}
      />

      {/* Il pannello riepiloga lo stato del noleggio, ma l'interazione
          principale resta sulla mappa tramite popup del marker. */}
      <PrenotazioneMezziDisponibili
        mezziDisponibili={mezziDisponibili}
        noleggioUtente={noleggioUtente}
        haNoleggioAttivo={haNoleggioAttivo}
      />

      {mezzoSegnalazioneSelezionato ? (
        <ModaleSegnalazioneMezzoUtente
          mezzo={mezzoSegnalazioneSelezionato}
          onClose={() => {
            setMezzoSegnalazioneSelezionato(null);
          }}
        />
      ) : null}
    </>
  );
}
