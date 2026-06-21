import type {
  AreaServizio,
  PosizioneUtenteMappa,
  PuntoInteresseMappa,
  StradaMappa,
} from "@/types/mobilita";

// Area di copertura unica del servizio: rappresenta il centro abitato di Bari
// senza includere i comuni limitrofi e viene usata come perimetro operativo.
export const areeServizioMock: AreaServizio[] = [
  {
    id: "area-bari-urbana",
    nome: "Area urbana di Bari",
    colore: "#0f766e",
    punti: [
      { latitudine: 41.1392, longitudine: 16.8232 },
      { latitudine: 41.1396, longitudine: 16.8608 },
      { latitudine: 41.1356, longitudine: 16.8868 },
      { latitudine: 41.1262, longitudine: 16.9102 },
      { latitudine: 41.1088, longitudine: 16.9185 },
      { latitudine: 41.0914, longitudine: 16.9021 },
      { latitudine: 41.0892, longitudine: 16.8588 },
      { latitudine: 41.1021, longitudine: 16.8295 },
      { latitudine: 41.1217, longitudine: 16.8216 },
    ],
  },
];

// La rete stradale e inventata, ma mantiene coordinate coerenti con il
// resto del dataset cosi da poter proiettare correttamente aree e mezzi.
export const stradeMappaMock: StradaMappa[] = [
  {
    id: "strada-001",
    nome: "Corso Zootropolis",
    tipo: "principale",
    punti: [
      { latitudine: 41.1238, longitudine: 16.8578 },
      { latitudine: 41.1205, longitudine: 16.8645 },
      { latitudine: 41.1171, longitudine: 16.8729 },
      { latitudine: 41.1118, longitudine: 16.8845 },
      { latitudine: 41.1067, longitudine: 16.8912 },
    ],
    etichettaPosizione: { latitudine: 41.1177, longitudine: 16.8721 },
  },
  {
    id: "strada-002",
    nome: "Viale della Mobilita",
    tipo: "principale",
    punti: [
      { latitudine: 41.1246, longitudine: 16.8728 },
      { latitudine: 41.1198, longitudine: 16.8717 },
      { latitudine: 41.1137, longitudine: 16.8708 },
      { latitudine: 41.1072, longitudine: 16.8697 },
      { latitudine: 41.0994, longitudine: 16.8683 },
    ],
    etichettaPosizione: { latitudine: 41.1134, longitudine: 16.8706 },
  },
  {
    id: "strada-003",
    nome: "Viale Stazione Nord",
    tipo: "secondaria",
    punti: [
      { latitudine: 41.1218, longitudine: 16.8564 },
      { latitudine: 41.1185, longitudine: 16.8608 },
      { latitudine: 41.1147, longitudine: 16.8656 },
      { latitudine: 41.1102, longitudine: 16.8712 },
    ],
    etichettaPosizione: { latitudine: 41.1161, longitudine: 16.8637 },
  },
  {
    id: "strada-004",
    nome: "Via del Campus",
    tipo: "secondaria",
    punti: [
      { latitudine: 41.1088, longitudine: 16.8764 },
      { latitudine: 41.1064, longitudine: 16.8816 },
      { latitudine: 41.1031, longitudine: 16.8864 },
      { latitudine: 41.0998, longitudine: 16.8901 },
    ],
    etichettaPosizione: { latitudine: 41.1046, longitudine: 16.8831 },
  },
  {
    id: "strada-005",
    nome: "Largo Aurora",
    tipo: "locale",
    punti: [
      { latitudine: 41.1163, longitudine: 16.8667 },
      { latitudine: 41.1149, longitudine: 16.8703 },
      { latitudine: 41.1138, longitudine: 16.8741 },
    ],
    etichettaPosizione: { latitudine: 41.1151, longitudine: 16.8698 },
  },
  {
    id: "strada-006",
    nome: "Via Parcheggio Est",
    tipo: "locale",
    punti: [
      { latitudine: 41.1129, longitudine: 16.8802 },
      { latitudine: 41.1113, longitudine: 16.8844 },
      { latitudine: 41.1097, longitudine: 16.8881 },
    ],
    etichettaPosizione: { latitudine: 41.1111, longitudine: 16.8841 },
  },
  {
    id: "strada-007",
    nome: "Anello del Parco",
    tipo: "locale",
    punti: [
      { latitudine: 41.1212, longitudine: 16.8688 },
      { latitudine: 41.1225, longitudine: 16.8731 },
      { latitudine: 41.1197, longitudine: 16.8761 },
      { latitudine: 41.1172, longitudine: 16.8723 },
      { latitudine: 41.1212, longitudine: 16.8688 },
    ],
    etichettaPosizione: { latitudine: 41.1201, longitudine: 16.8728 },
  },
];

// Punti di interesse reali di Bari usati per allineare la mappa a luoghi
// riconoscibili e coerenti con la cartografia reale caricata da OpenStreetMap.
export const puntiInteresseMappaMock: PuntoInteresseMappa[] = [
  {
    id: "poi-001",
    nome: "Campus Universitario",
    categoria: "campus",
    latitudine: 41.1087,
    longitudine: 16.8788,
  },
  {
    id: "poi-002",
    nome: "Stazione Centrale",
    categoria: "stazione",
    latitudine: 41.1171,
    longitudine: 16.8701,
  },
  {
    id: "poi-003",
    nome: "Parcheggio Rossani",
    categoria: "parcheggio",
    latitudine: 41.1168,
    longitudine: 16.8757,
  },
  {
    id: "poi-004",
    nome: "Centro Cittadino",
    categoria: "piazza",
    latitudine: 41.1253,
    longitudine: 16.8712,
  },
  {
    id: "poi-005",
    nome: "Parco 2 Giugno",
    categoria: "parco",
    latitudine: 41.1048,
    longitudine: 16.8711,
  },
  {
    id: "poi-006",
    nome: "Policlinico di Bari",
    categoria: "ospedale",
    latitudine: 41.1116,
    longitudine: 16.8579,
  },
];

// Posizione utente di esempio dentro il centro di Bari, utile per verificare
// il comportamento del marker personale sopra la cartografia reale.
export const posizioneUtenteMappaMock: PosizioneUtenteMappa = {
  etichetta: "Tu sei qui",
  latitudine: 41.1219,
  longitudine: 16.8731,
};

// Posizione operatore di esempio: serve a mostrare la vista sul territorio
// anche a chi lavora direttamente sul campo con i mezzi del servizio.
export const posizioneOperatoreMappaMock: PosizioneUtenteMappa = {
  etichetta: "Posizione operatore",
  latitudine: 41.1164,
  longitudine: 16.8668,
};
