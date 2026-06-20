import { randomUUID } from "crypto";
import { mezziMock, posizioneOperatoreMappaMock } from "@/lib/mappa/mock-data";
import { prisma } from "@/lib/prisma";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";
import {
  DISTANZA_MASSIMA_SBLOCCO_LOCALE_OPERATORE_METRI,
  MESSAGGIO_MEZZO_TROPPO_LONTANO_PER_SBLOCCO,
  operatoreVicinoAlMezzo,
} from "@/lib/operazioni-mezzo-operatore.shared";
import type { StatoMezzo } from "@/types/mobilita";
import {
  MOTIVI_SESSIONE_OPERATIVA_MEZZO,
  type MotivoSessioneOperativaMezzo,
} from "@/types/operazioni-mezzo";
const STATI_CON_NOLEGGIO_ATTIVO: StatoMezzo[] = [
  "PRENOTATO",
  "IN_USO",
  "IN_PAUSA",
];

type ApriSessioneOperativaLocaleInput = {
  operatoreId: number;
  mezzoId: string;
  motivo: MotivoSessioneOperativaMezzo;
  note: string;
};

type ChiudiSessioneOperativaLocaleInput = {
  operatoreId: number;
  mezzoId: string;
  noteChiusura: string;
};

function generaCodiceSessioneOperativaMezzo(): string {
  return `SOM-${randomUUID().replace(/-/g, "").slice(0, 24).toUpperCase()}`;
}

export function normalizzaMotivoSessioneOperativaMezzo(
  valore: unknown,
): MotivoSessioneOperativaMezzo {
  if (typeof valore !== "string") {
    return "RIPOSIZIONAMENTO";
  }

  const motivo = valore.trim().toUpperCase();

  return MOTIVI_SESSIONE_OPERATIVA_MEZZO.includes(
    motivo as MotivoSessioneOperativaMezzo,
  )
    ? (motivo as MotivoSessioneOperativaMezzo)
    : "RIPOSIZIONAMENTO";
}

export function normalizzaNoteSessioneOperativaMezzo(valore: unknown): string {
  if (typeof valore !== "string") {
    return "";
  }

  return valore.trim().slice(0, 500);
}

export const MESSAGGIO_SESSIONE_OPERATIVA_GIA_CHIUSA =
  "La sessione operativa locale su questo mezzo e gia stata chiusa.";

// OP.10 - micro-step backend:
// apre una sessione operativa locale solo quando il mezzo non e coinvolto in
// un noleggio attivo e l'operatore risulta vicino alla sua posizione mock.
export async function apriSessioneOperativaLocaleOperatore(
  input: ApriSessioneOperativaLocaleInput,
) {
  const mezzoId = input.mezzoId.trim();

  if (!mezzoId) {
    throw new Error("Il mezzo selezionato non e valido.");
  }

  const mezzoDinamico = (
    await risolviMezziConStatoDinamico(mezziMock)
  ).find((mezzo) => mezzo.id === mezzoId);

  if (!mezzoDinamico) {
    throw new Error("Il mezzo selezionato non esiste.");
  }

  if (STATI_CON_NOLEGGIO_ATTIVO.includes(mezzoDinamico.stato)) {
    throw new Error(
      "Non puoi sbloccare un mezzo che risulta prenotato, in uso o in pausa.",
    );
  }

  const sessioneAttivaEsistente = await prisma.sessioneOperativaMezzo.findFirst({
    where: {
      mezzoId: mezzoDinamico.id,
      stato: "ATTIVA",
    },
    select: {
      id: true,
      codice: true,
      modalita: true,
      apertaAt: true,
    },
  });

  if (sessioneAttivaEsistente) {
    throw new Error(
      "Esiste gia una sessione operativa attiva su questo mezzo.",
    );
  }

  const distanzaMetri = operatoreVicinoAlMezzo(posizioneOperatoreMappaMock, {
    latitudine: mezzoDinamico.latitudine,
    longitudine: mezzoDinamico.longitudine,
  })
    ? DISTANZA_MASSIMA_SBLOCCO_LOCALE_OPERATORE_METRI
    : DISTANZA_MASSIMA_SBLOCCO_LOCALE_OPERATORE_METRI + 1;

  if (distanzaMetri > DISTANZA_MASSIMA_SBLOCCO_LOCALE_OPERATORE_METRI) {
    throw new Error(MESSAGGIO_MEZZO_TROPPO_LONTANO_PER_SBLOCCO);
  }

  const sessione = await prisma.sessioneOperativaMezzo.create({
    data: {
      codice: generaCodiceSessioneOperativaMezzo(),
      operatoreId: input.operatoreId,
      mezzoId: mezzoDinamico.id,
      mezzoCodice: mezzoDinamico.codice,
      statoMezzoOrigine: mezzoDinamico.stato,
      modalita: "LOCALE",
      stato: "ATTIVA",
      motivo: input.motivo,
      noteApertura: input.note || null,
      apertaAt: new Date(),
    },
    select: {
      id: true,
      codice: true,
      mezzoId: true,
      mezzoCodice: true,
      statoMezzoOrigine: true,
      modalita: true,
      stato: true,
      motivo: true,
      noteApertura: true,
      noteChiusura: true,
      apertaAt: true,
      operatore: {
        select: {
          id: true,
          nome: true,
          cognome: true,
          email: true,
        },
      },
    },
  });

  return {
    sessione,
    mezzo: {
      id: mezzoDinamico.id,
      codice: mezzoDinamico.codice,
      modello: mezzoDinamico.modello,
      tipo: mezzoDinamico.tipo,
      statoCorrente: mezzoDinamico.stato,
      areaServizioNome: mezzoDinamico.areaServizioNome,
    },
    distanzaMetri: Math.round(distanzaMetri),
  };
}

