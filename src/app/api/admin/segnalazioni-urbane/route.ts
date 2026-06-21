// API Route: GET/POST /api/admin/segnalazioni-urbane
// UC-10: Segnalazione Criticita Urbane
// AP.03: la Pubblica Amministrazione registra e consulta criticita territoriali
// INF-09: accesso consentito solo a sessioni autenticate di ruolo amministrativo

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  creaSegnalazioneUrbana,
  normalizzaInputSegnalazioneUrbana,
  recuperaSegnalazioniUrbaneRecenti,
} from "@/lib/segnalazioni-urbane";
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

  return {
    amministrazione,
  };
}

export async function GET(request: NextRequest) {
  try {
    const sessione = await richiediAmministrazione(request);

    if ("errore" in sessione) {
      return sessione.errore;
    }

    const limiteRaw = request.nextUrl.searchParams.get("limite");
    const limite = Number(limiteRaw ?? "20");
    const limiteNormalizzato =
      Number.isFinite(limite) && limite > 0 ? Math.min(Math.trunc(limite), 50) : 20;

    const segnalazioni = await recuperaSegnalazioniUrbaneRecenti(
      limiteNormalizzato,
    );

    return NextResponse.json({ segnalazioni });
  } catch (error) {
    console.error("[SEGNALAZIONI URBANE GET ERROR]", error);

    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessione = await richiediAmministrazione(request);

    if ("errore" in sessione) {
      return sessione.errore;
    }

    const body = await request.json();
    const input = normalizzaInputSegnalazioneUrbana(body);

    if (!input) {
      return NextResponse.json(
        { errore: "Compila correttamente tutti i dati della segnalazione urbana." },
        { status: 400 },
      );
    }

    const segnalazione = await creaSegnalazioneUrbana({
      amministrazioneId: sessione.amministrazione.id,
      categoria: input.categoria,
      titolo: input.titolo,
      descrizione: input.descrizione,
      indirizzo: input.indirizzo,
      latitudine: input.latitudine,
      longitudine: input.longitudine,
    });

    return NextResponse.json(
      {
        messaggio: "Segnalazione urbana registrata con successo.",
        segnalazione,
      },
      { status: 201 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status =
      messaggio.includes("Esiste gia una segnalazione urbana simile")
        ? 409
        : messaggio.includes("Inserisci un titolo") ||
            messaggio.includes("Il titolo deve avere almeno") ||
            messaggio.includes("Inserisci una descrizione valida") ||
            messaggio.includes("Descrivi la criticita con almeno") ||
            messaggio.includes("Per la categoria selezionata descrivi") ||
            messaggio.includes("Se inserisci la posizione") ||
            messaggio.includes("latitudine indicata") ||
            messaggio.includes("longitudine indicata")
          ? 400
          : 500;

    console.error("[SEGNALAZIONE URBANA POST ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
