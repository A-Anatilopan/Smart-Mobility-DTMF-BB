// API Route: GET /api/admin/anagrafiche
// UC-20: Consultare Anagrafica e Patenti
// AP.06: la Pubblica Amministrazione legge anagrafiche utenti e stato patente
// INF-09: accesso consentito solo a sessioni autenticate di ruolo amministrativo

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  recuperaAnagraficaUtenteAmministrazione,
  recuperaAnagraficheUtentiAmministrazione,
} from "@/lib/anagrafiche-amministrazione";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

type SessioneAmministrazioneResult =
  | {
      amministrazione: NonNullable<Awaited<ReturnType<typeof verificaSessione>>>;
      errore?: never;
    }
  | { amministrazione?: never; errore: NextResponse<{ errore: string }> };

async function richiediAmministrazione(
  request: NextRequest,
): Promise<SessioneAmministrazioneResult> {
  const token = request.cookies.get("session_token")?.value;

  if (!token) {
    return {
      errore: NextResponse.json(
        {
          errore:
            "Devi effettuare l'accesso come Pubblica Amministrazione per usare questa sezione.",
        },
        { status: 401 },
      ),
    };
  }

  const amministrazione = await verificaSessione(token);

  if (!amministrazione) {
    return {
      errore: NextResponse.json(
        { errore: "Sessione non valida. Effettua di nuovo l'accesso." },
        { status: 401 },
      ),
    };
  }

  if (normalizzaRuolo(amministrazione.ruolo) !== RUOLI.PUBBLICA_AMMINISTRAZIONE) {
    return {
      errore: NextResponse.json(
        {
          errore:
            "Solo la Pubblica Amministrazione puo usare questa interfaccia.",
        },
        { status: 403 },
      ),
    };
  }

  return { amministrazione };
}

export async function GET(request: NextRequest) {
  try {
    const sessione = await richiediAmministrazione(request);

    if ("errore" in sessione) {
      return sessione.errore;
    }

    const utenteIdRaw = request.nextUrl.searchParams.get("utenteId");

    if (utenteIdRaw) {
      const utenteId = Number(utenteIdRaw);

      if (!Number.isInteger(utenteId) || utenteId <= 0) {
        return NextResponse.json(
          { errore: "L'identificativo utente richiesto non e valido." },
          { status: 400 },
        );
      }

      const anagrafica = await recuperaAnagraficaUtenteAmministrazione(utenteId);

      if (!anagrafica) {
        return NextResponse.json(
          {
            errore:
              "L'anagrafica richiesta non e stata trovata oppure non e accessibile da questa sezione.",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({ anagrafica });
    }

    const anagrafiche = await recuperaAnagraficheUtentiAmministrazione();

    return NextResponse.json({ anagrafiche });
  } catch (error) {
    console.error("[ANAGRAFICHE ADMIN GET ERROR]", error);

    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 },
    );
  }
}
