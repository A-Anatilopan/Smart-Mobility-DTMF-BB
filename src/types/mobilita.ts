// Tipi base del modulo M-02: descrivono i dati minimi necessari
// per mostrare mezzi disponibili e aree di servizio nella UI.

// Tipi di mezzo previsti nel progetto E-Smart Mobility.
export type TipoMezzo = "E-Bike" | "E-Scooter" | "E-Car";

// Stati minimi utili per distinguere i mezzi consultabili nella mappa o nell'elenco.
export type StatoMezzo =
  | "DISPONIBILE"
  | "PRENOTATO"
  | "IN_USO"
  | "IN_PAUSA"
  | "IN_MANUTENZIONE"
  | "NON_DISPONIBILE";

// Livelli patente iniziali: restano stringhe controllate per mantenere semplice il mock.
export type CategoriaPatenteRichiesta = "Nessuna" | "AM" | "A1" | "A2" | "A" | "B";

// Coordinate geografiche condivise tra mezzi e aree di servizio.
export type Coordinate = {
  latitudine: number;
  longitudine: number;
};

// Dati minimi di un mezzo da mostrare all'utente o all'operatore.
export type Mezzo = Coordinate & {
  id: string;
  codice: string;
  tipo: TipoMezzo;
  modello: string;
  stato: StatoMezzo;
  batteria: number;
  posti: number;
  patenteRichiesta: CategoriaPatenteRichiesta;
  areaServizioId: string;
  areaServizioNome: string;
};

// Punto di un poligono semplice usato per descrivere l'area coperta dal servizio.
export type PuntoAreaServizio = Coordinate;

// Dati minimi di una zona coperta dal servizio.
export type AreaServizio = {
  id: string;
  nome: string;
  colore: string;
  punti: PuntoAreaServizio[];
};

// Classificazione minima delle strade per disegnare una mappa urbana mock
// con gerarchie visive diverse tra assi principali e strade secondarie.
export type TipoStrada = "principale" | "secondaria" | "locale";

// Tratto stradale cartografico usato solo per la rappresentazione della mappa.
export type StradaMappa = {
  id: string;
  nome: string;
  tipo: TipoStrada;
  punti: Coordinate[];
  etichettaPosizione: Coordinate;
};

// Punto di interesse visibile sulla mappa con etichetta pubblica.
export type PuntoInteresseMappa = Coordinate & {
  id: string;
  nome: string;
  categoria: "campus" | "parcheggio" | "piazza" | "stazione" | "parco" | "ospedale";
};

// Posizione mock dell'utente o dell'osservatore da mostrare in mappa.
export type PosizioneUtenteMappa = Coordinate & {
  etichetta: string;
};
