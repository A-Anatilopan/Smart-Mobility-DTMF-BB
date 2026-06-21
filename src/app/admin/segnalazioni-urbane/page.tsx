import type { Metadata } from "next";
import SegnalazioniUrbaneAmministrazioneClient from "@/components/admin/SegnalazioniUrbaneAmministrazioneClient";
import { recuperaSegnalazioniUrbaneRecenti } from "@/lib/segnalazioni-urbane";

export const metadata: Metadata = {
  title: "Segnalazioni Urbane | E-Smart Mobility",
  description:
    "Area della Pubblica Amministrazione dedicata a segnalazioni urbane e criticita del territorio.",
};

export default async function SegnalazioniUrbanePage() {
  const segnalazioniIniziali = await recuperaSegnalazioniUrbaneRecenti(12);

  return (
    <SegnalazioniUrbaneAmministrazioneClient
      segnalazioniIniziali={segnalazioniIniziali}
    />
  );
}
