import { prisma } from "@/lib/prisma";
import { sincronizzaPrenotazioniScadute } from "@/lib/noleggio";
import type { Mezzo } from "@/types/mobilita";

// Alcuni stati dei mock rappresentano vincoli tecnici o mezzi fuori servizio
// e non devono essere sovrascritti da un semplice overlay di prenotazioni/corse.
const STATI_BLOCCANTI: Mezzo["stato"][] = [
  "IN_MANUTENZIONE",
  "NON_DISPONIBILE",
];

// Gli stati legati al noleggio devono riflettere solo la situazione reale del
// database. Se il mock parte con uno di questi valori ma nel DB non esiste piu
// nessuna prenotazione/corsa associata, il mezzo va riportato a disponibile.
const STATI_DINAMICI_NOLEGGIO: Mezzo["stato"][] = [
  "PRENOTATO",
  "IN_USO",
  "IN_PAUSA",
];

// Sovrappone ai mezzi del dataset mock lo stato reale letto dal database:
// serve a mostrare su mappe e liste operative i mezzi davvero prenotati,
// in uso o in pausa, senza perdere il resto dei metadati del mock.
export async function risolviMezziConStatoDinamico(
  mezziBase: Mezzo[],
): Promise<Mezzo[]> {
  const mezzoIds = mezziBase.map((mezzo) => mezzo.id);

  if (mezzoIds.length === 0) {
    return [];
  }

  await sincronizzaPrenotazioniScadute({ mezzoIds });

  const [prenotazioniAttive, corseAttive, corseTerminateConPosizione] =
    await Promise.all([
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
  const ultimePosizioniFineCorsa = new Map<
    string,
    { latitudine: number; longitudine: number }
  >();

  // Manteniamo per ogni mezzo solo l'ultima posizione finale disponibile:
  // serve per far leggere in flotta dove il mezzo e stato lasciato a fine corsa.
  for (const corsa of corseTerminateConPosizione) {
    if (ultimePosizioniFineCorsa.has(corsa.mezzoId)) {
      continue;
    }

    ultimePosizioniFineCorsa.set(corsa.mezzoId, {
      latitudine: Number(corsa.latitudineFine),
      longitudine: Number(corsa.longitudineFine),
    });
  }

  return mezziBase.map((mezzo) => {
    const statoCorsa = mezziInCorsa.get(mezzo.id);
    const mezzoPrenotato = mezziPrenotati.has(mezzo.id);
    const mezzoConAttivitaAperta = Boolean(statoCorsa) || mezzoPrenotato;
    const ultimaPosizioneFineCorsa = ultimePosizioniFineCorsa.get(mezzo.id);
    let mezzoRisolto = mezzo;

    if (!STATI_BLOCCANTI.includes(mezzo.stato)) {
      if (statoCorsa) {
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
