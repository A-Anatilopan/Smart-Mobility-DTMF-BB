// API Route: PATCH /api/pagamenti/metodi/[metodoPagamentoId]/predefinito
// UC-06: Gestione Metodi di Pagamento
// UT.10: l'utente autenticato imposta il proprio metodo predefinito
// INF-05: il sistema aggiorna solo il riferimento logico, senza esporre dati sensibili
// INF-09: accesso consentito solo a una sessione autenticata di ruolo utente

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { impostaMetodoPagamentoPredefinito } from "@/lib/metodi-pagamento";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

type RouteContext = {
  params: Promise<{
    metodoPagamentoId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          errore:
            "Devi effettuare l'accesso per scegliere il metodo di pagamento predefinito.",
        },
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
            "Solo un utente finale puo scegliere il metodo di pagamento predefinito da questa interfaccia.",
        },
        { status: 403 },
      );
    }

    const { metodoPagamentoId } = await context.params;
    const id = Number(metodoPagamentoId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { errore: "Il metodo di pagamento selezionato non e valido." },
        { status: 400 },
      );
    }

    const metodo = await impostaMetodoPagamentoPredefinito({
      utenteId: utente.id,
      metodoPagamentoId: id,
    });

    return NextResponse.json(
      {
        messaggio: "Metodo di pagamento predefinito aggiornato con successo.",
        metodo,
      },
      { status: 200 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status = messaggio.includes("non e disponibile") ? 404 : 500;

    console.error("[METODI PAGAMENTO PREDEFINITO ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
