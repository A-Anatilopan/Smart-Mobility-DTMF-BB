// API Route: PATCH /api/admin/segnalazioni-urbane/[id]/stato
// UC-10: Segnalazione Criticita Urbane
// AP.03: la Pubblica Amministrazione aggiorna lo stato operativo della criticita

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  aggiornaStatoSegnalazioneUrbana,
  normalizzaStatoSegnalazioneUrbana,
} from "@/lib/segnalazioni-urbane";
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
            "Devi effettuare l'accesso come Pubblica Amministrazione per aggiornare questa segnalazione.",
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

    if (normalizzaRuolo(utente.ruolo) !== RUOLI.PUBBLICA_AMMINISTRAZIONE) {
      return NextResponse.json(
        {
          errore:
            "Solo la Pubblica Amministrazione puo aggiornare lo stato di questa segnalazione.",
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

    const body = (await request.json().catch(() => null)) as
      | { stato?: unknown }
      | null;
    const nuovoStato = normalizzaStatoSegnalazioneUrbana(body?.stato);

    if (!nuovoStato) {
      return NextResponse.json(
        { errore: "Seleziona uno stato valido per la segnalazione urbana." },
        { status: 400 },
      );
    }

    const segnalazione = await aggiornaStatoSegnalazioneUrbana({
      segnalazioneId,
      nuovoStato,
    });

    return NextResponse.json(
      {
        messaggio: "Stato della segnalazione urbana aggiornato con successo.",
        segnalazione,
      },
      { status: 200 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status = messaggio.includes("non esiste") ? 404 : 500;

    console.error("[SEGNALAZIONE URBANA PATCH ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
