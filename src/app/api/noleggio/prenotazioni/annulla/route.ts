// API Route: POST /api/noleggio/prenotazioni/annulla
// UC-05: annullamento prenotazione
// UT.04: l'utente autenticato puo liberare un mezzo prenotato ma non ancora avviato
// INF-09: solo il proprietario della prenotazione puo annullarla

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { annullaPrenotazioneNoleggio } from "@/lib/noleggio";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per annullare la prenotazione." },
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
            "Solo un utente finale puo annullare una prenotazione da questa interfaccia.",
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
        { errore: "Seleziona una prenotazione valida prima di annullarla." },
        { status: 400 },
      );
    }

    const prenotazione = await annullaPrenotazioneNoleggio({
      prenotazioneId,
      utenteId: utente.id,
    });

    return NextResponse.json(
      {
        messaggio: "Prenotazione annullata con successo.",
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
      messaggio.includes("Prenotazione non trovata")
        ? 404
        : messaggio.includes("non tua") ||
            messaggio.includes("gia stata annullata") ||
            messaggio.includes("non e piu attiva")
          ? 409
          : 500;

    console.error("[ANNULLA PRENOTAZIONE ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
