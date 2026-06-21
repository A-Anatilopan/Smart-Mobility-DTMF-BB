import { randomUUID } from "crypto";
import type { SegnalazioneMezzo, Utente } from "@prisma/client";
import { aggiornaStatoMezzoPersistito, sincronizzaStatoMezzoPersistito } from "@/lib/mezzi";
import { prisma } from "@/lib/prisma";
import {
  CATEGORIE_SEGNALAZIONE_MEZZO,
  ORIGINI_SEGNALAZIONE_MEZZO,
  STATI_SEGNALAZIONE_MEZZO,
  type CategoriaSegnalazioneMezzo,
  type InputSegnalazioneMezzoOperatore,
  type InputSegnalazioneMezzoUtente,
  type SegnalazioneMezzoChiusaOperatore,
  type OrigineSegnalazioneMezzo,
  type RiepilogoSegnalazioniAperteMezzo,
  type SegnalazioneMezzoAttivaOperatore,
  type SegnalazioneMezzoDominio,
  type StatoSegnalazioneMezzo,
} from "@/types/segnalazioni";
import type { StatoMezzo } from "@/types/mobilita";

const LUNGHEZZA_MINIMA_DESCRIZIONE = 5;
const LUNGHEZZA_MINIMA_DESCRIZIONE_ALTRO = 10;
const LUNGHEZZA_MINIMA_RIEPILOGO_RISOLUZIONE = 10;
const FINESTRA_DUPLICATI_ORE = 6;

const STATI_SEGNALAZIONE_ATTIVI: StatoSegnalazioneMezzo[] = [
  "APERTA",
  "PRESA_IN_CARICO",
  "RITIRO_PROGRAMMATO",
  "IN_MANUTENZIONE",
  "RISOLTA",
  "RIMESSA_IN_SERVIZIO_PROGRAMMATA",
];

const STATI_SEGNALAZIONE_CHIUSI: StatoSegnalazioneMezzo[] = [
  "RIMESSA_IN_SERVIZIO",
];

type AzioneWorkflowSegnalazioneMezzoOperatore =
  | "PRENDI_IN_CARICO"
  | "PROGRAMMA_RITIRO"
  | "AVVIA_MANUTENZIONE"
  | "SEGNA_RISOLTA"
  | "PROGRAMMA_RIMESSA_IN_SERVIZIO"
  | "RIMETTI_IN_SERVIZIO";

type OperatorePresaInCaricoRidotto = Pick<
  Utente,
  "id" | "nome" | "cognome" | "email"
>;

type SegnalazioneMezzoConOperatore = SegnalazioneMezzo & {
  operatorePresaInCarico: OperatorePresaInCaricoRidotto | null;
};

function isCategoriaSegnalazioneMezzo(
  valore: string,
): valore is CategoriaSegnalazioneMezzo {
  return CATEGORIE_SEGNALAZIONE_MEZZO.includes(
    valore as CategoriaSegnalazioneMezzo,
  );
}

function isOrigineSegnalazioneMezzo(
  valore: string,
): valore is OrigineSegnalazioneMezzo {
  return ORIGINI_SEGNALAZIONE_MEZZO.includes(
    valore as OrigineSegnalazioneMezzo,
  );
}

function isStatoSegnalazioneMezzo(
  valore: string,
): valore is StatoSegnalazioneMezzo {
  return STATI_SEGNALAZIONE_MEZZO.includes(valore as StatoSegnalazioneMezzo);
}

function mappaSegnalazioneMezzoDominio(
  segnalazione: SegnalazioneMezzoConOperatore,
): SegnalazioneMezzoDominio {
  return {
    id: segnalazione.id,
    codice: segnalazione.codice,
    origine: normalizzaOrigineSegnalazioneMezzo(segnalazione.origine) ?? "UTENTE",
    utenteId: segnalazione.utenteId,
    operatorePresaInCarico: segnalazione.operatorePresaInCarico,
    mezzoId: segnalazione.mezzoId,
    mezzoCodice: segnalazione.mezzoCodice,
    categoria:
      normalizzaCategoriaSegnalazioneMezzo(segnalazione.categoria) ?? "ALTRO",
    descrizione: segnalazione.descrizione,
    stato: normalizzaStatoSegnalazioneMezzo(segnalazione.stato) ?? "APERTA",
    presaInCaricoAt: segnalazione.presaInCaricoAt,
    risoltaAt: segnalazione.risoltaAt,
    riepilogoRisoluzione: segnalazione.riepilogoRisoluzione,
    createdAt: segnalazione.createdAt,
    updatedAt: segnalazione.updatedAt,
  };
}

