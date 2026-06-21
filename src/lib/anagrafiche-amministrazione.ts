import { patenteScaduta } from "@/lib/patenti";
import { prisma } from "@/lib/prisma";
import { normalizzaRuolo, RUOLI } from "@/lib/ruoli";

export type StatoPatenteAmministrazione =
  | "VALIDA"
  | "SCADUTA"
  | "ASSENTE"
  | "INCOMPLETA";

export type AnagraficaUtenteAmministrazione = {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  codiceFiscale: string;
  dataNascita: string;
  statoAccount: string;
  patente: {
    numero: string | null;
    categoria: string | null;
    scadenza: string | null;
    stato: StatoPatenteAmministrazione;
  };
};

function formattaDataIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}

// La PA consulta solo anagrafiche utente finali, senza mischiare operatori
// e amministratori che appartengono a flussi autorizzativi differenti.
function eUtenteFinale(ruolo: string): boolean {
  return normalizzaRuolo(ruolo) === RUOLI.UTENTE;
}

function risolviStatoPatente(record: {
  numeroPatente: string | null;
  categoriaPatente: string | null;
  scadenzaPatente: Date | null;
}): StatoPatenteAmministrazione {
  const haNumero = !!record.numeroPatente;
  const haCategoria = !!record.categoriaPatente;
  const haScadenza = !!record.scadenzaPatente;

  if (!haNumero && !haCategoria && !haScadenza) {
    return "ASSENTE";
  }

  if (!haNumero || !haCategoria || !haScadenza) {
    return "INCOMPLETA";
  }

  return patenteScaduta(record.scadenzaPatente) ? "SCADUTA" : "VALIDA";
}

export async function recuperaAnagraficheUtentiAmministrazione(): Promise<
  AnagraficaUtenteAmministrazione[]
> {
  const utenti = await prisma.utente.findMany({
    orderBy: [{ cognome: "asc" }, { nome: "asc" }, { id: "asc" }],
    select: {
      id: true,
      nome: true,
      cognome: true,
      email: true,
      codiceFiscale: true,
      dataNascita: true,
      ruolo: true,
      stato: true,
      numeroPatente: true,
      categoriaPatente: true,
      scadenzaPatente: true,
    },
  });

  return utenti
    .filter((utente) => eUtenteFinale(utente.ruolo))
    .map((utente) => ({
      id: utente.id,
      nome: utente.nome,
      cognome: utente.cognome,
      email: utente.email,
      codiceFiscale: utente.codiceFiscale,
      dataNascita: formattaDataIso(utente.dataNascita),
      statoAccount: utente.stato,
      patente: {
        numero: utente.numeroPatente,
        categoria: utente.categoriaPatente,
        scadenza: utente.scadenzaPatente
          ? formattaDataIso(utente.scadenzaPatente)
          : null,
        stato: risolviStatoPatente(utente),
      },
    }));
}

export async function recuperaAnagraficaUtenteAmministrazione(
  utenteId: number,
): Promise<AnagraficaUtenteAmministrazione | null> {
  const utente = await prisma.utente.findUnique({
    where: {
      id: utenteId,
    },
    select: {
      id: true,
      nome: true,
      cognome: true,
      email: true,
      codiceFiscale: true,
      dataNascita: true,
      ruolo: true,
      stato: true,
      numeroPatente: true,
      categoriaPatente: true,
      scadenzaPatente: true,
    },
  });

  if (!utente || !eUtenteFinale(utente.ruolo)) {
    return null;
  }

  return {
    id: utente.id,
    nome: utente.nome,
    cognome: utente.cognome,
    email: utente.email,
    codiceFiscale: utente.codiceFiscale,
    dataNascita: formattaDataIso(utente.dataNascita),
    statoAccount: utente.stato,
    patente: {
      numero: utente.numeroPatente,
      categoria: utente.categoriaPatente,
      scadenza: utente.scadenzaPatente
        ? formattaDataIso(utente.scadenzaPatente)
        : null,
      stato: risolviStatoPatente(utente),
    },
  };
}
