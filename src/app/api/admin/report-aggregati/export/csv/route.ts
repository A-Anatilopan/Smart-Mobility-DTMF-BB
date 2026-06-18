import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  costruisciReportAggregatoAmministrazione,
  generaCsvReportAggregatoAmministrazione,
} from "@/lib/reportistica-amministrazione";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

// GET /api/admin/report-aggregati/export/csv
// Genera il primo export scaricabile del report aggregato per la PA.
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per esportare il report." },
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
            "Solo la Pubblica Amministrazione puo esportare questa reportistica.",
        },
        { status: 403 },
      );
    }

    const report = await costruisciReportAggregatoAmministrazione();
    const csv = generaCsvReportAggregatoAmministrazione(report);
    const dataRiferimento = new Date().toISOString().slice(0, 10);
    const nomeFile = `report-aggregato-pa-${dataRiferimento}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nomeFile}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[ADMIN REPORT EXPORT CSV ERROR]", error);

    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 },
    );
  }
}
