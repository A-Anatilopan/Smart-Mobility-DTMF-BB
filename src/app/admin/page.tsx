import type { Metadata } from "next";
import DashboardAmministrazioneClient from "@/components/admin/DashboardAmministrazioneClient";
import { areeServizioMock } from "@/lib/mappa/mock-data";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";
import type { PosizioneUtenteMappa } from "@/types/mobilita";

// Metadati della vista iniziale della Pubblica Amministrazione.
export const metadata: Metadata = {
  title: "Area Pubblica Amministrazione | E-Smart Mobility",
  description:
    "Area riservata della Pubblica Amministrazione per il quadro iniziale del servizio e della copertura urbana.",
};

type DashboardPubblicaAmministrazionePageProps = {
  searchParams: Promise<{
    latitudine?: string | string[];
    longitudine?: string | string[];
    focus?: string | string[];
  }>;
};

function parseNumeroQuery(valore: string | string[] | undefined): number | null {
  if (typeof valore !== "string") {
    return null;
  }

  const numero = Number(valore);
  return Number.isFinite(numero) ? numero : null;
}

// Se la pagina riceve coordinate da una segnalazione urbana, riusiamo la
// stessa mappa istituzionale centrando subito il focus sul punto indicato.
function ricavaPosizioneFocusDaQuery(query: {
  latitudine?: string | string[];
  longitudine?: string | string[];
  focus?: string | string[];
}): PosizioneUtenteMappa | null {
  const latitudine = parseNumeroQuery(query.latitudine);
  const longitudine = parseNumeroQuery(query.longitudine);

  if (latitudine === null || longitudine === null) {
    return null;
  }

  return {
    latitudine,
    longitudine,
    etichetta:
      query.focus === "segnalazione"
        ? "Posizione segnalazione"
        : "Punto selezionato",
  };
}

export default async function DashboardPubblicaAmministrazionePage({
  searchParams,
}: DashboardPubblicaAmministrazionePageProps) {
  const query = await searchParams;
  const mezziMonitorati = await risolviMezziConStatoDinamico();
  const posizioneFocus = ricavaPosizioneFocusDaQuery(query);

  return (
    <DashboardAmministrazioneClient
      aree={areeServizioMock}
      mezziIniziali={mezziMonitorati}
      posizioneFocus={posizioneFocus}
    />
  );
}
