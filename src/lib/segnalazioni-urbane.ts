import { randomUUID } from "crypto";
import type { Prisma, SegnalazioneUrbana, Utente } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CATEGORIE_SEGNALAZIONE_URBANA,
  STATI_SEGNALAZIONE_URBANA,
  type CategoriaSegnalazioneUrbana,
  type InputSegnalazioneUrbana,
  type SegnalazioneUrbanaDominio,
  type StatoSegnalazioneUrbana,
} from "@/types/segnalazioni-urbane";

const LUNGHEZZA_MINIMA_TITOLO = 5;
const LUNGHEZZA_MINIMA_DESCRIZIONE = 10;
const LUNGHEZZA_MINIMA_DESCRIZIONE_ALTRO = 15;
const FINESTRA_DUPLICATI_ORE = 12;

type AmministrazioneRidotta = Pick<Utente, "id" | "nome" | "cognome" | "email">;

type SegnalazioneUrbanaConAutore = SegnalazioneUrbana & {
  amministrazione: AmministrazioneRidotta;
};

function isCategoriaSegnalazioneUrbana(
  valore: string,
): valore is CategoriaSegnalazioneUrbana {
  return CATEGORIE_SEGNALAZIONE_URBANA.includes(
    valore as CategoriaSegnalazioneUrbana,
  );
}

function isStatoSegnalazioneUrbana(
  valore: string,
): valore is StatoSegnalazioneUrbana {
  return STATI_SEGNALAZIONE_URBANA.includes(valore as StatoSegnalazioneUrbana);
}

function decimalToNumber(
  valore: Prisma.Decimal | number | null | undefined,
): number | null {
  if (valore === null || valore === undefined) {
    return null;
  }

  return Number(valore);
}

function selectAmministrazioneSegnalante() {
  return {
    amministrazione: {
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
      },
    },
  } as const;
}

function mappaSegnalazioneUrbanaDominio(
  segnalazione: SegnalazioneUrbanaConAutore,
): SegnalazioneUrbanaDominio {
  const latitudine = decimalToNumber(segnalazione.latitudine);
  const longitudine = decimalToNumber(segnalazione.longitudine);

  return {
    id: segnalazione.id,
    codice: segnalazione.codice,
    amministrazioneId: segnalazione.amministrazioneId,
    amministrazione: segnalazione.amministrazione,
    categoria:
      normalizzaCategoriaSegnalazioneUrbana(segnalazione.categoria) ?? "ALTRO",
    titolo: segnalazione.titolo,
    descrizione: segnalazione.descrizione,
    indirizzo: segnalazione.indirizzo,
    posizione:
      latitudine === null || longitudine === null
        ? null
        : {
            latitudine,
            longitudine,
          },
    stato: normalizzaStatoSegnalazioneUrbana(segnalazione.stato) ?? "APERTA",
    createdAt: segnalazione.createdAt,
    updatedAt: segnalazione.updatedAt,
  };
}

export function generaCodiceSegnalazioneUrbana(): string {
  const timestamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();

  return `SEG-PA-${timestamp}-${suffix}`;
}

export function normalizzaCategoriaSegnalazioneUrbana(
  valore: unknown,
): CategoriaSegnalazioneUrbana | null {
  if (typeof valore !== "string") {
    return null;
  }

  const categoria = valore.trim().toUpperCase();
  return isCategoriaSegnalazioneUrbana(categoria) ? categoria : null;
}

export function normalizzaStatoSegnalazioneUrbana(
  valore: unknown,
): StatoSegnalazioneUrbana | null {
  if (typeof valore !== "string") {
    return null;
  }

  const stato = valore.trim().toUpperCase();
  return isStatoSegnalazioneUrbana(stato) ? stato : null;
}

export function normalizzaTitoloSegnalazioneUrbana(valore: unknown): string {
  if (typeof valore !== "string") {
    return "";
  }

  return valore.replace(/\s+/g, " ").trim();
}

export function normalizzaDescrizioneSegnalazioneUrbana(
  valore: unknown,
): string {
  if (typeof valore !== "string") {
    return "";
  }

  return valore.replace(/\s+/g, " ").trim();
}

