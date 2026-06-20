// API Route: PATCH /api/operatori/segnalazioni/mezzi/[id]/presa-in-carico
// UC-09: Segnalazione Guasto Mezzo
// UC-11: Invio Segnalazione
// OP.11: primo micro-step di presa in carico operativa della segnalazione
// INF-06: l'anomalia viene aggiornata senza bloccare gli altri flussi
// INF-09: accesso consentito solo a una sessione autenticata di ruolo operatore

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { prendiInCaricoSegnalazioneMezzoOperatore } from "@/lib/segnalazioni-mezzo";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          errore:
            "Devi effettuare l'accesso come operatore per aggiornare una segnalazione.",
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
            "Solo un operatore autorizzato puo aggiornare lo stato di questa segnalazione.",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const segnalazioneId = Number(id);

    if (!Number.isInteger(segnalazioneId) || segnalazioneId <= 0) {
      return NextResponse.json(
        { errore: "Il riferimento della segnalazione non e valido." },
        { status: 400 },
      );
    }

    const risultato = await prendiInCaricoSegnalazioneMezzoOperatore({
      segnalazioneId,
      operatoreId: operatore.id,
    });

    return NextResponse.json(
      {
        messaggio: risultato.giaInCarico
          ? "La segnalazione risulta gia presa in carico."
          : "Segnalazione presa in carico con successo.",
        segnalazione: risultato.segnalazione,
      },
      { status: 200 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status =
      messaggio.includes("non esiste piu")
        ? 404
        : messaggio.includes("gia chiusa") ||
            messaggio.includes("gia presa in carico da")
          ? 409
          : 500;

    console.error("[PRESA IN CARICO SEGNALAZIONE ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
