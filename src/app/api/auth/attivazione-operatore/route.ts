// API Route: POST /api/auth/attivazione-operatore
// UC-12: Attivazione Account Tramite Codice
// OP.12a: attivazione account Operatore con codice identificativo
// INF-09: solo gli account attivati possono accedere alle aree riservate

import { NextRequest, NextResponse } from "next/server";
import { attivaAccountConCodice } from "@/lib/attivazione-account";
import { RUOLI } from "@/lib/ruoli";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, codiceAttivazione } = body;

    // La route resta specifica per Operatore, mentre la logica riusabile
    // vive in src/lib per evitare duplicazione con la futura attivazione PA.
    const result = await attivaAccountConCodice({
      email,
      codiceAttivazione,
      ruoloRichiesto: RUOLI.OPERATORE,
      nomeRuoloPerMessaggi: "operatore",
      messaggioSuccesso: "Account operatore attivato con successo.",
    });

    return NextResponse.json(result.payload, { status: result.status });
  } catch (error) {
    console.error("[ATTIVAZIONE OPERATORE ERROR]", error);
    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 }
    );
  }
}
