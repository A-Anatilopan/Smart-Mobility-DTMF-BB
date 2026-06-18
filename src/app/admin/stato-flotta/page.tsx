import type { Metadata } from "next";
import StatoFlottaAmministrazioneClient from "@/components/admin/StatoFlottaAmministrazioneClient";
import { areeServizioMock, mezziMock } from "@/lib/mappa/mock-data";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";

export const metadata: Metadata = {
  title: "Stato Flotta | E-Smart Mobility",
  description:
    "Area della Pubblica Amministrazione dedicata alla lettura sintetica dello stato flotta.",
};

export default async function StatoFlottaPage() {
  const mezziMonitorati = await risolviMezziConStatoDinamico(mezziMock);

  return (
    <StatoFlottaAmministrazioneClient
      aree={areeServizioMock}
      mezziIniziali={mezziMonitorati}
    />
  );
}
