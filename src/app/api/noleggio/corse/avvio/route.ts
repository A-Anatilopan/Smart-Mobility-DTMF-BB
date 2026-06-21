// API Route: POST /api/noleggio/corse/avvio
// UC-01: Avvia Corsa
// UT.05: l'utente autenticato trasforma una prenotazione valida in corsa
// INF-04: la risposta prepara il flusso operativo di avvio corsa
// INF-09: solo l'utente autenticato proprietario della prenotazione puo avviare

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { calcolaDistanzaMetri } from "@/lib/geolocalizzazione";
import { posizioneUtenteMappaMock } from "@/lib/mappa/mock-data";
import { richiediMetodoPagamentoAttivoUtente } from "@/lib/metodi-pagamento";
import { trovaMezzoPerId } from "@/lib/mezzi";
import {
  avviaCorsaDaPrenotazione,
  avviaCorsaDiretta,
} from "@/lib/noleggio";
import { prisma } from "@/lib/prisma";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

const DISTANZA_MASSIMA_AVVIO_METRI = 50;
const GERARCHIA_PATENTI = ["AM", "A1", "A2", "A", "B"] as const;

function trovaIndicePatente(categoria: string | null | undefined): number {
  if (!categoria) {
    return -1;
  }

  return GERARCHIA_PATENTI.indexOf(
    categoria as (typeof GERARCHIA_PATENTI)[number],
  );
}

function patenteCompatibile(
  patenteUtente: string | null | undefined,
  patenteRichiesta: string,
): boolean {
  if (patenteRichiesta === "Nessuna") {
    return true;
  }

  return trovaIndicePatente(patenteUtente) >= trovaIndicePatente(patenteRichiesta);
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per avviare una corsa." },
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

    if (normalizzaRuolo(utente.ruolo) !== RUOLI.UTENTE) {
      return NextResponse.json(
        {
          errore:
            "Solo un utente finale puo avviare una corsa da questa interfaccia.",
        },
        { status: 403 },
      );
    }

    // UT.10: anche l'avvio diretto o da prenotazione richiede almeno un
    // metodo di pagamento attivo, altrimenti la corsa non puo partire.
    const metodoPagamentoAttivo = await richiediMetodoPagamentoAttivoUtente(
      utente.id,
    );

    const body = await request.json();
    const mezzoId = typeof body?.mezzoId === "string" ? body.mezzoId.trim() : "";
    const prenotazioneId =
      typeof body?.prenotazioneId === "number"
        ? body.prenotazioneId
        : Number(body?.prenotazioneId);

    const prenotazioneValida =
      Number.isInteger(prenotazioneId) && prenotazioneId > 0
        ? await prisma.prenotazione.findUnique({
            where: { id: prenotazioneId },
          })
        : null;

    if (prenotazioneValida && prenotazioneValida.utenteId !== utente.id) {
      return NextResponse.json(
        {
          errore:
            "Non puoi avviare una corsa partendo da una prenotazione non tua.",
        },
        { status: 403 },
      );
    }

    if (!prenotazioneValida && !mezzoId) {
      return NextResponse.json(
        {
          errore:
            "Seleziona una prenotazione valida oppure avvia direttamente un mezzo disponibile.",
        },
        { status: 400 },
      );
    }

    const mezzo = await trovaMezzoPerId(
      prenotazioneValida ? prenotazioneValida.mezzoId : mezzoId,
    );

    if (!mezzo) {
      return NextResponse.json(
        {
          errore: prenotazioneValida
            ? "Il mezzo associato alla prenotazione non e disponibile."
            : "Il mezzo selezionato non esiste.",
        },
        { status: 404 },
      );
    }

    if (!prenotazioneValida && mezzo.stato !== "DISPONIBILE") {
      return NextResponse.json(
        {
          errore:
            "Il mezzo selezionato non e disponibile per un avvio diretto della corsa.",
        },
        { status: 409 },
      );
    }

    if (
      !patenteCompatibile(
        utente.categoriaPatente,
        mezzo.patenteRichiesta,
      )
    ) {
      return NextResponse.json(
        {
          errore:
            "La tua patente non e compatibile con il mezzo selezionato.",
        },
        { status: 403 },
      );
    }

    // In questa fase la posizione utente e ancora mockata: applichiamo comunque
    // il vincolo lato server, cosi l'avvio corsa resta coerente con la regola
    // di business anche prima dell'introduzione della geolocalizzazione reale.
    const distanzaDalMezzo = calcolaDistanzaMetri(posizioneUtenteMappaMock, {
      latitudine: mezzo.latitudine,
      longitudine: mezzo.longitudine,
    });

    if (distanzaDalMezzo > DISTANZA_MASSIMA_AVVIO_METRI) {
      return NextResponse.json(
        {
          errore:
            "Puoi avviare la corsa solo quando sei vicino al mezzo selezionato.",
        },
        { status: 403 },
      );
    }

    const posizioneInizio = {
      latitudine: mezzo.latitudine,
      longitudine: mezzo.longitudine,
    };
    const corsa = prenotazioneValida
      ? await avviaCorsaDaPrenotazione({
          prenotazioneId: prenotazioneValida.id,
          posizioneInizio,
          metodoPagamento: {
            circuito: metodoPagamentoAttivo.circuito,
            ultime4: metodoPagamentoAttivo.ultime4,
            alias: metodoPagamentoAttivo.alias,
          },
        })
      : await avviaCorsaDiretta({
          utenteId: utente.id,
          mezzoId: mezzo.id,
          posizioneInizio,
          metodoPagamento: {
            circuito: metodoPagamentoAttivo.circuito,
            ultime4: metodoPagamentoAttivo.ultime4,
            alias: metodoPagamentoAttivo.alias,
          },
        });

    return NextResponse.json(
      {
        messaggio: prenotazioneValida
          ? "Corsa avviata con successo."
          : "Corsa avviata direttamente dal mezzo con successo.",
        corsa: {
          ...corsa,
          mezzo: {
            id: mezzo.id,
            codice: mezzo.codice,
            tipo: mezzo.tipo,
            modello: mezzo.modello,
            areaServizioNome: mezzo.areaServizioNome,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status =
      messaggio.includes("Prenotazione non trovata")
        ? 404
        : messaggio.includes("non e piu attiva") ||
            messaggio.includes("e scaduta") ||
            messaggio.includes("gia una corsa attiva") ||
            messaggio.includes("gia una prenotazione attiva") ||
            messaggio.includes("gia prenotato") ||
            messaggio.includes("gia coinvolto in una corsa attiva")
          ? 409
          : messaggio.includes("Devi salvare almeno un metodo di pagamento attivo")
            ? 403
          : 500;

    console.error("[AVVIO CORSA ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
