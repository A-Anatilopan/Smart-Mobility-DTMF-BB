// API Route: PATCH /api/account/profilo
// UT.11a: l'utente aggiorna i dati patente del proprio profilo
// INF-09: modifica consentita solo alla sessione autenticata dell'utente finale

import { NextRequest, NextResponse } from "next/server";
import { verificaSessione } from "@/lib/auth";
import {
  normalizzaDataPatente,
  validaCategoriaPatente,
} from "@/lib/patenti";
import { prisma } from "@/lib/prisma";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

async function richiediUtenteFinaleDaSessione(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;

  if (!token) {
    return {
      errore: NextResponse.json(
        { errore: "Devi effettuare l'accesso per aggiornare il profilo." },
        { status: 401 },
      ),
    };
  }

  const utente = await verificaSessione(token);

  if (!utente) {
    return {
      errore: NextResponse.json(
        { errore: "Sessione non valida. Effettua di nuovo l'accesso." },
        { status: 401 },
      ),
    };
  }

  if (normalizzaRuolo(utente.ruolo) !== RUOLI.UTENTE) {
    return {
      errore: NextResponse.json(
        {
          errore:
            "Solo un utente finale puo aggiornare questi dati da questa interfaccia.",
        },
        { status: 403 },
      ),
    };
  }

  return { utente };
}

export async function PATCH(request: NextRequest) {
  try {
    const sessione = await richiediUtenteFinaleDaSessione(request);

    if ("errore" in sessione) {
      return sessione.errore;
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { errore: "Inserisci correttamente i dati patente." },
        { status: 400 },
      );
    }

    const numeroPatente =
      typeof (body as { numeroPatente?: unknown }).numeroPatente === "string"
        ? (body as { numeroPatente: string }).numeroPatente.trim()
        : "";
    const categoriaPatente =
      typeof (body as { categoriaPatente?: unknown }).categoriaPatente ===
      "string"
        ? (body as { categoriaPatente: string }).categoriaPatente.trim().toUpperCase()
        : "";
    const scadenzaPatente = normalizzaDataPatente(
      (body as { scadenzaPatente?: unknown }).scadenzaPatente,
    );

    const rimuovePatente = !numeroPatente && !categoriaPatente && !scadenzaPatente;

    if (!rimuovePatente && (!numeroPatente || !categoriaPatente || !scadenzaPatente)) {
      return NextResponse.json(
        {
          errore:
            "Per salvare la patente devi compilare numero, categoria e data di scadenza.",
        },
        { status: 400 },
      );
    }

    if (numeroPatente && numeroPatente.length < 5) {
      return NextResponse.json(
        {
          errore:
            "Il numero patente inserito e troppo corto per essere valido.",
        },
        { status: 400 },
      );
    }

    if (numeroPatente && numeroPatente.length > 50) {
      return NextResponse.json(
        {
          errore:
            "Il numero patente inserito supera la lunghezza consentita.",
        },
        { status: 400 },
      );
    }

    if (categoriaPatente && !validaCategoriaPatente(categoriaPatente)) {
      return NextResponse.json(
        {
          errore:
            "La categoria patente non e supportata da questa interfaccia.",
        },
        { status: 400 },
      );
    }

    const scadenzaPatenteFinale = rimuovePatente
      ? null
      : new Date(scadenzaPatente as string);

    const profiloAggiornato = await prisma.utente.update({
      where: {
        id: sessione.utente.id,
      },
      data: {
        numeroPatente: rimuovePatente ? null : numeroPatente,
        categoriaPatente: rimuovePatente ? null : categoriaPatente,
        scadenzaPatente: scadenzaPatenteFinale,
      },
      select: {
        numeroPatente: true,
        categoriaPatente: true,
        scadenzaPatente: true,
      },
    });

    return NextResponse.json(
      {
        messaggio: rimuovePatente
          ? "Patente rimossa correttamente dal profilo."
          : "Patente aggiornata correttamente.",
        profilo: {
          ...profiloAggiornato,
          scadenzaPatente: profiloAggiornato.scadenzaPatente
            ? profiloAggiornato.scadenzaPatente.toISOString().slice(0, 10)
            : null,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PROFILO ACCOUNT PATCH ERROR]", error);

    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 },
    );
  }
}
