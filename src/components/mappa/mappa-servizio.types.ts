import type { AreaServizio, Mezzo, PosizioneUtenteMappa } from "@/types/mobilita";

// Modalita condivisa tra wrapper e mappa client per mantenere coerenti
// testi, indicatori e varianti delle viste utente, operatore e PA.
export type ModalitaMappa = "utente" | "operatore" | "amministrazione";

// Props condivise della mappa di servizio reale basata su cartografia esterna.
export type MappaServizioProps = {
  aree: AreaServizio[];
  mezzi: Mezzo[];
  modalita: ModalitaMappa;
  posizioneUtente?: PosizioneUtenteMappa | null;
};
