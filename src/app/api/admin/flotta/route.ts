import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { mezziMock } from "@/lib/mappa/mock-data";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

// GET /api/admin/flotta
// Restituisce il campione flotta aggiornato per la dashboard istituzionale.
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per consultare la flotta." },
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

    if (normalizzaRuolo(utente.ruolo) !== RUOLI.PUBBLICA_AMMINISTRAZIONE) {
      return NextResponse.json(
        {
          errore:
            "Solo la Pubblica Amministrazione puo consultare questa vista della flotta.",
        },
        { status: 403 },
      );
    }

    const mezzi = await risolviMezziConStatoDinamico(mezziMock);

    return NextResponse.json({ mezzi }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN FLOTTA LIVE ERROR]", error);

    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 },
    );
  }
}
