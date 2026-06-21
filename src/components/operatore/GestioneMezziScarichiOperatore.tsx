"use client";

import { useMemo, useState } from "react";
import {
  formattaStatoGestioneMezzoScarico,
  risolviPaletteStatoGestioneMezzoScarico,
  type GestioneMezzoScaricoAttiva,
  type GestioneMezzoScaricoChiusa,
  type StatoGestioneMezzoScarico,
} from "@/lib/mezzi-scarichi";
import type { Mezzo } from "@/types/mobilita";
import AzioneProgrammaRitiroMezzoScarico from "@/components/operatore/AzioneProgrammaRitiroMezzoScarico";
import AzioniWorkflowMezzoScarico from "@/components/operatore/AzioniWorkflowMezzoScarico";

type GestioneMezziScarichiOperatoreProps = {
  operatoreCorrenteId: number;
  mezziDaGestire: Mezzo[];
  gestioniAttive: GestioneMezzoScaricoAttiva[];
  gestioniChiuse: GestioneMezzoScaricoChiusa[];
};

function formattaDataOra(valore: Date | string | null) {
  if (!valore) {
    return "Dato non disponibile";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valore));
}

function contaPerStato(
  gestioni: GestioneMezzoScaricoAttiva[],
  stato: GestioneMezzoScaricoAttiva["stato"],
) {
  return gestioni.filter((gestione) => gestione.stato === stato).length;
}

