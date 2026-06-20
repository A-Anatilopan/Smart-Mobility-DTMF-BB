// API Route: POST /api/operatori/mezzi/[id]/blocco
// OP.10: chiusura della sessione operativa locale dopo lo spostamento del mezzo
// INF-04: risposta rapida all'operatore con esito e stato ripristinato
// INF-09: accesso consentito solo a sessioni autentiche di ruolo operatore

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  chiudiSessioneOperativaLocaleOperatore,
  MESSAGGIO_SESSIONE_OPERATIVA_GIA_CHIUSA,
  normalizzaNoteSessioneOperativaMezzo,
} from "@/lib/operazioni-mezzo-operatore";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          errore:
            "Devi effettuare l'accesso come operatore per bloccare di nuovo il mezzo.",
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
            "Solo un operatore autorizzato puo chiudere una sessione operativa sul mezzo.",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const noteChiusura = normalizzaNoteSessioneOperativaMezzo(
      body && typeof body === "object"
        ? (body as { noteChiusura?: unknown }).noteChiusura
        : undefined,
    );

    const risultato = await chiudiSessioneOperativaLocaleOperatore({
      operatoreId: operatore.id,
      mezzoId: id,
      noteChiusura,
    });

    return NextResponse.json(
      {
        messaggio:
          "Sessione operativa locale chiusa con successo. Il mezzo e tornato allo stato corretto del servizio.",
        sessione: risultato.sessione,
        mezzo: risultato.mezzo,
        statoRipristinato: risultato.statoRipristinato,
      },
      { status: 200 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status =
      messaggio.includes("non e valido")
        ? 400
        : messaggio === MESSAGGIO_SESSIONE_OPERATIVA_GIA_CHIUSA
          ? 409
          : messaggio.includes("ha aperto la sessione")
            ? 403
            : 500;

    console.error("[BLOCCO LOCALE OPERATORE ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
