// API Route: POST /api/auth/attivazione-amministrazione
// UC-12: Attivazione Account Tramite Codice
// AP.07a: attivazione account Pubblica Amministrazione con codice identificativo
// INF-09: solo gli account attivati possono accedere alle aree riservate

import { NextRequest, NextResponse } from "next/server";
import { attivaAccountConCodice } from "@/lib/attivazione-account";
import { RUOLI } from "@/lib/ruoli";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, codiceAttivazione, fase, nuovaPassword, confermaNuovaPassword } =
      body;

    // La route resta specifica per la Pubblica Amministrazione, mentre la logica
    // comune vive in src/lib e viene condivisa con l'attivazione Operatore.
    const result = await attivaAccountConCodice({
      email,
      codiceAttivazione,
      fase,
      nuovaPassword,
      confermaNuovaPassword,
      ruoloRichiesto: RUOLI.PUBBLICA_AMMINISTRAZIONE,
      nomeRuoloPerMessaggi: "pubblica amministrazione",
      messaggioCodiceValido:
        "Codice confermato. Ora scegli una password personale.",
      messaggioSuccesso:
        "Account Pubblica Amministrazione attivato con successo. Ti stiamo portando alla pagina di accesso.",
    });

    return NextResponse.json(result.payload, { status: result.status });
  } catch (error) {
    console.error("[ATTIVAZIONE AMMINISTRAZIONE ERROR]", error);
    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare piu tardi." },
      { status: 500 }
    );
  }
}
