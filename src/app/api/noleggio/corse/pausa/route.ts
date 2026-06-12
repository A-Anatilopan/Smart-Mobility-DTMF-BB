// API Route: POST /api/noleggio/corse/pausa
// UC-02: Pausa Corsa
// UT.06: l'utente autenticato mette in pausa una corsa attiva
// INF-04: la risposta prepara il futuro feedback rapido del flusso di pausa
// INF-09: solo l'utente autenticato proprietario della corsa puo sospenderla

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { mettiCorsaInPausa } from "@/lib/noleggio";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per mettere in pausa la corsa." },
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
            "Solo un utente finale puo mettere in pausa una corsa da questa interfaccia.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const corsaId =
      typeof body?.corsaId === "number" ? body.corsaId : Number(body?.corsaId);

    if (!Number.isInteger(corsaId) || corsaId <= 0) {
      return NextResponse.json(
        { errore: "Seleziona una corsa valida prima di metterla in pausa." },
        { status: 400 },
      );
    }

    const corsa = await mettiCorsaInPausa({
      corsaId,
      utenteId: utente.id,
    });

    return NextResponse.json(
      {
        messaggio: "Corsa messa in pausa con successo.",
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
            messaggio.includes("gia in pausa") ||
            messaggio.includes("gia terminata")
          ? 409
          : 500;

    console.error("[PAUSA CORSA ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
