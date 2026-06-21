// API Route: PATCH /api/operatori/mezzi-scarichi/[id]/workflow
// OP.09: avanzamento del ciclo di ritiro, ricarica e rimessa del mezzo scarico
// INF-09: accesso riservato all'operatore autenticato

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  avanzaWorkflowMezzoScarico,
  normalizzaAzioneWorkflowMezzoScarico,
} from "@/lib/mezzi-scarichi";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          errore:
            "Devi effettuare l'accesso come operatore per aggiornare questa gestione.",
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
            "Solo un operatore autorizzato puo aggiornare il workflow dei mezzi scarichi.",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const gestioneId = Number(id);

    if (!Number.isInteger(gestioneId) || gestioneId <= 0) {
      return NextResponse.json(
        { errore: "Identificativo gestione non valido." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const azione = normalizzaAzioneWorkflowMezzoScarico(body?.azione);

    if (!azione) {
      return NextResponse.json(
        { errore: "Azione workflow non valida." },
        { status: 400 },
      );
    }

    const gestione = await avanzaWorkflowMezzoScarico({
      gestioneId,
      operatoreId: operatore.id,
      azione,
    });

    return NextResponse.json(
      {
        messaggio: "Workflow mezzo scarico aggiornato con successo.",
        gestione,
      },
      { status: 200 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status =
      messaggio.includes("non e piu attiva")
        ? 404
        : messaggio.includes("Solo l'operatore") ||
            messaggio.includes("non e coerente")
          ? 409
          : 500;

    console.error("[WORKFLOW MEZZI SCARICHI ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
