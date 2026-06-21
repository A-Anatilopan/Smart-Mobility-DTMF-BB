// API Route: DELETE /api/pagamenti/metodi/[metodoPagamentoId]
// UC-06: Gestione Metodi di Pagamento
// UT.10: l'utente autenticato elimina davvero un metodo salvato
// INF-05: il dato viene rimosso dal database, non soltanto marcato come inattivo
// INF-09: accesso consentito solo a una sessione autenticata di ruolo utente

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  eliminaMetodoPagamentoUtente,
  trovaMetodoPagamentoPredefinitoUtente,
} from "@/lib/metodi-pagamento";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

type RouteContext = {
  params: Promise<{
    metodoPagamentoId: string;
  }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per eliminare questo metodo." },
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
            "Solo un utente finale puo eliminare un metodo di pagamento da questa interfaccia.",
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

    await eliminaMetodoPagamentoUtente({
      utenteId: utente.id,
      metodoPagamentoId: id,
    });

    const nuovoPredefinito = await trovaMetodoPagamentoPredefinitoUtente(
      utente.id,
    );

    return NextResponse.json(
      {
        messaggio: "Metodo di pagamento eliminato con successo.",
        metodoPagamentoIdEliminato: id,
        nuovoPredefinitoId: nuovoPredefinito?.id ?? null,
      },
      { status: 200 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status = messaggio.includes("non e disponibile")
      ? 404
      : messaggio.includes("corsa attiva o in pausa")
        ? 409
        : 500;

    console.error("[METODI PAGAMENTO DELETE ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