// OP.10 - micro-step backend:
// chiude la sessione operativa locale del mezzo e lascia che il resolver
// dinamico torni a mostrare lo stato business corretto del mezzo.
export async function chiudiSessioneOperativaLocaleOperatore(
  input: ChiudiSessioneOperativaLocaleInput,
) {
  const mezzoId = input.mezzoId.trim();

  if (!mezzoId) {
    throw new Error("Il mezzo selezionato non e valido.");
  }

  const sessioneAttiva = await prisma.sessioneOperativaMezzo.findFirst({
    where: {
      mezzoId,
      stato: "ATTIVA",
      modalita: "LOCALE",
    },
    select: {
      id: true,
      codice: true,
      mezzoId: true,
      mezzoCodice: true,
      statoMezzoOrigine: true,
      motivo: true,
      noteApertura: true,
      noteChiusura: true,
      apertaAt: true,
      operatoreId: true,
      operatore: {
        select: {
          id: true,
          nome: true,
          cognome: true,
          email: true,
        },
      },
    },
  });

  if (!sessioneAttiva) {
    throw new Error(MESSAGGIO_SESSIONE_OPERATIVA_GIA_CHIUSA);
  }

  if (sessioneAttiva.operatoreId !== input.operatoreId) {
    throw new Error(
      "Solo l'operatore che ha aperto la sessione locale puo chiuderla.",
    );
  }

  const sessioneChiusa = await prisma.sessioneOperativaMezzo.update({
    where: {
      id: sessioneAttiva.id,
    },
    data: {
      stato: "CHIUSA",
      chiusaAt: new Date(),
      noteChiusura: input.noteChiusura.trim() || null,
    },
    select: {
      id: true,
      codice: true,
      mezzoId: true,
      mezzoCodice: true,
      statoMezzoOrigine: true,
      modalita: true,
      stato: true,
      motivo: true,
      noteApertura: true,
      noteChiusura: true,
      apertaAt: true,
      chiusaAt: true,
      operatore: {
        select: {
          id: true,
          nome: true,
          cognome: true,
          email: true,
        },
      },
    },
  });

  const mezzoRisolto = (
    await risolviMezziConStatoDinamico(mezziMock)
  ).find((mezzo) => mezzo.id === mezzoId);

  return {
    sessione: sessioneChiusa,
    mezzo: mezzoRisolto
      ? {
          id: mezzoRisolto.id,
          codice: mezzoRisolto.codice,
          modello: mezzoRisolto.modello,
          tipo: mezzoRisolto.tipo,
          statoCorrente: mezzoRisolto.stato,
          areaServizioNome: mezzoRisolto.areaServizioNome,
        }
      : {
          id: sessioneChiusa.mezzoId,
          codice: sessioneChiusa.mezzoCodice,
          modello: "",
          tipo: "E-Bike" as const,
          statoCorrente: sessioneChiusa.statoMezzoOrigine as StatoMezzo,
          areaServizioNome: "",
        },
    statoRipristinato: mezzoRisolto?.stato ?? sessioneChiusa.statoMezzoOrigine,
  };
}
