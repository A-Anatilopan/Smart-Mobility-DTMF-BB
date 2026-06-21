import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// Questo seed ricostruisce un dataset demo coerente con le funzionalita gia
// sviluppate, cosi professori e colleghi possono avviare il progetto con dati
// immediatamente utili per login, mappa, noleggi, flotta, pagamenti e report.
const ACCOUNT_DEMO = [
  {
    nome: "Utente",
    cognome: "Prova",
    email: "utente@gmail.com",
    password: "Prova1234",
    dataNascita: "1998-04-12",
    codiceFiscale: "DMOUTN98D12A662A",
    numeroPatente: "BA9988776",
    categoriaPatente: "B",
    scadenzaPatente: "2029-06-30",
    ruolo: "Utente",
  },
  {
    nome: "Operatore",
    cognome: "Prova",
    email: "operatore@gmail.com",
    password: "Prova1234",
    dataNascita: "1993-09-21",
    codiceFiscale: "DMOOPR93P21A662B",
    numeroPatente: "BA4455667",
    categoriaPatente: "B",
    scadenzaPatente: "2030-05-31",
    ruolo: "Operatore",
  },
  {
    nome: "Pubblica",
    cognome: "Amministrazione",
    email: "pa@gmail.com",
    password: "Prova1234",
    dataNascita: "1987-02-03",
    codiceFiscale: "DMOPAM87B03A662C",
    numeroPatente: null,
    categoriaPatente: null,
    scadenzaPatente: null,
    ruolo: "Pubblica Amministrazione",
  },
  {
    nome: "Giulia",
    cognome: "Test",
    email: "utente.test@esmart.local",
    password: "Password123!",
    dataNascita: "1995-01-15",
    codiceFiscale: "TSTNTE95A15H501Z",
    numeroPatente: "UT1234567",
    categoriaPatente: "B",
    scadenzaPatente: "2028-11-30",
    ruolo: "Utente",
  },
  {
    nome: "Marco",
    cognome: "Servizio",
    email: "operatore.test@esmart.local",
    password: "Password123!",
    dataNascita: "1990-02-20",
    codiceFiscale: "TSTOPR90B20H501Y",
    numeroPatente: "OP7654321",
    categoriaPatente: "B",
    scadenzaPatente: "2029-12-31",
    ruolo: "Operatore",
  },
  {
    nome: "Laura",
    cognome: "Comune",
    email: "pa.test@esmart.local",
    password: "Password123!",
    dataNascita: "1988-03-10",
    codiceFiscale: "TSTPAM88C10H501X",
    numeroPatente: null,
    categoriaPatente: null,
    scadenzaPatente: null,
    ruolo: "Pubblica Amministrazione",
  },
  {
    nome: "Chiara",
    cognome: "Rossi",
    email: "chiara.rossi@gmail.com",
    password: "ChiaraRide2026!",
    dataNascita: "1997-07-18",
    codiceFiscale: "RSSCHR97L58A662D",
    numeroPatente: "BA2244668",
    categoriaPatente: "B",
    scadenzaPatente: "2028-08-31",
    ruolo: "Utente",
  },
  {
    nome: "Luca",
    cognome: "Bianchi",
    email: "luca.bianchi@gmail.com",
    password: "LucaMove2026!",
    dataNascita: "2000-01-09",
    codiceFiscale: "BNCLCU00A09A662E",
    numeroPatente: "AM5566778",
    categoriaPatente: "AM",
    scadenzaPatente: "2027-10-31",
    ruolo: "Utente",
  },
  {
    nome: "Martina",
    cognome: "Esposito",
    email: "martina.esposito@gmail.com",
    password: "MartinaUrban2026!",
    dataNascita: "1999-05-24",
    codiceFiscale: "SPSMTN99E64A662F",
    numeroPatente: null,
    categoriaPatente: null,
    scadenzaPatente: null,
    ruolo: "Utente",
  },
  {
    nome: "Davide",
    cognome: "Marino",
    email: "davide.marino@gmail.com",
    password: "DavideCity2026!",
    dataNascita: "1994-12-02",
    codiceFiscale: "MRNDVD94T02A662G",
    numeroPatente: "BA6677889",
    categoriaPatente: "B",
    scadenzaPatente: "2024-02-10",
    ruolo: "Utente",
  },
  {
    nome: "Maria",
    cognome: "Logistica",
    email: "maria.logistica@gmail.com",
    password: "MariaOps2026!",
    dataNascita: "1991-11-14",
    codiceFiscale: "LGSMRA91S54A662H",
    numeroPatente: "BA7788990",
    categoriaPatente: "B",
    scadenzaPatente: "2031-01-31",
    ruolo: "Operatore",
  },
  {
    nome: "Alessia",
    cognome: "Comune",
    email: "alessia.comune@gmail.com",
    password: "AlessiaPA2026!",
    dataNascita: "1986-06-27",
    codiceFiscale: "CMNLSS86H67A662I",
    numeroPatente: null,
    categoriaPatente: null,
    scadenzaPatente: null,
    ruolo: "Pubblica Amministrazione",
  },
];

