import type { Metadata } from "next";
import AreaRiservataShell from "@/components/auth/AreaRiservataShell";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

// Metadati della dashboard utente base.
export const metadata: Metadata = {
  title: "Dashboard Utente | E-Smart Mobility",
  description:
    "Area riservata utente di E-Smart Mobility per l'accesso ai servizi personali.",
};

export default async function DashboardUtentePage() {
  const utente = await richiediRuolo(RUOLI.UTENTE);

  return (
    <AreaRiservataShell
      badge="Dashboard Utente"
      titolo="Benvenuto nella tua area personale."
      descrizione="Da qui potrai accedere ai servizi collegati ai tuoi spostamenti, consultare il profilo e proseguire con le funzionalita disponibili nelle prossime iterazioni."
      nomeCompleto={`${utente.nome} ${utente.cognome}`}
      ruolo={utente.ruoloCanonico}
      highlights={[
        {
          titolo: "Profilo attivo",
          descrizione:
            "La tua sessione personale e stata riconosciuta correttamente dal sistema.",
        },
        {
          titolo: "Accesso riservato",
          descrizione:
            "Questa area e dedicata esclusivamente agli utenti registrati del servizio.",
        },
        {
          titolo: "Base pronta",
          descrizione:
            "La dashboard e pronta per ospitare le prossime funzionalita del flusso utente.",
        },
      ]}
    />
  );
}
