import type { Metadata } from "next";
import AreaRiservataShell from "@/components/auth/AreaRiservataShell";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

// Metadati della dashboard base per la Pubblica Amministrazione.
export const metadata: Metadata = {
  title: "Dashboard Pubblica Amministrazione | E-Smart Mobility",
  description:
    "Area riservata della Pubblica Amministrazione per monitoraggio, analisi e supervisione.",
};

export default async function DashboardPubblicaAmministrazionePage() {
  const utente = await richiediRuolo(RUOLI.PUBBLICA_AMMINISTRAZIONE);

  return (
    <AreaRiservataShell
      badge="Dashboard Pubblica Amministrazione"
      titolo="Area di monitoraggio istituzionale."
      descrizione="Questa sezione e pensata per le attivita di osservazione, analisi e supervisione della mobilita urbana da parte della Pubblica Amministrazione."
      nomeCompleto={`${utente.nome} ${utente.cognome}`}
      ruolo={utente.ruoloCanonico}
      highlights={[
        {
          titolo: "Vista istituzionale",
          descrizione:
            "L'accesso e dedicato ai profili autorizzati alle attivita di monitoraggio pubblico.",
        },
        {
          titolo: "Base analytics",
          descrizione:
            "La dashboard verra ampliata con report, analisi tratte e indicatori ambientali.",
        },
        {
          titolo: "Area separata",
          descrizione:
            "La Pubblica Amministrazione dispone di un ingresso distinto dagli altri stakeholder.",
        },
      ]}
    />
  );
}
