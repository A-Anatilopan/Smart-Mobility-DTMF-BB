// API Route: POST /api/noleggio/prenotazioni
// UC-05: Prenota Mezzo
// UT.04: l'utente autenticato prenota un mezzo disponibile
// INF-07: flusso iniziale semplice e diretto
// INF-08: niente doppia prenotazione sullo stesso mezzo o per lo stesso utente

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import { richiediMetodoPagamentoAttivoUtente } from "@/lib/metodi-pagamento";
import { trovaMezzoPerId } from "@/lib/mezzi";
import { creaPrenotazioneNoleggio } from "@/lib/noleggio";
import { patenteCompatibile, patenteScaduta } from "@/lib/patenti";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { errore: "Devi effettuare l'accesso per prenotare un mezzo." },
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
            "Solo un utente finale puo prenotare un mezzo da questa interfaccia.",
        },
        { status: 403 },
      );
    }

    // UT.10: prima di creare una prenotazione l'utente deve aver gia salvato
    // almeno un metodo di pagamento attivo, cosi il flusso resta coerente con
    // l'addebito automatico richiesto dal dominio.
    await richiediMetodoPagamentoAttivoUtente(utente.id);

    const body = await request.json();
    const mezzoId =
      typeof body?.mezzoId === "string" ? body.mezzoId.trim() : "";

    if (!mezzoId) {
      return NextResponse.json(
        { errore: "Seleziona un mezzo valido prima di prenotare." },
        { status: 400 },
      );
    }

    // In questa fase il catalogo mezzi vive ancora nel dataset mock di M-02:
    // la route verifica che il mezzo esista e sia adatto a una prenotazione.
    const mezzo = await trovaMezzoPerId(mezzoId);

    if (!mezzo) {
      return NextResponse.json(
        { errore: "Il mezzo selezionato non esiste." },
        { status: 404 },
      );
    }

    if (mezzo.stato !== "DISPONIBILE") {
      return NextResponse.json(
        {
          errore:
            "Il mezzo selezionato non e disponibile per una nuova prenotazione.",
        },
        { status: 409 },
      );
    }

    if (mezzo.patenteRichiesta !== "Nessuna") {
      if (
        !utente.numeroPatente ||
        !utente.categoriaPatente ||
        !utente.scadenzaPatente
      ) {
        return NextResponse.json(
          {
            errore:
              "Per questo mezzo devi avere una patente valida registrata nel tuo profilo.",
          },
          { status: 403 },
        );
      }

      if (patenteScaduta(utente.scadenzaPatente)) {
        return NextResponse.json(
          {
            errore:
              "La patente registrata nel tuo profilo risulta scaduta.",
          },
          { status: 403 },
        );
      }
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

    const prenotazione = await creaPrenotazioneNoleggio({
      utenteId: utente.id,
      mezzoId: mezzo.id,
    });

    return NextResponse.json(
      {
        messaggio: "Prenotazione creata con successo.",
        prenotazione: {
          ...prenotazione,
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
      messaggio.includes("gia una prenotazione attiva") ||
      messaggio.includes("gia una corsa attiva") ||
      messaggio.includes("gia prenotato") ||
      messaggio.includes("gia coinvolto in una corsa attiva")
        ? 409
        : messaggio.includes("Devi salvare almeno un metodo di pagamento attivo")
          ? 403
        : 500;

    console.error("[PRENOTAZIONE MEZZO ERROR]", error);

    return NextResponse.json(
      { errore: messaggio },
      { status },
    );
  }
}
