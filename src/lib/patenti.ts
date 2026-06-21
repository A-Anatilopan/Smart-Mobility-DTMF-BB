// Regole condivise per i controlli patente tra registrazione, profilo utente,
// prenotazione e avvio corsa, cosi tutta l'app applica gli stessi criteri.

export const CATEGORIE_PATENTE_VALIDE = ["AM", "A1", "A2", "A", "B"] as const;

export type CategoriaPatenteValida =
  (typeof CATEGORIE_PATENTE_VALIDE)[number];

export function validaCategoriaPatente(categoria: string): boolean {
  return CATEGORIE_PATENTE_VALIDE.includes(
    categoria as CategoriaPatenteValida,
  );
}

export function trovaIndicePatente(
  categoria: string | null | undefined,
): number {
  if (!categoria) {
    return -1;
  }

  return CATEGORIE_PATENTE_VALIDE.indexOf(categoria as CategoriaPatenteValida);
}

export function patenteCompatibile(
  patenteUtente: string | null | undefined,
  patenteRichiesta: string,
): boolean {
  if (patenteRichiesta === "Nessuna") {
    return true;
  }

  return trovaIndicePatente(patenteUtente) >= trovaIndicePatente(patenteRichiesta);
}

export function patenteScaduta(
  scadenzaPatente: string | Date | null | undefined,
  riferimento: Date = new Date(),
): boolean {
  if (!scadenzaPatente) {
    return true;
  }

  const scadenza = new Date(scadenzaPatente);

  if (Number.isNaN(scadenza.getTime())) {
    return true;
  }

  scadenza.setHours(23, 59, 59, 999);

  return riferimento.getTime() > scadenza.getTime();
}

export function normalizzaDataPatente(
  valore: unknown,
): string | null {
  if (typeof valore !== "string") {
    return null;
  }

  const testo = valore.trim();

  if (!testo) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(testo)) {
    return null;
  }

  return testo;
}