export function normalizzaIndirizzoSegnalazioneUrbana(valore: unknown): string {
  if (typeof valore !== "string") {
    return "";
  }

  return valore.replace(/\s+/g, " ").trim();
}

function normalizzaCoordinata(valore: unknown): number | null {
  if (typeof valore === "number" && Number.isFinite(valore)) {
    return valore;
  }

  if (typeof valore === "string" && valore.trim() !== "") {
    const numero = Number(valore);
    return Number.isFinite(numero) ? numero : null;
  }

  return null;
}

export function validaTitoloSegnalazioneUrbana(titolo: string): string | null {
  if (!titolo) {
    return "Inserisci un titolo chiaro della criticita urbana.";
  }

  if (titolo.length < LUNGHEZZA_MINIMA_TITOLO) {
    return "Il titolo deve avere almeno 5 caratteri utili.";
  }

  return null;
}

export function validaDescrizioneSegnalazioneUrbana(input: {
  categoria: CategoriaSegnalazioneUrbana;
  descrizione: string;
}): string | null {
  if (!input.descrizione) {
    return "Inserisci una descrizione valida della criticita urbana.";
  }

  const lunghezzaMinima =
    input.categoria === "ALTRO"
      ? LUNGHEZZA_MINIMA_DESCRIZIONE_ALTRO
      : LUNGHEZZA_MINIMA_DESCRIZIONE;

  if (input.descrizione.length < lunghezzaMinima) {
    return input.categoria === "ALTRO"
      ? "Per la categoria selezionata descrivi la criticita con almeno 15 caratteri utili."
      : "Descrivi la criticita con almeno 10 caratteri utili.";
  }

  return null;
}

export function validaPosizioneSegnalazioneUrbana(input: {
  latitudine: number | null;
  longitudine: number | null;
}): string | null {
  const haLatitudine = input.latitudine !== null;
  const haLongitudine = input.longitudine !== null;

  if (haLatitudine !== haLongitudine) {
    return "Se inserisci la posizione devi fornire sia latitudine sia longitudine.";
  }

  if (
    input.latitudine !== null &&
    (input.latitudine < -90 || input.latitudine > 90)
  ) {
    return "La latitudine indicata non e valida.";
  }

  if (
    input.longitudine !== null &&
    (input.longitudine < -180 || input.longitudine > 180)
  ) {
    return "La longitudine indicata non e valida.";
  }

  return null;
}

export function normalizzaInputSegnalazioneUrbana(
  body: unknown,
): InputSegnalazioneUrbana | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as {
    categoria?: unknown;
    titolo?: unknown;
    descrizione?: unknown;
    indirizzo?: unknown;
    latitudine?: unknown;
    longitudine?: unknown;
  };
  const categoria = normalizzaCategoriaSegnalazioneUrbana(candidate.categoria);

  if (!categoria) {
    return null;
  }

  return {
    categoria,
    titolo: normalizzaTitoloSegnalazioneUrbana(candidate.titolo),
    descrizione: normalizzaDescrizioneSegnalazioneUrbana(candidate.descrizione),
    indirizzo: normalizzaIndirizzoSegnalazioneUrbana(candidate.indirizzo),
    latitudine: normalizzaCoordinata(candidate.latitudine),
    longitudine: normalizzaCoordinata(candidate.longitudine),
  };
}

