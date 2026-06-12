// API Route: POST /api/noleggio/prenotazioni/scadenza
// UC-05.2: TempoPrenotazioneScaduto
// INF-08: il record deve essere riallineato subito quando la prenotazione scade

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { scadePrenotazioneNoleggio } from "@/lib/noleggio";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per sincronizzare la prenotazione." },
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
            "Solo un utente finale puo sincronizzare la scadenza di una propria prenotazione.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const prenotazioneId =
      typeof body?.prenotazioneId === "number"
        ? body.prenotazioneId
        : Number(body?.prenotazioneId);

    if (!Number.isInteger(prenotazioneId) || prenotazioneId <= 0) {
      return NextResponse.json(
        { errore: "Prenotazione non valida." },
        { status: 400 },
      );
    }

    const prenotazione = await scadePrenotazioneNoleggio({
      prenotazioneId,
      utenteId: utente.id,
    });

    return NextResponse.json(
      {
        messaggio: "Prenotazione scaduta e sincronizzata con successo.",
        prenotazione,
      },
      { status: 200 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status =
      messaggio.includes("Prenotazione non trovata") ||
      messaggio.includes("non valida")
        ? 404
        : messaggio.includes("non tua") ||
            messaggio.includes("non e piu attiva") ||
            messaggio.includes("non e ancora scaduta")
          ? 409
          : 500;

    console.error("[SCADENZA PRENOTAZIONE ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
