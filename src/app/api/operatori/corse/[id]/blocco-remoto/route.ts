// API Route: POST /api/operatori/corse/[id]/blocco-remoto
// OP.10: chiusura remota assistita di una corsa aperta o in pausa
// INF-04: risposta rapida e tracciabile per supporto operativo
// INF-09: accesso riservato al ruolo operatore

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { trovaMezzoPerId } from "@/lib/mezzi";
import { terminaCorsaDaOperatore } from "@/lib/noleggio";
import { prisma } from "@/lib/prisma";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function leggiNotaOperatore(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "";
  }

  const nota = (body as { notaOperatore?: unknown }).notaOperatore;

  return typeof nota === "string" ? nota.trim() : "";
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          errore:
            "Devi effettuare l'accesso come operatore per bloccare il mezzo da remoto.",
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
            "Solo un operatore autorizzato puo chiudere una corsa da remoto.",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const corsaId = Number(id);

    if (!Number.isInteger(corsaId) || corsaId <= 0) {
      return NextResponse.json(
        { errore: "Seleziona una corsa valida prima di bloccare il mezzo." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    const notaOperatore = leggiNotaOperatore(body);
    const corsaEsistente = await prisma.corsa.findUnique({
      where: { id: corsaId },
    });

    if (!corsaEsistente) {
      return NextResponse.json(
        { errore: "Corsa non trovata." },
        { status: 404 },
      );
    }

    const mezzo = await trovaMezzoPerId(corsaEsistente.mezzoId);

    const corsa = await terminaCorsaDaOperatore({
      corsaId,
      operatoreId: operatore.id,
      notaOperatore,
      posizioneFine: mezzo
        ? {
            latitudine: mezzo.latitudine,
            longitudine: mezzo.longitudine,
          }
        : null,
    });

    return NextResponse.json(
      {
        messaggio:
          "Corsa chiusa da remoto con successo. Il mezzo e tornato disponibile per il servizio.",
        corsa,
      },
      { status: 200 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status =
      messaggio.includes("nota operatore")
        ? 400
        : messaggio.includes("Corsa non trovata")
          ? 404
          : messaggio.includes("solo per corse ancora attive")
            ? 409
            : 500;

    console.error("[BLOCCO REMOTO OPERATORE ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