async function trovaSegnalazioneUrbanaDuplicata(input: {
  amministrazioneId: number;
  categoria: CategoriaSegnalazioneUrbana;
  titolo: string;
}): Promise<SegnalazioneUrbanaDominio | null> {
  const soglia = new Date(Date.now() - FINESTRA_DUPLICATI_ORE * 60 * 60 * 1000);

  const segnalazione = await prisma.segnalazioneUrbana.findFirst({
    where: {
      amministrazioneId: input.amministrazioneId,
      categoria: input.categoria,
      titolo: input.titolo,
      stato: {
        in: ["APERTA", "IN_VALUTAZIONE", "PIANIFICATA"],
      },
      createdAt: {
        gte: soglia,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: selectAmministrazioneSegnalante(),
  });

  return segnalazione ? mappaSegnalazioneUrbanaDominio(segnalazione) : null;
}

// La PA apre criticita urbane in modo tracciato e con coordinate opzionali,
// lasciando alla UI successiva il compito di mostrarle su mappa o elenco.
export async function creaSegnalazioneUrbana(input: {
  amministrazioneId: number;
  categoria: CategoriaSegnalazioneUrbana;
  titolo: string;
  descrizione: string;
  indirizzo: string;
  latitudine: number | null;
  longitudine: number | null;
}): Promise<SegnalazioneUrbanaDominio> {
  const titolo = normalizzaTitoloSegnalazioneUrbana(input.titolo);
  const descrizione = normalizzaDescrizioneSegnalazioneUrbana(input.descrizione);
  const indirizzo = normalizzaIndirizzoSegnalazioneUrbana(input.indirizzo);

  const erroreTitolo = validaTitoloSegnalazioneUrbana(titolo);

  if (erroreTitolo) {
    throw new Error(erroreTitolo);
  }

  const erroreDescrizione = validaDescrizioneSegnalazioneUrbana({
    categoria: input.categoria,
    descrizione,
  });

  if (erroreDescrizione) {
    throw new Error(erroreDescrizione);
  }

  const errorePosizione = validaPosizioneSegnalazioneUrbana({
    latitudine: input.latitudine,
    longitudine: input.longitudine,
  });

  if (errorePosizione) {
    throw new Error(errorePosizione);
  }

  const duplicata = await trovaSegnalazioneUrbanaDuplicata({
    amministrazioneId: input.amministrazioneId,
    categoria: input.categoria,
    titolo,
  });

  if (duplicata) {
    throw new Error(
      "Esiste gia una segnalazione urbana simile aperta di recente. Verifica prima l'elenco corrente.",
    );
  }

  const segnalazione = await prisma.segnalazioneUrbana.create({
    data: {
      codice: generaCodiceSegnalazioneUrbana(),
      amministrazioneId: input.amministrazioneId,
      categoria: input.categoria,
      titolo,
      descrizione,
      indirizzo: indirizzo || null,
      latitudine: input.latitudine,
      longitudine: input.longitudine,
      stato: "APERTA",
    },
    include: selectAmministrazioneSegnalante(),
  });

  return mappaSegnalazioneUrbanaDominio(segnalazione);
}

// Questa lista minima prepara la futura vista istituzionale senza introdurre
// ancora filtri complessi o workflow di lavorazione.
export async function recuperaSegnalazioniUrbaneRecenti(
  limite = 20,
): Promise<SegnalazioneUrbanaDominio[]> {
  const segnalazioni = await prisma.segnalazioneUrbana.findMany({
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
    take: limite,
    include: selectAmministrazioneSegnalante(),
  });

  return segnalazioni.map(mappaSegnalazioneUrbanaDominio);
}

// Questo micro-step completa AP.03 con una gestione minima ma reale dello
// stato: la PA puo far avanzare la criticita urbana senza introdurre ancora un
// workflow piu pesante con assegnazioni, note o storico dedicato.
export async function aggiornaStatoSegnalazioneUrbana(input: {
  segnalazioneId: number;
  nuovoStato: StatoSegnalazioneUrbana;
}): Promise<SegnalazioneUrbanaDominio> {
  const segnalazioneEsistente = await prisma.segnalazioneUrbana.findUnique({
    where: {
      id: input.segnalazioneId,
    },
    include: selectAmministrazioneSegnalante(),
  });

  if (!segnalazioneEsistente) {
    throw new Error("La segnalazione urbana selezionata non esiste.");
  }

  const statoCorrente =
    normalizzaStatoSegnalazioneUrbana(segnalazioneEsistente.stato) ?? "APERTA";

  if (statoCorrente === input.nuovoStato) {
    return mappaSegnalazioneUrbanaDominio(segnalazioneEsistente);
  }

  const segnalazioneAggiornata = await prisma.segnalazioneUrbana.update({
    where: {
      id: input.segnalazioneId,
    },
    data: {
      stato: input.nuovoStato,
    },
    include: selectAmministrazioneSegnalante(),
  });

  return mappaSegnalazioneUrbanaDominio(segnalazioneAggiornata);
}
