import type { ReportAggregatoAmministrazione } from "@/lib/reportistica-amministrazione";

type RigaPdf = {
  fontSize: number;
  prefissoBold?: string;
  testo: string;
  tipo: "corpo" | "meta" | "sezione" | "titolo";
};

const PAGE_HEIGHT = 842;
const PAGE_WIDTH = 595;
const MARGIN_X = 48;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 48;

function escapePdfText(testo: string): string {
  return testo
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function normalizzaTestoPdf(testo: string): string {
  return testo
    .replaceAll("€", "EUR ")
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "");
}

function lineHeightFor(tipo: RigaPdf["tipo"]): number {
  if (tipo === "titolo") {
    return 28;
  }

  if (tipo === "sezione") {
    return 20;
  }

  if (tipo === "meta") {
    return 16;
  }

  return 15;
}

function colorePerTipo(tipo: RigaPdf["tipo"]): string {
  if (tipo === "titolo") {
    return "0.05 0.11 0.2 rg";
  }

  if (tipo === "sezione") {
    return "0.02 0.45 0.48 rg";
  }

  if (tipo === "meta") {
    return "0.29 0.33 0.41 rg";
  }

  return "0.1 0.13 0.18 rg";
}

function aggiungiRiga(
  righe: RigaPdf[],
  testo: string,
  tipo: RigaPdf["tipo"] = "corpo",
  prefissoBold?: string,
): void {
  righe.push({
    fontSize: tipo === "titolo" ? 20 : tipo === "sezione" ? 13 : tipo === "meta" ? 10 : 11,
    prefissoBold,
    testo: normalizzaTestoPdf(testo),
    tipo,
  });
}

function misuraTestoStimato(testo: string, fontSize: number): number {
  return testo.length * fontSize * 0.52;
}

function costruisciRigheReport(
  report: ReportAggregatoAmministrazione,
): RigaPdf[] {
  const righe: RigaPdf[] = [];
  const dataGenerazione = new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  aggiungiRiga(righe, "Report aggregato - Pubblica Amministrazione", "titolo");
  aggiungiRiga(righe, `Data generazione: ${dataGenerazione}`, "meta");
  aggiungiRiga(righe, `Aree coperte nel campione: ${report.areeCoperte}`, "meta");
  aggiungiRiga(righe, "", "corpo");

  aggiungiRiga(righe, "Indicatori principali", "sezione");
  for (const indicatore of report.indicatoriPrincipali) {
    aggiungiRiga(
      righe,
      `${indicatore.label}: ${indicatore.valore} - ${indicatore.descrizione}`,
      "corpo",
      `${indicatore.label}:`,
    );
  }
  aggiungiRiga(righe, "", "corpo");

  aggiungiRiga(righe, "Stato servizio", "sezione");
  for (const indicatore of report.statoServizio) {
    aggiungiRiga(
      righe,
      `${indicatore.label}: ${indicatore.valore} - ${indicatore.descrizione}`,
      "corpo",
      `${indicatore.label}:`,
    );
  }
  aggiungiRiga(righe, "", "corpo");

  aggiungiRiga(righe, "Distribuzione corse concluse", "sezione");
  for (const item of report.distribuzioneCorsePerTipo) {
    aggiungiRiga(righe, `${item.label}: ${item.valore}`, "corpo", `${item.label}:`);
  }
  aggiungiRiga(righe, "", "corpo");

  aggiungiRiga(righe, "Copertura urbana", "sezione");
  aggiungiRiga(righe, `Totale aree: ${report.areeCoperte}`, "corpo", "Totale aree:");
  if (report.zoneCoperte.length === 0) {
    aggiungiRiga(righe, "Nessuna zona coperta presente nel campione.");
  } else {
    for (const zona of report.zoneCoperte) {
      aggiungiRiga(righe, `Zona coperta: ${zona}`, "corpo", "Zona coperta:");
    }
  }
  aggiungiRiga(righe, "", "corpo");

  aggiungiRiga(righe, "Dettaglio mezzi con batteria bassa", "sezione");
  if (report.dettaglioMezziBatteriaBassa.length === 0) {
    aggiungiRiga(righe, "Nessun mezzo sotto soglia nel campione corrente.");
  } else {
    for (const mezzo of report.dettaglioMezziBatteriaBassa) {
      aggiungiRiga(
        righe,
        `${mezzo.tipo} ${mezzo.codice} - ${mezzo.modello} - Batteria ${mezzo.batteria}% - Stato ${mezzo.stato}`,
        "corpo",
        `${mezzo.tipo} ${mezzo.codice} -`,
      );
    }
  }
  aggiungiRiga(righe, "", "corpo");

  aggiungiRiga(righe, "Dettaglio mezzi in manutenzione", "sezione");
  if (report.dettaglioMezziInManutenzione.length === 0) {
    aggiungiRiga(righe, "Nessun mezzo in manutenzione nel campione corrente.");
  } else {
    for (const mezzo of report.dettaglioMezziInManutenzione) {
      aggiungiRiga(
        righe,
        `${mezzo.tipo} ${mezzo.codice} - ${mezzo.modello} - Batteria ${mezzo.batteria}% - Stato ${mezzo.stato}`,
        "corpo",
        `${mezzo.tipo} ${mezzo.codice} -`,
      );
    }
  }

  return righe;
}

