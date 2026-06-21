import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const TIPI_METODO_PAGAMENTO = ["CARTA"] as const;
export type TipoMetodoPagamento = (typeof TIPI_METODO_PAGAMENTO)[number];

export const STATI_METODO_PAGAMENTO = ["ATTIVO"] as const;
export type StatoMetodoPagamento = (typeof STATI_METODO_PAGAMENTO)[number];

export const CIRCUITI_METODO_PAGAMENTO = [
  "VISA",
  "MASTERCARD",
  "AMEX",
  "PAGOBANCOMAT",
  "ALTRO",
] as const;
export type CircuitoMetodoPagamento =
  (typeof CIRCUITI_METODO_PAGAMENTO)[number];

function normalizzaSpazi(valore: string) {
  return valore.replace(/\s+/g, " ").trim();
}

function estraiSoloCifre(valore: string) {
  return valore.replace(/\D/g, "");
}

function normalizzaCircuito(valore: unknown): CircuitoMetodoPagamento | null {
  if (typeof valore !== "string") {
    return null;
  }

  const circuito = normalizzaSpazi(valore).toUpperCase();

  return CIRCUITI_METODO_PAGAMENTO.includes(
    circuito as CircuitoMetodoPagamento,
  )
    ? (circuito as CircuitoMetodoPagamento)
    : null;
}

function validaScadenza(input: { mese: number; anno: number }) {
  if (!Number.isInteger(input.mese) || input.mese < 1 || input.mese > 12) {
    throw new Error("Il mese di scadenza non e valido.");
  }

  if (!Number.isInteger(input.anno) || input.anno < 2026 || input.anno > 2046) {
    throw new Error("L'anno di scadenza non e valido.");
  }

  const adesso = new Date();
  const annoCorrente = adesso.getFullYear();
  const meseCorrente = adesso.getMonth() + 1;

  if (
    input.anno < annoCorrente ||
    (input.anno === annoCorrente && input.mese < meseCorrente)
  ) {
    throw new Error("La data di scadenza e gia passata.");
  }
}

function numeroCartaSuperaControlloLuhn(numeroCarta: string) {
  let somma = 0;
  let raddoppia = false;

  for (let indice = numeroCarta.length - 1; indice >= 0; indice -= 1) {
    let cifra = Number(numeroCarta[indice]);

    if (Number.isNaN(cifra)) {
      return false;
    }

    if (raddoppia) {
      cifra *= 2;

      if (cifra > 9) {
        cifra -= 9;
      }
    }

    somma += cifra;
    raddoppia = !raddoppia;
  }

  return somma % 10 === 0;
}

function generaTokenMockMetodoPagamento() {
  return `pm_mock_${randomUUID().replaceAll("-", "")}`;
}

function costruisciAliasPagamento(input: {
  alias?: string;
  circuito: CircuitoMetodoPagamento;
  ultime4: string;
}) {
  const aliasPulito =
    typeof input.alias === "string" ? normalizzaSpazi(input.alias) : "";

  if (aliasPulito.length > 0) {
    return aliasPulito;
  }

  return `${input.circuito} •••• ${input.ultime4}`;
}

// Ritorna tutti i metodi visibili all'utente, ordinati mettendo prima il
// predefinito e poi i piu recenti, cosi la UI puo essere semplice da leggere.
export async function elencaMetodiPagamentoUtente(utenteId: number) {
  return prisma.metodoPagamento.findMany({
    where: {
      utenteId,
      stato: "ATTIVO",
    },
    orderBy: [{ predefinito: "desc" }, { updatedAt: "desc" }],
  });
}

export async function trovaMetodoPagamentoPredefinitoUtente(utenteId: number) {
  return prisma.metodoPagamento.findFirst({
    where: {
      utenteId,
      stato: "ATTIVO",
      predefinito: true,
    },
  });
}

// Questo helper verra riusato come precondizione su prenotazione e avvio corsa:
// se non esiste almeno un metodo attivo, l'utente non potra proseguire.
export async function utenteHaMetodoPagamentoAttivo(utenteId: number) {
  const metodo = await prisma.metodoPagamento.findFirst({
    where: {
      utenteId,
      stato: "ATTIVO",
    },
    select: {
      id: true,
    },
  });

  return Boolean(metodo);
}

export async function richiediMetodoPagamentoAttivoUtente(utenteId: number) {
  const metodo = await prisma.metodoPagamento.findFirst({
    where: {
      utenteId,
      stato: "ATTIVO",
    },
    orderBy: [{ predefinito: "desc" }, { updatedAt: "desc" }],
  });

  if (!metodo) {
    throw new Error(
      "Devi salvare almeno un metodo di pagamento attivo prima di prenotare o iniziare una corsa.",
    );
  }

  return metodo;
}

