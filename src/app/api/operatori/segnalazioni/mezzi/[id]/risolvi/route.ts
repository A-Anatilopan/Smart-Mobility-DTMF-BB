// API Route: PATCH /api/operatori/segnalazioni/mezzi/[id]/risolvi
// UC-09: Segnalazione Guasto Mezzo
// UC-11: Invio Segnalazione
// OP.11: chiusura della segnalazione con riepilogo obbligatorio
// INF-06: il caso viene chiuso mantenendo traccia dell'intervento effettuato
// INF-09: accesso consentito solo a una sessione autenticata di ruolo operatore

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  normalizzaRiepilogoRisoluzioneSegnalazioneMezzo,
  risolviSegnalazioneMezzoOperatore,
} from "@/lib/segnalazioni-mezzo";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          errore:
            "Devi effettuare l'accesso come operatore per chiudere una segnalazione.",
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
            "Solo un operatore autorizzato puo chiudere questa segnalazione.",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const segnalazioneId = Number(id);

    if (!Number.isInteger(segnalazioneId) || segnalazioneId <= 0) {
      return NextResponse.json(
        { errore: "Il riferimento della segnalazione non e valido." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    const riepilogoRisoluzione = normalizzaRiepilogoRisoluzioneSegnalazioneMezzo(
      body && typeof body === "object"
        ? (body as { riepilogoRisoluzione?: unknown }).riepilogoRisoluzione
        : "",
    );

    const segnalazione = await risolviSegnalazioneMezzoOperatore({
      segnalazioneId,
      operatoreId: operatore.id,
      riepilogoRisoluzione,
    });

    return NextResponse.json(
      {
        messaggio: "Segnalazione chiusa con successo.",
        segnalazione,
      },
      { status: 200 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status =
      messaggio.includes("non esiste piu")
        ? 404
        : messaggio.includes("gia chiusa") ||
            messaggio.includes("Puoi chiudere solo una segnalazione") ||
            messaggio.includes("puo chiudere questa segnalazione")
          ? 409
          : messaggio.includes("Inserisci un breve riepilogo") ||
              messaggio.includes("Descrivi la risoluzione")
            ? 400
            : 500;

    console.error("[RISOLUZIONE SEGNALAZIONE ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
