// Logica condivisa per attivare account gia creati tramite codice identificativo.
// UC-12: Attivazione Account Tramite Codice
// OP.12a / AP.07a: il ruolo richiesto viene passato dalla route specifica.
// INF-05: la nuova password viene salvata solo dopo hashing irreversibile.
// INF-09: solo gli account in stato ATTIVO possono poi accedere alle aree riservate.

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { normalizzaRuolo, RUOLI, type RuoloCanonico } from "@/lib/ruoli";

const STATO_ACCOUNT_ATTIVO = "ATTIVO";
const STATO_ACCOUNT_DA_ATTIVARE = "DA_ATTIVARE";

type FaseAttivazione = "verifica-codice" | "completa-attivazione";

type AttivaAccountConCodiceInput = {
  email: unknown;
  codiceAttivazione: unknown;
  fase: unknown;
  nuovaPassword: unknown;
  confermaNuovaPassword: unknown;
  ruoloRichiesto: RuoloCanonico;
  nomeRuoloPerMessaggi: string;
  messaggioCodiceValido: string;
  messaggioSuccesso: string;
};

type AttivaAccountConCodicePayload = {
  errore?: string;
  messaggio?: string;
  prossimaFase?: "password";
  utente?: {
    id: number;
    nome: string;
    cognome: string;
    email: string;
    ruolo: string;
    stato: string;
  };
};

type AccountDaAttivare = {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  ruolo: string;
  stato: string;
  codiceAttivazione: string | null;
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

// L'API lavora in due fasi esplicite: prima valida il codice, poi imposta
// la password personale e rende attivo l'account.
function normalizzaFaseAttivazione(fase: unknown): FaseAttivazione | null {
  if (fase === "verifica-codice" || fase === "completa-attivazione") {
    return fase;
  }

  return null;
}

// La password nuova deve rispettare almeno il vincolo minimo gia usato
// nella registrazione utente, cosi il progetto resta coerente.
function validaNuovaPassword(password: string): boolean {
  return password.length >= 8;
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

// Recupera l'account e verifica che email, ruolo, stato e codice siano coerenti.
// Questo blocco e condiviso dalle due fasi per evitare divergenze tra i controlli.
async function verificaAccountDaAttivare({
  emailNormalizzata,
  codiceNormalizzato,
  ruoloRichiesto,
  nomeRuoloPerMessaggi,
}: {
  emailNormalizzata: string;
  codiceNormalizzato: string;
  ruoloRichiesto: RuoloCanonico;
  nomeRuoloPerMessaggi: string;
}): Promise<
  | { ok: true; account: AccountDaAttivare }
  | { ok: false; result: AttivaAccountConCodiceResult }
> {
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
      ok: false,
      result: {
        status: 404,
        payload: { errore: `Account ${nomeRuoloPerMessaggi} non trovato.` },
      },
    };
  }

  // Un account gia attivo non deve riusare il codice di attivazione.
  if (account.stato === STATO_ACCOUNT_ATTIVO) {
    return {
      ok: false,
      result: {
        status: 409,
        payload: {
          errore: "Account gia attivo. Puoi accedere con le credenziali.",
        },
      },
    };
  }

  if (account.stato !== STATO_ACCOUNT_DA_ATTIVARE) {
    return {
      ok: false,
      result: {
        status: 403,
        payload: {
          errore:
            "Lo stato attuale dell'account non consente l'attivazione con codice.",
        },
      },
    };
  }

  // UC-12.2: CodiceInesistente quando il record non contiene alcun codice.
  if (!account.codiceAttivazione) {
    return {
      ok: false,
      result: {
        status: 404,
        payload: {
          errore: "Codice di attivazione inesistente o gia utilizzato.",
        },
      },
    };
  }

  const codiceSalvato = account.codiceAttivazione.trim().toUpperCase();

  if (codiceSalvato !== codiceNormalizzato) {
    return {
      ok: false,
      result: {
        status: 400,
        payload: { errore: "Codice identificativo non valido." },
      },
    };
  }

  return { ok: true, account };
}

// Funzione comune usabile da endpoint diversi: Operatore e Pubblica Amministrazione.
export async function attivaAccountConCodice({
  email,
  codiceAttivazione,
  fase,
  nuovaPassword,
  confermaNuovaPassword,
  ruoloRichiesto,
  nomeRuoloPerMessaggi,
  messaggioCodiceValido,
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

  const faseNormalizzata = normalizzaFaseAttivazione(fase);

  if (!faseNormalizzata) {
    return {
      status: 400,
      payload: { errore: "Fase di attivazione non valida." },
    };
  }

  // ---- STEP 2: Recupero account e verifica codice identificativo ----
  const verificaAccount = await verificaAccountDaAttivare({
    emailNormalizzata,
    codiceNormalizzato,
    ruoloRichiesto,
    nomeRuoloPerMessaggi,
  });

  if (!verificaAccount.ok) {
    return verificaAccount.result;
  }

  const { account } = verificaAccount;

  // ---- STEP 3: Prima fase, conferma solo il codice ----
  // Il database non viene modificato: l'attivazione avviene solo dopo la password.
  if (faseNormalizzata === "verifica-codice") {
    return {
      status: 200,
      payload: {
        messaggio: messaggioCodiceValido,
        prossimaFase: "password",
      },
    };
  }

  // ---- STEP 4: Seconda fase, validazione della nuova password ----
  if (typeof nuovaPassword !== "string" || !validaNuovaPassword(nuovaPassword)) {
    return {
      status: 400,
      payload: { errore: "La nuova password deve contenere almeno 8 caratteri." },
    };
  }

  if (
    typeof confermaNuovaPassword !== "string" ||
    nuovaPassword !== confermaNuovaPassword
  ) {
    return {
      status: 400,
      payload: { errore: "La nuova password e la conferma non coincidono." },
    };
  }

  // ---- STEP 5: Attivazione account e salvataggio nuova password ----
  // Il codice viene cancellato dopo l'uso e la nuova password viene salvata hashata.
  const nuovaPasswordHash = await hashPassword(nuovaPassword);

  const accountAttivato = await prisma.utente.update({
    where: { id: account.id },
    data: {
      passwordHash: nuovaPasswordHash,
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
