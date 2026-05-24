// Elenco dei ruoli canonici concordati nel progetto.
// Manteniamo anche una normalizzazione minima per compatibilita con dati legacy.

export const RUOLI = {
  UTENTE: "Utente",
  OPERATORE: "Operatore",
  PUBBLICA_AMMINISTRAZIONE: "Pubblica Amministrazione",
} as const;

export type RuoloCanonico = (typeof RUOLI)[keyof typeof RUOLI];

// Valori compatti usati nel cookie di ruolo per aiutare il proxy
// a distinguere le aree protette senza esporre dipendenze dal database.
const COOKIE_ROLE_VALUES = {
  [RUOLI.UTENTE]: "utente",
  [RUOLI.OPERATORE]: "operatore",
  [RUOLI.PUBBLICA_AMMINISTRAZIONE]: "pubblica-amministrazione",
} as const;

// Alcuni record locali creati nelle prime prove usano valori diversi.
// Questa funzione li riallinea ai tre ruoli ufficiali del progetto.
export function normalizzaRuolo(ruolo: string | undefined): RuoloCanonico {
  if (ruolo === RUOLI.UTENTE || ruolo === "UTENTE") {
    return RUOLI.UTENTE;
  }

  if (ruolo === RUOLI.OPERATORE || ruolo === "OPERATORE") {
    return RUOLI.OPERATORE;
  }

  return RUOLI.PUBBLICA_AMMINISTRAZIONE;
}

// Converte il ruolo canonico in un valore breve e stabile per il cookie.
export function serializzaRuoloPerCookie(ruolo: string | undefined): string {
  const ruoloCanonico = normalizzaRuolo(ruolo);
  return COOKIE_ROLE_VALUES[ruoloCanonico];
}

// Ricostruisce il ruolo partendo dal valore letto nel cookie di sessione.
export function leggiRuoloDaCookie(
  valoreCookie: string | undefined
): RuoloCanonico | null {
  if (valoreCookie === COOKIE_ROLE_VALUES[RUOLI.UTENTE]) {
    return RUOLI.UTENTE;
  }

  if (valoreCookie === COOKIE_ROLE_VALUES[RUOLI.OPERATORE]) {
    return RUOLI.OPERATORE;
  }

  if (valoreCookie === COOKIE_ROLE_VALUES[RUOLI.PUBBLICA_AMMINISTRAZIONE]) {
    return RUOLI.PUBBLICA_AMMINISTRAZIONE;
  }

  return null;
}

// Ogni ruolo ha una propria area di atterraggio dopo l'autenticazione.
export function risolviPercorsoDashboard(ruolo: string | undefined): string {
  const ruoloCanonico = normalizzaRuolo(ruolo);

  if (ruoloCanonico === RUOLI.UTENTE) {
    return "/dashboard";
  }

  if (ruoloCanonico === RUOLI.OPERATORE) {
    return "/operatore";
  }

  return "/admin";
}
