// Tipi condivisi della sessione operativa mezzo: servono a distinguere il
// movimento locale eseguito dall'operatore dal futuro blocco remoto assistito.

export const MODALITA_SESSIONE_OPERATIVA_MEZZO = ["LOCALE"] as const;
export type ModalitaSessioneOperativaMezzo =
  (typeof MODALITA_SESSIONE_OPERATIVA_MEZZO)[number];

export const STATI_SESSIONE_OPERATIVA_MEZZO = ["ATTIVA", "CHIUSA"] as const;
export type StatoSessioneOperativaMezzo =
  (typeof STATI_SESSIONE_OPERATIVA_MEZZO)[number];

export const MOTIVI_SESSIONE_OPERATIVA_MEZZO = [
  "RIPOSIZIONAMENTO",
  "RITIRO_PER_MANUTENZIONE",
  "TRASFERIMENTO_DEPOSITO",
  "VERIFICA_TECNICA",
  "ALTRO",
] as const;

export type MotivoSessioneOperativaMezzo =
  (typeof MOTIVI_SESSIONE_OPERATIVA_MEZZO)[number];
