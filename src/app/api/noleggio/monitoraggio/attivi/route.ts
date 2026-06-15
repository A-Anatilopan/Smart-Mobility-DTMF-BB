import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { mezziMock } from "@/lib/mappa/mock-data";
import { trovaRiepilogoMonitoraggioOperatore } from "@/lib/noleggio";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

// GET /api/noleggio/monitoraggio/attivi
// Elenco sintetico di prenotazioni e corse realmente aperte.
export async function GET(request: NextRequest) {
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
            "Solo un operatore autorizzato puo consultare il monitoraggio attivo.",
        },
        { status: 403 },
      );
    }

    const elenco = await trovaRiepilogoMonitoraggioOperatore(12);

    const monitoraggi = elenco.map((voce) => {
      const mezzoId = voce.corsa?.mezzoId ?? voce.prenotazione?.mezzoId ?? null;
      const mezzo = mezzoId
        ? mezziMock.find((mezzoCorrente) => mezzoCorrente.id === mezzoId) ?? null
        : null;

      return {
        ...voce,
        prenotazione: voce.prenotazione
          ? {
              ...voce.prenotazione,
              mezzo: mezzo
                ? {
                    id: mezzo.id,
                    codice: mezzo.codice,
                    tipo: mezzo.tipo,
                    modello: mezzo.modello,
                    areaServizioNome: mezzo.areaServizioNome,
                  }
                : null,
            }
          : null,
        corsa: voce.corsa
          ? {
              ...voce.corsa,
              mezzo: mezzo
                ? {
                    id: mezzo.id,
                    codice: mezzo.codice,
                    tipo: mezzo.tipo,
                    modello: mezzo.modello,
                    areaServizioNome: mezzo.areaServizioNome,
                  }
                : null,
            }
          : null,
      };
    });

    return NextResponse.json(
      {
        messaggio: "Elenco noleggi aperti recuperato con successo.",
        monitoraggi,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[MONITORAGGIO ATTIVO OPERATORE ERROR]", error);

    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 },
    );
  }
}
