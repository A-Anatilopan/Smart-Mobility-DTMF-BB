// Helper server-side del modulo M-03: costruiscono la base del dominio
// prenotazione/corsa senza aprire ancora UI, pagamenti o integrazioni IoT.

import { randomUUID } from "crypto";
import type { Corsa, Prenotazione, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CorsaNoleggio,
  MonitoraggioNoleggioUtente,
  PrenotazioneNoleggio,
  RiconsegnaMezzoOperatore,
} from "@/types/noleggio";
import type { Coordinate } from "@/types/mobilita";
import {
  calcolaCostoPausaTotaleCent,
  calcolaCostoUtilizzoTotaleCent,
  COSTO_SBLOCCO_CENT,
} from "@/lib/tariffe-noleggio";

const DURATA_PRENOTAZIONE_MINUTI = 15;

function generaCodiceDominio(prefisso: "PRE" | "COR"): string {
  // Usiamo l'UUID senza trattini cosi il codice finale resta entro 36
  // caratteri, in linea con il vincolo VARCHAR(36) scelto per Prisma.
  return `${prefisso}-${randomUUID().replaceAll("-", "")}`;
}

function decimalToNumber(
  valore: Prisma.Decimal | number | null | undefined,
): number | null {
  if (valore === null || valore === undefined) {
    return null;
  }

  return Number(valore);
}

function normalizzaPosizione(
  latitudine: Prisma.Decimal | number | null | undefined,
  longitudine: Prisma.Decimal | number | null | undefined,
): Coordinate | null {
  const latitudineNormalizzata = decimalToNumber(latitudine);
  const longitudineNormalizzata = decimalToNumber(longitudine);

  if (
    latitudineNormalizzata === null ||
    longitudineNormalizzata === null
  ) {
    return null;
  }

  return {
    latitudine: latitudineNormalizzata,
    longitudine: longitudineNormalizzata,
  };
}

function mappaPrenotazioneDominio(
  prenotazione: Prenotazione,
): PrenotazioneNoleggio {
  return {
    id: prenotazione.id,
    codice: prenotazione.codice,
    utenteId: prenotazione.utenteId,
    mezzoId: prenotazione.mezzoId,
    stato: prenotazione.stato as PrenotazioneNoleggio["stato"],
    prenotataAt: prenotazione.prenotataAt,
    scadeAt: prenotazione.scadeAt,
    annullataAt: prenotazione.annullataAt,
    convertitaInCorsaAt: prenotazione.convertitaInCorsaAt,
  };
}

function mappaCorsaDominio(corsa: Corsa): CorsaNoleggio {
  return {
    id: corsa.id,
    codice: corsa.codice,
    utenteId: corsa.utenteId,
    mezzoId: corsa.mezzoId,
    prenotazioneId: corsa.prenotazioneId,
    stato: corsa.stato as CorsaNoleggio["stato"],
    iniziataAt: corsa.iniziataAt,
    ultimaRipresaAt: corsa.ultimaRipresaAt,
    pausaIniziataAt: corsa.pausaIniziataAt,
    terminataAt: corsa.terminataAt,
    durataUtilizzoMs: corsa.durataUtilizzoMs,
    durataPausaMs: corsa.durataPausaMs,
    posizioneInizio: normalizzaPosizione(
      corsa.latitudineInizio,
      corsa.longitudineInizio,
    ),
    posizioneFine: normalizzaPosizione(
      corsa.latitudineFine,
      corsa.longitudineFine,
    ),
    costi: {
      costoSbloccoCent: corsa.costoSbloccoCent,
      costoUtilizzoCent: corsa.costoUtilizzoCent,
      costoPausaCent: corsa.costoPausaCent,
      costoTotaleCent: corsa.costoTotaleCent,
    },
  };
}

function calcolaMillisecondiSegmento(inizio: Date, fine: Date): number {
  return Math.max(fine.getTime() - inizio.getTime(), 0);
}

// Calcola la scadenza standard della prenotazione per i futuri flussi UC-05.
export function calcolaScadenzaPrenotazione(
  partenza: Date = new Date(),
): Date {
  const scadenza = new Date(partenza);
  scadenza.setMinutes(scadenza.getMinutes() + DURATA_PRENOTAZIONE_MINUTI);
  return scadenza;
}

