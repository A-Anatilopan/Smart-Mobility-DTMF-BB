import type { Metadata } from "next";
import AnagraficheAmministrazioneClient from "@/components/admin/AnagraficheAmministrazioneClient";
import { recuperaAnagraficheUtentiAmministrazione } from "@/lib/anagrafiche-amministrazione";

export const metadata: Metadata = {
  title: "Anagrafiche | E-Smart Mobility",
  description:
    "Area della Pubblica Amministrazione dedicata alla consultazione utenti e patenti.",
};

// La pagina resta server-side: prepara il dataset iniziale e lascia alla UI
// client solo ricerca e filtro locale.
export default async function AnagrafichePage() {
  const anagraficheIniziali = await recuperaAnagraficheUtentiAmministrazione();

  return (
    <AnagraficheAmministrazioneClient
      anagraficheIniziali={anagraficheIniziali}
    />
  );
}