function suddividiInPagine(righe: RigaPdf[]): RigaPdf[][] {
  const pagine: RigaPdf[][] = [];
  let paginaCorrente: RigaPdf[] = [];
  let y = PAGE_HEIGHT - MARGIN_TOP;

  for (const riga of righe) {
    const altezza = lineHeightFor(riga.tipo);

    if (y - altezza < MARGIN_BOTTOM) {
      pagine.push(paginaCorrente);
      paginaCorrente = [];
      y = PAGE_HEIGHT - MARGIN_TOP;
    }

    paginaCorrente.push(riga);
    y -= altezza;
  }

  if (paginaCorrente.length > 0) {
    pagine.push(paginaCorrente);
  }

  return pagine;
}

function costruisciStreamPagina(righe: RigaPdf[], paginaNumero: number, totalePagine: number): string {
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const commands: string[] = [];

  commands.push("0.96 0.98 1 rg");
  commands.push(`0 ${PAGE_HEIGHT - 96} ${PAGE_WIDTH} 96 re f`);

  for (const riga of righe) {
    if (riga.testo.length === 0) {
      y -= lineHeightFor(riga.tipo);
      continue;
    }

    commands.push(colorePerTipo(riga.tipo));
    if (riga.prefissoBold && riga.tipo === "corpo" && riga.testo.startsWith(riga.prefissoBold)) {
      const resto = riga.testo.slice(riga.prefissoBold.length).trimStart();
      const widthPrefisso = misuraTestoStimato(riga.prefissoBold, riga.fontSize);

      commands.push("BT");
      commands.push(`/F2 ${riga.fontSize} Tf`);
      commands.push(`1 0 0 1 ${MARGIN_X} ${y} Tm`);
      commands.push(`(${escapePdfText(riga.prefissoBold)}) Tj`);
      commands.push("ET");

      commands.push("BT");
      commands.push(`/F1 ${riga.fontSize} Tf`);
      commands.push(`1 0 0 1 ${MARGIN_X + widthPrefisso + 2} ${y} Tm`);
      commands.push(`(${escapePdfText(resto)}) Tj`);
      commands.push("ET");
    } else {
      commands.push("BT");
      commands.push(`/F1 ${riga.fontSize} Tf`);
      commands.push(`1 0 0 1 ${MARGIN_X} ${y} Tm`);
      commands.push(`(${escapePdfText(riga.testo)}) Tj`);
      commands.push("ET");
    }

    y -= lineHeightFor(riga.tipo);
  }

  commands.push("0.45 0.5 0.58 rg");
  commands.push("BT");
  commands.push("/F1 10 Tf");
  commands.push(`1 0 0 1 ${MARGIN_X} 28 Tm`);
  commands.push(`(Pagina ${paginaNumero} di ${totalePagine}) Tj`);
  commands.push("ET");

  return commands.join("\n");
}

// Questo generatore PDF produce un report scaricabile senza dipendenze esterne,
// cosi CSV e PDF restano coerenti e portabili nel repository del progetto.
export function generaPdfReportAggregatoAmministrazione(
  report: ReportAggregatoAmministrazione,
): Buffer {
  const pagine = suddividiInPagine(costruisciRigheReport(report));
  const oggetti: string[] = [];
  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];

  oggetti.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  oggetti.push("2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj");
  oggetti.push("3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");
  oggetti.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj");

  let prossimoId = 5;

  for (let indice = 0; indice < pagine.length; indice += 1) {
    const pageId = prossimoId;
    const contentId = prossimoId + 1;
    prossimoId += 2;

    pageObjectIds.push(pageId);
    contentObjectIds.push(contentId);

    const stream = costruisciStreamPagina(pagine[indice], indice + 1, pagine.length);
    const streamLength = Buffer.byteLength(stream, "utf8");

    oggetti.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>\nendobj`,
    );
    oggetti.push(
      `${contentId} 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj`,
    );
  }

  oggetti[1] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageObjectIds.length} >>\nendobj`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const oggetto of oggetti) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${oggetto}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${oggetti.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let indice = 1; indice < offsets.length; indice += 1) {
    pdf += `${String(offsets[indice]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${oggetti.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}
