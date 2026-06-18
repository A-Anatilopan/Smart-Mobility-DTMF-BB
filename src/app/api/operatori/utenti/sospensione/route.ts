import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  riattivaUtenteOperatore,
  sospendiUtenteOperatore,
} from "@/lib/gestione-utenti-operatore";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

function normalizzaInput(body: unknown): {
  utenteId: number | null;
  email: string;
  azione: "sospendi" | "riattiva";
} {
  if (!body || typeof body !== "object") {
    return {
      utenteId: null,
      email: "",
      azione: "sospendi",
    };
  }

  const candidate = body as {
    utenteId?: number | string;
    email?: string;
    azione?: string;
  };

  const utenteId =
    typeof candidate.utenteId === "number"
      ? candidate.utenteId
      : Number(candidate.utenteId);

  return {
    utenteId: Number.isInteger(utenteId) && utenteId > 0 ? utenteId : null,
    email: typeof candidate.email === "string" ? candidate.email.trim() : "",
    azione: candidate.azione === "riattiva" ? "riattiva" : "sospendi",
  };
}

// POST /api/operatori/utenti/sospensione
// OP.06: sospensione account utente con controllo su prenotazioni e corse aperte
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per gestire gli account utente." },
        { status: 401 },
      );
    }

    const operatore = await verificaSessione(token);

    if (!operatore) {
      return NextResponse.json(
        { errore: "Sessione non valida. Effettua di nuovo l'accesso." },
        { status: 401 },
      );
    }

    if (normalizzaRuolo(operatore.ruolo) !== RUOLI.OPERATORE) {
      return NextResponse.json(
        {
          errore:
            "Solo un operatore autorizzato puo sospendere un account utente.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { utenteId, email, azione } = normalizzaInput(body);

    if (!utenteId && !email) {
      return NextResponse.json(
        {
          errore:
            "Inserisci l'identificativo numerico o l'email dell'utente da sospendere.",
        },
        { status: 400 },
      );
    }

    const risultato =
      azione === "riattiva"
        ? await riattivaUtenteOperatore({ utenteId, email })
        : await sospendiUtenteOperatore({ utenteId, email });

    if (risultato.esito === "NON_TROVATO") {
      return NextResponse.json(
        { errore: risultato.messaggio },
        { status: 404 },
      );
    }

    if (
      risultato.esito === "NON_UTENTE" ||
      risultato.esito === "GIA_SOSPESO" ||
      risultato.esito === "GIA_ATTIVO" ||
      risultato.esito === "CORSA_ATTIVA"
    ) {
      return NextResponse.json(
        {
          errore: risultato.messaggio,
          utente: risultato.utente,
          monitoraggio: risultato.monitoraggio,
          esito: risultato.esito,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        messaggio: risultato.messaggio,
        utente: risultato.utente,
        monitoraggio: risultato.monitoraggio,
        esito: risultato.esito,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[SOSPENSIONE ACCOUNT UTENTE ERROR]", error);

    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 },
    );
  }
}