// Allinea le prenotazioni attive con il tempo reale: se il limite e passato,
// la prenotazione non deve continuare a bloccare mezzo, utente o vista mappa.
export async function sincronizzaPrenotazioniScadute(filtro?: {
  utenteId?: number;
  mezzoId?: string;
  mezzoIds?: string[];
}): Promise<void> {
  const where: Prisma.PrenotazioneWhereInput = {
    stato: "ATTIVA",
    scadeAt: {
      lt: new Date(),
    },
  };

  if (typeof filtro?.utenteId === "number") {
    where.utenteId = filtro.utenteId;
  }

  if (typeof filtro?.mezzoId === "string") {
    where.mezzoId = filtro.mezzoId;
  }

  if (Array.isArray(filtro?.mezzoIds) && filtro.mezzoIds.length > 0) {
    where.mezzoId = {
      in: filtro.mezzoIds,
    };
  }

  await prisma.prenotazione.updateMany({
    where,
    data: {
      stato: "SCADUTA",
    },
  });
}

// Verifica se l'utente ha gia una prenotazione attiva, per evitare
// sovrapposizioni prima di aprire i flussi completi lato UI.
export async function trovaPrenotazioneAttivaUtente(
  utenteId: number,
): Promise<PrenotazioneNoleggio | null> {
  await sincronizzaPrenotazioniScadute({ utenteId });

  const prenotazione = await prisma.prenotazione.findFirst({
    where: {
      utenteId,
      stato: "ATTIVA",
    },
    orderBy: {
      prenotataAt: "desc",
    },
  });

  return prenotazione ? mappaPrenotazioneDominio(prenotazione) : null;
}

// Verifica se il mezzo e gia impegnato da una prenotazione ancora valida.
export async function trovaPrenotazioneAttivaMezzo(
  mezzoId: string,
): Promise<PrenotazioneNoleggio | null> {
  await sincronizzaPrenotazioniScadute({ mezzoId });

  const prenotazione = await prisma.prenotazione.findFirst({
    where: {
      mezzoId,
      stato: "ATTIVA",
    },
    orderBy: {
      prenotataAt: "desc",
    },
  });

  return prenotazione ? mappaPrenotazioneDominio(prenotazione) : null;
}

// Verifica se l'utente ha gia una corsa aperta o in pausa, utile per UC-01/02/03.
export async function trovaCorsaAttivaUtente(
  utenteId: number,
): Promise<CorsaNoleggio | null> {
  const corsa = await prisma.corsa.findFirst({
    where: {
      utenteId,
      stato: {
        in: ["ATTIVA", "IN_PAUSA"],
      },
    },
    orderBy: {
      iniziataAt: "desc",
    },
  });

  return corsa ? mappaCorsaDominio(corsa) : null;
}

// Recupera l'ultima corsa terminata dell'utente per mantenere un riepilogo
// coerente anche dopo il refresh della dashboard.
export async function trovaUltimaCorsaTerminataUtente(
  utenteId: number,
): Promise<CorsaNoleggio | null> {
  const corsa = await prisma.corsa.findFirst({
    where: {
      utenteId,
      stato: "TERMINATA",
    },
    orderBy: {
      terminataAt: "desc",
    },
  });

  return corsa ? mappaCorsaDominio(corsa) : null;
}

// Recupera le ultime corse terminate con posizione finale valorizzata, cosi
// l'operatore puo sapere dove i mezzi sono stati lasciati dopo l'uso.
export async function trovaUltimeRiconsegneMezzi(
  limite: number = 6,
): Promise<RiconsegnaMezzoOperatore[]> {
  const corse = await prisma.corsa.findMany({
    where: {
      stato: "TERMINATA",
      latitudineFine: {
        not: null,
      },
      longitudineFine: {
        not: null,
      },
    },
    include: {
      utente: {
        select: {
          id: true,
          nome: true,
          cognome: true,
          email: true,
        },
      },
    },
    orderBy: {
      terminataAt: "desc",
    },
    take: limite,
  });

  return corse.map((corsa) => ({
    utente: corsa.utente,
    corsa: mappaCorsaDominio(corsa),
  }));
}

