// API Route: PATCH /api/operatori/segnalazioni/mezzi/[id]/workflow
// UC-09: Segnalazione Guasto Mezzo
// UC-11: Invio Segnalazione
// OP.11: workflow operativo completo della segnalazione
// INF-06: la gestione dell'anomalia viene aggiornata senza bloccare gli altri flussi
// INF-09: accesso consentito solo a una sessione autenticata di ruolo operatore

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  aggiornaWorkflowSegnalazioneMezzoOperatore,
  normalizzaRiepilogoRisoluzioneSegnalazioneMezzo,
} from "@/lib/segnalazioni-mezzo";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type AzioneWorkflowRequest =
  | "PRENDI_IN_CARICO"
  | "PROGRAMMA_RITIRO"
  | "AVVIA_MANUTENZIONE"
  | "SEGNA_RISOLTA"
  | "PROGRAMMA_RIMESSA_IN_SERVIZIO"
  | "RIMETTI_IN_SERVIZIO";

const MESSAGGI_SUCCESSO: Record<AzioneWorkflowRequest, string> = {
  PRENDI_IN_CARICO: "Segnalazione presa in carico con successo.",
  PROGRAMMA_RITIRO: "Ritiro del mezzo programmato con successo.",
  AVVIA_MANUTENZIONE: "Manutenzione del mezzo avviata con successo.",
  SEGNA_RISOLTA: "Segnalazione segnata come risolta con successo.",
  PROGRAMMA_RIMESSA_IN_SERVIZIO:
    "Rimessa in servizio programmata con successo.",
  RIMETTI_IN_SERVIZIO: "Mezzo rimesso in servizio con successo.",
};

function normalizzaAzioneWorkflow(
  valore: unknown,
): AzioneWorkflowRequest | null {
  if (typeof valore !== "string") {
    return null;
  }

  const azione = valore.trim().toUpperCase();

  return azione in MESSAGGI_SUCCESSO
    ? (azione as AzioneWorkflowRequest)
    : null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          errore:
            "Devi effettuare l'accesso come operatore per aggiornare questa segnalazione.",
        },
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
            "Solo un operatore autorizzato puo aggiornare lo stato di questa segnalazione.",
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

    const body = await request.json().catch(() => null);
    const azione = normalizzaAzioneWorkflow(
      body && typeof body === "object"
        ? (body as { azione?: unknown }).azione
        : null,
    );

    if (!azione) {
      return NextResponse.json(
        { errore: "L'azione richiesta non e valida." },
        { status: 400 },
      );
    }

    const riepilogoRisoluzione =
      azione === "SEGNA_RISOLTA"
        ? normalizzaRiepilogoRisoluzioneSegnalazioneMezzo(
            body && typeof body === "object"
              ? (body as { riepilogoRisoluzione?: unknown })
                  .riepilogoRisoluzione
              : "",
          )
        : "";

    const risultato = await aggiornaWorkflowSegnalazioneMezzoOperatore({
      segnalazioneId,
      operatoreId: operatore.id,
      azione,
      riepilogoRisoluzione,
    });

    return NextResponse.json(
      {
        messaggio: risultato.giaAggiornata
          ? "La segnalazione era gia nello stato richiesto."
          : MESSAGGI_SUCCESSO[azione],
        segnalazione: risultato.segnalazione,
      },
      { status: 200 },
    );
  } catch (error) {
    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore interno del server. Riprovare piu tardi.";

    const status =
      messaggio.includes("non esiste piu")
        ? 404
        : messaggio.includes("non e valida") ||
            messaggio.includes("Inserisci un breve riepilogo") ||
            messaggio.includes("Descrivi la risoluzione")
          ? 400
          : messaggio.includes("gia chiusa") ||
              messaggio.includes("puo continuare la gestione") ||
              messaggio.includes("Puoi ")
            ? 409
            : 500;

    console.error("[WORKFLOW SEGNALAZIONE ERROR]", error);

    return NextResponse.json({ errore: messaggio }, { status });
  }
}