function selectOperatorePresaInCarico() {
  return {
    operatorePresaInCarico: {
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
      },
    },
  } as const;
}

function formattaOperatoreAssegnato(
  operatore: OperatorePresaInCaricoRidotto | null,
): string {
  if (!operatore) {
    return "un altro operatore";
  }

  return `${operatore.nome} ${operatore.cognome}`.trim();
}

function risolviStatoMezzoDaAzioneWorkflow(
  azione: AzioneWorkflowSegnalazioneMezzoOperatore,
): StatoMezzo {
  if (azione === "AVVIA_MANUTENZIONE") {
    return "IN_MANUTENZIONE";
  }

  if (azione === "RIMETTI_IN_SERVIZIO") {
    return "DISPONIBILE";
  }

  return "NON_DISPONIBILE";
}

// I codici leggibili aiutano tracciabilita, debug e distinzione tra
// segnalazioni aperte dall'utente e segnalazioni future aperte dall'operatore.
export function generaCodiceSegnalazioneMezzo(
  origine: OrigineSegnalazioneMezzo,
): string {
  const prefisso = origine === "OPERATORE" ? "SEG-OP" : "SEG-UT";
  const timestamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();

  return `${prefisso}-${timestamp}-${suffix}`;
}

export function normalizzaCategoriaSegnalazioneMezzo(
  valore: unknown,
): CategoriaSegnalazioneMezzo | null {
  if (typeof valore !== "string") {
    return null;
  }

  const categoria = valore.trim().toUpperCase();
  return isCategoriaSegnalazioneMezzo(categoria) ? categoria : null;
}

export function normalizzaOrigineSegnalazioneMezzo(
  valore: unknown,
): OrigineSegnalazioneMezzo | null {
  if (typeof valore !== "string") {
    return null;
  }

  const origine = valore.trim().toUpperCase();
  return isOrigineSegnalazioneMezzo(origine) ? origine : null;
}

export function normalizzaStatoSegnalazioneMezzo(
  valore: unknown,
): StatoSegnalazioneMezzo | null {
  if (typeof valore !== "string") {
    return null;
  }

  const stato = valore.trim().toUpperCase();
  return isStatoSegnalazioneMezzo(stato) ? stato : null;
}

export function normalizzaDescrizioneSegnalazioneMezzo(
  valore: unknown,
): string {
  if (typeof valore !== "string") {
    return "";
  }

  return valore.replace(/\s+/g, " ").trim();
}

export function normalizzaRiepilogoRisoluzioneSegnalazioneMezzo(
  valore: unknown,
): string {
  if (typeof valore !== "string") {
    return "";
  }

  return valore.replace(/\s+/g, " ").trim();
}

// Restituiamo direttamente il messaggio di errore per tenere la route snella e
// allineata agli altri helper server-side gia presenti nel progetto.
export function validaDescrizioneSegnalazioneMezzo(input: {
  categoria: CategoriaSegnalazioneMezzo;
  descrizione: string;
}): string | null {
  const lunghezzaMinima =
    input.categoria === "ALTRO"
      ? LUNGHEZZA_MINIMA_DESCRIZIONE_ALTRO
      : LUNGHEZZA_MINIMA_DESCRIZIONE;

  if (!input.descrizione) {
    return "Inserisci una descrizione valida del problema riscontrato.";
  }

  if (input.descrizione.length < lunghezzaMinima) {
    if (input.categoria === "ALTRO") {
      return "Per la categoria selezionata descrivi il problema con almeno 10 caratteri utili.";
    }

    return "Descrivi il problema con almeno 5 caratteri utili.";
  }

  return null;
}

export function validaRiepilogoRisoluzioneSegnalazioneMezzo(
  riepilogoRisoluzione: string,
): string | null {
  if (!riepilogoRisoluzione) {
    return "Inserisci un breve riepilogo di quello che e stato fatto per risolvere il problema.";
  }

  if (riepilogoRisoluzione.length < LUNGHEZZA_MINIMA_RIEPILOGO_RISOLUZIONE) {
    return "Descrivi la risoluzione con almeno 10 caratteri utili.";
  }

  return null;
}

