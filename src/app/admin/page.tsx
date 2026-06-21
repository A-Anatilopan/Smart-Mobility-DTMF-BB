import type { Metadata } from "next";
import DashboardAmministrazioneClient from "@/components/admin/DashboardAmministrazioneClient";
import { areeServizioMock } from "@/lib/mappa/mock-data";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";

// Metadati della vista iniziale della Pubblica Amministrazione.
export const metadata: Metadata = {
  title: "Area Pubblica Amministrazione | E-Smart Mobility",
  description:
    "Area riservata della Pubblica Amministrazione per il quadro iniziale del servizio e della copertura urbana.",
};

export default async function DashboardPubblicaAmministrazionePage() {
  const mezziMonitorati = await risolviMezziConStatoDinamico();

  return <DashboardAmministrazioneClient aree={areeServizioMock} mezziIniziali={mezziMonitorati} />;
}
