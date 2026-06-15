import type { Metadata } from "next";
import ListaMezziFiltrabile from "@/components/mappa/ListaMezziFiltrabile";
import HeroSezioneOperatore from "@/components/operatore/HeroSezioneOperatore";
import { mezziMock } from "@/lib/mappa/mock-data";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";

export const metadata: Metadata = {
  title: "Flotta | E-Smart Mobility",
  description:
    "Area operatore dedicata all'elenco filtrabile della flotta monitorata.",
};

export default async function OperatoreFlottaPage() {
  const mezziMonitorati = await risolviMezziConStatoDinamico(mezziMock);

  return (
    <>
      <HeroSezioneOperatore
        soprattitolo="Flotta"
        titolo="Qui puoi filtrare e leggere tutti i mezzi del campione operativo."
        descrizione="Qui l'operatore consulta l'intera flotta con stato, batteria e posizione aggiornata del mezzo, inclusa l'ultima posizione utile dopo la chiusura di un noleggio."
      />

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Flotta monitorata
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Mezzi e posizione operativa
          </h2>
        </div>

        <ListaMezziFiltrabile
          mezzi={mezziMonitorati}
          modalita="operatore"
          messaggioVuoto="Prova a cambiare stato o tipo mezzo per ritrovare i veicoli che vuoi monitorare."
        />
      </section>
    </>
  );
}
