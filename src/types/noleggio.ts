import type { Coordinate } from "@/types/mobilita";

// Stati minimi della prenotazione: bastano per aprire UC-05 senza introdurre
// ancora tutte le varianti avanzate del dominio noleggio.
export type StatoPrenotazione =
  | "ATTIVA"
  | "SCADUTA"
  | "ANNULLATA"
  | "CONVERTITA_IN_CORSA";

// Stati minimi della corsa per supportare avvio, pausa, termine e monitoraggio.
export type StatoCorsa = "ATTIVA" | "IN_PAUSA" | "TERMINATA";

// Dettaglio costi minimale in centesimi per evitare problemi di floating point.
export type DettaglioCostoCorsa = {
  costoSbloccoCent: number;
  costoUtilizzoCent: number;
  costoPausaCent: number;
  costoTotaleCent: number;
};

// Contratto iniziale della prenotazione: tiene insieme utente, mezzo scelto e
// finestra temporale di validita prima dell'avvio della corsa.
export type PrenotazioneNoleggio = {
  id: number;
  codice: string;
  utenteId: number;
  mezzoId: string;
  stato: StatoPrenotazione;
  prenotataAt: Date | string;
  scadeAt: Date | string;
  annullataAt: Date | string | null;
  convertitaInCorsaAt: Date | string | null;
};

// Contratto iniziale della corsa: per ora contiene solo i dati minimi utili a
// supportare i futuri flussi di avvio, pausa, termine e costo finale.
export type CorsaNoleggio = {
  id: number;
  codice: string;
  utenteId: number;
  terminataDaOperatoreId: number | null;
  mezzoId: string;
  prenotazioneId: number | null;
  stato: StatoCorsa;
  iniziataAt: Date | string;
  ultimaRipresaAt: Date | string;
  pausaIniziataAt: Date | string | null;
  terminataAt: Date | string | null;
  durataUtilizzoMs: number;
  durataPausaMs: number;
  posizioneInizio: Coordinate | null;
  posizioneFine: Coordinate | null;
  costi: DettaglioCostoCorsa;
  modalitaTerminazione: string | null;
  notaTerminazioneOperatore: string | null;
};

// Stati sintetici pensati per la lettura rapida lato operatore durante il
// monitoraggio del noleggio di un utente specifico.
export type StatoMonitoraggioNoleggio =
  | "NESSUN_NOLEGGIO_ATTIVO"
  | "PRENOTAZIONE_ATTIVA"
  | "CORSA_ATTIVA"
  | "CORSA_IN_PAUSA";

// Contratto iniziale per UC-25: l'operatore riceve il profilo essenziale
// dell'utente e, se presente, il noleggio ancora in corso.
export type MonitoraggioNoleggioUtente = {
  utente: {
    id: number;
    nome: string;
    cognome: string;
    email: string;
    ruolo: string;
    stato: string;
  };
  statoMonitoraggio: StatoMonitoraggioNoleggio;
  prenotazione: PrenotazioneNoleggio | null;
  corsa: CorsaNoleggio | null;
};

// Elenco sintetico usato dall'operatore per vedere in un colpo d'occhio i
// noleggi ancora aperti, senza partire ogni volta da una ricerca manuale.
export type RiepilogoMonitoraggioOperatore = {
  utente: {
    id: number;
    nome: string;
    cognome: string;
    email: string;
  };
  statoMonitoraggio: StatoMonitoraggioNoleggio;
  prenotazione: PrenotazioneNoleggio | null;
  corsa: CorsaNoleggio | null;
};

// Riepilogo sintetico per l'operatore: serve a leggere rapidamente dove un
// mezzo e stato lasciato a fine corsa e da quale utente proveniva il noleggio.
export type RiconsegnaMezzoOperatore = {
  utente: {
    id: number;
    nome: string;
    cognome: string;
    email: string;
  };
  corsa: CorsaNoleggio;
};
