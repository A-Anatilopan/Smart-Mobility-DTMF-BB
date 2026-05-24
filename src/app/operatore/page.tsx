import type { Metadata } from "next";
import AreaRiservataShell from "@/components/auth/AreaRiservataShell";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

// Metadati della dashboard operatore base.
export const metadata: Metadata = {
  title: "Dashboard Operatore | E-Smart Mobility",
  description:
    "Area riservata operatore di E-Smart Mobility per supervisione e attivita di servizio.",
};

export default async function DashboardOperatorePage() {
  const utente = await richiediRuolo(RUOLI.OPERATORE);

  return (
    <AreaRiservataShell
      badge="Dashboard Operatore"
      titolo="Area operativa del servizio."
      descrizione="Questa sezione e dedicata agli operatori che supervisionano la flotta, i noleggi e le attivita logistiche collegate al servizio di mobilita condivisa."
      nomeCompleto={`${utente.nome} ${utente.cognome}`}
      ruolo={utente.ruoloCanonico}
      highlights={[
        {
          titolo: "Accesso operativo",
          descrizione:
            "La sessione attiva appartiene a un profilo autorizzato alle funzioni di servizio.",
        },
        {
          titolo: "Controllo flotta",
          descrizione:
            "Questa base verra estesa con gli strumenti di monitoraggio e manutenzione.",
        },
        {
          titolo: "Area dedicata",
          descrizione:
            "Gli operatori visualizzano un ingresso separato dal flusso dell'utente finale.",
        },
      ]}
    />
  );
}
