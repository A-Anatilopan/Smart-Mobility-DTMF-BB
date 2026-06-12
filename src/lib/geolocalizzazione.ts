import type { Coordinate } from "@/types/mobilita";

// Helpers geografici minimi del progetto: per ora bastano a verificare la
// prossimita tra utente e mezzo senza introdurre SDK esterni o geolocalizzazione
// reale del browser nel dominio server-side.

const RAGGIO_TERRESTRE_METRI = 6_371_000;

function toRadianti(gradi: number): number {
  return (gradi * Math.PI) / 180;
}

// Calcola la distanza reale in metri tra due coordinate tramite formula di
// Haversine, adeguata al controllo di prossimita richiesto per l'avvio corsa.
export function calcolaDistanzaMetri(
  puntoA: Coordinate,
  puntoB: Coordinate,
): number {
  const deltaLatitudine = toRadianti(
    puntoB.latitudine - puntoA.latitudine,
  );
  const deltaLongitudine = toRadianti(
    puntoB.longitudine - puntoA.longitudine,
  );
  const latitudineA = toRadianti(puntoA.latitudine);
  const latitudineB = toRadianti(puntoB.latitudine);

  const valoreHaversine =
    Math.sin(deltaLatitudine / 2) ** 2 +
    Math.cos(latitudineA) *
      Math.cos(latitudineB) *
      Math.sin(deltaLongitudine / 2) ** 2;

  const angoloCentrale =
    2 *
    Math.atan2(
      Math.sqrt(valoreHaversine),
      Math.sqrt(1 - valoreHaversine),
    );

  return RAGGIO_TERRESTRE_METRI * angoloCentrale;
}
