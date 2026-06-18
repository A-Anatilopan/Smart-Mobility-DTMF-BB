import { areeServizioMock, mezziMock } from "@/lib/mappa/mock-data";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";
import { prisma } from "@/lib/prisma";

type DistribuzioneTipo = {
  label: string;
  valore: number;
};

type IndicatoreReport = {
  label: string;
  valore: string;
  descrizione: string;
};

type DettaglioMezzoReport = {
  batteria: number;
  codice: string;
  modello: string;
  stato: string;
  tipo: string;
};

export type ReportAggregatoAmministrazione = {
  dettaglioMezziBatteriaBassa: DettaglioMezzoReport[];
  dettaglioMezziInManutenzione: DettaglioMezzoReport[];
  indicatoriPrincipali: IndicatoreReport[];
  distribuzioneCorsePerTipo: DistribuzioneTipo[];
  statoServizio: IndicatoreReport[];
  areeCoperte: number;
  zoneCoperte: string[];
};

function pulisciValoreCsv(valore: string): string {
  return `"${valore.replaceAll('"', '""')}"`;
}

function aggiungiRigaCsv(righe: string[], colonne: string[]): void {
  righe.push(colonne.map(pulisciValoreCsv).join(";"));
}

function formattaValutaCent(cent: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cent / 100);
}

function formattaDurataMedia(ms: number): string {
  const minuti = Math.round(ms / 60000);

  if (minuti < 60) {
    return `${minuti} min`;
  }

  const ore = Math.floor(minuti / 60);
  const minutiResidui = minuti % 60;

  return `${ore} h ${minutiResidui} min`;
}

// Questo helper raccoglie una prima base reale per AP.01 usando dati di corse
// e prenotazioni dal database, piu lo stato dinamico della flotta mock.
export async function costruisciReportAggregatoAmministrazione(): Promise<ReportAggregatoAmministrazione> {
  const [corseCompletate, aggregateCorse, prenotazioniAttive, mezziMonitorati] =
    await Promise.all([
      prisma.corsa.findMany({
        where: {
          stato: "TERMINATA",
        },
        select: {
          mezzoId: true,
        },
      }),
      prisma.corsa.aggregate({
        where: {
          stato: "TERMINATA",
        },
        _count: {
          id: true,
        },
        _sum: {
          costoTotaleCent: true,
          durataPausaMs: true,
        },
        _avg: {
          durataUtilizzoMs: true,
        },
      }),
      prisma.prenotazione.count({
        where: {
          stato: "ATTIVA",
        },
      }),
      risolviMezziConStatoDinamico(mezziMock),
    ]);

  const corsePerTipo = corseCompletate.reduce<Record<string, number>>(
    (accumulatore, corsa) => {
      const mezzo = mezziMock.find(
        (mezzoCorrente) => mezzoCorrente.id === corsa.mezzoId,
      );

      if (!mezzo) {
        return accumulatore;
      }

      accumulatore[mezzo.tipo] = (accumulatore[mezzo.tipo] ?? 0) + 1;
      return accumulatore;
    },
    {},
  );

  const corseTerminate = aggregateCorse._count.id;
  const ricavoTotale = aggregateCorse._sum.costoTotaleCent ?? 0;
  const tempoTotalePausa = aggregateCorse._sum.durataPausaMs ?? 0;
  const durataMediaUtilizzo = Math.round(
    aggregateCorse._avg.durataUtilizzoMs ?? 0,
  );

  const mezziDisponibili = mezziMonitorati.filter(
    (mezzo) => mezzo.stato === "DISPONIBILE",
  ).length;
  const mezziInMovimento = mezziMonitorati.filter((mezzo) =>
    ["PRENOTATO", "IN_USO", "IN_PAUSA"].includes(mezzo.stato),
  ).length;
  const mezziConBatteriaBassa = mezziMonitorati.filter(
    (mezzo) => mezzo.batteria <= 25,
  );
  const mezziInManutenzione = mezziMonitorati.filter(
    (mezzo) => mezzo.stato === "IN_MANUTENZIONE",
  );
  const dettaglioMezziBatteriaBassa = mezziConBatteriaBassa.map((mezzo) => ({
    batteria: mezzo.batteria,
    codice: mezzo.codice,
    modello: mezzo.modello,
    stato: mezzo.stato,
    tipo: mezzo.tipo,
  }));
  const dettaglioMezziInManutenzione = mezziInManutenzione.map((mezzo) => ({
    batteria: mezzo.batteria,
    codice: mezzo.codice,
    modello: mezzo.modello,
    stato: mezzo.stato,
    tipo: mezzo.tipo,
  }));

  return {
    dettaglioMezziBatteriaBassa,
    dettaglioMezziInManutenzione,
    indicatoriPrincipali: [
      {
        label: "Corse concluse",
        valore: String(corseTerminate),
        descrizione: "Numero complessivo di corse terminate registrate finora.",
      },
      {
        label: "Ricavo totale",
        valore: formattaValutaCent(ricavoTotale),
        descrizione: "Somma dei costi finali registrati sulle corse concluse.",
      },
      {
        label: "Durata media corsa",
        valore:
          corseTerminate > 0 ? formattaDurataMedia(durataMediaUtilizzo) : "0 min",
        descrizione:
          "Media del solo tempo di utilizzo effettivo sulle corse terminate.",
      },
      {
        label: "Pausa complessiva",
        valore:
          tempoTotalePausa > 0 ? formattaDurataMedia(tempoTotalePausa) : "0 min",
        descrizione:
          "Tempo totale accumulato in pausa dalle corse concluse del campione.",
      },
    ],
    distribuzioneCorsePerTipo: [
      {
        label: "E-Bike",
        valore: corsePerTipo["E-Bike"] ?? 0,
      },
      {
        label: "E-Scooter",
        valore: corsePerTipo["E-Scooter"] ?? 0,
      },
      {
        label: "E-Car",
        valore: corsePerTipo["E-Car"] ?? 0,
      },
    ],
    statoServizio: [
      {
        label: "Prenotazioni aperte",
        valore: String(prenotazioniAttive),
        descrizione:
          "Numero di prenotazioni ancora attive al momento della lettura del report.",
      },
      {
        label: "Mezzi disponibili",
        valore: String(mezziDisponibili),
        descrizione:
          "Veicoli immediatamente utilizzabili nel campione operativo corrente.",
      },
      {
        label: "Mezzi in movimento",
        valore: String(mezziInMovimento),
        descrizione:
          "Somma di mezzi prenotati, in uso o momentaneamente in pausa.",
      },
      {
        label: "Batteria bassa",
        valore: String(mezziConBatteriaBassa.length),
        descrizione:
          "Numero di mezzi che risultano sotto la soglia di batteria definita.",
      },
      {
        label: "In manutenzione",
        valore: String(mezziInManutenzione.length),
        descrizione:
          "Numero di mezzi attualmente fuori servizio per lavorazioni manutentive.",
      },
    ],
    areeCoperte: areeServizioMock.length,
    zoneCoperte: areeServizioMock.map((area) => area.nome),
  };
}