// Salva un metodo mock senza memorizzare mai numero completo carta o CVV:
// persistiamo solo ultime4, scadenza, intestatario, circuito e token simulato.
export async function salvaMetodoPagamentoUtente(input: {
  utenteId: number;
  circuito: unknown;
  intestatario: unknown;
  numeroCarta: unknown;
  scadenzaMese: unknown;
  scadenzaAnno: unknown;
  alias?: unknown;
  impostaComePredefinito?: boolean;
}) {
  const circuito = normalizzaCircuito(input.circuito);
  if (!circuito) {
    throw new Error("Seleziona un circuito di pagamento valido.");
  }

  const intestatario =
    typeof input.intestatario === "string"
      ? normalizzaSpazi(input.intestatario)
      : "";
  if (intestatario.length < 3) {
    throw new Error("Inserisci un intestatario valido.");
  }

  const numeroCarta =
    typeof input.numeroCarta === "string"
      ? estraiSoloCifre(input.numeroCarta)
      : "";
  if (numeroCarta.length < 12 || numeroCarta.length > 19) {
    throw new Error("Il numero della carta non e valido.");
  }

  if (!numeroCartaSuperaControlloLuhn(numeroCarta)) {
    throw new Error("Il numero della carta non supera il controllo di validita.");
  }

  const scadenzaMese = Number(input.scadenzaMese);
  const scadenzaAnno = Number(input.scadenzaAnno);
  validaScadenza({
    mese: scadenzaMese,
    anno: scadenzaAnno,
  });

  const ultime4 = numeroCarta.slice(-4);
  const alias = costruisciAliasPagamento({
    alias: typeof input.alias === "string" ? input.alias : "",
    circuito,
    ultime4,
  });

  const esistentiAttivi = await prisma.metodoPagamento.findMany({
    where: {
      utenteId: input.utenteId,
      stato: "ATTIVO",
    },
    select: {
      id: true,
      predefinito: true,
      ultime4: true,
      circuito: true,
      scadenzaMese: true,
      scadenzaAnno: true,
    },
  });

  const duplicato = esistentiAttivi.find(
    (metodo) =>
      metodo.ultime4 === ultime4 &&
      metodo.circuito === circuito &&
      metodo.scadenzaMese === scadenzaMese &&
      metodo.scadenzaAnno === scadenzaAnno,
  );

  if (duplicato) {
    throw new Error(
      "Esiste gia un metodo di pagamento attivo con gli stessi dati principali.",
    );
  }

  const deveEsserePredefinito =
    esistentiAttivi.length === 0 || input.impostaComePredefinito === true;

  return prisma.$transaction(async (transaction) => {
    if (deveEsserePredefinito) {
      await transaction.metodoPagamento.updateMany({
        where: {
          utenteId: input.utenteId,
          predefinito: true,
        },
        data: {
          predefinito: false,
        },
      });
    }

    return transaction.metodoPagamento.create({
      data: {
        utenteId: input.utenteId,
        tipo: "CARTA",
        circuito,
        intestatario,
        ultime4,
        scadenzaMese,
        scadenzaAnno,
        alias,
        tokenMock: generaTokenMockMetodoPagamento(),
        stato: "ATTIVO",
        predefinito: deveEsserePredefinito,
      },
    });
  });
}

export async function impostaMetodoPagamentoPredefinito(input: {
  utenteId: number;
  metodoPagamentoId: number;
}) {
  const metodo = await prisma.metodoPagamento.findFirst({
    where: {
      id: input.metodoPagamentoId,
      utenteId: input.utenteId,
      stato: "ATTIVO",
    },
  });

  if (!metodo) {
    throw new Error("Il metodo di pagamento selezionato non e disponibile.");
  }

  return prisma.$transaction(async (transaction) => {
    await transaction.metodoPagamento.updateMany({
      where: {
        utenteId: input.utenteId,
        predefinito: true,
      },
      data: {
        predefinito: false,
      },
    });

    return transaction.metodoPagamento.update({
      where: {
        id: metodo.id,
      },
      data: {
        predefinito: true,
      },
    });
  });
}

// In questo progetto la rimozione di un metodo e definitiva: non viene solo
// disattivato, ma cancellato davvero dal database come richiesto dal flusso.
export async function eliminaMetodoPagamentoUtente(input: {
  utenteId: number;
  metodoPagamentoId: number;
}) {
  const metodo = await prisma.metodoPagamento.findFirst({
    where: {
      id: input.metodoPagamentoId,
      utenteId: input.utenteId,
      stato: "ATTIVO",
    },
  });

  if (!metodo) {
    throw new Error("Il metodo di pagamento selezionato non e disponibile.");
  }

  return prisma.$transaction(async (transaction) => {
    await transaction.metodoPagamento.delete({
      where: {
        id: metodo.id,
      },
    });

    if (!metodo.predefinito) {
      return;
    }

    const sostituto = await transaction.metodoPagamento.findFirst({
      where: {
        utenteId: input.utenteId,
        stato: "ATTIVO",
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    if (sostituto) {
      await transaction.metodoPagamento.update({
        where: {
          id: sostituto.id,
        },
        data: {
          predefinito: true,
        },
      });
    }
  });
}
