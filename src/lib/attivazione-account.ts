// Logica condivisa per attivare account gia creati tramite codice identificativo.
// UC-12: Attivazione Account Tramite Codice
// OP.12a / AP.07a: il ruolo richiesto viene passato dalla route specifica.
// INF-09: solo gli account in stato ATTIVO possono poi accedere alle aree riservate.

import { prisma } from "@/lib/prisma";
import { normalizzaRuolo, RUOLI, type RuoloCanonico } from "@/lib/ruoli";

const STATO_ACCOUNT_ATTIVO = "ATTIVO";
const STATO_ACCOUNT_DA_ATTIVARE = "DA_ATTIVARE";

type AttivaAccountConCodiceInput = {
  email: unknown;
  codiceAttivazione: unknown;
  ruoloRichiesto: RuoloCanonico;
  nomeRuoloPerMessaggi: string;
  messaggioSuccesso: string;
};

type AttivaAccountConCodicePayload = {
  errore?: string;
  messaggio?: string;
  utente?: {
    id: number;
    nome: string;
    cognome: string;
    email: string;
    ruolo: string;
    stato: string;
  };
};

type AttivaAccountConCodiceResult = {
  status: number;
  payload: AttivaAccountConCodicePayload;
};

// Manteniamo una validazione semplice per non bloccare codici creati a mano
// durante i test universitari, ma impediamo input vuoti o troppo lunghi.
function normalizzaCodiceAttivazione(codice: unknown): string | null {
  if (typeof codice !== "string") {
    return null;
  }

  const codicePulito = codice.trim().toUpperCase();

  if (!codicePulito || codicePulito.length > 20) {
    return null;
  }

  return codicePulito;
}

// Valida il formato base dell'email prima di interrogare il database.
function validaEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Evita che ruoli non riconosciuti vengano trattati per errore come PA
// a causa della normalizzazione legacy presente nel progetto.
function ruoloSalvatoSupportato(ruolo: string): boolean {
  return (
    ruolo === RUOLI.UTENTE ||
    ruolo === RUOLI.OPERATORE ||
    ruolo === RUOLI.PUBBLICA_AMMINISTRAZIONE ||
    ruolo === "UTENTE" ||
    ruolo === "OPERATORE"
  );
}

// Funzione comune usabile da endpoint diversi: Operatore e Pubblica Amministrazione.
export async function attivaAccountConCodice({
  email,
  codiceAttivazione,
  ruoloRichiesto,
  nomeRuoloPerMessaggi,
  messaggioSuccesso,
}: AttivaAccountConCodiceInput): Promise<AttivaAccountConCodiceResult> {
  // ---- STEP 1: Validazione input minimo ----
  // UC-12.1: CodiceNonValido quando il codice manca o non e utilizzabile.
  if (typeof email !== "string" || !email.trim()) {
    return {
      status: 400,
      payload: { errore: `Email ${nomeRuoloPerMessaggi} obbligatoria.` },
    };
  }

  const emailNormalizzata = email.toLowerCase().trim();

  if (!validaEmail(emailNormalizzata)) {
    return {
      status: 400,
      payload: { errore: "Formato email non valido." },
    };
  }

  const codiceNormalizzato = normalizzaCodiceAttivazione(codiceAttivazione);

  if (!codiceNormalizzato) {
    return {
      status: 400,
      payload: { errore: "Codice identificativo non valido." },
    };
  }

  // ---- STEP 2: Recupero account con il ruolo richiesto ----
  const account = await prisma.utente.findUnique({
    where: { email: emailNormalizzata },
    select: {
      id: true,
      nome: true,
      cognome: true,
      email: true,
      ruolo: true,
      stato: true,
      codiceAttivazione: true,
    },
  });

  if (
    !account ||
    !ruoloSalvatoSupportato(account.ruolo) ||
    normalizzaRuolo(account.ruolo) !== ruoloRichiesto
  ) {
    return {
      status: 404,
      payload: { errore: `Account ${nomeRuoloPerMessaggi} non trovato.` },
    };
  }

  // ---- STEP 3: Verifica stato dell'account ----
  // Un account gia attivo non deve riusare il codice di attivazione.
  if (account.stato === STATO_ACCOUNT_ATTIVO) {
    return {
      status: 409,
      payload: {
        errore: "Account gia attivo. Puoi accedere con le credenziali.",
      },
    };
  }

  if (account.stato !== STATO_ACCOUNT_DA_ATTIVARE) {
    return {
      status: 403,
      payload: {
        errore:
          "Lo stato attuale dell'account non consente l'attivazione con codice.",
      },
    };
  }

  // ---- STEP 4: Verifica codice identificativo ----
  // UC-12.2: CodiceInesistente quando il record non contiene alcun codice.
  if (!account.codiceAttivazione) {
    return {
      status: 404,
      payload: { errore: "Codice di attivazione inesistente o gia utilizzato." },
    };
  }

  const codiceSalvato = account.codiceAttivazione.trim().toUpperCase();

  if (codiceSalvato !== codiceNormalizzato) {
    return {
      status: 400,
      payload: { errore: "Codice identificativo non valido." },
    };
  }

  // ---- STEP 5: Attivazione account ----
  // Il codice viene cancellato dopo l'uso per evitare riattivazioni ripetute.
  const accountAttivato = await prisma.utente.update({
    where: { id: account.id },
    data: {
      stato: STATO_ACCOUNT_ATTIVO,
      codiceAttivazione: null,
      tentativiFalliti: 0,
      bloccatoFinoA: null,
    },
    select: {
      id: true,
      nome: true,
      cognome: true,
      email: true,
      ruolo: true,
      stato: true,
    },
  });

  return {
    status: 200,
    payload: {
      messaggio: messaggioSuccesso,
      utente: accountAttivato,
    },
  };
}