// Verifica se il mezzo e gia coinvolto in una corsa aperta o in pausa.
export async function trovaCorsaAttivaMezzo(
  mezzoId: string,
): Promise<CorsaNoleggio | null> {
  const corsa = await prisma.corsa.findFirst({
    where: {
      mezzoId,
      stato: {
        in: ["ATTIVA", "IN_PAUSA"],
      },
    },
    orderBy: {
      iniziataAt: "desc",
    },
  });

  return corsa ? mappaCorsaDominio(corsa) : null;
}

// Costruisce una vista minima del noleggio corrente di un utente, pensata per
// l'operatore che deve capire in fretta se c'e una prenotazione o una corsa.
export async function monitoraNoleggioUtente(
  utenteId: number,
): Promise<MonitoraggioNoleggioUtente | null> {
  const utente = await prisma.utente.findUnique({
    where: { id: utenteId },
    select: {
      id: true,
      nome: true,
      cognome: true,
      email: true,
      ruolo: true,
    },
  });

  if (!utente) {
    return null;
  }

  const [prenotazioneAttiva, corsaAttiva] = await Promise.all([
    trovaPrenotazioneAttivaUtente(utenteId),
    trovaCorsaAttivaUtente(utenteId),
  ]);

  if (corsaAttiva) {
    return {
      utente,
      statoMonitoraggio:
        corsaAttiva.stato === "IN_PAUSA" ? "CORSA_IN_PAUSA" : "CORSA_ATTIVA",
      prenotazione: null,
      corsa: corsaAttiva,
    };
  }

  if (prenotazioneAttiva) {
    return {
      utente,
      statoMonitoraggio: "PRENOTAZIONE_ATTIVA",
      prenotazione: prenotazioneAttiva,
      corsa: null,
    };
  }

  return {
    utente,
    statoMonitoraggio: "NESSUN_NOLEGGIO_ATTIVO",
    prenotazione: null,
    corsa: null,
  };
}

// Crea una prenotazione minima se l'utente non ha gia prenotazioni o corse attive.
export async function creaPrenotazioneNoleggio(input: {
  utenteId: number;
  mezzoId: string;
  scadeAt?: Date;
}): Promise<PrenotazioneNoleggio> {
  await Promise.all([
    sincronizzaPrenotazioniScadute({ utenteId: input.utenteId }),
    sincronizzaPrenotazioniScadute({ mezzoId: input.mezzoId }),
  ]);

  const [
    prenotazioneAttiva,
    corsaAttiva,
    prenotazioneAttivaMezzo,
    corsaAttivaMezzo,
  ] = await Promise.all([
    trovaPrenotazioneAttivaUtente(input.utenteId),
    trovaCorsaAttivaUtente(input.utenteId),
    trovaPrenotazioneAttivaMezzo(input.mezzoId),
    trovaCorsaAttivaMezzo(input.mezzoId),
  ]);

  if (prenotazioneAttiva) {
    throw new Error("L'utente ha gia una prenotazione attiva.");
  }

  if (corsaAttiva) {
    throw new Error("L'utente ha gia una corsa attiva.");
  }

  if (prenotazioneAttivaMezzo) {
    throw new Error("Il mezzo selezionato e gia prenotato.");
  }

  if (corsaAttivaMezzo) {
    throw new Error("Il mezzo selezionato e gia coinvolto in una corsa attiva.");
  }

  const prenotazione = await prisma.prenotazione.create({
    data: {
      codice: generaCodiceDominio("PRE"),
      utenteId: input.utenteId,
      mezzoId: input.mezzoId,
      scadeAt: input.scadeAt ?? calcolaScadenzaPrenotazione(),
    },
  });

  return mappaPrenotazioneDominio(prenotazione);
}

