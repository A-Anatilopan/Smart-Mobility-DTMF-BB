// Tipi condivisi del dominio segnalazioni mezzo.
// Aprono UT.09 e restano riusabili anche per OP.03, OP.04 e OP.11.

export const ORIGINI_SEGNALAZIONE_MEZZO = ["UTENTE", "OPERATORE"] as const;

export type OrigineSegnalazioneMezzo =
  (typeof ORIGINI_SEGNALAZIONE_MEZZO)[number];

export const CATEGORIE_SEGNALAZIONE_MEZZO = [
  "DANNO_VISIBILE",
  "BLOCCO_APERTURA",
  "BLOCCO_CHIUSURA",
  "PROBLEMA_FRENI",
  "ALTRO",
] as const;

export type CategoriaSegnalazioneMezzo =
  (typeof CATEGORIE_SEGNALAZIONE_MEZZO)[number];

export const STATI_SEGNALAZIONE_MEZZO = [
  "APERTA",
  "PRESA_IN_CARICO",
  "RISOLTA",
] as const;

export type StatoSegnalazioneMezzo =
  (typeof STATI_SEGNALAZIONE_MEZZO)[number];

export type SegnalazioneMezzoDominio = {
  id: number;
  codice: string;
  origine: OrigineSegnalazioneMezzo;
  utenteId: number;
  mezzoId: string;
  mezzoCodice: string;
  categoria: CategoriaSegnalazioneMezzo;
  descrizione: string;
  stato: StatoSegnalazioneMezzo;
  presaInCaricoAt: Date | string | null;
  risoltaAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type InputSegnalazioneMezzoUtente = {
  mezzoId: string;
  mezzoCodice: string;
  categoria: CategoriaSegnalazioneMezzo;
  descrizione: string;
};
