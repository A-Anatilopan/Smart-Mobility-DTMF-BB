// API Route: GET /api/pagamenti/metodi
// API Route: POST /api/pagamenti/metodi
// UC-06: Gestione Metodi di Pagamento
// UT.10: l'utente autenticato consulta e salva i propri metodi di pagamento
// INF-05: nessun numero completo carta o CVV viene salvato nel database
// INF-09: accesso consentito solo a una sessione autenticata di ruolo utente

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  elencaMetodiPagamentoUtente,
  salvaMetodoPagamentoUtente,
} from "@/lib/metodi-pagamento";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

async function richiediUtenteFinaleDaSessione(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;

  if (!token) {
    return {
      errore: NextResponse.json(
        { errore: "Devi effettuare l'accesso per gestire i metodi di pagamento." },
        { status: 401 },
      ),
    };
  }

  const utente = await verificaSessione(token);

  if (!utente) {
    return {
      errore: NextResponse.json(
        { errore: "Sessione non valida. Effettua di nuovo l'accesso." },
        { status: 401 },
      ),
    };
  }

  if (normalizzaRuolo(utente.ruolo) !== RUOLI.UTENTE) {
    return {
      errore: NextResponse.json(
        {
          errore:
            "Solo un utente finale puo gestire i metodi di pagamento da questa interfaccia.",
        },
        { status: 403 },
      ),
    };
  }

  return { utente };
}

export async function GET(request: NextRequest) {
  try {
    const sessione = await richiediUtenteFinaleDaSessione(request);

    if ("errore" in sessione) {
      return sessione.errore;
    }

    const metodi = await elencaMetodiPagamentoUtente(sessione.utente.id);

    return NextResponse.json(
      {
        metodi,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[METODI PAGAMENTO LIST ERROR]", error);

    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessione = await richiediUtenteFinaleDaSessione(request);

    if ("errore" in sessione) {
      return sessione.errore;
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { errore: "Inserisci correttamente i dati del metodo di pagamento." },
        { status: 400 },
      );
    }

    const metodo = await salvaMetodoPagamentoUtente({
      utenteId: sessione.utente.id,
      circuito: (body as { circuito?: unknown }).circuito,
      intestatario: (body as { intestatario?: unknown }).intestatario,
      numeroCarta: (body as { numeroCarta?: unknown }).numeroCarta,
      scadenzaMese: (body as { scadenzaMese?: unknown }).scadenzaMese,
      scadenzaAnno: (body as { scadenzaAnno?: unknown }).scadenzaAnno,
      alias: (body as { alias?: unknown }).alias,
      impostaComePredefinito: (body as { impostaComePredefinito?: unknown })
        .impostaComePredefinito === true,
    });

    return NextResponse.json(
      {
        messaggio: "Metodo di pagamento salvato con successo.",
        metodo,
      },
      { status: 201 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status =
      messaggio.includes("valido") ||
      messaggio.includes("scadenza") ||
      messaggio.includes("intestatario") ||
      messaggio.includes("gia un metodo di pagamento attivo")
        ? 400
        : 500;

    console.error("[METODI PAGAMENTO CREATE ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