const MEZZI_DEMO = [
  {
    id: "mezzo-001",
    codice: "EB-1001",
    tipo: "E-Bike",
    modello: "Urban Glide One",
    stato: "DISPONIBILE",
    batteria: 92,
    latitudine: 41.12198,
    longitudine: 16.87305,
    posti: 1,
    patenteRichiesta: "Nessuna",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-002",
    codice: "ES-2044",
    tipo: "E-Scooter",
    modello: "Volt Street X",
    stato: "DISPONIBILE",
    batteria: 67,
    latitudine: 41.12182,
    longitudine: 16.87322,
    posti: 1,
    patenteRichiesta: "AM",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-003",
    codice: "EC-3007",
    tipo: "E-Car",
    modello: "City Move Mini",
    stato: "DISPONIBILE",
    batteria: 54,
    latitudine: 41.12194,
    longitudine: 16.87316,
    posti: 4,
    patenteRichiesta: "B",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-004",
    codice: "ES-2051",
    tipo: "E-Scooter",
    modello: "Volt Street X",
    stato: "DISPONIBILE",
    batteria: 43,
    latitudine: 41.1187,
    longitudine: 16.8709,
    posti: 1,
    patenteRichiesta: "AM",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-005",
    codice: "EB-1026",
    tipo: "E-Bike",
    modello: "Urban Glide Plus",
    stato: "DISPONIBILE",
    batteria: 81,
    latitudine: 41.1169,
    longitudine: 16.8759,
    posti: 1,
    patenteRichiesta: "Nessuna",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-006",
    codice: "EC-3014",
    tipo: "E-Car",
    modello: "Eco Drive Compact",
    stato: "DISPONIBILE",
    batteria: 74,
    latitudine: 41.1089,
    longitudine: 16.8786,
    posti: 2,
    patenteRichiesta: "B",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-007",
    codice: "EB-1034",
    tipo: "E-Bike",
    modello: "Urban Glide Lite",
    stato: "DISPONIBILE",
    batteria: 88,
    latitudine: 41.1256,
    longitudine: 16.8708,
    posti: 1,
    patenteRichiesta: "Nessuna",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-008",
    codice: "ES-2062",
    tipo: "E-Scooter",
    modello: "Volt Street Pro",
    stato: "DISPONIBILE",
    batteria: 58,
    latitudine: 41.1234,
    longitudine: 16.8677,
    posti: 1,
    patenteRichiesta: "AM",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-009",
    codice: "EC-3021",
    tipo: "E-Car",
    modello: "City Move Mini",
    stato: "PRENOTATO",
    batteria: 63,
    latitudine: 41.1124,
    longitudine: 16.8661,
    posti: 4,
    patenteRichiesta: "B",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-010",
    codice: "EB-1047",
    tipo: "E-Bike",
    modello: "Urban Glide Tour",
    stato: "DISPONIBILE",
    batteria: 77,
    latitudine: 41.1049,
    longitudine: 16.8711,
    posti: 1,
    patenteRichiesta: "Nessuna",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-012",
    codice: "EC-3030",
    tipo: "E-Car",
    modello: "Eco Drive Compact",
    stato: "IN_USO",
    batteria: 46,
    latitudine: 41.1191,
    longitudine: 16.8844,
    posti: 2,
    patenteRichiesta: "B",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-013",
    codice: "EB-1058",
    tipo: "E-Bike",
    modello: "Urban Glide Plus",
    stato: "IN_MANUTENZIONE",
    batteria: 19,
    latitudine: 41.1117,
    longitudine: 16.8578,
    posti: 1,
    patenteRichiesta: "Nessuna",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-014",
    codice: "ES-2084",
    tipo: "E-Scooter",
    modello: "Volt Street Pro",
    stato: "IN_PAUSA",
    batteria: 34,
    latitudine: 41.1086,
    longitudine: 16.8892,
    posti: 1,
    patenteRichiesta: "AM",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-015",
    codice: "EC-3042",
    tipo: "E-Car",
    modello: "Eco Drive Urban",
    stato: "NON_DISPONIBILE",
    batteria: 11,
    latitudine: 41.0988,
    longitudine: 16.8682,
    posti: 2,
    patenteRichiesta: "B",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-016",
    codice: "ES-2091",
    tipo: "E-Scooter",
    modello: "Volt Street Lite",
    stato: "DISPONIBILE",
    batteria: 71,
    latitudine: 41.12212,
    longitudine: 16.87336,
    posti: 1,
    patenteRichiesta: "AM",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  // Mezzi aggiuntivi vicino alla posizione utente standard della mappa:
  // servono a garantire almeno due opzioni vicine e ad arricchire le prove.
  {
    id: "mezzo-017",
    codice: "EB-1064",
    tipo: "E-Bike",
    modello: "Urban Glide City",
    stato: "DISPONIBILE",
    batteria: 84,
    latitudine: 41.12174,
    longitudine: 16.87288,
    posti: 1,
    patenteRichiesta: "Nessuna",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-018",
    codice: "ES-2103",
    tipo: "E-Scooter",
    modello: "Volt Street Neo",
    stato: "DISPONIBILE",
    batteria: 73,
    latitudine: 41.12208,
    longitudine: 16.87294,
    posti: 1,
    patenteRichiesta: "AM",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-019",
    codice: "EC-3054",
    tipo: "E-Car",
    modello: "City Move Urban",
    stato: "DISPONIBILE",
    batteria: 69,
    latitudine: 41.12166,
    longitudine: 16.87358,
    posti: 4,
    patenteRichiesta: "B",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  // Mezzi aggiuntivi vicino alla posizione operatore standard della mappa.
  {
    id: "mezzo-020",
    codice: "EB-1071",
    tipo: "E-Bike",
    modello: "Urban Glide Flex",
    stato: "DISPONIBILE",
    batteria: 79,
    latitudine: 41.11655,
    longitudine: 16.86654,
    posti: 1,
    patenteRichiesta: "Nessuna",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-021",
    codice: "ES-2110",
    tipo: "E-Scooter",
    modello: "Volt Street Compact",
    stato: "DISPONIBILE",
    batteria: 62,
    latitudine: 41.11621,
    longitudine: 16.86698,
    posti: 1,
    patenteRichiesta: "AM",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-022",
    codice: "EC-3061",
    tipo: "E-Car",
    modello: "Eco Drive Urban",
    stato: "DISPONIBILE",
    batteria: 57,
    latitudine: 41.11688,
    longitudine: 16.86724,
    posti: 2,
    patenteRichiesta: "B",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  // Mezzi aggiuntivi distribuiti tra stazione, campus e lungomare:
  // allargano la prova del servizio e mantengono ogni account con almeno due
  // mezzi nel raggio richiesto di 9 km sulle posizioni realistiche usate oggi.
  {
    id: "mezzo-023",
    codice: "EB-1082",
    tipo: "E-Bike",
    modello: "Urban Glide Plus",
    stato: "DISPONIBILE",
    batteria: 91,
    latitudine: 41.11734,
    longitudine: 16.87042,
    posti: 1,
    patenteRichiesta: "Nessuna",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-024",
    codice: "ES-2125",
    tipo: "E-Scooter",
    modello: "Volt Street Air",
    stato: "DISPONIBILE",
    batteria: 76,
    latitudine: 41.10912,
    longitudine: 16.87844,
    posti: 1,
    patenteRichiesta: "AM",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
  {
    id: "mezzo-025",
    codice: "EC-3073",
    tipo: "E-Car",
    modello: "City Move Mini",
    stato: "DISPONIBILE",
    batteria: 66,
    latitudine: 41.12498,
    longitudine: 16.87234,
    posti: 4,
    patenteRichiesta: "B",
    areaServizioId: "area-bari-urbana",
    areaServizioNome: "Area urbana di Bari",
  },
];

function giorniFa(giorni, ore = 9, minuti = 0) {
  const data = new Date();
  data.setHours(ore, minuti, 0, 0);
  data.setDate(data.getDate() - giorni);
  return data;
}

function minutiDa(data, minuti) {
  return new Date(data.getTime() + minuti * 60 * 1000);
}

function secondiDa(data, secondi) {
  return new Date(data.getTime() + secondi * 1000);
}

async function creaHashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function costruisciMappaHashPassword() {
  const passwordUniche = [...new Set(ACCOUNT_DEMO.map((account) => account.password))];
  const entries = await Promise.all(
    passwordUniche.map(async (password) => [password, await creaHashPassword(password)]),
  );

  return new Map(entries);
}

function creaDatiUtente(account, passwordHash) {
  return {
    nome: account.nome,
    cognome: account.cognome,
    email: account.email.toLowerCase(),
    passwordHash,
    dataNascita: new Date(account.dataNascita),
    codiceFiscale: account.codiceFiscale.toUpperCase(),
    numeroPatente: account.numeroPatente,
    categoriaPatente: account.categoriaPatente,
    scadenzaPatente: account.scadenzaPatente
      ? new Date(account.scadenzaPatente)
      : null,
    ruolo: account.ruolo,
    stato: "ATTIVO",
    codiceAttivazione: null,
    tentativiFalliti: 0,
    bloccatoFinoA: null,
  };
}

function creaCorsaTerminata({
  codice,
  utenteId,
  mezzoId,
  iniziataAt,
  durataUtilizzoMin,
  durataPausaMin,
  latitudineInizio,
  longitudineInizio,
  latitudineFine,
  longitudineFine,
  costoSbloccoCent,
  costoUtilizzoCent,
  costoPausaCent,
  mezzoPagamento,
}) {
  const ultimaRipresaAt = minutiDa(
    iniziataAt,
    Math.max(durataUtilizzoMin - 6, 0),
  );
  const terminataAt = minutiDa(
    iniziataAt,
    durataUtilizzoMin + durataPausaMin,
  );

  return {
    codice,
    utenteId,
    mezzoId,
    stato: "TERMINATA",
    iniziataAt,
    ultimaRipresaAt,
    pausaIniziataAt: durataPausaMin > 0 ? minutiDa(iniziataAt, durataUtilizzoMin) : null,
    terminataAt,
    latitudineInizio,
    longitudineInizio,
    latitudineFine,
    longitudineFine,
    durataUtilizzoMs: durataUtilizzoMin * 60 * 1000,
    durataPausaMs: durataPausaMin * 60 * 1000,
    costoSbloccoCent,
    costoUtilizzoCent,
    costoPausaCent,
    costoTotaleCent: costoSbloccoCent + costoUtilizzoCent + costoPausaCent,
    metodoPagamentoCircuito: mezzoPagamento.circuito,
    metodoPagamentoUltime4: mezzoPagamento.ultime4,
    metodoPagamentoAlias: mezzoPagamento.alias,
    pagamentoStato: "ADDEBITATO",
    pagamentoAutorizzatoAt: secondiDa(terminataAt, -20),
    pagamentoAddebitatoAt: secondiDa(terminataAt, -5),
    codiceAddebitoMock: `PAY-${codice}`,
    modalitaTerminazione: "UTENTE",
    notaTerminazioneOperatore: null,
  };
}

async function main() {
  const hashPassword = await costruisciMappaHashPassword();

  await prisma.$transaction(async (tx) => {
    // Pulizia in ordine inverso rispetto alle dipendenze per ottenere un seed
    // ri-eseguibile senza errori di chiave esterna.
    await tx.sessione.deleteMany();
    await tx.gestioneMezzoScarico.deleteMany();
    await tx.sessioneOperativaMezzo.deleteMany();
    await tx.segnalazioneMezzo.deleteMany();
    await tx.segnalazioneUrbana.deleteMany();
    await tx.corsa.deleteMany();
    await tx.prenotazione.deleteMany();
    await tx.metodoPagamento.deleteMany();
    await tx.mezzo.deleteMany();
    await tx.utente.deleteMany();

    await tx.utente.createMany({
      data: ACCOUNT_DEMO.map((account) =>
        creaDatiUtente(account, hashPassword.get(account.password)),
      ),
    });

    const utenti = await tx.utente.findMany({
      select: {
        id: true,
        email: true,
      },
    });
    const utenteIdPerEmail = new Map(
      utenti.map((utente) => [utente.email.toLowerCase(), utente.id]),
    );

    await tx.mezzo.createMany({
      data: MEZZI_DEMO,
    });

    await tx.metodoPagamento.createMany({
      data: [
        {
          utenteId: utenteIdPerEmail.get("utente@gmail.com"),
          tipo: "CARTA",
          circuito: "VISA",
          intestatario: "Utente Prova",
          ultime4: "4242",
          scadenzaMese: 12,
          scadenzaAnno: 2029,
          alias: "Visa personale",
          tokenMock: "tok_demo_utente_4242",
          stato: "ATTIVO",
          predefinito: true,
        },
        {
          utenteId: utenteIdPerEmail.get("chiara.rossi@gmail.com"),
          tipo: "CARTA",
          circuito: "MASTERCARD",
          intestatario: "Chiara Rossi",
          ultime4: "5454",
          scadenzaMese: 7,
          scadenzaAnno: 2028,
          alias: "Mastercard lavoro",
          tokenMock: "tok_demo_chiara_5454",
          stato: "ATTIVO",
          predefinito: true,
        },
        {
          utenteId: utenteIdPerEmail.get("luca.bianchi@gmail.com"),
          tipo: "CARTA",
          circuito: "VISA",
          intestatario: "Luca Bianchi",
          ultime4: "1111",
          scadenzaMese: 3,
          scadenzaAnno: 2028,
          alias: "Visa quotidiana",
          tokenMock: "tok_demo_luca_1111",
          stato: "ATTIVO",
          predefinito: true,
        },
      ],
    });

    await tx.prenotazione.create({
      data: {
        codice: "PRE-DEMO-ATTIVA-001",
        utenteId: utenteIdPerEmail.get("martina.esposito@gmail.com"),
        mezzoId: "mezzo-009",
        stato: "ATTIVA",
        prenotataAt: new Date(),
        scadeAt: minutiDa(new Date(), 15),
      },
    });

    const prenotazioneConvertitaPausa = await tx.prenotazione.create({
      data: {
        codice: "PRE-DEMO-CONV-001",
        utenteId: utenteIdPerEmail.get("chiara.rossi@gmail.com"),
        mezzoId: "mezzo-014",
        stato: "CONVERTITA_IN_CORSA",
        prenotataAt: minutiDa(new Date(), -35),
        scadeAt: minutiDa(new Date(), -20),
        convertitaInCorsaAt: minutiDa(new Date(), -21),
      },
      select: { id: true },
    });

    const prenotazioneConvertitaUso = await tx.prenotazione.create({
      data: {
        codice: "PRE-DEMO-CONV-002",
        utenteId: utenteIdPerEmail.get("luca.bianchi@gmail.com"),
        mezzoId: "mezzo-012",
        stato: "CONVERTITA_IN_CORSA",
        prenotataAt: minutiDa(new Date(), -22),
        scadeAt: minutiDa(new Date(), -7),
        convertitaInCorsaAt: minutiDa(new Date(), -8),
      },
      select: { id: true },
    });

    await tx.prenotazione.createMany({
      data: [
        {
          codice: "PRE-DEMO-SCADUTA-001",
          utenteId: utenteIdPerEmail.get("davide.marino@gmail.com"),
          mezzoId: "mezzo-004",
          stato: "SCADUTA",
          prenotataAt: minutiDa(new Date(), -120),
          scadeAt: minutiDa(new Date(), -105),
        },
        {
          codice: "PRE-DEMO-ANNULLATA-001",
          utenteId: utenteIdPerEmail.get("utente@gmail.com"),
          mezzoId: "mezzo-007",
          stato: "ANNULLATA",
          prenotataAt: minutiDa(new Date(), -180),
          scadeAt: minutiDa(new Date(), -165),
          annullataAt: minutiDa(new Date(), -175),
        },
      ],
    });

    await tx.corsa.createMany({
      data: [
        creaCorsaTerminata({
          codice: "COR-DEMO-001",
          utenteId: utenteIdPerEmail.get("utente@gmail.com"),
          mezzoId: "mezzo-001",
          iniziataAt: giorniFa(1, 10, 10),
          durataUtilizzoMin: 24,
          durataPausaMin: 3,
          latitudineInizio: 41.12198,
          longitudineInizio: 16.87305,
          latitudineFine: 41.1168,
          longitudineFine: 16.8757,
          costoSbloccoCent: 100,
          costoUtilizzoCent: 480,
          costoPausaCent: 30,
          mezzoPagamento: {
            circuito: "VISA",
            ultime4: "4242",
            alias: "Visa personale",
          },
        }),
        creaCorsaTerminata({
          codice: "COR-DEMO-002",
          utenteId: utenteIdPerEmail.get("chiara.rossi@gmail.com"),
          mezzoId: "mezzo-003",
          iniziataAt: giorniFa(2, 8, 45),
          durataUtilizzoMin: 31,
          durataPausaMin: 5,
          latitudineInizio: 41.12194,
          longitudineInizio: 16.87316,
          latitudineFine: 41.1089,
          longitudineFine: 16.8786,
          costoSbloccoCent: 200,
          costoUtilizzoCent: 930,
          costoPausaCent: 50,
          mezzoPagamento: {
            circuito: "MASTERCARD",
            ultime4: "5454",
            alias: "Mastercard lavoro",
          },
        }),
        creaCorsaTerminata({
          codice: "COR-DEMO-003",
          utenteId: utenteIdPerEmail.get("luca.bianchi@gmail.com"),
          mezzoId: "mezzo-002",
          iniziataAt: giorniFa(3, 12, 5),
          durataUtilizzoMin: 17,
          durataPausaMin: 2,
          latitudineInizio: 41.12182,
          longitudineInizio: 16.87322,
          latitudineFine: 41.1234,
          longitudineFine: 16.8677,
          costoSbloccoCent: 100,
          costoUtilizzoCent: 340,
          costoPausaCent: 20,
          mezzoPagamento: {
            circuito: "VISA",
            ultime4: "1111",
            alias: "Visa quotidiana",
          },
        }),
        creaCorsaTerminata({
          codice: "COR-DEMO-004",
          utenteId: utenteIdPerEmail.get("martina.esposito@gmail.com"),
          mezzoId: "mezzo-005",
          iniziataAt: giorniFa(4, 16, 20),
          durataUtilizzoMin: 29,
          durataPausaMin: 0,
          latitudineInizio: 41.1169,
          longitudineInizio: 16.8759,
          latitudineFine: 41.1049,
          longitudineFine: 16.8711,
          costoSbloccoCent: 100,
          costoUtilizzoCent: 580,
          costoPausaCent: 0,
          mezzoPagamento: {
            circuito: "VISA",
            ultime4: "4242",
            alias: "Visa personale",
          },
        }),
        creaCorsaTerminata({
          codice: "COR-DEMO-005",
          utenteId: utenteIdPerEmail.get("utente.test@esmart.local"),
          mezzoId: "mezzo-006",
          iniziataAt: giorniFa(5, 9, 30),
          durataUtilizzoMin: 22,
          durataPausaMin: 6,
          latitudineInizio: 41.1089,
          longitudineInizio: 16.8786,
          latitudineFine: 41.1116,
          longitudineFine: 16.8579,
          costoSbloccoCent: 200,
          costoUtilizzoCent: 660,
          costoPausaCent: 60,
          mezzoPagamento: {
            circuito: "VISA",
            ultime4: "4242",
            alias: "Visa personale",
          },
        }),
        creaCorsaTerminata({
          codice: "COR-DEMO-006",
          utenteId: utenteIdPerEmail.get("davide.marino@gmail.com"),
          mezzoId: "mezzo-007",
          iniziataAt: giorniFa(6, 18, 15),
          durataUtilizzoMin: 14,
          durataPausaMin: 1,
          latitudineInizio: 41.1256,
          longitudineInizio: 16.8708,
          latitudineFine: 41.1217,
          longitudineFine: 16.8216,
          costoSbloccoCent: 100,
          costoUtilizzoCent: 280,
          costoPausaCent: 10,
          mezzoPagamento: {
            circuito: "MASTERCARD",
            ultime4: "5454",
            alias: "Mastercard lavoro",
          },
        }),
        creaCorsaTerminata({
          codice: "COR-DEMO-007",
          utenteId: utenteIdPerEmail.get("chiara.rossi@gmail.com"),
          mezzoId: "mezzo-008",
          iniziataAt: giorniFa(7, 13, 0),
          durataUtilizzoMin: 19,
          durataPausaMin: 3,
          latitudineInizio: 41.1234,
          longitudineInizio: 16.8677,
          latitudineFine: 41.1253,
          longitudineFine: 16.8712,
          costoSbloccoCent: 100,
          costoUtilizzoCent: 380,
          costoPausaCent: 30,
          mezzoPagamento: {
            circuito: "MASTERCARD",
            ultime4: "5454",
            alias: "Mastercard lavoro",
          },
        }),
        creaCorsaTerminata({
          codice: "COR-DEMO-008",
          utenteId: utenteIdPerEmail.get("luca.bianchi@gmail.com"),
          mezzoId: "mezzo-010",
          iniziataAt: giorniFa(8, 11, 25),
          durataUtilizzoMin: 26,
          durataPausaMin: 4,
          latitudineInizio: 41.1049,
          longitudineInizio: 16.8711,
          latitudineFine: 41.1087,
          longitudineFine: 16.8788,
          costoSbloccoCent: 100,
          costoUtilizzoCent: 520,
          costoPausaCent: 40,
          mezzoPagamento: {
            circuito: "VISA",
            ultime4: "1111",
            alias: "Visa quotidiana",
          },
        }),
        creaCorsaTerminata({
          codice: "COR-DEMO-009",
          utenteId: utenteIdPerEmail.get("martina.esposito@gmail.com"),
          mezzoId: "mezzo-016",
          iniziataAt: giorniFa(9, 17, 10),
          durataUtilizzoMin: 11,
          durataPausaMin: 0,
          latitudineInizio: 41.12212,
          longitudineInizio: 16.87336,
          latitudineFine: 41.1171,
          longitudineFine: 16.8701,
          costoSbloccoCent: 100,
          costoUtilizzoCent: 220,
          costoPausaCent: 0,
          mezzoPagamento: {
            circuito: "VISA",
            ultime4: "4242",
            alias: "Visa personale",
          },
        }),
        creaCorsaTerminata({
          codice: "COR-DEMO-010",
          utenteId: utenteIdPerEmail.get("utente@gmail.com"),
          mezzoId: "mezzo-004",
          iniziataAt: giorniFa(10, 14, 40),
          durataUtilizzoMin: 16,
          durataPausaMin: 2,
          latitudineInizio: 41.1187,
          longitudineInizio: 16.8709,
          latitudineFine: 41.1164,
          longitudineFine: 16.8668,
          costoSbloccoCent: 100,
          costoUtilizzoCent: 320,
          costoPausaCent: 20,
          mezzoPagamento: {
            circuito: "VISA",
            ultime4: "4242",
            alias: "Visa personale",
          },
        }),
      ],
    });

    await tx.corsa.create({
      data: {
        codice: "COR-DEMO-ATTIVA-001",
        utenteId: utenteIdPerEmail.get("luca.bianchi@gmail.com"),
        mezzoId: "mezzo-012",
        prenotazioneId: prenotazioneConvertitaUso.id,
        stato: "ATTIVA",
        iniziataAt: minutiDa(new Date(), -18),
        ultimaRipresaAt: minutiDa(new Date(), -4),
        pausaIniziataAt: null,
        latitudineInizio: 41.1191,
        longitudineInizio: 16.8844,
        durataUtilizzoMs: 14 * 60 * 1000,
        durataPausaMs: 3 * 60 * 1000,
        costoSbloccoCent: 200,
        costoUtilizzoCent: 420,
        costoPausaCent: 30,
        costoTotaleCent: 650,
      },
    });

    await tx.corsa.create({
      data: {
        codice: "COR-DEMO-PAUSA-001",
        utenteId: utenteIdPerEmail.get("chiara.rossi@gmail.com"),
        mezzoId: "mezzo-014",
        prenotazioneId: prenotazioneConvertitaPausa.id,
        stato: "IN_PAUSA",
        iniziataAt: minutiDa(new Date(), -32),
        ultimaRipresaAt: minutiDa(new Date(), -11),
        pausaIniziataAt: minutiDa(new Date(), -6),
        latitudineInizio: 41.1086,
        longitudineInizio: 16.8892,
        durataUtilizzoMs: 21 * 60 * 1000,
        durataPausaMs: 5 * 60 * 1000,
        costoSbloccoCent: 100,
        costoUtilizzoCent: 420,
        costoPausaCent: 50,
        costoTotaleCent: 570,
      },
    });

    await tx.segnalazioneMezzo.createMany({
      data: [
        {
          codice: "SEG-MEZZO-001",
          origine: "UTENTE",
          utenteId: utenteIdPerEmail.get("utente@gmail.com"),
          operatorePresaInCaricoId: utenteIdPerEmail.get("operatore@gmail.com"),
          mezzoId: "mezzo-013",
          mezzoCodice: "EB-1058",
          categoria: "PROBLEMA_FRENI",
          descrizione: "La frenata posteriore risponde in ritardo durante il tragitto.",
          stato: "IN_MANUTENZIONE",
          presaInCaricoAt: minutiDa(new Date(), -220),
          risoltaAt: null,
          riepilogoRisoluzione: null,
        },
        {
          codice: "SEG-MEZZO-002",
          origine: "OPERATORE",
          utenteId: utenteIdPerEmail.get("maria.logistica@gmail.com"),
          operatorePresaInCaricoId: utenteIdPerEmail.get("maria.logistica@gmail.com"),
          mezzoId: "mezzo-015",
          mezzoCodice: "EC-3042",
          categoria: "ALTRO",
          descrizione: "Batteria sotto soglia e mezzo portato fuori servizio per ritiro.",
          stato: "RITIRO_PROGRAMMATO",
          presaInCaricoAt: minutiDa(new Date(), -160),
          risoltaAt: null,
          riepilogoRisoluzione: null,
        },
        {
          codice: "SEG-MEZZO-003",
          origine: "UTENTE",
          utenteId: utenteIdPerEmail.get("chiara.rossi@gmail.com"),
          operatorePresaInCaricoId: utenteIdPerEmail.get("operatore@gmail.com"),
          mezzoId: "mezzo-004",
          mezzoCodice: "ES-2051",
          categoria: "DANNO_VISIBILE",
          descrizione: "Graffio laterale segnalato e poi verificato dal team operativo.",
          stato: "RISOLTA",
          presaInCaricoAt: giorniFa(2, 15, 0),
          risoltaAt: giorniFa(1, 12, 30),
          riepilogoRisoluzione: "Verifica completata, danno solo estetico e mezzo rimesso in servizio.",
        },
      ],
    });

    await tx.sessioneOperativaMezzo.createMany({
      data: [
        {
          codice: "SOM-DEMO-001",
          operatoreId: utenteIdPerEmail.get("operatore@gmail.com"),
          mezzoId: "mezzo-013",
          mezzoCodice: "EB-1058",
          statoMezzoOrigine: "IN_MANUTENZIONE",
          modalita: "REMOTA",
          stato: "ATTIVA",
          motivo: "VERIFICA_GUASTO",
          noteApertura: "Sessione aperta per controllare il mezzo dopo segnalazione freni.",
          noteChiusura: null,
          apertaAt: minutiDa(new Date(), -55),
          chiusaAt: null,
        },
        {
          codice: "SOM-DEMO-002",
          operatoreId: utenteIdPerEmail.get("maria.logistica@gmail.com"),
          mezzoId: "mezzo-002",
          mezzoCodice: "ES-2044",
          statoMezzoOrigine: "DISPONIBILE",
          modalita: "LOCALE",
          stato: "CHIUSA",
          motivo: "CONTROLLO_VISIVO",
          noteApertura: "Controllo rapido prima del rientro in area universitaria.",
          noteChiusura: "Nessuna anomalia rilevata, mezzo confermato disponibile.",
          apertaAt: giorniFa(1, 8, 30),
          chiusaAt: giorniFa(1, 8, 45),
        },
      ],
    });

    await tx.gestioneMezzoScarico.createMany({
      data: [
        {
          codice: "MSC-DEMO-001",
          operatoreId: utenteIdPerEmail.get("operatore@gmail.com"),
          mezzoId: "mezzo-015",
          stato: "RITIRO_PROGRAMMATO_MEZZO_SCARICO",
          batteriaRilevata: 11,
          noteOperative: "Ritiro programmato dal lungomare per batteria quasi esaurita.",
          ritiroProgrammatoAt: minutiDa(new Date(), -80),
          mezzoRitiratoAt: null,
          caricaIniziataAt: null,
          caricaCompletataAt: null,
          rimessaProgrammataAt: null,
          rimessaCompletataAt: null,
          chiusaAt: null,
        },
        {
          codice: "MSC-DEMO-002",
          operatoreId: utenteIdPerEmail.get("maria.logistica@gmail.com"),
          mezzoId: "mezzo-013",
          stato: "CARICA_COMPLETATA",
          batteriaRilevata: 19,
          noteOperative: "Mezzo ricaricato e pronto alla rimessa dopo controllo tecnico.",
          ritiroProgrammatoAt: giorniFa(3, 7, 45),
          mezzoRitiratoAt: giorniFa(3, 8, 20),
          caricaIniziataAt: giorniFa(3, 8, 40),
          caricaCompletataAt: giorniFa(3, 12, 15),
          rimessaProgrammataAt: giorniFa(2, 9, 0),
          rimessaCompletataAt: null,
          chiusaAt: null,
        },
      ],
    });

    await tx.segnalazioneUrbana.createMany({
      data: [
        {
          codice: "SEG-PA-DEMO-001",
          amministrazioneId: utenteIdPerEmail.get("pa@gmail.com"),
          categoria: "ILLUMINAZIONE",
          titolo: "Lampione guasto sul lungomare",
          descrizione: "Illuminazione intermittente vicino al percorso ciclopedonale del lungomare.",
          indirizzo: "Lungomare Nazario Sauro, Bari",
          latitudine: 41.1252,
          longitudine: 16.8726,
          stato: "APERTA",
        },
        {
          codice: "SEG-PA-DEMO-002",
          amministrazioneId: utenteIdPerEmail.get("pa@gmail.com"),
          categoria: "MANTO_STRADALE",
          titolo: "Asfalto dissestato in area campus",
          descrizione: "Presenza di buche e avvallamenti che rendono poco sicuro il transito dei mezzi leggeri.",
          indirizzo: "Via Orabona, Bari",
          latitudine: 41.1087,
          longitudine: 16.8788,
          stato: "IN_VALUTAZIONE",
        },
        {
          codice: "SEG-PA-DEMO-003",
          amministrazioneId: utenteIdPerEmail.get("alessia.comune@gmail.com"),
          categoria: "SEGNALETICA",
          titolo: "Segnaletica verticale poco visibile in stazione",
          descrizione: "Cartelli di accesso alla zona di sharing da riposizionare per migliorare la leggibilita.",
          indirizzo: "Piazza Aldo Moro, Bari",
          latitudine: 41.1171,
          longitudine: 16.8701,
          stato: "PIANIFICATA",
        },
        {
          codice: "SEG-PA-DEMO-004",
          amministrazioneId: utenteIdPerEmail.get("pa.test@esmart.local"),
          categoria: "AREA_DI_SOSTA",
          titolo: "Stalli da ridisegnare vicino a Parco 2 Giugno",
          descrizione: "Intervento gia completato con nuova segnaletica orizzontale dedicata ai mezzi condivisi.",
          indirizzo: "Parco 2 Giugno, Bari",
          latitudine: 41.1048,
          longitudine: 16.8711,
          stato: "RISOLTA",
        },
      ],
    });
  });

  console.log("");
  console.log("Seed demo completato con successo.");
  console.log("Password comuni facili da ricordare:");
  console.log("- Utente: utente@gmail.com / Prova1234");
  console.log("- Operatore: operatore@gmail.com / Prova1234");
  console.log("- Pubblica Amministrazione: pa@gmail.com / Prova1234");
  console.log("");
  console.log("Account storici mantenuti per compatibilita:");
  console.log("- utente.test@esmart.local / Password123!");
  console.log("- operatore.test@esmart.local / Password123!");
  console.log("- pa.test@esmart.local / Password123!");
  console.log("");
  console.log("Dataset incluso:");
  console.log(`- ${ACCOUNT_DEMO.length} account`);
  console.log(`- ${MEZZI_DEMO.length} mezzi`);
  console.log("- corse terminate, una corsa attiva, una corsa in pausa");
  console.log("- prenotazioni attive, scadute e annullate");
  console.log("- metodi di pagamento demo");
  console.log("- segnalazioni mezzo, workflow operativi e segnalazioni urbane");
}

main()
  .catch((error) => {
    console.error("Errore durante la ricostruzione del dataset demo.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
