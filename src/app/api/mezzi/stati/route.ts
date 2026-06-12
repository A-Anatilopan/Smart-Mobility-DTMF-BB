// API Route: POST /api/mezzi/stati
// Restituisce lo stato effettivo dei mezzi richiesti senza ricaricare l'intera
// pagina, cosi le mappe possono aggiornare marker e legenda senza perdere zoom.

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { mezziMock } from "@/lib/mappa/mock-data";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";

function normalizzaMezzoIds(body: unknown): string[] {
  if (!body || typeof body !== "object") {
    return [];
  }

  const mezzoIds = (body as { mezzoIds?: unknown }).mezzoIds;

  if (!Array.isArray(mezzoIds)) {
    return [];
  }

  return mezzoIds
    .filter((valore): valore is string => typeof valore === "string")
    .map((valore) => valore.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per consultare lo stato dei mezzi." },
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

    const body = await request.json();
    const mezzoIds = normalizzaMezzoIds(body);

    if (mezzoIds.length === 0) {
      return NextResponse.json(
        { errore: "Seleziona almeno un mezzo valido." },
        { status: 400 },
      );
    }

    const mezziRichiesti = mezziMock.filter((mezzo) => mezzoIds.includes(mezzo.id));
    const mezziRisolti = await risolviMezziConStatoDinamico(mezziRichiesti);

    return NextResponse.json(
      {
        mezzi: mezziRisolti.map((mezzo) => ({
          id: mezzo.id,
          stato: mezzo.stato,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[STATI MEZZI MAPPA ERROR]", error);

    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 },
    );
  }
}