// Questa regola anti-duplicato evita spam e doppie segnalazioni immediate
// sullo stesso mezzo, ma lascia spazio a nuovi invii se il problema si ripete.
export async function trovaSegnalazioneDuplicataUtente(input: {
  utenteId: number;
  mezzoId: string;
  categoria: CategoriaSegnalazioneMezzo;
}): Promise<SegnalazioneMezzoDominio | null> {
  const soglia = new Date(Date.now() - FINESTRA_DUPLICATI_ORE * 60 * 60 * 1000);

  const segnalazione = await prisma.segnalazioneMezzo.findFirst({
    where: {
      utenteId: input.utenteId,
      mezzoId: input.mezzoId,
      categoria: input.categoria,
      stato: {
        in: STATI_SEGNALAZIONE_ATTIVI,
      },
      createdAt: {
        gte: soglia,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: selectOperatorePresaInCarico(),
  });

  return segnalazione ? mappaSegnalazioneMezzoDominio(segnalazione) : null;
}

// L'operatore puo segnalare un problema gia noto da un utente, ma non deve
// duplicare piu volte la stessa segnalazione operativa sullo stesso mezzo in
// un intervallo troppo breve.
export async function trovaSegnalazioneDuplicataOperatore(input: {
  utenteId: number;
  mezzoId: string;
  categoria: CategoriaSegnalazioneMezzo;
}): Promise<SegnalazioneMezzoDominio | null> {
  const soglia = new Date(Date.now() - FINESTRA_DUPLICATI_ORE * 60 * 60 * 1000);

  const segnalazione = await prisma.segnalazioneMezzo.findFirst({
    where: {
      utenteId: input.utenteId,
      origine: "OPERATORE",
      mezzoId: input.mezzoId,
      categoria: input.categoria,
      stato: {
        in: STATI_SEGNALAZIONE_ATTIVI,
      },
      createdAt: {
        gte: soglia,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: selectOperatorePresaInCarico(),
  });

  return segnalazione ? mappaSegnalazioneMezzoDominio(segnalazione) : null;
}

// La creazione resta concentrata qui cosi route, UI futura e controlli
// operatore riusano lo stesso punto di ingresso del dominio segnalazioni.
export async function creaSegnalazioneMezzoUtente(input: {
  utenteId: number;
  mezzoId: string;
  mezzoCodice: string;
  categoria: CategoriaSegnalazioneMezzo;
  descrizione: string;
}): Promise<SegnalazioneMezzoDominio> {
  const descrizioneNormalizzata = normalizzaDescrizioneSegnalazioneMezzo(
    input.descrizione,
  );
  const erroreDescrizione = validaDescrizioneSegnalazioneMezzo({
    categoria: input.categoria,
    descrizione: descrizioneNormalizzata,
  });

  if (erroreDescrizione) {
    throw new Error(erroreDescrizione);
  }

  const duplicata = await trovaSegnalazioneDuplicataUtente({
    utenteId: input.utenteId,
    mezzoId: input.mezzoId,
    categoria: input.categoria,
  });

  if (duplicata) {
    throw new Error(
      "Hai gia inviato una segnalazione simile per questo mezzo. Attendi la presa in carico prima di inviarne un'altra.",
    );
  }

  const segnalazione = await prisma.segnalazioneMezzo.create({
    data: {
      codice: generaCodiceSegnalazioneMezzo("UTENTE"),
      origine: "UTENTE",
      utenteId: input.utenteId,
      mezzoId: input.mezzoId,
      mezzoCodice: input.mezzoCodice,
      categoria: input.categoria,
      descrizione: descrizioneNormalizzata,
      stato: "APERTA",
    },
    include: selectOperatorePresaInCarico(),
  });

  return mappaSegnalazioneMezzoDominio(segnalazione);
}

// L'origine operatore riusa la stessa entita del dominio ma mantiene codice,
// messaggi e regole anti-duplicato dedicate al contesto operativo.
export async function creaSegnalazioneMezzoOperatore(input: {
  utenteId: number;
  mezzoId: string;
  mezzoCodice: string;
  categoria: CategoriaSegnalazioneMezzo;
  descrizione: string;
}): Promise<SegnalazioneMezzoDominio> {
  const descrizioneNormalizzata = normalizzaDescrizioneSegnalazioneMezzo(
    input.descrizione,
  );
  const erroreDescrizione = validaDescrizioneSegnalazioneMezzo({
    categoria: input.categoria,
    descrizione: descrizioneNormalizzata,
  });

  if (erroreDescrizione) {
    throw new Error(erroreDescrizione);
  }

  const duplicata = await trovaSegnalazioneDuplicataOperatore({
    utenteId: input.utenteId,
    mezzoId: input.mezzoId,
    categoria: input.categoria,
  });

  if (duplicata) {
    throw new Error(
      "Hai gia inviato una segnalazione operativa simile per questo mezzo. Attendi la presa in carico prima di inviarne un'altra.",
    );
  }

  const segnalazione = await prisma.segnalazioneMezzo.create({
    data: {
      codice: generaCodiceSegnalazioneMezzo("OPERATORE"),
      origine: "OPERATORE",
      utenteId: input.utenteId,
      mezzoId: input.mezzoId,
      mezzoCodice: input.mezzoCodice,
      categoria: input.categoria,
      descrizione: descrizioneNormalizzata,
      stato: "APERTA",
    },
    include: selectOperatorePresaInCarico(),
  });

  return mappaSegnalazioneMezzoDominio(segnalazione);
}

// Questo riepilogo prepara la vera lettura operativa dei mezzi da manutenere:
// raggruppa le segnalazioni ancora aperte o gia prese in carico per mezzo.
export async function recuperaRiepiloghiSegnalazioniApertePerMezzo(
  mezzoIds: string[],
): Promise<RiepilogoSegnalazioniAperteMezzo[]> {
  if (mezzoIds.length === 0) {
    return [];
  }

  const segnalazioni = await prisma.segnalazioneMezzo.findMany({
    where: {
      mezzoId: {
        in: mezzoIds,
      },
      stato: {
        in: STATI_SEGNALAZIONE_ATTIVI,
      },
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    include: selectOperatorePresaInCarico(),
  });

  const riepiloghi = new Map<string, RiepilogoSegnalazioniAperteMezzo>();

  for (const segnalazione of segnalazioni) {
    const riepilogoEsistente = riepiloghi.get(segnalazione.mezzoId);
    const categoria =
      normalizzaCategoriaSegnalazioneMezzo(segnalazione.categoria) ?? "ALTRO";
    const origine =
      normalizzaOrigineSegnalazioneMezzo(segnalazione.origine) ?? "UTENTE";

    if (!riepilogoEsistente) {
      riepiloghi.set(segnalazione.mezzoId, {
        mezzoId: segnalazione.mezzoId,
        totaleSegnalazioniAperte: segnalazione.stato === "APERTA" ? 1 : 0,
        totaleSegnalazioniInGestione:
          segnalazione.stato === "APERTA" ? 0 : 1,
        ultimaSegnalazioneAt: segnalazione.updatedAt,
        ultimaCategoria: categoria,
        ultimaOrigine: origine,
        ultimoCodiceSegnalazione: segnalazione.codice,
      });
      continue;
    }

    riepiloghi.set(segnalazione.mezzoId, {
      ...riepilogoEsistente,
      totaleSegnalazioniAperte:
        riepilogoEsistente.totaleSegnalazioniAperte +
        (segnalazione.stato === "APERTA" ? 1 : 0),
      totaleSegnalazioniInGestione:
        riepilogoEsistente.totaleSegnalazioniInGestione +
        (segnalazione.stato === "APERTA" ? 0 : 1),
    });
  }

  return Array.from(riepiloghi.values());
}

// Questa lettura dettaglia le singole anomalie ancora attive, cosi la sezione
// operatore puo mostrare non solo il volume per mezzo ma anche cosa e aperto.
export async function recuperaSegnalazioniAttivePerMezzo(
  mezzoIds: string[],
): Promise<SegnalazioneMezzoAttivaOperatore[]> {
  if (mezzoIds.length === 0) {
    return [];
  }

  const segnalazioni = await prisma.segnalazioneMezzo.findMany({
    where: {
      mezzoId: {
        in: mezzoIds,
      },
      stato: {
        in: STATI_SEGNALAZIONE_ATTIVI,
      },
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    include: selectOperatorePresaInCarico(),
  });

  return segnalazioni.map((segnalazione) => ({
    id: segnalazione.id,
    codice: segnalazione.codice,
    mezzoId: segnalazione.mezzoId,
    mezzoCodice: segnalazione.mezzoCodice,
    origine: normalizzaOrigineSegnalazioneMezzo(segnalazione.origine) ?? "UTENTE",
    categoria:
      normalizzaCategoriaSegnalazioneMezzo(segnalazione.categoria) ?? "ALTRO",
    descrizione: segnalazione.descrizione,
    stato: normalizzaStatoSegnalazioneMezzo(segnalazione.stato) ?? "APERTA",
    createdAt: segnalazione.createdAt,
    updatedAt: segnalazione.updatedAt,
    presaInCaricoAt: segnalazione.presaInCaricoAt,
    operatorePresaInCarico: segnalazione.operatorePresaInCarico,
    riepilogoRisoluzione: segnalazione.riepilogoRisoluzione,
  }));
}

// La cronologia chiusa permette all'operatore di rileggere cosa e gia stato
// risolto senza mischiare questo archivio con il lavoro ancora aperto.
export async function recuperaSegnalazioniChiuseRecenti(
  mezzoIds: string[],
  limite = 12,
): Promise<SegnalazioneMezzoChiusaOperatore[]> {
  if (mezzoIds.length === 0) {
    return [];
  }

  const segnalazioni = await prisma.segnalazioneMezzo.findMany({
    where: {
      mezzoId: {
        in: mezzoIds,
      },
      stato: {
        in: STATI_SEGNALAZIONE_CHIUSI,
      },
    },
    orderBy: [
      {
        risoltaAt: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
    take: limite,
    include: selectOperatorePresaInCarico(),
  });

  return segnalazioni.map((segnalazione) => ({
    id: segnalazione.id,
    codice: segnalazione.codice,
    mezzoId: segnalazione.mezzoId,
    mezzoCodice: segnalazione.mezzoCodice,
    origine: normalizzaOrigineSegnalazioneMezzo(segnalazione.origine) ?? "UTENTE",
    categoria:
      normalizzaCategoriaSegnalazioneMezzo(segnalazione.categoria) ?? "ALTRO",
    descrizione: segnalazione.descrizione,
    stato:
      normalizzaStatoSegnalazioneMezzo(segnalazione.stato) ??
      "RIMESSA_IN_SERVIZIO",
    createdAt: segnalazione.createdAt,
    updatedAt: segnalazione.updatedAt,
    presaInCaricoAt: segnalazione.presaInCaricoAt,
    risoltaAt: segnalazione.risoltaAt,
    operatorePresaInCarico: segnalazione.operatorePresaInCarico,
    riepilogoRisoluzione: segnalazione.riepilogoRisoluzione,
  }));
}

// Prima di introdurre chiusura e workflow piu ampi, abilitiamo il passaggio
// minimo da APERTA a PRESA_IN_CARICO direttamente dalla sezione operativa.
export async function aggiornaWorkflowSegnalazioneMezzoOperatore(input: {
  segnalazioneId: number;
  operatoreId: number;
  azione: AzioneWorkflowSegnalazioneMezzoOperatore;
  riepilogoRisoluzione?: string;
}): Promise<{
  segnalazione: SegnalazioneMezzoDominio;
  giaAggiornata: boolean;
}> {
  const segnalazione = await prisma.segnalazioneMezzo.findUnique({
    where: {
      id: input.segnalazioneId,
    },
    include: selectOperatorePresaInCarico(),
  });

  if (!segnalazione) {
    throw new Error("La segnalazione selezionata non esiste piu.");
  }

  const statoCorrente =
    normalizzaStatoSegnalazioneMezzo(segnalazione.stato) ?? "APERTA";

  if (statoCorrente === "RIMESSA_IN_SERVIZIO") {
    throw new Error(
      "La segnalazione selezionata risulta gia chiusa e non puo piu essere aggiornata.",
    );
  }

  if (
    statoCorrente !== "APERTA" &&
    segnalazione.operatorePresaInCaricoId &&
    segnalazione.operatorePresaInCaricoId !== input.operatoreId
  ) {
    throw new Error(
      `Solo ${formattaOperatoreAssegnato(
        segnalazione.operatorePresaInCarico,
      )} puo continuare la gestione di questa segnalazione, perche l'ha presa in carico.`,
    );
  }

  if (
    input.azione === "PRENDI_IN_CARICO" &&
    segnalazione.operatorePresaInCaricoId &&
    segnalazione.operatorePresaInCaricoId !== input.operatoreId
  ) {
    throw new Error(
      `La segnalazione e gia presa in carico da ${formattaOperatoreAssegnato(
        segnalazione.operatorePresaInCarico,
      )}.`,
    );
  }

  if (input.azione === "SEGNA_RISOLTA") {
    const riepilogoRisoluzioneNormalizzato =
      normalizzaRiepilogoRisoluzioneSegnalazioneMezzo(
        input.riepilogoRisoluzione,
      );
    const erroreRiepilogo = validaRiepilogoRisoluzioneSegnalazioneMezzo(
      riepilogoRisoluzioneNormalizzato,
    );

    if (erroreRiepilogo) {
      throw new Error(erroreRiepilogo);
    }
  }

  let prossimoStato: StatoSegnalazioneMezzo | null = null;
  let giaAggiornata = false;

  if (input.azione === "PRENDI_IN_CARICO") {
    if (statoCorrente === "PRESA_IN_CARICO") {
      giaAggiornata = true;
      prossimoStato = "PRESA_IN_CARICO";
    } else if (statoCorrente === "APERTA") {
      prossimoStato = "PRESA_IN_CARICO";
    } else {
      throw new Error(
        "Puoi prendere in carico solo una segnalazione ancora aperta.",
      );
    }
  } else if (input.azione === "PROGRAMMA_RITIRO") {
    if (statoCorrente === "RITIRO_PROGRAMMATO") {
      giaAggiornata = true;
      prossimoStato = "RITIRO_PROGRAMMATO";
    } else if (statoCorrente === "PRESA_IN_CARICO") {
      prossimoStato = "RITIRO_PROGRAMMATO";
    } else {
      throw new Error(
        "Puoi programmare il ritiro solo dopo aver preso in carico la segnalazione.",
      );
    }
  } else if (input.azione === "AVVIA_MANUTENZIONE") {
    if (statoCorrente === "IN_MANUTENZIONE") {
      giaAggiornata = true;
      prossimoStato = "IN_MANUTENZIONE";
    } else if (statoCorrente === "RITIRO_PROGRAMMATO") {
      prossimoStato = "IN_MANUTENZIONE";
    } else {
      throw new Error(
        "Puoi avviare la manutenzione solo dopo aver programmato il ritiro del mezzo.",
      );
    }
  } else if (input.azione === "SEGNA_RISOLTA") {
    if (statoCorrente === "RISOLTA") {
      giaAggiornata = true;
      prossimoStato = "RISOLTA";
    } else if (statoCorrente === "IN_MANUTENZIONE") {
      prossimoStato = "RISOLTA";
    } else {
      throw new Error(
        "Puoi segnare come risolta solo una segnalazione che sia gia in manutenzione.",
      );
    }
  } else if (input.azione === "PROGRAMMA_RIMESSA_IN_SERVIZIO") {
    if (statoCorrente === "RIMESSA_IN_SERVIZIO_PROGRAMMATA") {
      giaAggiornata = true;
      prossimoStato = "RIMESSA_IN_SERVIZIO_PROGRAMMATA";
    } else if (statoCorrente === "RISOLTA") {
      prossimoStato = "RIMESSA_IN_SERVIZIO_PROGRAMMATA";
    } else {
      throw new Error(
        "Puoi programmare la rimessa in servizio solo dopo aver risolto il problema.",
      );
    }
  } else if (input.azione === "RIMETTI_IN_SERVIZIO") {
    if (statoCorrente === "RIMESSA_IN_SERVIZIO_PROGRAMMATA") {
      prossimoStato = "RIMESSA_IN_SERVIZIO";
    } else {
      throw new Error(
        "Puoi rimettere in servizio il mezzo solo dopo aver programmato la rimessa in servizio.",
      );
    }
  }

  if (giaAggiornata || !prossimoStato) {
    return {
      segnalazione: mappaSegnalazioneMezzoDominio(segnalazione),
      giaAggiornata,
    };
  }

  const riepilogoRisoluzioneNormalizzato =
    input.azione === "SEGNA_RISOLTA"
      ? normalizzaRiepilogoRisoluzioneSegnalazioneMezzo(
          input.riepilogoRisoluzione,
        )
      : segnalazione.riepilogoRisoluzione;

  const aggiornata = await prisma.segnalazioneMezzo.update({
    where: {
      id: input.segnalazioneId,
    },
    data: {
      stato: prossimoStato,
      risoltaAt:
        prossimoStato === "RISOLTA"
          ? new Date()
          : prossimoStato === "RIMESSA_IN_SERVIZIO"
            ? segnalazione.risoltaAt
            : segnalazione.risoltaAt,
      riepilogoRisoluzione: riepilogoRisoluzioneNormalizzato,
      presaInCaricoAt: segnalazione.presaInCaricoAt ?? new Date(),
      operatorePresaInCaricoId:
        segnalazione.operatorePresaInCaricoId ?? input.operatoreId,
    },
    include: selectOperatorePresaInCarico(),
  });

  await aggiornaStatoMezzoPersistito({
    mezzoId: segnalazione.mezzoId,
    stato: risolviStatoMezzoDaAzioneWorkflow(input.azione),
  });
  await sincronizzaStatoMezzoPersistito(segnalazione.mezzoId);

  return {
    segnalazione: mappaSegnalazioneMezzoDominio(aggiornata),
    giaAggiornata: false,
  };
}

export async function prendiInCaricoSegnalazioneMezzoOperatore(
  input: {
    segnalazioneId: number;
    operatoreId: number;
  },
): Promise<{
  segnalazione: SegnalazioneMezzoDominio;
  giaInCarico: boolean;
}> {
  const risultato = await aggiornaWorkflowSegnalazioneMezzoOperatore({
    segnalazioneId: input.segnalazioneId,
    operatoreId: input.operatoreId,
    azione: "PRENDI_IN_CARICO",
  });

  return {
    segnalazione: risultato.segnalazione,
    giaInCarico: risultato.giaAggiornata,
  };
}

export async function risolviSegnalazioneMezzoOperatore(input: {
  segnalazioneId: number;
  operatoreId: number;
  riepilogoRisoluzione: string;
}): Promise<SegnalazioneMezzoDominio> {
  const risultato = await aggiornaWorkflowSegnalazioneMezzoOperatore({
    segnalazioneId: input.segnalazioneId,
    operatoreId: input.operatoreId,
    azione: "SEGNA_RISOLTA",
    riepilogoRisoluzione: input.riepilogoRisoluzione,
  });

  return risultato.segnalazione;
}

export function normalizzaInputSegnalazioneMezzoUtente(
  body: unknown,
): InputSegnalazioneMezzoUtente | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as {
    mezzoId?: unknown;
    mezzoCodice?: unknown;
    categoria?: unknown;
    descrizione?: unknown;
  };
  const categoria = normalizzaCategoriaSegnalazioneMezzo(candidate.categoria);

  if (!categoria) {
    return null;
  }

  return {
    mezzoId:
      typeof candidate.mezzoId === "string" ? candidate.mezzoId.trim() : "",
    mezzoCodice:
      typeof candidate.mezzoCodice === "string"
        ? candidate.mezzoCodice.trim().toUpperCase()
        : "",
    categoria,
    descrizione: normalizzaDescrizioneSegnalazioneMezzo(candidate.descrizione),
  };
}

export function normalizzaInputSegnalazioneMezzoOperatore(
  body: unknown,
): InputSegnalazioneMezzoOperatore | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as {
    mezzoId?: unknown;
    mezzoCodice?: unknown;
    categoria?: unknown;
    descrizione?: unknown;
  };
  const categoria = normalizzaCategoriaSegnalazioneMezzo(candidate.categoria);

  if (!categoria) {
    return null;
  }

  return {
    mezzoId:
      typeof candidate.mezzoId === "string" ? candidate.mezzoId.trim() : "",
    mezzoCodice:
      typeof candidate.mezzoCodice === "string"
        ? candidate.mezzoCodice.trim().toUpperCase()
        : "",
    categoria,
    descrizione: normalizzaDescrizioneSegnalazioneMezzo(candidate.descrizione),
  };
}
