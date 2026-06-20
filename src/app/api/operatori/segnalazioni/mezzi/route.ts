// API Route: POST /api/operatori/segnalazioni/mezzi
// UC-09: Segnalazione Guasto Mezzo
// UC-11: Invio Segnalazione
// OP.03: l'operatore autenticato segnala un malfunzionamento su un mezzo
// INF-06: il sistema registra l'anomalia senza bloccare il resto del flusso
// INF-09: accesso consentito solo a una sessione autenticata di ruolo operatore

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { mezziMock } from "@/lib/mappa/mock-data";
import {
  creaSegnalazioneMezzoOperatore,
  normalizzaInputSegnalazioneMezzoOperatore,
} from "@/lib/segnalazioni-mezzo";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          errore:
            "Devi effettuare l'accesso come operatore per inviare una segnalazione.",
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
            "Solo un operatore autorizzato puo inviare questa segnalazione da questa interfaccia.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const input = normalizzaInputSegnalazioneMezzoOperatore(body);

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

    const mezzo = mezziMock.find((mezzoCorrente) => mezzoCorrente.id === input.mezzoId);

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

    const segnalazione = await creaSegnalazioneMezzoOperatore({
      utenteId: operatore.id,
      mezzoId: mezzo.id,
      mezzoCodice: mezzo.codice,
      categoria: input.categoria,
      descrizione: input.descrizione,
    });

    return NextResponse.json(
      {
        messaggio: "Segnalazione operativa inviata con successo.",
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
      messaggio.includes("Hai gia inviato una segnalazione operativa simile") ||
      messaggio.includes("I dati del mezzo non sono coerenti")
        ? 409
        : messaggio.includes("Inserisci una descrizione valida") ||
            messaggio.includes("Descrivi il problema con almeno") ||
            messaggio.includes("Per la categoria selezionata descrivi")
          ? 400
          : 500;

    console.error("[SEGNALAZIONE MEZZO OPERATORE ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
