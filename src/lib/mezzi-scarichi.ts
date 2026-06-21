import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { aggiornaStatoMezzoPersistito, trovaMezzoPerId } from "@/lib/mezzi";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";

export const STATI_GESTIONE_MEZZO_SCARICO = [
  "RITIRO_PROGRAMMATO_MEZZO_SCARICO",
  "MEZZO_RITIRATO",
  "IN_CARICA",
  "CARICA_COMPLETATA",
  "RIMESSA_PROGRAMMATA",
  "RIMESSA_COMPLETATA",
] as const;

export type StatoGestioneMezzoScarico =
  (typeof STATI_GESTIONE_MEZZO_SCARICO)[number];

export const AZIONI_WORKFLOW_MEZZO_SCARICO = [
  "SEGNA_MEZZO_RITIRATO",
  "AVVIA_CARICA",
  "SEGNA_CARICA_COMPLETATA",
  "PROGRAMMA_RIMESSA",
  "COMPLETA_RIMESSA",
] as const;

export type AzioneWorkflowMezzoScarico =
  (typeof AZIONI_WORKFLOW_MEZZO_SCARICO)[number];

const SOGLIA_BATTERIA_MEZZO_SCARICO = 25;

export function formattaStatoGestioneMezzoScarico(
  stato: StatoGestioneMezzoScarico,
) {
  switch (stato) {
    case "RITIRO_PROGRAMMATO_MEZZO_SCARICO":
      return "Ritiro programmato";
    case "MEZZO_RITIRATO":
      return "Mezzo ritirato";
    case "IN_CARICA":
      return "In carica";
    case "CARICA_COMPLETATA":
      return "Carica completata";
    case "RIMESSA_PROGRAMMATA":
      return "Rimessa programmata";
    case "RIMESSA_COMPLETATA":
      return "Rimessa completata";
  }
}

export function risolviPaletteStatoGestioneMezzoScarico(
  stato: StatoGestioneMezzoScarico,
) {
  switch (stato) {
    case "RITIRO_PROGRAMMATO_MEZZO_SCARICO":
      return {
        bordoCard: "border-amber-100",
        sfondoCard: "bg-amber-50",
        testoAccento: "text-amber-800",
        etichetta: "border-amber-200 bg-amber-100 text-amber-800",
      };
    case "MEZZO_RITIRATO":
      return {
        bordoCard: "border-orange-100",
        sfondoCard: "bg-orange-50",
        testoAccento: "text-orange-800",
        etichetta: "border-orange-200 bg-orange-100 text-orange-800",
      };
    case "IN_CARICA":
      return {
        bordoCard: "border-cyan-100",
        sfondoCard: "bg-cyan-50",
        testoAccento: "text-cyan-800",
        etichetta: "border-cyan-200 bg-cyan-100 text-cyan-800",
      };
    case "CARICA_COMPLETATA":
      return {
        bordoCard: "border-emerald-100",
        sfondoCard: "bg-emerald-50",
        testoAccento: "text-emerald-800",
        etichetta: "border-emerald-200 bg-emerald-100 text-emerald-800",
      };
    case "RIMESSA_PROGRAMMATA":
      return {
        bordoCard: "border-violet-100",
        sfondoCard: "bg-violet-50",
        testoAccento: "text-violet-800",
        etichetta: "border-violet-200 bg-violet-100 text-violet-800",
      };
    case "RIMESSA_COMPLETATA":
      return {
        bordoCard: "border-slate-100",
        sfondoCard: "bg-slate-50",
        testoAccento: "text-slate-800",
        etichetta: "border-slate-200 bg-slate-100 text-slate-800",
      };
  }
}

export function generaCodiceGestioneMezzoScarico() {
  const timestamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();

  return `MSC-${timestamp}-${suffix}`;
}

export function normalizzaNoteGestioneMezzoScarico(valore: unknown) {
  if (typeof valore !== "string") {
    return "";
  }

  return valore.replace(/\s+/g, " ").trim();
}

function isAzioneWorkflowMezzoScarico(
  valore: string,
): valore is AzioneWorkflowMezzoScarico {
  return AZIONI_WORKFLOW_MEZZO_SCARICO.includes(
    valore as AzioneWorkflowMezzoScarico,
  );
}

export function normalizzaAzioneWorkflowMezzoScarico(
  valore: unknown,
): AzioneWorkflowMezzoScarico | null {
  if (typeof valore !== "string") {
    return null;
  }

  const azione = valore.trim().toUpperCase();
  return isAzioneWorkflowMezzoScarico(azione)
    ? azione
    : null;
}

