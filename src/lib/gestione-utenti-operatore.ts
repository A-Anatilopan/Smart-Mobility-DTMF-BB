import type { Prisma } from "@prisma/client";
import { monitoraNoleggioUtente } from "@/lib/noleggio";
import { prisma } from "@/lib/prisma";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";
import type { MonitoraggioNoleggioUtente } from "@/types/noleggio";

export const STATO_ACCOUNT_SOSPESO = "SOSPESO";

export type EsitoSospensioneUtenteOperatore =
  | "SOSPESO"
  | "RIATTIVATO"
  | "NON_TROVATO"
  | "NON_UTENTE"
  | "GIA_SOSPESO"
  | "GIA_ATTIVO"
  | "CORSA_ATTIVA";

type CriterioRicercaUtente = {
  utenteId?: number | null;
  email?: string;
};

type UtenteGestioneOperatore = {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  ruolo: string;
  stato: string;
};

export type RisultatoSospensioneUtenteOperatore = {
  esito: EsitoSospensioneUtenteOperatore;
  messaggio: string;
  utente: UtenteGestioneOperatore | null;
  monitoraggio: MonitoraggioNoleggioUtente | null;
};

function normalizzaInputRicercaUtente(
  criterio: CriterioRicercaUtente,
): CriterioRicercaUtente {
  return {
    utenteId:
      typeof criterio.utenteId === "number" && criterio.utenteId > 0
        ? criterio.utenteId
        : null,
    email:
      typeof criterio.email === "string" ? criterio.email.trim() : "",
  };
}

function costruisciWhereUtente(
  criterio: CriterioRicercaUtente,
): Prisma.UtenteWhereInput | null {
  if (criterio.utenteId) {
    return { id: criterio.utenteId };
  }

  if (criterio.email) {
    return { email: criterio.email };
  }

  return null;
}

async function trovaUtenteGestibile(
  criterio: CriterioRicercaUtente,
): Promise<UtenteGestioneOperatore | null> {
  const criterioNormalizzato = normalizzaInputRicercaUtente(criterio);
  const where = costruisciWhereUtente(criterioNormalizzato);

  if (!where) {
    return null;
  }

  return prisma.utente.findFirst({
    where,
    select: {
      id: true,
      nome: true,
      cognome: true,
      email: true,
      ruolo: true,
      stato: true,
    },
  });
}

// Centralizziamo qui la regola di OP.06, cosi API e UI leggono la stessa
// decisione e i casi UC-19.1 / UC-19.2 restano coerenti.
export async function valutaSospensioneUtenteOperatore(
  criterio: CriterioRicercaUtente,
): Promise<RisultatoSospensioneUtenteOperatore> {
  const utente = await trovaUtenteGestibile(criterio);

  if (!utente) {
    return {
      esito: "NON_TROVATO",
      messaggio: "Utente non trovato.",
      utente: null,
      monitoraggio: null,
    };
  }

  if (normalizzaRuolo(utente.ruolo) !== RUOLI.UTENTE) {
    return {
      esito: "NON_UTENTE",
      messaggio:
        "La sospensione e disponibile solo per gli account utente del servizio.",
      utente,
      monitoraggio: null,
    };
  }

  const monitoraggio = await monitoraNoleggioUtente(utente.id);

  if (utente.stato === STATO_ACCOUNT_SOSPESO) {
    return {
      esito: "GIA_SOSPESO",
      messaggio: "Questo account risulta gia sospeso.",
      utente,
      monitoraggio,
    };
  }

  if (
    monitoraggio?.statoMonitoraggio === "CORSA_ATTIVA" ||
    monitoraggio?.statoMonitoraggio === "CORSA_IN_PAUSA"
  ) {
    return {
      esito: "CORSA_ATTIVA",
      messaggio:
        "Non puoi sospendere questo account finche esiste una corsa attiva o in pausa.",
      utente,
      monitoraggio,
    };
  }

  if (monitoraggio?.statoMonitoraggio === "PRENOTAZIONE_ATTIVA") {
    return {
      esito: "SOSPESO",
      messaggio:
        "Account utente sospendibile: la prenotazione attiva verra annullata automaticamente.",
      utente,
      monitoraggio,
    };
  }

  return {
    esito: "SOSPESO",
    messaggio:
      "Account utente sospeso con successo. Le sessioni attive sono state chiuse.",
    utente: {
      ...utente,
      stato: STATO_ACCOUNT_SOSPESO,
    },
    monitoraggio,
  };
}

