// Tariffe condivise del noleggio: vengono usate sia lato server per i calcoli
// ufficiali sia lato client per mostrare stime coerenti durante la corsa.

export const COSTO_SBLOCCO_CENT = 100;
export const COSTO_UTILIZZO_AL_MINUTO_CENT = 25;
export const COSTO_PAUSA_AL_MINUTO_CENT = 10;
export const MILLIS_PER_MINUTO = 60_000;

export function calcolaCostoProporzionaleCent(
  durataMillisecondi: number,
  costoAlMinutoCent: number,
): number {
  return Math.round((durataMillisecondi / MILLIS_PER_MINUTO) * costoAlMinutoCent);
}

export function calcolaCostoUtilizzoTotaleCent(
  durataMillisecondi: number,
): number {
  return calcolaCostoProporzionaleCent(
    durataMillisecondi,
    COSTO_UTILIZZO_AL_MINUTO_CENT,
  );
}

export function calcolaCostoPausaTotaleCent(
  durataMillisecondi: number,
): number {
  return calcolaCostoProporzionaleCent(
    durataMillisecondi,
    COSTO_PAUSA_AL_MINUTO_CENT,
  );
}
