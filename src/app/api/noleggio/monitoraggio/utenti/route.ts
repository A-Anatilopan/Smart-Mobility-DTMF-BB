// API Route: POST /api/noleggio/monitoraggio/utenti
// UC-25: Monitoraggio Noleggio
// OP.05: l'operatore consulta lo stato corrente di noleggio di un utente
// INF-09: accesso consentito solo a una sessione autenticata di ruolo operatore

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { mezziMock } from "@/lib/mappa/mock-data";
import { monitoraNoleggioUtente } from "@/lib/noleggio";
import { prisma } from "@/lib/prisma";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

function normalizzaInputRicercaUtente(body: unknown): {
  utenteId: number | null;
  email: string;
} {
  if (!body || typeof body !== "object") {
    return {
      utenteId: null,
      email: "",
    };
  }

  const candidate = body as {
    utenteId?: number | string;
    email?: string;
  };

  const utenteId =
    typeof candidate.utenteId === "number"
      ? candidate.utenteId
      : Number(candidate.utenteId);

  return {
    utenteId: Number.isInteger(utenteId) && utenteId > 0 ? utenteId : null,
    email: typeof candidate.email === "string" ? candidate.email.trim() : "",
  };
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per monitorare i noleggi." },
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
            "Solo un operatore autorizzato puo monitorare lo stato noleggio degli utenti.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { utenteId, email } = normalizzaInputRicercaUtente(body);

    if (!utenteId && !email) {
      return NextResponse.json(
        {
          errore:
            "Inserisci l'identificativo numerico o l'email dell'utente da monitorare.",
        },
        { status: 400 },
      );
    }

    const utente = await prisma.utente.findFirst({
      where: utenteId
        ? { id: utenteId }
        : {
            email,
          },
      select: {
        id: true,
      },
    });

    if (!utente) {
      return NextResponse.json(
        { errore: "Utente non trovato." },
        { status: 404 },
      );
    }

    const monitoraggio = await monitoraNoleggioUtente(utente.id);

    if (!monitoraggio) {
      return NextResponse.json(
        { errore: "Utente non trovato." },
        { status: 404 },
      );
    }

    const mezzoPrenotato = monitoraggio.prenotazione
      ? mezziMock.find(
          (mezzoCorrente) =>
            mezzoCorrente.id === monitoraggio.prenotazione?.mezzoId,
        )
      : null;

    const mezzoInCorsa = monitoraggio.corsa
      ? mezziMock.find(
          (mezzoCorrente) => mezzoCorrente.id === monitoraggio.corsa?.mezzoId,
        )
      : null;

    return NextResponse.json(
      {
        messaggio: "Monitoraggio noleggio recuperato con successo.",
        monitoraggio: {
          ...monitoraggio,
          prenotazione: monitoraggio.prenotazione
            ? {
                ...monitoraggio.prenotazione,
                mezzo: mezzoPrenotato
                  ? {
                      id: mezzoPrenotato.id,
                      codice: mezzoPrenotato.codice,
                      tipo: mezzoPrenotato.tipo,
                      modello: mezzoPrenotato.modello,
                      areaServizioNome: mezzoPrenotato.areaServizioNome,
                    }
                  : null,
              }
            : null,
          corsa: monitoraggio.corsa
            ? {
                ...monitoraggio.corsa,
                mezzo: mezzoInCorsa
                  ? {
                      id: mezzoInCorsa.id,
                      codice: mezzoInCorsa.codice,
                      tipo: mezzoInCorsa.tipo,
                      modello: mezzoInCorsa.modello,
                      areaServizioNome: mezzoInCorsa.areaServizioNome,
                    }
                  : null,
              }
            : null,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[MONITORAGGIO NOLEGGIO OPERATORE ERROR]", error);

    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 },
    );
  }
}
