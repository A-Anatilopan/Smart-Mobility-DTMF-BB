import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { costruisciReportTratteCo2Amministrazione } from "@/lib/tratte-co2-amministrazione";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

// GET /api/admin/tratte-e-co2
// Restituisce il quadro iniziale delle tratte ricorrenti e della CO2 risparmiata.
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per consultare questa sezione." },
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
            "Solo la Pubblica Amministrazione puo consultare l'analisi tratte e CO2.",
        },
        { status: 403 },
      );
    }

    const filtroTipoMezzo =
      request.nextUrl.searchParams.get("tipoMezzo") ?? undefined;
    const report = await costruisciReportTratteCo2Amministrazione({
      filtroTipoMezzo,
    });

    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN TRATTE CO2 ERROR]", error);

    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 },
    );
  }
}
