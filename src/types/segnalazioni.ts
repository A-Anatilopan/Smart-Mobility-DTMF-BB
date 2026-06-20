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
  "RITIRO_PROGRAMMATO",
  "IN_MANUTENZIONE",
  "RISOLTA",
  "RIMESSA_IN_SERVIZIO_PROGRAMMATA",
  "RIMESSA_IN_SERVIZIO",
] as const;

export type StatoSegnalazioneMezzo =
  (typeof STATI_SEGNALAZIONE_MEZZO)[number];

export type OperatoreAssegnatoSegnalazioneMezzo = {
  id: number;
  nome: string;
  cognome: string;
  email: string;
};

export type SegnalazioneMezzoDominio = {
  id: number;
  codice: string;
  origine: OrigineSegnalazioneMezzo;
  utenteId: number;
  operatorePresaInCarico: OperatoreAssegnatoSegnalazioneMezzo | null;
  mezzoId: string;
  mezzoCodice: string;
  categoria: CategoriaSegnalazioneMezzo;
  descrizione: string;
  stato: StatoSegnalazioneMezzo;
  presaInCaricoAt: Date | string | null;
  risoltaAt: Date | string | null;
  riepilogoRisoluzione: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type RiepilogoSegnalazioniAperteMezzo = {
  mezzoId: string;
  totaleSegnalazioniAperte: number;
  totaleSegnalazioniInGestione: number;
  ultimaSegnalazioneAt: Date | string;
  ultimaCategoria: CategoriaSegnalazioneMezzo;
  ultimaOrigine: OrigineSegnalazioneMezzo;
  ultimoCodiceSegnalazione: string;
};

export type SegnalazioneMezzoAttivaOperatore = {
  id: number;
  codice: string;
  mezzoId: string;
  mezzoCodice: string;
  origine: OrigineSegnalazioneMezzo;
  categoria: CategoriaSegnalazioneMezzo;
  descrizione: string;
  stato: StatoSegnalazioneMezzo;
  createdAt: Date | string;
  updatedAt: Date | string;
  presaInCaricoAt: Date | string | null;
  operatorePresaInCarico: OperatoreAssegnatoSegnalazioneMezzo | null;
  riepilogoRisoluzione: string | null;
};

export type SegnalazioneMezzoChiusaOperatore = {
  id: number;
  codice: string;
  mezzoId: string;
  mezzoCodice: string;
  origine: OrigineSegnalazioneMezzo;
  categoria: CategoriaSegnalazioneMezzo;
  descrizione: string;
  stato: StatoSegnalazioneMezzo;
  createdAt: Date | string;
  updatedAt: Date | string;
  presaInCaricoAt: Date | string | null;
  risoltaAt: Date | string | null;
  operatorePresaInCarico: OperatoreAssegnatoSegnalazioneMezzo | null;
  riepilogoRisoluzione: string | null;
};

export type MezzoConRiepilogoSegnalazioniAperte = {
  mezzo: {
    id: string;
    codice: string;
    modello: string;
    tipo: string;
    stato: string;
    batteria: number;
    areaServizioNome: string;
  };
  riepilogo: RiepilogoSegnalazioniAperteMezzo;
};

export type MezzoConDettaglioSegnalazioniAperte = {
  mezzo: {
    id: string;
    codice: string;
    modello: string;
    tipo: string;
    stato: string;
    batteria: number;
    areaServizioNome: string;
  };
  riepilogo: RiepilogoSegnalazioniAperteMezzo;
  segnalazioniAttive: SegnalazioneMezzoAttivaOperatore[];
};

export type CronologiaSegnalazioneChiusaOperatore = {
  segnalazione: SegnalazioneMezzoChiusaOperatore;
  mezzo: {
    id: string;
    codice: string;
    modello: string;
    tipo: string;
    areaServizioNome: string;
  };
};

export type InputSegnalazioneMezzoUtente = {
  mezzoId: string;
  mezzoCodice: string;
  categoria: CategoriaSegnalazioneMezzo;
  descrizione: string;
};

// L'operatore invia gli stessi dati minimi dell'utente, ma l'origine viene
// risolta lato server per tenere distinta la tracciabilita operativa.
export type InputSegnalazioneMezzoOperatore = {
  mezzoId: string;
  mezzoCodice: string;
  categoria: CategoriaSegnalazioneMezzo;
  descrizione: string;
};
