// API Route: POST /api/noleggio/corse/termine
// UC-03: Termina Corsa
// UT.07: l'utente autenticato termina una corsa attiva o in pausa
// UT.08: la risposta restituisce un primo dettaglio costo minimale
// INF-04: feedback iniziale del termine corsa
// INF-09: solo il proprietario della corsa puo terminarla

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { trovaMezzoPerId } from "@/lib/mezzi";
import { terminaCorsa } from "@/lib/noleggio";
import { prisma } from "@/lib/prisma";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per terminare la corsa." },
        { status: 401 },
      );
    }

    const utente = await verificaSessione(token);

    if (!utente) {
      return NextResponse.json(
        { errore: "Sessione non valida. Effettua di nuovo l'accesso." },
        { status: 401 },
      );
    }

    if (normalizzaRuolo(utente.ruolo) !== RUOLI.UTENTE) {
      return NextResponse.json(
        {
          errore:
            "Solo un utente finale puo terminare una corsa da questa interfaccia.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const corsaId =
      typeof body?.corsaId === "number" ? body.corsaId : Number(body?.corsaId);

    if (!Number.isInteger(corsaId) || corsaId <= 0) {
      return NextResponse.json(
        { errore: "Seleziona una corsa valida prima di terminarla." },
        { status: 400 },
      );
    }

    const corsaEsistente = await prisma.corsa.findUnique({
      where: { id: corsaId },
    });

    if (!corsaEsistente) {
      return NextResponse.json(
        { errore: "Corsa non trovata." },
        { status: 404 },
      );
    }

    if (corsaEsistente.utenteId !== utente.id) {
      return NextResponse.json(
        { errore: "Non puoi terminare una corsa non tua." },
        { status: 403 },
      );
    }

    const mezzo = await trovaMezzoPerId(corsaEsistente.mezzoId);

    const latitudineFine =
      typeof body?.latitudineFine === "number"
        ? body.latitudineFine
        : mezzo?.latitudine;
    const longitudineFine =
      typeof body?.longitudineFine === "number"
        ? body.longitudineFine
        : mezzo?.longitudine;

    const corsa = await terminaCorsa({
      corsaId: corsaEsistente.id,
      utenteId: utente.id,
      posizioneFine:
        typeof latitudineFine === "number" &&
        typeof longitudineFine === "number"
          ? {
              latitudine: latitudineFine,
              longitudine: longitudineFine,
            }
          : null,
    });

    return NextResponse.json(
      {
        messaggio: "Corsa terminata con successo.",
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
      messaggio.includes("Corsa non trovata")
        ? 404
        : messaggio.includes("non tua") ||
            messaggio.includes("gia terminata")
          ? 409
          : 500;

    console.error("[TERMINE CORSA ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
