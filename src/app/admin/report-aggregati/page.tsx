import type { Metadata } from "next";
import ReportAggregatiAmministrazioneClient from "@/components/admin/ReportAggregatiAmministrazioneClient";
import { costruisciReportAggregatoAmministrazione } from "@/lib/reportistica-amministrazione";

export const metadata: Metadata = {
  title: "Report Aggregati | E-Smart Mobility",
  description:
    "Prima area report della Pubblica Amministrazione con indicatori aggregati su mobilita e flotta.",
};

export default async function ReportAggregatiPage() {
  const report = await costruisciReportAggregatoAmministrazione();

  return <ReportAggregatiAmministrazioneClient reportIniziale={report} />;
}
