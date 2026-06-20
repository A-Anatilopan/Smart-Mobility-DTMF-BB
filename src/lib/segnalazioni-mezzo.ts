import { randomUUID } from "crypto";
import type { SegnalazioneMezzo } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CATEGORIE_SEGNALAZIONE_MEZZO,
  ORIGINI_SEGNALAZIONE_MEZZO,
  STATI_SEGNALAZIONE_MEZZO,
  type CategoriaSegnalazioneMezzo,
  type InputSegnalazioneMezzoOperatore,
  type InputSegnalazioneMezzoUtente,
  type OrigineSegnalazioneMezzo,
  type SegnalazioneMezzoDominio,
  type StatoSegnalazioneMezzo,
} from "@/types/segnalazioni";

const LUNGHEZZA_MINIMA_DESCRIZIONE = 5;
const LUNGHEZZA_MINIMA_DESCRIZIONE_ALTRO = 10;
const FINESTRA_DUPLICATI_ORE = 6;

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
  segnalazione: SegnalazioneMezzo,
): SegnalazioneMezzoDominio {
  return {
    id: segnalazione.id,
    codice: segnalazione.codice,
    origine: normalizzaOrigineSegnalazioneMezzo(segnalazione.origine) ?? "UTENTE",
    utenteId: segnalazione.utenteId,
    mezzoId: segnalazione.mezzoId,
    mezzoCodice: segnalazione.mezzoCodice,
    categoria:
      normalizzaCategoriaSegnalazioneMezzo(segnalazione.categoria) ?? "ALTRO",
    descrizione: segnalazione.descrizione,
    stato: normalizzaStatoSegnalazioneMezzo(segnalazione.stato) ?? "APERTA",
    presaInCaricoAt: segnalazione.presaInCaricoAt,
    risoltaAt: segnalazione.risoltaAt,
    createdAt: segnalazione.createdAt,
    updatedAt: segnalazione.updatedAt,
  };
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
        in: ["APERTA", "PRESA_IN_CARICO"],
      },
      createdAt: {
        gte: soglia,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
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
        in: ["APERTA", "PRESA_IN_CARICO"],
      },
      createdAt: {
        gte: soglia,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
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
  });

  return mappaSegnalazioneMezzoDominio(segnalazione);
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
