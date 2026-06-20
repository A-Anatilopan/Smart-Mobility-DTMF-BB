import { calcolaDistanzaMetri } from "@/lib/geolocalizzazione";
import type { Coordinate } from "@/types/mobilita";

export const DISTANZA_MASSIMA_SBLOCCO_LOCALE_OPERATORE_METRI = 500;

export const MESSAGGIO_MEZZO_TROPPO_LONTANO_PER_SBLOCCO =
  "Puoi sbloccare questo mezzo solo quando sei vicino alla sua posizione operativa.";

// Helper condiviso tra backend e UI: mantiene coerente la stessa regola di
// prossimita per lo sblocco locale operatore in tutti i punti del progetto.
export function operatoreVicinoAlMezzo(
  posizioneOperatore: Coordinate,
  posizioneMezzo: Coordinate,
): boolean {
  return (
    calcolaDistanzaMetri(posizioneOperatore, posizioneMezzo) <=
    DISTANZA_MASSIMA_SBLOCCO_LOCALE_OPERATORE_METRI
  );
}
