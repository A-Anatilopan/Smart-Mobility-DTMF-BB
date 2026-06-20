import type { AreaServizio, Mezzo, PosizioneUtenteMappa } from "@/types/mobilita";
import type { NoleggioUtenteController } from "@/components/noleggio/useNoleggioUtente";

// Modalita condivisa tra wrapper e mappa client per mantenere coerenti
// testi, indicatori e varianti delle viste utente, operatore e PA.
export type ModalitaMappa = "utente" | "operatore" | "amministrazione";

// Punto dedicato alla lettura operativa delle ultime riconsegne: permette di
// mostrare in mappa dove un mezzo e stato lasciato al termine della corsa.
export type RiconsegnaRecenteMappa = {
  id: string;
  etichetta: string;
  descrizione: string;
  latitudine: number;
  longitudine: number;
};

export type SessioneOperativaMezzoCard = {
  id: number;
  codice: string;
  motivo: string;
  noteApertura: string | null;
  noteChiusura: string | null;
  apertaAt: string;
  operatore: {
    id: number;
    nome: string;
    cognome: string;
    email: string;
  };
};

// Props condivise della mappa di servizio reale basata su cartografia esterna.
export type MappaServizioProps = {
  aree: AreaServizio[];
  mezzi: Mezzo[];
  modalita: ModalitaMappa;
  posizioneUtente?: PosizioneUtenteMappa | null;
  noleggioUtente?: NoleggioUtenteController;
  onApriSegnalazioneMezzo?: (mezzo: Mezzo) => void;
  onApriSessioneOperativaMezzo?: (mezzo: Mezzo) => void;
  sessioniOperativeAttive?: Record<string, SessioneOperativaMezzoCard>;
  riconsegneRecenti?: RiconsegnaRecenteMappa[];
  mostraPuntiChiave?: boolean;
  mostraPuntiInteresse?: boolean;
};