// Questa vista apre il dominio OP.09 con una sezione dedicata e gia pulita:
// oggi rende visibili i mezzi scarichi da prendere in carico e i workflow
// logistici gia aperti, mentre i pulsanti di avanzamento arriveranno negli
// step successivi.
export default function GestioneMezziScarichiOperatore({
  operatoreCorrenteId,
  mezziDaGestire,
  gestioniAttive,
  gestioniChiuse,
}: GestioneMezziScarichiOperatoreProps) {
  const [mezzoSelezionato, setMezzoSelezionato] = useState("TUTTI");

  const mezziDisponibiliPerFiltro = useMemo(() => {
    const mappaMezzi = new Map<
      string,
      { id: string; modello: string; codice: string }
    >();

    for (const mezzo of mezziDaGestire) {
      mappaMezzi.set(mezzo.id, {
        id: mezzo.id,
        modello: mezzo.modello,
        codice: mezzo.codice,
      });
    }

    for (const gestione of gestioniAttive) {
      mappaMezzi.set(gestione.mezzo.id, {
        id: gestione.mezzo.id,
        modello: gestione.mezzo.modello,
        codice: gestione.mezzo.codice,
      });
    }

    for (const gestione of gestioniChiuse) {
      mappaMezzi.set(gestione.mezzo.id, {
        id: gestione.mezzo.id,
        modello: gestione.mezzo.modello,
        codice: gestione.mezzo.codice,
      });
    }

    return Array.from(mappaMezzi.values()).sort((a, b) =>
      `${a.modello} ${a.codice}`.localeCompare(`${b.modello} ${b.codice}`, "it"),
    );
  }, [gestioniAttive, gestioniChiuse, mezziDaGestire]);

  const gestioniChiuseFiltrate = useMemo(
    () =>
      mezzoSelezionato === "TUTTI"
        ? gestioniChiuse
        : gestioniChiuse.filter(
            (gestione) => gestione.mezzo.id === mezzoSelezionato,
          ),
    [gestioniChiuse, mezzoSelezionato],
  );

  const haFiltroAttivo = mezzoSelezionato !== "TUTTI";

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Da programmare
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {mezziDaGestire.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Mezzi scarichi gia fuori disponibilita ma non ancora entrati nel
            workflow logistico.
          </p>
        </article>

        <article className="rounded-[1.75rem] border border-rose-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
            Ritiri attivi
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {contaPerStato(gestioniAttive, "RITIRO_PROGRAMMATO_MEZZO_SCARICO") +
              contaPerStato(gestioniAttive, "MEZZO_RITIRATO")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Mezzi gia agganciati al ciclo di recupero, dal ritiro programmato
            fino al ritiro completato.
          </p>
        </article>

        <article className="rounded-[1.75rem] border border-cyan-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
            In carica
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {contaPerStato(gestioniAttive, "IN_CARICA")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Mezzi che si trovano attualmente fuori città e sono in fase di
            ricarica.
          </p>
        </article>

        <article className="rounded-[1.75rem] border border-emerald-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Rientro pronto
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {contaPerStato(gestioniAttive, "CARICA_COMPLETATA") +
              contaPerStato(gestioniAttive, "RIMESSA_PROGRAMMATA")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Mezzi pronti a rientrare sul territorio ma non ancora rimessi in
            servizio.
          </p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              Mezzi scarichi da prendere in carico
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Qui partiranno i nuovi ritiri.
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              Ogni mezzo mostrato qui e gia fuori disponibilita per batteria
              bassa e aspetta soltanto l&apos;apertura del suo ciclo logistico.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {mezziDaGestire.length > 0 ? (
              mezziDaGestire.map((mezzo) => (
                <div
                  key={mezzo.id}
                  className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {mezzo.modello} ({mezzo.codice})
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {mezzo.tipo} · {mezzo.areaServizioNome}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-amber-800">
                        {mezzo.batteria}%
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                        Batteria
                      </p>
                    </div>
                  </div>

                  <AzioneProgrammaRitiroMezzoScarico mezzoId={mezzo.id} />
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/65 px-4 py-4">
                <p className="text-sm font-medium text-slate-700">
                  In questo momento non ci sono nuovi mezzi scarichi da avviare.
                </p>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-sky-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Workflow aperti
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Qui restano visibili i mezzi gia entrati nel ciclo.
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              Questa colonna rende chiaro a che punto si trova ogni mezzo
              scarico gia agganciato alla gestione operativa.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {gestioniAttive.length > 0 ? (
              gestioniAttive.map((gestione) => {
                const stato = gestione.stato as StatoGestioneMezzoScarico;
                const palette = risolviPaletteStatoGestioneMezzoScarico(stato);

                return (
                  <div
                    key={gestione.id}
                    className={`rounded-2xl border px-4 py-4 ${palette.bordoCard} ${palette.sfondoCard}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-950">
                            {gestione.mezzo.modello} ({gestione.mezzo.codice})
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${palette.etichetta}`}
                          >
                            {formattaStatoGestioneMezzoScarico(stato)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600">
                          Operatore: {gestione.operatore.nome}{" "}
                          {gestione.operatore.cognome}
                        </p>
                        {gestione.noteOperative ? (
                          <p className="text-sm text-slate-600">
                            Nota: {gestione.noteOperative}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <p className={`text-lg font-semibold ${palette.testoAccento}`}>
                          {gestione.mezzo.batteria}%
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                          Batteria attuale
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Ingresso: {gestione.batteriaRilevata}%
                        </p>
                      </div>
                    </div>

                    <AzioniWorkflowMezzoScarico
                      gestioneId={gestione.id}
                      stato={stato}
                      operatoreCorrenteId={operatoreCorrenteId}
                      operatoreAssegnatoId={gestione.operatore.id}
                      operatoreAssegnatoNome={`${gestione.operatore.nome} ${gestione.operatore.cognome}`.trim()}
                    />
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/65 px-4 py-4">
                <p className="text-sm font-medium text-slate-700">
                  Nessun ciclo di ritiro o ricarica e attivo in questo momento.
                </p>
              </div>
            )}
          </div>
        </article>
      </div>

      <article className="rounded-[1.75rem] border border-emerald-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Storico chiuso
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
            Qui ritrovi le ultime rimesse completate.
          </h3>
          <p className="text-sm leading-6 text-slate-600">
            Questa lista tiene separati i casi ormai conclusi, cosi il flusso
            attivo resta leggibile ma l&apos;operatore non perde la tracciabilita
            del lavoro gia chiuso.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.45rem] border border-emerald-200 bg-emerald-50/75 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Workflow chiusi
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {gestioniChiuseFiltrate.length}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Storico recente dei mezzi gia ricaricati e rimessi nel flusso
              logistico concluso.
            </p>
          </div>

          <div className="rounded-[1.45rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Ultima chiusura registrata
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {gestioniChiuseFiltrate[0]?.chiusaAt
                ? formattaDataOra(gestioniChiuseFiltrate[0].chiusaAt)
                : "Nessuna chiusura disponibile"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Lo storico resta richiamabile solo quando serve, cosi la sezione
              principale non si allunga inutilmente.
            </p>
          </div>
        </div>

        <details className="group mt-5 overflow-hidden rounded-[1.55rem] border border-slate-100 bg-[linear-gradient(180deg,_rgba(248,250,252,0.94)_0%,_rgba(255,255,255,0.98)_100%)] shadow-[0_14px_30px_-24px_rgba(15,23,42,0.18)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Storico disponibile
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                Apri lo storico delle rimesse completate
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                {gestioniChiuseFiltrate.length} elementi
              </span>
              <span className="rounded-full border border-slate-900 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white transition group-open:border-emerald-200 group-open:bg-emerald-50 group-open:text-emerald-700">
                <span className="group-open:hidden">Apri</span>
                <span className="hidden group-open:inline">Chiudi</span>
              </span>
            </div>
          </summary>

          <div className="border-t border-slate-100 bg-white/90 px-4 py-4">
            <div className="rounded-[1.45rem] border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Filtro storico
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    Seleziona un mezzo per rivedere solo le rimesse completate
                    che lo riguardano.
                  </p>
                </div>

                {haFiltroAttivo ? (
                  <button
                    type="button"
                    onClick={() => setMezzoSelezionato("TUTTI")}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Reset filtro
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Mezzo
                  </span>
                  <select
                    value={mezzoSelezionato}
                    onChange={(event) =>
                      setMezzoSelezionato(event.target.value)
                    }
                    className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="TUTTI">Tutti i mezzi</option>
                    {mezziDisponibiliPerFiltro.map((mezzo) => (
                      <option key={`mezzo-scarico-${mezzo.id}`} value={mezzo.id}>
                        {mezzo.modello} ({mezzo.codice})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-[1.1rem] border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600">
                  {haFiltroAttivo
                    ? `${gestioniChiuseFiltrate.length} chiusure per il mezzo selezionato`
                    : "Vista completa su tutte le chiusure registrate"}
                </div>
              </div>
            </div>

            {gestioniChiuseFiltrate.length > 0 ? (
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {gestioniChiuseFiltrate.map((gestione) => {
              const stato = gestione.stato as StatoGestioneMezzoScarico;
              const palette = risolviPaletteStatoGestioneMezzoScarico(stato);

              return (
                <div
                  key={gestione.id}
                  className={`rounded-2xl border px-4 py-4 ${palette.bordoCard} ${palette.sfondoCard}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-950">
                          {gestione.mezzo.modello} ({gestione.mezzo.codice})
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${palette.etichetta}`}
                        >
                          {formattaStatoGestioneMezzoScarico(stato)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Operatore: {gestione.operatore.nome}{" "}
                        {gestione.operatore.cognome}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-semibold ${palette.testoAccento}`}>
                        {gestione.mezzo.batteria}%
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        Batteria finale
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/80 bg-white/85 px-3 py-3">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Ritiro aperto
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">
                        {formattaDataOra(gestione.ritiroProgrammatoAt)}
                      </dd>
                    </div>

                    <div className="rounded-xl border border-white/80 bg-white/85 px-3 py-3">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Rimessa completata
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">
                        {formattaDataOra(gestione.chiusaAt)}
                      </dd>
                    </div>
                  </dl>

                  {gestione.noteOperative ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Nota iniziale: {gestione.noteOperative}
                    </p>
                  ) : null}
                </div>
              );
                })}
              </div>
            ) : (
              <article className="rounded-[1.35rem] border border-dashed border-emerald-200 bg-white px-4 py-5">
                <p className="text-sm font-semibold text-slate-950">
                  Nessuna rimessa completata disponibile in cronologia.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Quando un mezzo completera il suo ciclo, restera consultabile
                  qui senza occupare spazio nella parte attiva della sezione.
                </p>
              </article>
            )}
          </div>
        </details>
      </article>
    </section>
  );
}
