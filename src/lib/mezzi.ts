import { prisma } from "@/lib/prisma";
import { sincronizzaPrenotazioniScadute } from "@/lib/noleggio";
import type { Mezzo } from "@/types/mobilita";

// Alcuni stati dei mock rappresentano vincoli tecnici o mezzi fuori servizio
// e non devono essere sovrascritti da un semplice overlay di prenotazioni/corse.
const STATI_BLOCCANTI: Mezzo["stato"][] = [
  "IN_MANUTENZIONE",
  "NON_DISPONIBILE",
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

  const [prenotazioniAttive, corseAttive] = await Promise.all([
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

  return mezziBase.map((mezzo) => {
    if (STATI_BLOCCANTI.includes(mezzo.stato)) {
      return mezzo;
    }

    const statoCorsa = mezziInCorsa.get(mezzo.id);

    if (statoCorsa) {
      return {
        ...mezzo,
        stato: statoCorsa,
      };
    }

    if (mezziPrenotati.has(mezzo.id)) {
      return {
        ...mezzo,
        stato: "PRENOTATO",
      };
    }

    return mezzo;
  });
}
