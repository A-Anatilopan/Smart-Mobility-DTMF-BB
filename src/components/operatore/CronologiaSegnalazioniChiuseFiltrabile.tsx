"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { CronologiaSegnalazioneChiusaOperatore } from "@/types/segnalazioni";

type CronologiaSegnalazioniChiuseFiltrabileProps = {
  cronologiaSegnalazioniChiuse: CronologiaSegnalazioneChiusaOperatore[];
};

function formattaCategoriaSegnalazione(categoria: string) {
  return categoria.toLowerCase().replaceAll("_", " ");
}

function formattaOrigineSegnalazione(origine: string) {
  return origine === "OPERATORE" ? "Operatore" : "Utente";
}

function formattaDataSegnalazione(valore: Date | string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valore));
}

function classiBadgeOrigineSegnalazione(origine: string) {
  if (origine === "OPERATORE") {
    return "bg-sky-50 text-sky-700";
  }

  return "bg-fuchsia-50 text-fuchsia-700";
}

// La cronologia chiusa cresce nel tempo: questi filtri aiutano l'operatore a
// ritrovare rapidamente una segnalazione gia risolta senza confonderla con i
// casi ancora aperti.
export default function CronologiaSegnalazioniChiuseFiltrabile({
  cronologiaSegnalazioniChiuse,
}: CronologiaSegnalazioniChiuseFiltrabileProps) {
  const [ricerca, setRicerca] = useState("");
  const [categoriaSelezionata, setCategoriaSelezionata] = useState("TUTTE");
  const [origineSelezionata, setOrigineSelezionata] = useState("TUTTE");
  const [areaSelezionata, setAreaSelezionata] = useState("TUTTE");

  const ricercaDifferita = useDeferredValue(ricerca);

  const categorieDisponibili = useMemo(
    () =>
      Array.from(
        new Set(
          cronologiaSegnalazioniChiuse.map(
            ({ segnalazione }) => segnalazione.categoria,
          ),
        ),
      ),
    [cronologiaSegnalazioniChiuse],
  );

  const originiDisponibili = useMemo(
    () =>
      Array.from(
        new Set(
          cronologiaSegnalazioniChiuse.map(
            ({ segnalazione }) => segnalazione.origine,
          ),
        ),
      ),
    [cronologiaSegnalazioniChiuse],
  );

  const areeDisponibili = useMemo(
    () =>
      Array.from(
        new Set(
          cronologiaSegnalazioniChiuse.map(({ mezzo }) => mezzo.areaServizioNome),
        ),
      ),
    [cronologiaSegnalazioniChiuse],
  );

  const cronologiaFiltrata = cronologiaSegnalazioniChiuse.filter(
    ({ segnalazione, mezzo }) => {
      const query = ricercaDifferita.trim().toLowerCase();
      const combaciaRicerca =
        query.length === 0 ||
        segnalazione.codice.toLowerCase().includes(query) ||
        mezzo.codice.toLowerCase().includes(query) ||
        mezzo.modello.toLowerCase().includes(query) ||
        segnalazione.descrizione.toLowerCase().includes(query) ||
        (segnalazione.riepilogoRisoluzione ?? "").toLowerCase().includes(query) ||
        `${segnalazione.operatorePresaInCarico?.nome ?? ""} ${
          segnalazione.operatorePresaInCarico?.cognome ?? ""
        }`
          .trim()
          .toLowerCase()
          .includes(query) ||
        (segnalazione.operatorePresaInCarico?.email ?? "")
          .toLowerCase()
          .includes(query);
      const combaciaCategoria =
        categoriaSelezionata === "TUTTE" ||
        segnalazione.categoria === categoriaSelezionata;
      const combaciaOrigine =
        origineSelezionata === "TUTTE" ||
        segnalazione.origine === origineSelezionata;
      const combaciaArea =
        areaSelezionata === "TUTTE" || mezzo.areaServizioNome === areaSelezionata;

      return (
        combaciaRicerca &&
        combaciaCategoria &&
        combaciaOrigine &&
        combaciaArea
      );
    },
  );

  const haFiltriAttivi =
    ricerca.trim().length > 0 ||
    categoriaSelezionata !== "TUTTE" ||
    origineSelezionata !== "TUTTE" ||
    areaSelezionata !== "TUTTE";

  return (
    <div className="space-y-4">
      <div className="rounded-[1.45rem] border border-slate-100 bg-slate-50/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Filtri cronologia
            </p>
            <p className="text-sm leading-6 text-slate-600">
              Cerca per codice, mezzo, descrizione o riepilogo e restringi lo
              storico per categoria, origine o area.
            </p>
          </div>

          {haFiltriAttivi ? (
            <button
              type="button"
              onClick={() => {
                setRicerca("");
                setCategoriaSelezionata("TUTTE");
                setOrigineSelezionata("TUTTE");
                setAreaSelezionata("TUTTE");
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Reset filtri
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Cerca</span>
            <input
              type="text"
              value={ricerca}
              onChange={(event) => setRicerca(event.target.value)}
              placeholder="Codice, mezzo o riepilogo"
              className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Categoria</span>
            <select
              value={categoriaSelezionata}
              onChange={(event) => setCategoriaSelezionata(event.target.value)}
              className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="TUTTE">Tutte</option>
              {categorieDisponibili.map((categoria) => (
                <option key={`categoria-chiusa-${categoria}`} value={categoria}>
                  {formattaCategoriaSegnalazione(categoria)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Origine</span>
            <select
              value={origineSelezionata}
              onChange={(event) => setOrigineSelezionata(event.target.value)}
              className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="TUTTE">Tutte</option>
              {originiDisponibili.map((origine) => (
                <option key={`origine-chiusa-${origine}`} value={origine}>
                  {formattaOrigineSegnalazione(origine)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Area</span>
            <select
              value={areaSelezionata}
              onChange={(event) => setAreaSelezionata(event.target.value)}
              className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="TUTTE">Tutte</option>
              {areeDisponibili.map((area) => (
                <option key={`area-chiusa-${area}`} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {cronologiaFiltrata.length > 0 ? (
        <div className="space-y-3">
          {cronologiaFiltrata.map(({ segnalazione, mezzo }) => (
            <article
              key={segnalazione.id}
              className="rounded-[1.35rem] border border-slate-100 bg-slate-50/70 px-4 py-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.16)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-700">
                      {mezzo.tipo}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] ${classiBadgeOrigineSegnalazione(
                        segnalazione.origine,
                      )}`}
                    >
                      {formattaOrigineSegnalazione(segnalazione.origine)}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-emerald-800">
                      Risolta
                    </span>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-slate-950">
                      {mezzo.modello}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {mezzo.codice} · {mezzo.areaServizioNome}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Codice segnalazione
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {segnalazione.codice}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-slate-100 bg-white/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Categoria e descrizione
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {formattaCategoriaSegnalazione(segnalazione.categoria)}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {segnalazione.descrizione}
                </p>
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-emerald-100 bg-[linear-gradient(180deg,_rgba(236,253,245,0.78)_0%,_rgba(255,255,255,0.94)_100%)] px-4 py-3 shadow-[0_12px_26px_-22px_rgba(16,185,129,0.28)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Riepilogo risoluzione
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {segnalazione.riepilogoRisoluzione ??
                    "Nessun riepilogo registrato."}
                </p>
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-sky-100 bg-sky-50/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                  Operatore assegnatario
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {segnalazione.operatorePresaInCarico
                    ? `${segnalazione.operatorePresaInCarico.nome} ${segnalazione.operatorePresaInCarico.cognome}`
                    : "Operatore non registrato"}
                </p>
                {segnalazione.operatorePresaInCarico ? (
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {segnalazione.operatorePresaInCarico.email}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Apertura
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {formattaDataSegnalazione(segnalazione.createdAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Chiusura
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {segnalazione.risoltaAt
                      ? formattaDataSegnalazione(segnalazione.risoltaAt)
                      : "Chiusura non registrata"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Presa in carico
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {segnalazione.presaInCaricoAt
                      ? formattaDataSegnalazione(segnalazione.presaInCaricoAt)
                      : "Non registrata"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <article className="rounded-[1.35rem] border border-dashed border-violet-200 bg-white px-4 py-5">
          <p className="text-sm font-semibold text-slate-950">
            Nessuna segnalazione chiusa corrisponde ai filtri selezionati.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Prova ad allargare la ricerca o a rimuovere alcuni filtri per
            ritrovare piu rapidamente lo storico che ti serve.
          </p>
        </article>
      )}
    </div>
  );
}
