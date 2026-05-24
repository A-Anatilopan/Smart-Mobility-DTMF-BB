// API Route: POST /api/auth/registrazione
// UC-07: Registrazione Utente
// UT.11a: registrazione con dati anagrafici e patente (opzionale)
// INF-05: password hashata con bcrypt prima del salvataggio
// Sequenza principale UC-07: validazione → unicità → creazione account

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// Valida il formato del Codice Fiscale italiano (16 caratteri alfanumerici)
function validaCodiceFiscale(cf: string): boolean {
  return /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(
    cf.toUpperCase()
  );
}

// Valida il formato email
function validaEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nome,
      cognome,
      email,
      password,
      dataNascita,
      codiceFiscale,
      numeroPatente,
      categoriaPatente,
    } = body;

    // ---- STEP 1: Validazione campi obbligatori ----
    // UC-07 Sequenza Principale passo 3.2: validazione correttezza sintattica
    if (
      !nome ||
      !cognome ||
      !email ||
      !password ||
      !dataNascita ||
      !codiceFiscale
    ) {
      return NextResponse.json(
        { errore: "Tutti i campi obbligatori devono essere compilati." },
        { status: 400 }
      );
    }

    if (!validaEmail(email)) {
      return NextResponse.json(
        { errore: "Formato email non valido." },
        { status: 400 }
      );
    }

    if (!validaCodiceFiscale(codiceFiscale)) {
      return NextResponse.json(
        { errore: "Formato Codice Fiscale non valido." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { errore: "La password deve contenere almeno 8 caratteri." },
        { status: 400 }
      );
    }

    // ---- STEP 2: Verifica unicità email e codice fiscale ----
    // UC-07.1: DatiAnagraficiNonValidi - email o CF già registrati
    const utenteEsistente = await prisma.utente.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { codiceFiscale: codiceFiscale.toUpperCase() },
        ],
      },
    });

    if (utenteEsistente) {
      if (utenteEsistente.email === email.toLowerCase()) {
        return NextResponse.json(
          { errore: "Questa email è già registrata nel sistema." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { errore: "Questo Codice Fiscale è già registrato nel sistema." },
        { status: 409 }
      );
    }

    // ---- STEP 3: Hash della password ----
    // INF-05: funzione di derivazione crittografica irreversibile
    const passwordHash = await hashPassword(password);

    // ---- STEP 4: Creazione account ----
    // UC-07 Sequenza Principale passo 4: crea account con stato ATTIVO
    // Il ruolo viene salvato con il naming ufficiale concordato nel progetto.
    const nuovoUtente = await prisma.utente.create({
      data: {
        nome: nome.trim(),
        cognome: cognome.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        dataNascita: new Date(dataNascita),
        codiceFiscale: codiceFiscale.toUpperCase().trim(),
        numeroPatente: numeroPatente?.trim() || null,
        categoriaPatente: categoriaPatente?.trim() || null,
        ruolo: "Utente",
        stato: "ATTIVO",
      },
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        ruolo: true,
        stato: true,
        createdAt: true,
      },
    });

    // ---- STEP 5: Risposta successo ----
    // UC-07 Post-condizioni Successo: account creato e salvato
    return NextResponse.json(
      {
        messaggio: "Registrazione completata con successo.",
        utente: nuovoUtente,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTRAZIONE ERROR]", error);
    return NextResponse.json(
      { errore: "Errore interno del server. Riprovare più tardi." },
      { status: 500 }
    );
  }
}
