import { calcolaDistanzaMetri } from "@/lib/geolocalizzazione";
import { puntiInteresseMappaMock } from "@/lib/mappa/mock-data";
import { recuperaMezziBase } from "@/lib/mezzi";
import { prisma } from "@/lib/prisma";
import type { Coordinate, TipoMezzo } from "@/types/mobilita";

export const FILTRI_TIPO_MEZZO_TRATTE_CO2 = [
  "TUTTI",
  "E-Bike",
  "E-Scooter",
  "E-Car",
] as const;

export type FiltroTipoMezzoTratteCo2 =
  (typeof FILTRI_TIPO_MEZZO_TRATTE_CO2)[number];

type IndicatoreTratteCo2 = {
  label: string;
  valore: string;
  descrizione: string;
};

type TrattaFrequenteAmministrazione = {
  id: string;
  partenza: string;
  arrivo: string;
  corseConcluse: number;
  distanzaMediaKm: number;
  durataMediaMin: number;
  tipologiaPrevalente: TipoMezzo | "Mista";
};

type NodoUrbanoRicorrente = {
  nome: string;
  partenzeCoinvolte: number;
  arriviCoinvolti: number;
  totaleCoinvolgimenti: number;
};

export type ReportTratteCo2Amministrazione = {
  filtroTipoMezzo: FiltroTipoMezzoTratteCo2;
  indicatori: IndicatoreTratteCo2[];
  tratteFrequenti: TrattaFrequenteAmministrazione[];
  nodiUrbaniRicorrenti: NodoUrbanoRicorrente[];
  distribuzioneRisparmioCo2: Array<{
    tipo: TipoMezzo;
    kgRisparmiati: number;
  }>;
  notaMetodologica: string;
};

const CO2_RISPARMIATA_GRAMMI_KM: Record<TipoMezzo, number> = {
  "E-Bike": 95,
  "E-Scooter": 75,
  "E-Car": 45,
};

function formattaNumeroCompatto(valore: number): string {
  return new Intl.NumberFormat("it-IT", {
    maximumFractionDigits: valore >= 100 ? 0 : 1,
    minimumFractionDigits: valore > 0 && valore < 10 ? 1 : 0,
  }).format(valore);
}

function formattaChilometri(km: number): string {
  return `${formattaNumeroCompatto(km)} km`;
}

function formattaKgCo2(kg: number): string {
  return `${formattaNumeroCompatto(kg)} kg`;
}

function risolviFiltroTipoMezzo(
  filtroTipoMezzo?: string,
): FiltroTipoMezzoTratteCo2 {
  if (!filtroTipoMezzo) {
    return "TUTTI";
  }

  return FILTRI_TIPO_MEZZO_TRATTE_CO2.includes(
    filtroTipoMezzo as FiltroTipoMezzoTratteCo2,
  )
    ? (filtroTipoMezzo as FiltroTipoMezzoTratteCo2)
    : "TUTTI";
}

function risolviEtichettaPunto(coordinate: Coordinate): string {
  let migliorNome = "Area urbana di Bari";
  let distanzaMinima = Number.POSITIVE_INFINITY;

  for (const punto of puntiInteresseMappaMock) {
    const distanza = calcolaDistanzaMetri(coordinate, punto);

    if (distanza < distanzaMinima) {
      distanzaMinima = distanza;
      migliorNome = punto.nome;
    }
  }

  return migliorNome;
}

function risolviTipologiaPrevalente(
  conteggioPerTipo: Record<TipoMezzo, number>,
): TipoMezzo | "Mista" {
  const ordinati = (Object.entries(conteggioPerTipo) as Array<[TipoMezzo, number]>)
    .sort(([, valoreA], [, valoreB]) => valoreB - valoreA);

  if (ordinati.length === 0) {
    return "Mista";
  }

  if (ordinati.length > 1 && ordinati[0][1] === ordinati[1][1]) {
    return "Mista";
  }

  return ordinati[0][0];
}

