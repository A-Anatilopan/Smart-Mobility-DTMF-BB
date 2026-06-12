// API Route: POST /api/noleggio/corse/ripresa
// UC-02: Ripresa Corsa dopo pausa
// UT.06: l'utente autenticato puo riprendere una corsa messa in pausa
// UT.08: il calcolo dei costi mantiene separati utilizzo effettivo e pausa
// INF-04 / INF-09: feedback rapido e protezione per utente proprietario

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { riprendiCorsaInPausa } from "@/lib/noleggio";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per riprendere la corsa." },
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
            "Solo un utente finale puo riprendere una corsa da questa interfaccia.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const corsaId =
      typeof body?.corsaId === "number" ? body.corsaId : Number(body?.corsaId);

    if (!Number.isInteger(corsaId) || corsaId <= 0) {
      return NextResponse.json(
        { errore: "Seleziona una corsa valida prima di riprenderla." },
        { status: 400 },
      );
    }

    const corsa = await riprendiCorsaInPausa({
      corsaId,
      utenteId: utente.id,
    });

    return NextResponse.json(
      {
        messaggio: "Corsa ripresa con successo.",
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
            messaggio.includes("non e attualmente in pausa") ||
            messaggio.includes("gia terminata")
          ? 409
          : 500;

    console.error("[RIPRESA CORSA ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
