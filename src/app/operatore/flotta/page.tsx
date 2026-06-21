import type { Metadata } from "next";
import FlottaOperatoreClient from "@/components/operatore/FlottaOperatoreClient";
import HeroSezioneOperatore from "@/components/operatore/HeroSezioneOperatore";
import RiepilogoSessioniOperativeAttive from "@/components/operatore/RiepilogoSessioniOperativeAttive";
import { risolviMezziConStatoDinamico } from "@/lib/mezzi";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/session";
import { RUOLI } from "@/lib/ruoli";
import type { StatoMezzo } from "@/types/mobilita";

export const metadata: Metadata = {
  title: "Flotta | E-Smart Mobility",
  description:
    "Area operatore dedicata all'elenco filtrabile della flotta monitorata.",
};

type OperatoreFlottaPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const STATI_FILTRO_VALIDI: StatoMezzo[] = [
  "DISPONIBILE",
  "PRENOTATO",
  "IN_USO",
  "IN_PAUSA",
  "IN_MANUTENZIONE",
  "NON_DISPONIBILE",
];

function risolviStatoFiltroIniziale(
  valore: string | string[] | undefined,
): StatoMezzo | "TUTTI" {
  if (typeof valore !== "string") {
    return "TUTTI";
  }

  const statoNormalizzato = valore.trim().toUpperCase();

  if (statoNormalizzato === "TUTTI" || statoNormalizzato.length === 0) {
    return "TUTTI";
  }

  return STATI_FILTRO_VALIDI.includes(statoNormalizzato as StatoMezzo)
    ? (statoNormalizzato as StatoMezzo)
    : "TUTTI";
}

export default async function OperatoreFlottaPage({
  searchParams,
}: OperatoreFlottaPageProps) {
  const [operatore, mezziMonitorati, sessioniOperativeAttiveDb] = await Promise.all([
    richiediRuolo(RUOLI.OPERATORE),
    risolviMezziConStatoDinamico(),
    prisma.sessioneOperativaMezzo.findMany({
      where: {
        stato: "ATTIVA",
        modalita: "LOCALE",
      },
      select: {
        id: true,
        codice: true,
        mezzoId: true,
        mezzoCodice: true,
        motivo: true,
        noteApertura: true,
        noteChiusura: true,
        apertaAt: true,
        operatore: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            email: true,
          },
        },
      },
      orderBy: {
        apertaAt: "desc",
      },
    }),
  ]);
  const query = await searchParams;
  const ricercaIniziale =
    typeof query.ricerca === "string" ? query.ricerca.trim() : "";
  const statoIniziale = risolviStatoFiltroIniziale(query.stato);
  const sessioniOperativeAttive = Object.fromEntries(
    sessioniOperativeAttiveDb.map((sessione) => [
      sessione.mezzoId,
      {
        ...sessione,
        apertaAt: sessione.apertaAt.toISOString(),
      },
    ]),
  );
  const sessioniOperativeRiepilogo = sessioniOperativeAttiveDb.map(
    (sessione) => {
      const mezzo = mezziMonitorati.find(
        (mezzoCorrente) => mezzoCorrente.id === sessione.mezzoId,
      );

      return {
        id: sessione.id,
        codice: sessione.codice,
        mezzoId: sessione.mezzoId,
        mezzoCodice: sessione.mezzoCodice,
        mezzoModello: mezzo?.modello ?? sessione.mezzoCodice,
        statoMezzoCorrente: mezzo?.stato ?? "NON_DISPONIBILE",
        motivo: sessione.motivo,
        noteApertura: sessione.noteApertura,
        noteChiusura: sessione.noteChiusura,
        apertaAt: sessione.apertaAt.toISOString(),
        operatore: sessione.operatore,
      };
    },
  );

  return (
    <>
      <HeroSezioneOperatore
        soprattitolo="Flotta"
        titolo="Qui puoi filtrare e leggere tutti i mezzi del campione operativo."
        descrizione="Qui l'operatore consulta l'intera flotta con stato, batteria e posizione aggiornata del mezzo, inclusa l'ultima posizione utile dopo la chiusura di un noleggio."
      />

      <section id="flotta-monitorata" className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Flotta monitorata
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Mezzi e posizione operativa
          </h2>
        </div>

        <RiepilogoSessioniOperativeAttive
          sessioni={sessioniOperativeRiepilogo}
          operatoreCorrenteId={operatore.id}
        />

        <FlottaOperatoreClient
          key={`${ricercaIniziale || "vuoto"}::${statoIniziale}`}
          mezzi={mezziMonitorati}
          ricercaIniziale={ricercaIniziale}
          statoIniziale={statoIniziale}
          sessioniOperativeAttive={sessioniOperativeAttive}
        />
      </section>
    </>
  );
}
