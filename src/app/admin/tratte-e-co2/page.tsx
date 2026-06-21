import type { Metadata } from "next";
import TratteECo2AmministrazioneClient from "@/components/admin/TratteECo2AmministrazioneClient";
import { costruisciReportTratteCo2Amministrazione } from "@/lib/tratte-co2-amministrazione";

export const metadata: Metadata = {
  title: "Tratte e CO2 | E-Smart Mobility",
  description:
    "Area della Pubblica Amministrazione dedicata a tratte piu usate e impatto ambientale.",
};

export default async function TratteECo2Page() {
  const report = await costruisciReportTratteCo2Amministrazione();

  return <TratteECo2AmministrazioneClient reportIniziale={report} />;
}