// La sospensione finale riesegue il controllo nel database per evitare che una
// prenotazione o una corsa aperta sfuggano tra verifica iniziale e conferma.
export async function sospendiUtenteOperatore(
  criterio: CriterioRicercaUtente,
): Promise<RisultatoSospensioneUtenteOperatore> {
  const valutazione = await valutaSospensioneUtenteOperatore(criterio);

  if (valutazione.esito !== "SOSPESO" || !valutazione.utente) {
    return valutazione;
  }

  const risultato = await prisma.$transaction(async (transaction) => {
    const utente = await transaction.utente.findUnique({
      where: {
        id: valutazione.utente!.id,
      },
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        ruolo: true,
        stato: true,
      },
    });

    if (!utente) {
      return {
        esito: "NON_TROVATO" as const,
        messaggio: "Utente non trovato.",
        utente: null,
      };
    }

    if (normalizzaRuolo(utente.ruolo) !== RUOLI.UTENTE) {
      return {
        esito: "NON_UTENTE" as const,
        messaggio:
          "La sospensione e disponibile solo per gli account utente del servizio.",
        utente,
      };
    }

    if (utente.stato === STATO_ACCOUNT_SOSPESO) {
      return {
        esito: "GIA_SOSPESO" as const,
        messaggio: "Questo account risulta gia sospeso.",
        utente,
      };
    }

    await transaction.prenotazione.updateMany({
      where: {
        utenteId: utente.id,
        stato: "ATTIVA",
        scadeAt: {
          lt: new Date(),
        },
      },
      data: {
        stato: "SCADUTA",
      },
    });

    const corsaAttiva = await transaction.corsa.findFirst({
      where: {
        utenteId: utente.id,
        stato: {
          in: ["ATTIVA", "IN_PAUSA"],
        },
      },
      select: {
        id: true,
      },
    });

    if (corsaAttiva) {
      return {
        esito: "CORSA_ATTIVA" as const,
        messaggio:
          "Non puoi sospendere questo account finche esiste una corsa attiva o in pausa.",
        utente,
      };
    }

    const prenotazioneAttiva = await transaction.prenotazione.findFirst({
      where: {
        utenteId: utente.id,
        stato: "ATTIVA",
      },
      select: {
        id: true,
      },
    });

    if (prenotazioneAttiva) {
      await transaction.prenotazione.update({
        where: {
          id: prenotazioneAttiva.id,
        },
        data: {
          stato: "ANNULLATA",
          annullataAt: new Date(),
        },
      });
    }

    const utenteSospeso = await transaction.utente.update({
      where: {
        id: utente.id,
      },
      data: {
        stato: STATO_ACCOUNT_SOSPESO,
      },
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        ruolo: true,
        stato: true,
      },
    });

    return {
      esito: "SOSPESO" as const,
      messaggio: prenotazioneAttiva
        ? "Account utente sospeso con successo. La prenotazione attiva e stata annullata e la sessione verra chiusa al prossimo controllo."
        : "Account utente sospeso con successo. La sessione verra chiusa al prossimo controllo.",
      utente: utenteSospeso,
    };
  });

  const monitoraggio =
    risultato.utente && risultato.esito !== "NON_UTENTE"
      ? await monitoraNoleggioUtente(risultato.utente.id)
      : null;

  return {
    esito: risultato.esito,
    messaggio: risultato.messaggio,
    utente: risultato.utente,
    monitoraggio,
  };
}

// L'operatore deve poter riaprire un account sospeso senza ripassare dai
// flussi di attivazione iniziale: qui riportiamo lo stato ad ATTIVO.
export async function riattivaUtenteOperatore(
  criterio: CriterioRicercaUtente,
): Promise<RisultatoSospensioneUtenteOperatore> {
  const utente = await trovaUtenteGestibile(criterio);

  if (!utente) {
    return {
      esito: "NON_TROVATO",
      messaggio: "Utente non trovato.",
      utente: null,
      monitoraggio: null,
    };
  }

  if (normalizzaRuolo(utente.ruolo) !== RUOLI.UTENTE) {
    return {
      esito: "NON_UTENTE",
      messaggio:
        "La riattivazione e disponibile solo per gli account utente del servizio.",
      utente,
      monitoraggio: null,
    };
  }

  if (utente.stato !== STATO_ACCOUNT_SOSPESO) {
    return {
      esito: "GIA_ATTIVO",
      messaggio: "Questo account e gia attivo e non richiede riattivazione.",
      utente,
      monitoraggio: await monitoraNoleggioUtente(utente.id),
    };
  }

  const utenteRiattivato = await prisma.utente.update({
    where: {
      id: utente.id,
    },
    data: {
      stato: "ATTIVO",
    },
    select: {
      id: true,
      nome: true,
      cognome: true,
      email: true,
      ruolo: true,
      stato: true,
    },
  });

  return {
    esito: "RIATTIVATO",
    messaggio: "Account utente riattivato con successo.",
    utente: utenteRiattivato,
    monitoraggio: await monitoraNoleggioUtente(utente.id),
  };
}
