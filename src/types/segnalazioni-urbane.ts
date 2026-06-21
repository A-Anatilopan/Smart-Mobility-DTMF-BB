// Tipi condivisi del dominio segnalazioni urbane.
// Aprono AP.03 mantenendo separato il lessico territoriale da quello dei mezzi.

import type { Coordinate } from "@/types/mobilita";

export const CATEGORIE_SEGNALAZIONE_URBANA = [
  "ILLUMINAZIONE",
  "SEGNALETICA",
  "MANTO_STRADALE",
  "AREA_DI_SOSTA",
  "OSTACOLO_URBANO",
  "ALTRO",
] as const;

export type CategoriaSegnalazioneUrbana =
  (typeof CATEGORIE_SEGNALAZIONE_URBANA)[number];

export const STATI_SEGNALAZIONE_URBANA = [
  "APERTA",
  "IN_VALUTAZIONE",
  "PIANIFICATA",
  "RISOLTA",
] as const;

export type StatoSegnalazioneUrbana =
  (typeof STATI_SEGNALAZIONE_URBANA)[number];

export type AmministrazioneSegnalanteUrbana = {
  id: number;
  nome: string;
  cognome: string;
  email: string;
};

export type SegnalazioneUrbanaDominio = {
  id: number;
  codice: string;
  amministrazioneId: number;
  amministrazione: AmministrazioneSegnalanteUrbana;
  categoria: CategoriaSegnalazioneUrbana;
  titolo: string;
  descrizione: string;
  indirizzo: string | null;
  posizione: Coordinate | null;
  stato: StatoSegnalazioneUrbana;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type InputSegnalazioneUrbana = {
  categoria: CategoriaSegnalazioneUrbana;
  titolo: string;
  descrizione: string;
  indirizzo: string;
  latitudine: number | null;
  longitudine: number | null;
};