// Permette all'utente di rilasciare una prenotazione ancora attiva quando
// decide di non partire piu con quel mezzo.
export async function annullaPrenotazioneNoleggio(input: {
  prenotazioneId: number;
  utenteId: number;
}): Promise<PrenotazioneNoleggio> {
  const prenotazione = await prisma.prenotazione.findUnique({
    where: { id: input.prenotazioneId },
  });

  if (!prenotazione) {
    throw new Error("Prenotazione non trovata.");
  }

  if (prenotazione.utenteId !== input.utenteId) {
    throw new Error("Non puoi annullare una prenotazione non tua.");
  }

  if (prenotazione.stato === "ANNULLATA") {
    throw new Error("La prenotazione e gia stata annullata.");
  }

  if (prenotazione.stato === "ATTIVA" && prenotazione.scadeAt < new Date()) {
    await prisma.prenotazione.update({
      where: { id: prenotazione.id },
      data: {
        stato: "SCADUTA",
      },
    });

    throw new Error("La prenotazione e scaduta e non puo piu essere annullata.");
  }

  if (prenotazione.stato !== "ATTIVA") {
    throw new Error("La prenotazione non e piu attiva.");
  }

  const prenotazioneAggiornata = await prisma.prenotazione.update({
    where: { id: prenotazione.id },
    data: {
      stato: "ANNULLATA",
      annullataAt: new Date(),
    },
  });

  return mappaPrenotazioneDominio(prenotazioneAggiornata);
}

// Forza la chiusura server-side di una prenotazione scaduta specifica, cosi il
// database resta allineato subito anche quando la scadenza viene rilevata dal client.
export async function scadePrenotazioneNoleggio(input: {
  prenotazioneId: number;
  utenteId: number;
}): Promise<PrenotazioneNoleggio> {
  const prenotazione = await prisma.prenotazione.findUnique({
    where: { id: input.prenotazioneId },
  });

  if (!prenotazione) {
    throw new Error("Prenotazione non trovata.");
  }

  if (prenotazione.utenteId !== input.utenteId) {
    throw new Error("Non puoi sincronizzare una prenotazione non tua.");
  }

  if (prenotazione.stato === "SCADUTA") {
    return mappaPrenotazioneDominio(prenotazione);
  }

  if (prenotazione.stato !== "ATTIVA") {
    throw new Error("La prenotazione non e piu attiva.");
  }

  if (prenotazione.scadeAt >= new Date()) {
    throw new Error("La prenotazione non e ancora scaduta.");
  }

  const prenotazioneAggiornata = await prisma.prenotazione.update({
    where: { id: prenotazione.id },
    data: {
      stato: "SCADUTA",
    },
  });

  return mappaPrenotazioneDominio(prenotazioneAggiornata);
}

// Converte una prenotazione valida in corsa, mantenendo il legame tra i due
// record e registrando una posizione iniziale minima quando disponibile.
export async function avviaCorsaDaPrenotazione(input: {
  prenotazioneId: number;
  posizioneInizio?: Coordinate | null;
}): Promise<CorsaNoleggio> {
  return prisma.$transaction(async (tx) => {
    const prenotazione = await tx.prenotazione.findUnique({
      where: { id: input.prenotazioneId },
    });

    if (!prenotazione) {
      throw new Error("Prenotazione non trovata.");
    }

    if (prenotazione.stato !== "ATTIVA") {
      throw new Error("La prenotazione non e piu attiva.");
    }

    if (prenotazione.scadeAt < new Date()) {
      await tx.prenotazione.update({
        where: { id: prenotazione.id },
        data: {
          stato: "SCADUTA",
        },
      });

      throw new Error("La prenotazione e scaduta e non puo piu avviare una corsa.");
    }

    const corsaAttiva = await tx.corsa.findFirst({
      where: {
        utenteId: prenotazione.utenteId,
        stato: {
          in: ["ATTIVA", "IN_PAUSA"],
        },
      },
    });

    if (corsaAttiva) {
      throw new Error("L'utente ha gia una corsa attiva.");
    }

    await tx.prenotazione.update({
      where: { id: prenotazione.id },
      data: {
        stato: "CONVERTITA_IN_CORSA",
        convertitaInCorsaAt: new Date(),
      },
    });

    const corsa = await tx.corsa.create({
      data: {
        codice: generaCodiceDominio("COR"),
        utenteId: prenotazione.utenteId,
        mezzoId: prenotazione.mezzoId,
        prenotazioneId: prenotazione.id,
        ultimaRipresaAt: new Date(),
        latitudineInizio: input.posizioneInizio?.latitudine,
        longitudineInizio: input.posizioneInizio?.longitudine,
      },
    });

    return mappaCorsaDominio(corsa);
  });
}

