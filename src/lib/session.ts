// Helper server-side per leggere la sessione e applicare i controlli di accesso
// nelle pagine riservate dell'App Router.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificaSessione } from "@/lib/auth";
import {
  normalizzaRuolo,
  risolviPercorsoDashboard,
  type RuoloCanonico,
} from "@/lib/ruoli";

// Recupera l'utente autenticato dalla request corrente.
// Se il token manca o la sessione non e valida, il flusso viene reindirizzato al login.
export async function richiediUtenteAutenticato() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const sessioneCorrente = await prisma.sessione.findUnique({
    where: {
      token,
    },
    include: {
      utente: {
        select: {
          id: true,
          stato: true,
        },
      },
    },
  });

  // Se il token appartiene a un account sospeso, chiudiamo subito la sessione
  // e riportiamo l'utente al login con un messaggio esplicito.
  if (sessioneCorrente?.utente.stato === "SOSPESO") {
    await prisma.sessione.deleteMany({
      where: {
        utenteId: sessioneCorrente.utente.id,
      },
    });
    redirect("/login?sospeso=1");
  }

  const utente = await verificaSessione(token);

  if (!utente) {
    redirect("/login");
  }

  return {
    ...utente,
    ruoloCanonico: normalizzaRuolo(utente.ruolo),
  };
}

// Permette l'accesso alla pagina solo al ruolo richiesto.
// Se l'utente e autenticato ma appartiene a un'altra area, viene indirizzato
// alla propria dashboard corretta.
export async function richiediRuolo(ruoloRichiesto: RuoloCanonico) {
  const utente = await richiediUtenteAutenticato();

  if (utente.ruoloCanonico !== ruoloRichiesto) {
    redirect(risolviPercorsoDashboard(utente.ruolo));
  }

  return utente;
}
