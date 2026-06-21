// API Route: POST /api/segnalazioni/mezzi
// UC-09: Segnalazione Guasto Mezzo
// UC-11: Invio Segnalazione
// UT.09: l'utente autenticato segnala un problema riscontrato su un mezzo
// INF-06: il sistema registra l'anomalia senza bloccare il resto del flusso
// INF-09: solo utenti autenticati e con ruolo corretto possono inviare la segnalazione

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { trovaMezzoPerId } from "@/lib/mezzi";
import { creaSegnalazioneMezzoUtente, normalizzaInputSegnalazioneMezzoUtente } from "@/lib/segnalazioni-mezzo";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per inviare una segnalazione." },
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
            "Solo un utente finale puo inviare questa segnalazione da questa interfaccia.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const input = normalizzaInputSegnalazioneMezzoUtente(body);

    if (!input) {
      return NextResponse.json(
        { errore: "Compila correttamente tutti i dati della segnalazione." },
        { status: 400 },
      );
    }

    if (!input.mezzoId) {
      return NextResponse.json(
        { errore: "Seleziona un mezzo valido prima di inviare la segnalazione." },
        { status: 400 },
      );
    }

    if (!input.mezzoCodice) {
      return NextResponse.json(
        { errore: "Il codice del mezzo selezionato non e valido." },
        { status: 400 },
      );
    }

    const mezzo = await trovaMezzoPerId(input.mezzoId);

    if (!mezzo) {
      return NextResponse.json(
        { errore: "Il mezzo selezionato non esiste." },
        { status: 404 },
      );
    }

    if (mezzo.codice.toUpperCase() !== input.mezzoCodice) {
      return NextResponse.json(
        {
          errore:
            "I dati del mezzo non sono coerenti. Aggiorna la schermata e riprova.",
        },
        { status: 409 },
      );
    }

    const segnalazione = await creaSegnalazioneMezzoUtente({
      utenteId: utente.id,
      mezzoId: mezzo.id,
      mezzoCodice: mezzo.codice,
      categoria: input.categoria,
      descrizione: input.descrizione,
    });

    return NextResponse.json(
      {
        messaggio: "Segnalazione inviata con successo.",
        segnalazione,
      },
      { status: 201 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status =
      messaggio.includes("Hai gia inviato una segnalazione simile") ||
      messaggio.includes("I dati del mezzo non sono coerenti")
        ? 409
        : messaggio.includes("Inserisci una descrizione valida") ||
            messaggio.includes("Descrivi il problema con almeno") ||
            messaggio.includes("Per la categoria selezionata descrivi")
          ? 400
          : 500;

    console.error("[SEGNALAZIONE MEZZO UTENTE ERROR]", error);

    return NextResponse.json(
      { errore: messaggio },
      { status },
    );
  }
}
