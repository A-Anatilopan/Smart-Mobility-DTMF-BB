// API Route: POST /api/operatori/mezzi/[id]/sblocco
// OP.10: apertura sessione operativa locale per lo spostamento del mezzo
// INF-04: risposta rapida all'operatore sullo stato dello sblocco richiesto
// INF-09: accesso consentito solo a sessioni autentiche di ruolo operatore

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  apriSessioneOperativaLocaleOperatore,
  normalizzaMotivoSessioneOperativaMezzo,
  normalizzaNoteSessioneOperativaMezzo,
} from "@/lib/operazioni-mezzo-operatore";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          errore:
            "Devi effettuare l'accesso come operatore per sbloccare un mezzo.",
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
            "Solo un operatore autorizzato puo aprire una sessione operativa sul mezzo.",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);

    const motivo = normalizzaMotivoSessioneOperativaMezzo(
      body && typeof body === "object"
        ? (body as { motivo?: unknown }).motivo
        : undefined,
    );
    const note = normalizzaNoteSessioneOperativaMezzo(
      body && typeof body === "object"
        ? (body as { note?: unknown }).note
        : undefined,
    );

    const risultato = await apriSessioneOperativaLocaleOperatore({
      operatoreId: operatore.id,
      mezzoId: id,
      motivo,
      note,
    });

    return NextResponse.json(
      {
        messaggio:
          "Sessione operativa locale aperta con successo. Il mezzo puo essere spostato dall'operatore.",
        sessione: risultato.sessione,
        mezzo: risultato.mezzo,
        distanzaMetri: risultato.distanzaMetri,
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
        : messaggio.includes("non e valido")
          ? 400
          : messaggio.includes("solo quando sei vicino")
            ? 403
            : messaggio.includes("gia una sessione operativa attiva") ||
                messaggio.includes("prenotato, in uso o in pausa")
              ? 409
              : 500;

    console.error("[SBLOCCO LOCALE OPERATORE ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