// Avvia una corsa diretta senza prenotazione preventiva: serve quando l'utente
// si trova gia vicino al mezzo e vuole partire subito senza bloccarlo in anticipo.
export async function avviaCorsaDiretta(input: {
  utenteId: number;
  mezzoId: string;
  posizioneInizio?: Coordinate | null;
}): Promise<CorsaNoleggio> {
  return prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.prenotazione.updateMany({
        where: {
          utenteId: input.utenteId,
          stato: "ATTIVA",
          scadeAt: {
            lt: new Date(),
          },
        },
        data: {
          stato: "SCADUTA",
        },
      }),
      tx.prenotazione.updateMany({
        where: {
          mezzoId: input.mezzoId,
          stato: "ATTIVA",
          scadeAt: {
            lt: new Date(),
          },
        },
        data: {
          stato: "SCADUTA",
        },
      }),
    ]);

    const [prenotazioneAttivaUtente, corsaAttivaUtente] = await Promise.all([
      tx.prenotazione.findFirst({
        where: {
          utenteId: input.utenteId,
          stato: "ATTIVA",
        },
      }),
      tx.corsa.findFirst({
        where: {
          utenteId: input.utenteId,
          stato: {
            in: ["ATTIVA", "IN_PAUSA"],
          },
        },
      }),
    ]);

    if (prenotazioneAttivaUtente) {
      throw new Error("L'utente ha gia una prenotazione attiva.");
    }

    if (corsaAttivaUtente) {
      throw new Error("L'utente ha gia una corsa attiva.");
    }

    const [prenotazioneAttivaMezzo, corsaAttivaMezzo] = await Promise.all([
      tx.prenotazione.findFirst({
        where: {
          mezzoId: input.mezzoId,
          stato: "ATTIVA",
        },
      }),
      tx.corsa.findFirst({
        where: {
          mezzoId: input.mezzoId,
          stato: {
            in: ["ATTIVA", "IN_PAUSA"],
          },
        },
      }),
    ]);

    if (prenotazioneAttivaMezzo) {
      throw new Error("Il mezzo selezionato e gia prenotato.");
    }

    if (corsaAttivaMezzo) {
      throw new Error("Il mezzo selezionato e gia coinvolto in una corsa attiva.");
    }

    const corsa = await tx.corsa.create({
      data: {
        codice: generaCodiceDominio("COR"),
        utenteId: input.utenteId,
        mezzoId: input.mezzoId,
        prenotazioneId: null,
        ultimaRipresaAt: new Date(),
        latitudineInizio: input.posizioneInizio?.latitudine,
        longitudineInizio: input.posizioneInizio?.longitudine,
      },
    });

    return mappaCorsaDominio(corsa);
  });
}

// Porta una corsa attiva nello stato IN_PAUSA e registra il momento in cui la
// pausa inizia, consolidando il tempo reale di utilizzo fin qui maturato.
export async function mettiCorsaInPausa(input: {
  corsaId: number;
  utenteId: number;
}): Promise<CorsaNoleggio> {
  const corsa = await prisma.corsa.findUnique({
    where: { id: input.corsaId },
  });

  if (!corsa) {
    throw new Error("Corsa non trovata.");
  }

  if (corsa.utenteId !== input.utenteId) {
    throw new Error("Non puoi mettere in pausa una corsa non tua.");
  }

  if (corsa.stato === "IN_PAUSA") {
    throw new Error("La corsa e gia in pausa.");
  }

  if (corsa.stato === "TERMINATA") {
    throw new Error("La corsa e gia terminata.");
  }

  const pausaIniziataAt = new Date();
  const durataUtilizzoAggiornata =
    corsa.durataUtilizzoMs +
    calcolaMillisecondiSegmento(corsa.ultimaRipresaAt, pausaIniziataAt);

  const corsaAggiornata = await prisma.corsa.update({
    where: { id: corsa.id },
    data: {
      stato: "IN_PAUSA",
      pausaIniziataAt,
      durataUtilizzoMs: durataUtilizzoAggiornata,
    },
  });

  return mappaCorsaDominio(corsaAggiornata);
}

