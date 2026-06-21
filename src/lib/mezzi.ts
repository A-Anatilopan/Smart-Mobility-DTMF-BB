import type { Mezzo as MezzoPrisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { catalogoMezziIniziale } from "@/lib/mezzi-catalogo";
import type { Mezzo } from "@/types/mobilita";

// Gli stati di noleggio vanno riallineati in base al database reale: se il
// mezzo nel catalogo nasceva con uno stato dinamico ma non ha piu attivita
// aperte, torna automaticamente a disponibile.
const STATI_DINAMICI_NOLEGGIO: Mezzo["stato"][] = [
  "PRENOTATO",
  "IN_USO",
  "IN_PAUSA",
];

// Alcuni stati delle segnalazioni rendono il mezzo non utilizzabile anche se
// non e ancora in manutenzione tecnica vera e propria.
const STATI_SEGNALAZIONE_NON_DISPONIBILE = [
  "PRESA_IN_CARICO",
  "RITIRO_PROGRAMMATO",
  "RISOLTA",
  "RIMESSA_IN_SERVIZIO_PROGRAMMATA",
];
const STATI_SEGNALAZIONE_MANUTENTIVA = ["IN_MANUTENZIONE"];

function mappaRecordMezzo(record: MezzoPrisma): Mezzo {
  return {
    id: record.id,
    codice: record.codice,
    tipo: record.tipo as Mezzo["tipo"],
    modello: record.modello,
    stato: record.stato as Mezzo["stato"],
    batteria: record.batteria,
    latitudine: Number(record.latitudine),
    longitudine: Number(record.longitudine),
    posti: record.posti,
    patenteRichiesta: record.patenteRichiesta as Mezzo["patenteRichiesta"],
    areaServizioId: record.areaServizioId,
    areaServizioNome: record.areaServizioNome,
  };
}

async function garantisciCatalogoMezziPersistito(): Promise<void> {
  const mezziPresenti = await prisma.mezzo.findMany({
    select: {
      id: true,
    },
  });

  const mezziPresentiIds = new Set(mezziPresenti.map((mezzo) => mezzo.id));
  const mezziMancanti = catalogoMezziIniziale.filter(
    (mezzo) => !mezziPresentiIds.has(mezzo.id),
  );

  if (mezziMancanti.length === 0) {
    return;
  }

  // Inseriamo solo i record assenti: il database diventa la fonte runtime,
  // mentre il catalogo iniziale resta come bootstrap stabile del progetto.
  await prisma.mezzo.createMany({
    data: mezziMancanti.map((mezzo) => ({
      id: mezzo.id,
      codice: mezzo.codice,
      tipo: mezzo.tipo,
      modello: mezzo.modello,
      stato: mezzo.stato,
      batteria: mezzo.batteria,
      latitudine: mezzo.latitudine,
      longitudine: mezzo.longitudine,
      posti: mezzo.posti,
      patenteRichiesta: mezzo.patenteRichiesta,
      areaServizioId: mezzo.areaServizioId,
      areaServizioNome: mezzo.areaServizioNome,
    })),
  });
}

async function sincronizzaPrenotazioniScadutePerMezzi(
  mezzoIds: string[],
): Promise<void> {
  if (mezzoIds.length === 0) {
    return;
  }

  const prenotazioniScadute = await prisma.prenotazione.findMany({
    where: {
      mezzoId: {
        in: mezzoIds,
      },
      stato: "ATTIVA",
      scadeAt: {
        lt: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  if (prenotazioniScadute.length === 0) {
    return;
  }

  await prisma.prenotazione.updateMany({
    where: {
      id: {
        in: prenotazioniScadute.map((prenotazione) => prenotazione.id),
      },
    },
    data: {
      stato: "SCADUTA",
    },
  });
}

export async function recuperaMezziBase(): Promise<Mezzo[]> {
  await garantisciCatalogoMezziPersistito();

  const records = await prisma.mezzo.findMany();
  const mezziPerId = new Map(records.map((record) => [record.id, mappaRecordMezzo(record)]));
  const mezziOrdinati = catalogoMezziIniziale
    .map((mezzoCatalogo) => mezziPerId.get(mezzoCatalogo.id) ?? null)
    .filter((mezzo): mezzo is Mezzo => mezzo !== null);

  const mezziExtra = Array.from(mezziPerId.values()).filter(
    (mezzo) =>
      !catalogoMezziIniziale.some(
        (mezzoCatalogo) => mezzoCatalogo.id === mezzo.id,
      ),
  );

  return [...mezziOrdinati, ...mezziExtra];
}

export async function recuperaMezziBasePerIds(mezzoIds: string[]): Promise<Mezzo[]> {
  if (mezzoIds.length === 0) {
    return [];
  }

  const catalogoCompleto = await recuperaMezziBase();
  const indiceRichiesto = new Set(mezzoIds);

  return catalogoCompleto.filter((mezzo) => indiceRichiesto.has(mezzo.id));
}

export async function trovaMezzoBasePerId(
  mezzoId: string,
): Promise<Mezzo | null> {
  const idNormalizzato = mezzoId.trim();

  if (!idNormalizzato) {
    return null;
  }

  const mezzi = await recuperaMezziBasePerIds([idNormalizzato]);
  return mezzi[0] ?? null;
}

export async function trovaMezzoPerId(mezzoId: string): Promise<Mezzo | null> {
  const mezzoBase = await trovaMezzoBasePerId(mezzoId);

  if (!mezzoBase) {
    return null;
  }

  const [mezzoRisolto] = await risolviMezziConStatoDinamico([mezzoBase]);
  return mezzoRisolto ?? null;
}

export async function aggiornaStatoMezzoPersistito(input: {
  mezzoId: string;
  stato: Mezzo["stato"];
  latitudine?: number;
  longitudine?: number;
}): Promise<void> {
  const data: {
    stato: Mezzo["stato"];
    latitudine?: number;
    longitudine?: number;
  } = {
    stato: input.stato,
  };

  if (
    typeof input.latitudine === "number" &&
    typeof input.longitudine === "number"
  ) {
    data.latitudine = input.latitudine;
    data.longitudine = input.longitudine;
  }

  await prisma.mezzo.update({
    where: {
      id: input.mezzoId,
    },
    data,
  });
}

export async function sincronizzaStatoMezzoPersistito(
  mezzoId: string,
): Promise<Mezzo | null> {
  const mezzoBase = await trovaMezzoBasePerId(mezzoId);

  if (!mezzoBase) {
    return null;
  }

  const [mezzoRisolto] = await risolviMezziConStatoDinamico([mezzoBase]);

  if (!mezzoRisolto) {
    return null;
  }

  const posizioneCambiata =
    mezzoBase.latitudine !== mezzoRisolto.latitudine ||
    mezzoBase.longitudine !== mezzoRisolto.longitudine;
  const statoCambiato = mezzoBase.stato !== mezzoRisolto.stato;

  if (statoCambiato || posizioneCambiata) {
    await prisma.mezzo.update({
      where: {
        id: mezzoRisolto.id,
      },
      data: {
        stato: mezzoRisolto.stato,
        latitudine: mezzoRisolto.latitudine,
        longitudine: mezzoRisolto.longitudine,
      },
    });
  }

  return mezzoRisolto;
}

export async function sincronizzaStatoMezziPersistiti(
  mezzoIds: string[],
): Promise<void> {
  const mezzoIdsUnici = [...new Set(mezzoIds.map((mezzoId) => mezzoId.trim()).filter(Boolean))];

  for (const mezzoId of mezzoIdsUnici) {
    await sincronizzaStatoMezzoPersistito(mezzoId);
  }
}

// Sovrappone ai mezzi persistiti lo stato reale letto dal database, cosi la
// UI continua a leggere prenotazioni, corse, segnalazioni e sessioni
// operative senza perdere i metadati base della flotta.
export async function risolviMezziConStatoDinamico(
  mezziBase?: Mezzo[],
): Promise<Mezzo[]> {
  const catalogoBase = mezziBase ?? (await recuperaMezziBase());
  const mezzoIds = catalogoBase.map((mezzo) => mezzo.id);

  if (mezzoIds.length === 0) {
    return [];
  }

  await sincronizzaPrenotazioniScadutePerMezzi(mezzoIds);

  const [
    prenotazioniAttive,
    corseAttive,
    corseTerminateConPosizione,
    segnalazioniConImpattoOperativo,
    sessioniOperativeAttive,
  ] = await Promise.all([
    prisma.prenotazione.findMany({
      where: {
        mezzoId: {
          in: mezzoIds,
        },
        stato: "ATTIVA",
      },
      select: {
        mezzoId: true,
      },
    }),
    prisma.corsa.findMany({
      where: {
        mezzoId: {
          in: mezzoIds,
        },
        stato: {
          in: ["ATTIVA", "IN_PAUSA"],
        },
      },
      select: {
        mezzoId: true,
        stato: true,
      },
    }),
    prisma.corsa.findMany({
      where: {
        mezzoId: {
          in: mezzoIds,
        },
        stato: "TERMINATA",
        latitudineFine: {
          not: null,
        },
        longitudineFine: {
          not: null,
        },
      },
      select: {
        mezzoId: true,
        latitudineFine: true,
        longitudineFine: true,
        terminataAt: true,
      },
      orderBy: {
        terminataAt: "desc",
      },
    }),
    prisma.segnalazioneMezzo.findMany({
      where: {
        mezzoId: {
          in: mezzoIds,
        },
        stato: {
          in: [
            ...STATI_SEGNALAZIONE_NON_DISPONIBILE,
            ...STATI_SEGNALAZIONE_MANUTENTIVA,
          ],
        },
      },
      select: {
        mezzoId: true,
        stato: true,
      },
    }),
    prisma.sessioneOperativaMezzo.findMany({
      where: {
        mezzoId: {
          in: mezzoIds,
        },
        stato: "ATTIVA",
      },
      select: {
        mezzoId: true,
      },
    }),
  ]);

  const mezziPrenotati = new Set(
    prenotazioniAttive.map((prenotazione) => prenotazione.mezzoId),
  );
  const mezziInCorsa = new Map<string, Mezzo["stato"]>(
    corseAttive.map((corsa) => [
      corsa.mezzoId,
      corsa.stato === "IN_PAUSA" ? "IN_PAUSA" : "IN_USO",
    ]),
  );
  const mezziInManutenzione = new Set<string>();
  const mezziNonDisponibiliPerSegnalazione = new Set<string>();
  const mezziConSessioneOperativaAttiva = new Set(
    sessioniOperativeAttive.map((sessione) => sessione.mezzoId),
  );

  for (const segnalazione of segnalazioniConImpattoOperativo) {
    if (STATI_SEGNALAZIONE_MANUTENTIVA.includes(segnalazione.stato)) {
      mezziInManutenzione.add(segnalazione.mezzoId);
      continue;
    }

    if (STATI_SEGNALAZIONE_NON_DISPONIBILE.includes(segnalazione.stato)) {
      mezziNonDisponibiliPerSegnalazione.add(segnalazione.mezzoId);
    }
  }

  const ultimePosizioniFineCorsa = new Map<
    string,
    { latitudine: number; longitudine: number }
  >();

  for (const corsa of corseTerminateConPosizione) {
    if (ultimePosizioniFineCorsa.has(corsa.mezzoId)) {
      continue;
    }

    ultimePosizioniFineCorsa.set(corsa.mezzoId, {
      latitudine: Number(corsa.latitudineFine),
      longitudine: Number(corsa.longitudineFine),
    });
  }

  return catalogoBase.map((mezzo) => {
    const mezzoInManutenzione = mezziInManutenzione.has(mezzo.id);
    const statoCorsa = mezziInCorsa.get(mezzo.id);
    const mezzoPrenotato = mezziPrenotati.has(mezzo.id);
    const mezzoConAttivitaAperta = Boolean(statoCorsa) || mezzoPrenotato;
    const ultimaPosizioneFineCorsa = ultimePosizioniFineCorsa.get(mezzo.id);
    let mezzoRisolto = mezzo;

    if (mezzoInManutenzione) {
      mezzoRisolto = {
        ...mezzoRisolto,
        stato: "IN_MANUTENZIONE",
      };
    } else if (mezziNonDisponibiliPerSegnalazione.has(mezzo.id)) {
      mezzoRisolto = {
        ...mezzoRisolto,
        stato: "NON_DISPONIBILE",
      };
    } else if (mezziConSessioneOperativaAttiva.has(mezzo.id)) {
      mezzoRisolto = {
        ...mezzoRisolto,
        stato: "NON_DISPONIBILE",
      };
    } else if (statoCorsa) {
      mezzoRisolto = {
        ...mezzoRisolto,
        stato: statoCorsa,
      };
    } else if (mezzoPrenotato) {
      mezzoRisolto = {
        ...mezzoRisolto,
        stato: "PRENOTATO",
      };
    } else if (STATI_DINAMICI_NOLEGGIO.includes(mezzo.stato)) {
      mezzoRisolto = {
        ...mezzoRisolto,
        stato: "DISPONIBILE",
      };
    }

    if (ultimaPosizioneFineCorsa && !mezzoConAttivitaAperta) {
      mezzoRisolto = {
        ...mezzoRisolto,
        latitudine: ultimaPosizioneFineCorsa.latitudine,
        longitudine: ultimaPosizioneFineCorsa.longitudine,
      };
    }

    return mezzoRisolto;
  });
}