// Questo export CSV supporta la prima versione concreta di AP.01.2 e mantiene
// una struttura semplice, leggibile e riusabile anche per futuri export.
export function generaCsvReportAggregatoAmministrazione(
  report: ReportAggregatoAmministrazione,
): string {
  const righe: string[] = [];

  const dataGenerazione = new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  aggiungiRigaCsv(righe, ["Report aggregato", "Pubblica Amministrazione"]);
  aggiungiRigaCsv(righe, ["Data generazione", dataGenerazione]);
  aggiungiRigaCsv(righe, ["Formato", "CSV"]);
  righe.push("");

  function aggiungiSezione(
    titolo: string,
    righeSezione: Array<{
      indicatore: string;
      valore: string;
      descrizione: string;
    }>,
  ) {
    aggiungiRigaCsv(righe, [titolo]);
    aggiungiRigaCsv(righe, ["Indicatore", "Valore", "Descrizione"]);

    for (const riga of righeSezione) {
      aggiungiRigaCsv(righe, [riga.indicatore, riga.valore, riga.descrizione]);
    }

    righe.push("");
  }

  function aggiungiSezioneDettaglioMezzi(
    titolo: string,
    mezzi: DettaglioMezzoReport[],
  ) {
    aggiungiRigaCsv(righe, [titolo]);
    aggiungiRigaCsv(righe, [
      "Tipo mezzo",
      "Codice mezzo",
      "Modello",
      "Batteria %",
      "Stato attuale",
    ]);

    if (mezzi.length === 0) {
      aggiungiRigaCsv(righe, ["Nessun mezzo", "-", "-", "-", "-"]);
      righe.push("");
      return;
    }

    for (const mezzo of mezzi) {
      aggiungiRigaCsv(righe, [
        mezzo.tipo,
        mezzo.codice,
        mezzo.modello,
        String(mezzo.batteria),
        mezzo.stato,
      ]);
    }

    righe.push("");
  }

  aggiungiSezione(
    "Indicatori principali",
    report.indicatoriPrincipali.map((indicatore) => ({
      indicatore: indicatore.label,
      valore: indicatore.valore,
      descrizione: indicatore.descrizione,
    })),
  );

  aggiungiSezione(
    "Stato servizio",
    report.statoServizio.map((indicatore) => ({
      indicatore: indicatore.label,
      valore: indicatore.valore,
      descrizione: indicatore.descrizione,
    })),
  );

  aggiungiSezione(
    "Distribuzione corse concluse",
    report.distribuzioneCorsePerTipo.map((distribuzione) => ({
      indicatore: distribuzione.label,
      valore: String(distribuzione.valore),
      descrizione: "Numero di corse concluse per tipologia di mezzo.",
    })),
  );

  aggiungiRigaCsv(righe, ["Copertura urbana"]);
  aggiungiRigaCsv(righe, [
    "Indicatore",
    "Valore",
    "Zona coperta",
    "Descrizione",
  ]);
  aggiungiRigaCsv(righe, [
    "Aree coperte totali",
    String(report.areeCoperte),
    "-",
    "Numero di aree urbane coperte nel campione corrente.",
  ]);

  if (report.zoneCoperte.length === 0) {
    aggiungiRigaCsv(righe, [
      "Zona coperta",
      "-",
      "-",
      "Nessuna zona coperta presente nel campione corrente.",
    ]);
  } else {
    for (const zona of report.zoneCoperte) {
      aggiungiRigaCsv(righe, [
        "Zona coperta",
        "-",
        zona,
        "Area inclusa nella copertura urbana osservata.",
      ]);
    }
  }

  righe.push("");

  aggiungiSezioneDettaglioMezzi(
    "Dettaglio mezzi con batteria bassa",
    report.dettaglioMezziBatteriaBassa,
  );

  aggiungiSezioneDettaglioMezzi(
    "Dettaglio mezzi in manutenzione",
    report.dettaglioMezziInManutenzione,
  );

  return `\uFEFF${righe.join("\n")}`;
}
