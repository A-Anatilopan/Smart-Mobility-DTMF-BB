"use client";

import { useState } from "react";
import ListaMezziFiltrabile from "@/components/mappa/ListaMezziFiltrabile";
import ModaleSessioneOperativaMezzo from "@/components/operatore/ModaleSessioneOperativaMezzo";
import ModaleSegnalazioneMezzoOperatore from "@/components/segnalazioni/ModaleSegnalazioneMezzoOperatore";
import type { Mezzo } from "@/types/mobilita";

type SessioneOperativaAttivaCard = {
  id: number;
  codice: string;
  motivo: string;
  noteApertura: string | null;
  noteChiusura: string | null;
  apertaAt: string;
  operatore: {
    id: number;
    nome: string;
    cognome: string;
    email: string;
  };
};

type FlottaOperatoreClientProps = {
  mezzi: Mezzo[];
  ricercaIniziale?: string;
  statoIniziale?: string;
  sessioniOperativeAttive: Record<string, SessioneOperativaAttivaCard>;
};

// Questo wrapper collega la lista flotta alla segnalazione operativa senza
// spostare la logica del filtro dentro la pagina server.
export default function FlottaOperatoreClient({
  mezzi,
  ricercaIniziale,
  statoIniziale,
  sessioniOperativeAttive,
}: FlottaOperatoreClientProps) {
  const [mezzoSelezionato, setMezzoSelezionato] = useState<Mezzo | null>(null);
  const [mezzoSessioneOperativa, setMezzoSessioneOperativa] =
    useState<Mezzo | null>(null);

  return (
    <>
      <ListaMezziFiltrabile
        mezzi={mezzi}
        modalita="operatore"
        messaggioVuoto="Prova a cambiare stato o tipo mezzo per ritrovare i veicoli che vuoi monitorare."
        ricercaIniziale={ricercaIniziale}
        statoIniziale={statoIniziale}
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
