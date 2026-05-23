// API Route: POST /api/auth/login
// UC-08: Login per tutti i ruoli (Utente, Operatore, Pubblica Amministrazione)
// UT.11b, OP.12b, AP.07b
// UC-08.1: PasswordErrata — credenziali non valide
// UC-08.2: UtenteNonEsistente — account non trovato
// UC-08.3: SuperamentoNumeroMassimoTentativi — blocco temporaneo 1 ora
// INF-05: confronto password tramite bcrypt irreversibile
// INF-09: sessione attiva obbligatoria per accesso alle aree protette

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificaPassword, creaSessione } from "@/lib/auth";

const MAX_TENTATIVI = 5;
const BLOCCO_DURATA_MINUTI = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // ---- STEP 1: Validazione campi obbligatori ----
    if (!email || !password) {
      return NextResponse.json(
        { errore: "Email e password sono obbligatorie." },
        { status: 400 }
      );
    }

    // ---- STEP 2: Ricerca utente nel database ----
    // UC-08.2: UtenteNonEsistente
    const utente = await prisma.utente.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!utente) {
      return NextResponse.json(
        { errore: "Credenziali non valide." },
        { status: 401 }
      );
    }

    // ---- STEP 3: Verifica account sospeso ----
    // UC-08 Pre-condizioni: account deve essere in stato ATTIVO
    if (utente.stato === "SOSPESO") {
      return NextResponse.json(
        {
          errore:
            "Account sospeso. Contatta l'assistenza per ulteriori informazioni.",
        },
        { status: 403 }
      );
    }

    // ---- STEP 4: Verifica blocco temporaneo ----
    // UC-08.3: SuperamentoNumeroMassimoTentativi
    if (utente.bloccatoFinoA && utente.bloccatoFinoA > new Date()) {
      const minutiRimasti = Math.ceil(
        (utente.bloccatoFinoA.getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        {
          errore: `Troppi tentativi falliti. Account bloccato per altri ${minutiRimasti} minuti.`,
        },
        { status: 429 }
      );
    }

    // ---- STEP 5: Verifica password ----
    // UC-08.1: PasswordErrata
    // INF-05: bcrypt confronta senza mai decifrare l'hash
    const passwordCorretta = await verificaPassword(
      password,
      utente.passwordHash
    );

    if (!passwordCorretta) {
      const nuoviTentativi = utente.tentativiFalliti + 1;

      if (nuoviTentativi >= MAX_TENTATIVI) {
        // UC-08.3: blocco temporaneo dopo MAX_TENTATIVI tentativi
        const bloccatoFinoA = new Date();
        bloccatoFinoA.setMinutes(
          bloccatoFinoA.getMinutes() + BLOCCO_DURATA_MINUTI
        );

        await prisma.utente.update({
          where: { id: utente.id },
          data: { tentativiFalliti: nuoviTentativi, bloccatoFinoA },
        });

        return NextResponse.json(
          {
            errore: `Troppi tentativi falliti. Account bloccato per ${BLOCCO_DURATA_MINUTI} minuti.`,
          },
          { status: 429 }
        );
      }

      // UC-08.1: tentativi rimanenti prima del blocco
      await prisma.utente.update({
        where: { id: utente.id },
        data: { tentativiFalliti: nuoviTentativi },
      });

      return NextResponse.json(
        {
          errore: `Credenziali non valide. Tentativi rimasti: ${
            MAX_TENTATIVI - nuoviTentativi
          }.`,
        },
        { status: 401 }
      );
    }

    // ---- STEP 6: Reset tentativi falliti dopo login riuscito ----
    await prisma.utente.update({
      where: { id: utente.id },
      data: { tentativiFalliti: 0, bloccatoFinoA: null },
    });

    // ---- STEP 7: Creazione sessione ----
    // INF-09: sessione attiva associata all'account autenticato
    const token = await creaSessione(utente.id);

    // ---- STEP 8: Risposta con cookie e dati utente ----
    const response = NextResponse.json(
      {
        messaggio: "Login effettuato con successo.",
        utente: {
          id: utente.id,
          nome: utente.nome,
          cognome: utente.cognome,
          email: utente.email,
          ruolo: utente.ruolo,
          stato: utente.stato,
        },
      },
      { status: 200 }
    );

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare più tardi." },
      { status: 500 }
    );
  }
}