// Questo builder apre AP.04 e AP.05 con una prima lettura reale delle corse:
// usa le coordinate minime salvate nel dominio noleggio e coefficienti CO2
// simulati, adeguati al contesto accademico del progetto.
export async function costruisciReportTratteCo2Amministrazione(input?: {
  filtroTipoMezzo?: string;
}): Promise<ReportTratteCo2Amministrazione> {
  const filtroTipoMezzo = risolviFiltroTipoMezzo(input?.filtroTipoMezzo);
  const [corseTerminate, mezziBase] = await Promise.all([
    prisma.corsa.findMany({
      where: {
        stato: "TERMINATA",
        latitudineInizio: { not: null },
        longitudineInizio: { not: null },
        latitudineFine: { not: null },
        longitudineFine: { not: null },
      },
      select: {
        id: true,
        mezzoId: true,
        durataUtilizzoMs: true,
        latitudineInizio: true,
        longitudineInizio: true,
        latitudineFine: true,
        longitudineFine: true,
      },
    }),
    recuperaMezziBase(),
  ]);

  const mezziPerId = new Map(mezziBase.map((mezzo) => [mezzo.id, mezzo]));
  const aggregatoTratte = new Map<
    string,
    {
      id: string;
      partenza: string;
      arrivo: string;
      corseConcluse: number;
      distanzaTotaleKm: number;
      durataTotaleMin: number;
      conteggioPerTipo: Record<TipoMezzo, number>;
    }
  >();
  const co2PerTipo: Record<TipoMezzo, number> = {
    "E-Bike": 0,
    "E-Scooter": 0,
    "E-Car": 0,
  };
  const nodiUrbani = new Map<
    string,
    {
      nome: string;
      partenzeCoinvolte: number;
      arriviCoinvolti: number;
    }
  >();

  for (const corsa of corseTerminate) {
    const mezzo = mezziPerId.get(corsa.mezzoId);

    if (
      !mezzo ||
      corsa.latitudineInizio === null ||
      corsa.longitudineInizio === null ||
      corsa.latitudineFine === null ||
      corsa.longitudineFine === null
    ) {
      continue;
    }

    if (filtroTipoMezzo !== "TUTTI" && mezzo.tipo !== filtroTipoMezzo) {
      continue;
    }

    const puntoInizio: Coordinate = {
      latitudine: Number(corsa.latitudineInizio),
      longitudine: Number(corsa.longitudineInizio),
    };
    const puntoFine: Coordinate = {
      latitudine: Number(corsa.latitudineFine),
      longitudine: Number(corsa.longitudineFine),
    };
    const partenza = risolviEtichettaPunto(puntoInizio);
    const arrivo = risolviEtichettaPunto(puntoFine);
    const distanzaKm = calcolaDistanzaMetri(puntoInizio, puntoFine) / 1000;
    const durataMin = corsa.durataUtilizzoMs / 60000;
    const chiaveTratta = `${partenza}__${arrivo}`;
    const aggregata = aggregatoTratte.get(chiaveTratta) ?? {
      id: chiaveTratta,
      partenza,
      arrivo,
      corseConcluse: 0,
      distanzaTotaleKm: 0,
      durataTotaleMin: 0,
      conteggioPerTipo: {
        "E-Bike": 0,
        "E-Scooter": 0,
        "E-Car": 0,
      },
    };

    aggregata.corseConcluse += 1;
    aggregata.distanzaTotaleKm += distanzaKm;
    aggregata.durataTotaleMin += durataMin;
    aggregata.conteggioPerTipo[mezzo.tipo] += 1;
    aggregatoTratte.set(chiaveTratta, aggregata);

    const nodoPartenza = nodiUrbani.get(partenza) ?? {
      nome: partenza,
      partenzeCoinvolte: 0,
      arriviCoinvolti: 0,
    };
    nodoPartenza.partenzeCoinvolte += 1;
    nodiUrbani.set(partenza, nodoPartenza);

    const nodoArrivo = nodiUrbani.get(arrivo) ?? {
      nome: arrivo,
      partenzeCoinvolte: 0,
      arriviCoinvolti: 0,
    };
    nodoArrivo.arriviCoinvolti += 1;
    nodiUrbani.set(arrivo, nodoArrivo);

    co2PerTipo[mezzo.tipo] +=
      (CO2_RISPARMIATA_GRAMMI_KM[mezzo.tipo] * distanzaKm) / 1000;
  }

  const tratteFrequenti = [...aggregatoTratte.values()]
    .sort((trattaA, trattaB) => trattaB.corseConcluse - trattaA.corseConcluse)
    .slice(0, 5)
    .map((tratta) => ({
      id: tratta.id,
      partenza: tratta.partenza,
      arrivo: tratta.arrivo,
      corseConcluse: tratta.corseConcluse,
      distanzaMediaKm:
        tratta.corseConcluse > 0
          ? Number((tratta.distanzaTotaleKm / tratta.corseConcluse).toFixed(2))
          : 0,
      durataMediaMin:
        tratta.corseConcluse > 0
          ? Number((tratta.durataTotaleMin / tratta.corseConcluse).toFixed(1))
          : 0,
      tipologiaPrevalente: risolviTipologiaPrevalente(tratta.conteggioPerTipo),
    }));

  const corseGeolocalizzate = corseTerminate.length;
  const nodiUrbaniRicorrenti = [...nodiUrbani.values()]
    .map((nodo) => ({
      ...nodo,
      totaleCoinvolgimenti: nodo.partenzeCoinvolte + nodo.arriviCoinvolti,
    }))
    .sort(
      (nodoA, nodoB) =>
        nodoB.totaleCoinvolgimenti - nodoA.totaleCoinvolgimenti,
    )
    .slice(0, 5);
  const distanzaTotaleKm = [...aggregatoTratte.values()].reduce(
    (accumulatore, tratta) => accumulatore + tratta.distanzaTotaleKm,
    0,
  );
  const co2TotaleKg = Object.values(co2PerTipo).reduce(
    (accumulatore, valore) => accumulatore + valore,
    0,
  );
  const trattaTop = tratteFrequenti[0];
  const etichettaFiltro =
    filtroTipoMezzo === "TUTTI" ? "intera flotta" : filtroTipoMezzo;

  return {
    filtroTipoMezzo,
    indicatori: [
      {
        label: "Corse geolocalizzate",
        valore: String(corseGeolocalizzate),
        descrizione:
          `Corse terminate con coordinate iniziali e finali disponibili per l'analisi territoriale sulla ${etichettaFiltro}.`,
      },
      {
        label: "Distanza osservata",
        valore: formattaChilometri(distanzaTotaleKm),
        descrizione:
          `Somma delle distanze stimate tra punto di inizio e punto di fine delle corse concluse per ${etichettaFiltro}.`,
      },
      {
        label: "CO2 risparmiata",
        valore: formattaKgCo2(co2TotaleKg),
        descrizione:
          `Stima accademica del risparmio emissivo rispetto a mobilita urbana tradizionale per ${etichettaFiltro}.`,
      },
      {
        label: "Tratta piu usata",
        valore: trattaTop
          ? `${trattaTop.partenza} -> ${trattaTop.arrivo}`
          : "Nessuna tratta disponibile",
        descrizione:
          `Percorso piu ricorrente nel campione corrente delle corse terminate per ${etichettaFiltro}.`,
      },
    ],
    tratteFrequenti,
    nodiUrbaniRicorrenti,
    distribuzioneRisparmioCo2: [
      {
        tipo: "E-Bike",
        kgRisparmiati: Number(co2PerTipo["E-Bike"].toFixed(2)),
      },
      {
        tipo: "E-Scooter",
        kgRisparmiati: Number(co2PerTipo["E-Scooter"].toFixed(2)),
      },
      {
        tipo: "E-Car",
        kgRisparmiati: Number(co2PerTipo["E-Car"].toFixed(2)),
      },
    ],
    notaMetodologica:
      "Le tratte derivano dalle coordinate minime di inizio/fine corsa e il risparmio CO2 usa coefficienti simulati per finalita didattiche. Il filtro per tipologia mezzo ricalcola l'intera lettura sul sottoinsieme selezionato.",
  };
}