// Riporta una corsa dallo stato IN_PAUSA ad ATTIVA e consolida il costo della
// pausa appena conclusa prima di far ripartire il conteggio utilizzo.
export async function riprendiCorsaInPausa(input: {
  corsaId: number;
  utenteId: number;
}): Promise<CorsaNoleggio> {
  const corsa = await prisma.corsa.findUnique({
    where: { id: input.corsaId },
  });

  if (!corsa) {
    throw new Error("Corsa non trovata.");
  }

  if (corsa.utenteId !== input.utenteId) {
    throw new Error("Non puoi riprendere una corsa non tua.");
  }

  if (corsa.stato === "TERMINATA") {
    throw new Error("La corsa e gia terminata.");
  }

  if (corsa.stato !== "IN_PAUSA" || !corsa.pausaIniziataAt) {
    throw new Error("La corsa non e attualmente in pausa.");
  }

  const ripresaAt = new Date();
  const durataPausaAggiornata =
    corsa.durataPausaMs +
    calcolaMillisecondiSegmento(corsa.pausaIniziataAt, ripresaAt);

  const corsaAggiornata = await prisma.corsa.update({
    where: { id: corsa.id },
    data: {
      stato: "ATTIVA",
      pausaIniziataAt: null,
      ultimaRipresaAt: ripresaAt,
      durataPausaMs: durataPausaAggiornata,
    },
  });

  return mappaCorsaDominio(corsaAggiornata);
}

// Termina una corsa attiva o in pausa, registrando una posizione finale minima
// e il primo dettaglio costi utile per i futuri flussi UT.07 / UT.08.
export async function terminaCorsa(input: {
  corsaId: number;
  utenteId: number;
  posizioneFine?: Coordinate | null;
}): Promise<CorsaNoleggio> {
  const corsa = await prisma.corsa.findUnique({
    where: { id: input.corsaId },
  });

  if (!corsa) {
    throw new Error("Corsa non trovata.");
  }

  if (corsa.utenteId !== input.utenteId) {
    throw new Error("Non puoi terminare una corsa non tua.");
  }

  if (corsa.stato === "TERMINATA") {
    throw new Error("La corsa e gia terminata.");
  }

  const terminataAt = new Date();
  const durataUtilizzoTotaleMs =
    corsa.durataUtilizzoMs +
    (corsa.stato === "ATTIVA"
      ? calcolaMillisecondiSegmento(corsa.ultimaRipresaAt, terminataAt)
      : 0);
  const durataPausaTotaleMs =
    corsa.durataPausaMs +
    (corsa.stato === "IN_PAUSA" && corsa.pausaIniziataAt
      ? calcolaMillisecondiSegmento(corsa.pausaIniziataAt, terminataAt)
      : 0);
  const costoSbloccoCent = COSTO_SBLOCCO_CENT;
  const costoUtilizzoCent =
    calcolaCostoUtilizzoTotaleCent(durataUtilizzoTotaleMs);
  const costoPausaCent = calcolaCostoPausaTotaleCent(durataPausaTotaleMs);
  const costoTotaleCent =
    costoSbloccoCent + costoUtilizzoCent + costoPausaCent;

  const corsaAggiornata = await prisma.corsa.update({
    where: { id: corsa.id },
    data: {
      stato: "TERMINATA",
      terminataAt,
      latitudineFine: input.posizioneFine?.latitudine,
      longitudineFine: input.posizioneFine?.longitudine,
      durataUtilizzoMs: durataUtilizzoTotaleMs,
      durataPausaMs: durataPausaTotaleMs,
      costoSbloccoCent,
      costoUtilizzoCent,
      costoPausaCent,
      costoTotaleCent,
    },
  });

  return mappaCorsaDominio(corsaAggiornata);
}
