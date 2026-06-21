// API Route: POST /api/operatori/mezzi-scarichi
// OP.09: apertura del workflow logistico per il ritiro di un mezzo scarico
// INF-09: accesso riservato all'operatore autenticato

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { programmaRitiroMezzoScarico } from "@/lib/mezzi-scarichi";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          errore:
            "Devi effettuare l'accesso come operatore per programmare il ritiro del mezzo.",
        },
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
            "Solo un operatore autorizzato puo programmare il ritiro di un mezzo scarico.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const mezzoId =
      typeof body?.mezzoId === "string" ? body.mezzoId.trim() : "";
    const noteOperative =
      typeof body?.noteOperative === "string" ? body.noteOperative : "";

    if (!mezzoId) {
      return NextResponse.json(
        { errore: "Seleziona un mezzo valido prima di programmare il ritiro." },
        { status: 400 },
      );
    }

    const gestione = await programmaRitiroMezzoScarico({
      operatoreId: operatore.id,
      mezzoId,
      noteOperative,
    });

    return NextResponse.json(
      {
        messaggio:
          "Ritiro mezzo scarico programmato con successo nella nuova sezione operativa.",
        gestione,
      },
      { status: 201 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status =
      messaggio.includes("non esiste")
        ? 404
        : messaggio.includes("gia una gestione aperta") ||
            messaggio.includes("fuori disponibilita") ||
            messaggio.includes("sotto soglia batteria")
          ? 409
          : 500;

    console.error("[GESTIONE MEZZI SCARICHI OPERATORI ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