// Questa lettura raccoglie i workflow ancora aperti, cosi la sezione mezzi
// scarichi puo distinguere i casi gia gestiti da quelli ancora da avviare.
export async function recuperaGestioniMezziScarichiAttive() {
  return prisma.gestioneMezzoScarico.findMany({
    where: {
      chiusaAt: null,
    },
    include: {
      operatore: {
        select: {
          id: true,
          nome: true,
          cognome: true,
          email: true,
        },
      },
      mezzo: {
        select: {
          id: true,
          codice: true,
          modello: true,
          tipo: true,
          stato: true,
          batteria: true,
          areaServizioNome: true,
        },
      },
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export type GestioneMezzoScaricoAttiva = Awaited<
  ReturnType<typeof recuperaGestioniMezziScarichiAttive>
>[number];

// Lo storico chiuso resta separato dai workflow attivi, cosi l'operatore puo
// consultare le ultime rimesse completate senza confonderle con i casi ancora
// aperti nel ciclo logistico corrente.
export async function recuperaStoricoGestioniMezziScarichiChiuse(limit = 8) {
  return prisma.gestioneMezzoScarico.findMany({
    where: {
      chiusaAt: {
        not: null,
      },
    },
    include: {
      operatore: {
        select: {
          id: true,
          nome: true,
          cognome: true,
          email: true,
        },
      },
      mezzo: {
        select: {
          id: true,
          codice: true,
          modello: true,
          tipo: true,
          stato: true,
          batteria: true,
          areaServizioNome: true,
        },
      },
    },
    orderBy: [
      {
        chiusaAt: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
    take: limit,
  });
}

export type GestioneMezzoScaricoChiusa = Awaited<
  ReturnType<typeof recuperaStoricoGestioniMezziScarichiChiuse>
>[number];

// In ingresso usiamo solo mezzi realmente scarichi e gia fuori disponibilita,
// evitando quelli che sono gia stati agganciati a un workflow logistico aperto.
export async function recuperaMezziScarichiDaGestire() {
  const [mezziMonitorati, gestioniAttive] = await Promise.all([
    risolviMezziConStatoDinamico(),
    prisma.gestioneMezzoScarico.findMany({
      where: {
        chiusaAt: null,
      },
      select: {
        mezzoId: true,
      },
    }),
  ]);

  const mezzoIdsGiaPresiInCarico = new Set(
    gestioniAttive.map((gestione) => gestione.mezzoId),
  );

  return mezziMonitorati.filter(
    (mezzo) =>
      mezzo.batteria <= SOGLIA_BATTERIA_MEZZO_SCARICO &&
      mezzo.stato === "NON_DISPONIBILE" &&
      !mezzoIdsGiaPresiInCarico.has(mezzo.id),
  );
}

// Apre il primo step reale di OP.09: il mezzo scarico entra nel workflow
// logistico senza cambiare il suo significato utente, che resta NON_DISPONIBILE
// finche non verra rimesso in servizio.
export async function programmaRitiroMezzoScarico(input: {
  operatoreId: number;
  mezzoId: string;
  noteOperative?: string;
}) {
  const mezzo = await trovaMezzoPerId(input.mezzoId);

  if (!mezzo) {
    throw new Error("Il mezzo selezionato non esiste.");
  }

  if (mezzo.batteria > SOGLIA_BATTERIA_MEZZO_SCARICO) {
    throw new Error(
      "Puoi programmare il ritiro solo per mezzi realmente sotto soglia batteria.",
    );
  }

  if (mezzo.stato !== "NON_DISPONIBILE") {
    throw new Error(
      "Il mezzo deve essere fuori disponibilita prima di entrare nella gestione mezzi scarichi.",
    );
  }

  const gestioneAttivaEsistente = await prisma.gestioneMezzoScarico.findFirst({
    where: {
      mezzoId: mezzo.id,
      chiusaAt: null,
    },
    select: {
      id: true,
      codice: true,
    },
  });

  if (gestioneAttivaEsistente) {
    throw new Error(
      "Esiste gia una gestione aperta per questo mezzo scarico.",
    );
  }

  const noteOperative = normalizzaNoteGestioneMezzoScarico(
    input.noteOperative,
  );

  const gestione = await prisma.gestioneMezzoScarico.create({
    data: {
      codice: generaCodiceGestioneMezzoScarico(),
      operatoreId: input.operatoreId,
      mezzoId: mezzo.id,
      stato: "RITIRO_PROGRAMMATO_MEZZO_SCARICO",
      batteriaRilevata: mezzo.batteria,
      noteOperative: noteOperative || null,
    },
    include: {
      operatore: {
        select: {
          id: true,
          nome: true,
          cognome: true,
          email: true,
        },
      },
      mezzo: {
        select: {
          id: true,
          codice: true,
          modello: true,
          tipo: true,
          stato: true,
          batteria: true,
          areaServizioNome: true,
        },
      },
    },
  });

  await aggiornaStatoMezzoPersistito({
    mezzoId: mezzo.id,
    stato: "NON_DISPONIBILE",
  });

  return gestione;
}

function risolviTransizioneWorkflowMezzoScarico(input: {
  statoCorrente: StatoGestioneMezzoScarico;
  azione: AzioneWorkflowMezzoScarico;
}) {
  const now = new Date();

  if (
    input.statoCorrente === "RITIRO_PROGRAMMATO_MEZZO_SCARICO" &&
    input.azione === "SEGNA_MEZZO_RITIRATO"
  ) {
    return {
      prossimoStato: "MEZZO_RITIRATO" as StatoGestioneMezzoScarico,
      dataAggiornamento: {
        stato: "MEZZO_RITIRATO" as StatoGestioneMezzoScarico,
        mezzoRitiratoAt: now,
      },
      statoMezzo: "NON_DISPONIBILE" as const,
    };
  }

  if (
    input.statoCorrente === "MEZZO_RITIRATO" &&
    input.azione === "AVVIA_CARICA"
  ) {
    return {
      prossimoStato: "IN_CARICA" as StatoGestioneMezzoScarico,
      dataAggiornamento: {
        stato: "IN_CARICA" as StatoGestioneMezzoScarico,
        caricaIniziataAt: now,
      },
      statoMezzo: "NON_DISPONIBILE" as const,
    };
  }

  if (
    input.statoCorrente === "IN_CARICA" &&
    input.azione === "SEGNA_CARICA_COMPLETATA"
  ) {
    return {
      prossimoStato: "CARICA_COMPLETATA" as StatoGestioneMezzoScarico,
      dataAggiornamento: {
        stato: "CARICA_COMPLETATA" as StatoGestioneMezzoScarico,
        caricaCompletataAt: now,
      },
      statoMezzo: "NON_DISPONIBILE" as const,
      batteriaMezzo: 100,
    };
  }

  if (
    input.statoCorrente === "CARICA_COMPLETATA" &&
    input.azione === "PROGRAMMA_RIMESSA"
  ) {
    return {
      prossimoStato: "RIMESSA_PROGRAMMATA" as StatoGestioneMezzoScarico,
      dataAggiornamento: {
        stato: "RIMESSA_PROGRAMMATA" as StatoGestioneMezzoScarico,
        rimessaProgrammataAt: now,
      },
      statoMezzo: "NON_DISPONIBILE" as const,
    };
  }

  if (
    input.statoCorrente === "RIMESSA_PROGRAMMATA" &&
    input.azione === "COMPLETA_RIMESSA"
  ) {
    return {
      prossimoStato: "RIMESSA_COMPLETATA" as StatoGestioneMezzoScarico,
      dataAggiornamento: {
        stato: "RIMESSA_COMPLETATA" as StatoGestioneMezzoScarico,
        rimessaCompletataAt: now,
        chiusaAt: now,
      },
      statoMezzo: "DISPONIBILE" as const,
    };
  }

  throw new Error(
    "L'azione richiesta non e coerente con lo stato attuale del mezzo scarico.",
  );
}

export async function avanzaWorkflowMezzoScarico(input: {
  gestioneId: number;
  operatoreId: number;
  azione: AzioneWorkflowMezzoScarico;
}) {
  const gestione = await prisma.gestioneMezzoScarico.findUnique({
    where: {
      id: input.gestioneId,
    },
    include: {
      operatore: {
        select: {
          id: true,
          nome: true,
          cognome: true,
          email: true,
        },
      },
      mezzo: {
        select: {
          id: true,
          codice: true,
          modello: true,
          tipo: true,
          stato: true,
          batteria: true,
          areaServizioNome: true,
        },
      },
    },
  });

  if (!gestione || gestione.chiusaAt) {
    throw new Error("La gestione richiesta non e piu attiva.");
  }

  if (gestione.operatoreId !== input.operatoreId) {
    throw new Error(
      "Solo l'operatore che ha aperto questa gestione puo far avanzare il workflow.",
    );
  }

  const transizione = risolviTransizioneWorkflowMezzoScarico({
    statoCorrente: gestione.stato as StatoGestioneMezzoScarico,
    azione: input.azione,
  });

  await prisma.gestioneMezzoScarico.update({
    where: {
      id: gestione.id,
    },
    data: transizione.dataAggiornamento,
  });

  await aggiornaStatoMezzoPersistito({
    mezzoId: gestione.mezzoId,
    stato: transizione.statoMezzo,
    batteria: transizione.batteriaMezzo,
  });

  return prisma.gestioneMezzoScarico.findUniqueOrThrow({
    where: {
      id: gestione.id,
    },
    include: {
      operatore: {
        select: {
          id: true,
          nome: true,
          cognome: true,
          email: true,
        },
      },
      mezzo: {
        select: {
          id: true,
          codice: true,
          modello: true,
          tipo: true,
          stato: true,
          batteria: true,
          areaServizioNome: true,
        },
      },
    },
  });
}
