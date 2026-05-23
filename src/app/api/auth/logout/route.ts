// API Route: POST /api/auth/logout
// UC-08: gestione fine sessione
// INF-09: eliminazione sessione dal DB e pulizia cookie
// Il token viene cercato in tre posti in ordine di priorità:
// 1. Cookie HTTP-only (flusso browser)
// 2. Body della richiesta (flusso API/test)
// 3. Header Authorization Bearer (flusso REST standard)

import { NextRequest, NextResponse } from "next/server";
import { eliminaSessione } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Priorità 1: cookie HTTP-only (impostato al login da browser)
    let token = request.cookies.get("session_token")?.value;

    // Priorità 2: token nel body della richiesta (per test API)
    if (!token) {
      const body = await request.json().catch(() => ({}));
      token = body.token;
    }

    // Priorità 3: Authorization header (standard Bearer)
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { errore: "Nessun token di sessione trovato." },
        { status: 400 }
      );
    }

    // Eliminazione sessione dal database
    await eliminaSessione(token);

    // Costruiamo la risposta e cancelliamo il cookie
    const response = NextResponse.json(
      { messaggio: "Logout effettuato con successo." },
      { status: 200 }
    );

    response.cookies.set("session_token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[LOGOUT ERROR]", error);
    return NextResponse.json(
      { errore: "Errore interno del server." },
      { status: 500 }
    );
  }
}