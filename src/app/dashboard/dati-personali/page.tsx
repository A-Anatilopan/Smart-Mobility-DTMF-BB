import type { Metadata } from "next";
import DashboardDatiPersonaliClient from "@/components/profilo/DashboardDatiPersonaliClient";
import { richiediRuolo } from "@/lib/session";
import { RUOLI } from "@/lib/ruoli";

// Questa pagina raccoglie il profilo dell'utente in uno spazio separato dalla
// home operativa, cosi mappa, cronologia e dati account restano distinti.
export const metadata: Metadata = {
  title: "Dati personali | E-Smart Mobility",
  description:
    "Area riservata utente per consultare il proprio profilo e aggiornare i dati patente.",
};

export default async function DashboardDatiPersonaliPage() {
  const utente = await richiediRuolo(RUOLI.UTENTE);

  return (
    <DashboardDatiPersonaliClient
      profiloIniziale={{
        nome: utente.nome,
        cognome: utente.cognome,
        email: utente.email,
        dataNascita: utente.dataNascita.toISOString().slice(0, 10),
        codiceFiscale: utente.codiceFiscale,
        numeroPatente: utente.numeroPatente,
        categoriaPatente: utente.categoriaPatente,
        scadenzaPatente: utente.scadenzaPatente
          ? utente.scadenzaPatente.toISOString().slice(0, 10)
          : null,
      }}
    />
  );
}
