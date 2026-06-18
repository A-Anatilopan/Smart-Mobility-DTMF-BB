import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { costruisciReportAggregatoAmministrazione } from "@/lib/reportistica-amministrazione";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

// GET /api/admin/report-aggregati
// Restituisce il report sintetico aggiornato per la PA.
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per consultare i report." },
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
            "Solo la Pubblica Amministrazione puo consultare questa reportistica.",
        },
        { status: 403 },
      );
    }

    const report = await costruisciReportAggregatoAmministrazione();

    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN REPORT AGGREGATI ERROR]", error);

    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 },
    );
  }
}
