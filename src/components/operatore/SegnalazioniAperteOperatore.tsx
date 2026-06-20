import AzioniSegnalazioneOperatore from "@/components/operatore/AzioniSegnalazioneOperatore";
import CronologiaSegnalazioniChiuseFiltrabile from "@/components/operatore/CronologiaSegnalazioniChiuseFiltrabile";
import type {
  CronologiaSegnalazioneChiusaOperatore,
  MezzoConDettaglioSegnalazioniAperte,
} from "@/types/segnalazioni";

type SegnalazioniAperteOperatoreProps = {
  mezziConSegnalazioniAperte: MezzoConDettaglioSegnalazioniAperte[];
  cronologiaSegnalazioniChiuse: CronologiaSegnalazioneChiusaOperatore[];
  operatoreCorrenteId: number;
};

function formattaCategoriaSegnalazione(categoria: string) {
  return categoria.toLowerCase().replaceAll("_", " ");
}

function formattaOrigineSegnalazione(origine: string) {
  return origine === "OPERATORE" ? "Operatore" : "Utente";
}

function formattaStatoMezzo(stato: string) {
  return stato.toLowerCase().replaceAll("_", " ");
}

function formattaStatoSegnalazione(stato: string) {
  return stato.toLowerCase().replaceAll("_", " ");
}

function classiBadgeOrigineSegnalazione(origine: string) {
  if (origine === "OPERATORE") {
    return "bg-sky-50 text-sky-700";
  }

  return "bg-fuchsia-50 text-fuchsia-700";
}

function classiBadgeStatoSegnalazione(stato: string) {
  if (stato === "PRESA_IN_CARICO") {
    return "bg-emerald-50 text-emerald-800";
  }

  if (stato === "RITIRO_PROGRAMMATO") {
    return "bg-amber-50 text-amber-800";
  }

  if (stato === "IN_MANUTENZIONE") {
    return "bg-rose-50 text-rose-800";
  }

  if (stato === "RISOLTA") {
    return "bg-sky-50 text-sky-800";
  }

  if (stato === "RIMESSA_IN_SERVIZIO_PROGRAMMATA") {
    return "bg-violet-50 text-violet-800";
  }

  if (stato === "RIMESSA_IN_SERVIZIO") {
    return "bg-slate-100 text-slate-800";
  }

  return "bg-amber-50 text-amber-800";
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

// Questa sezione diventa il punto unico di lettura delle anomalie aperte:
// l'operatore vede per mezzo il volume delle segnalazioni e la loro ultima
// evoluzione, senza confondere la pagina Priorita flotta con una gestione ampia.
export default function SegnalazioniAperteOperatore({
  mezziConSegnalazioniAperte,
  cronologiaSegnalazioniChiuse,
  operatoreCorrenteId,
}: SegnalazioniAperteOperatoreProps) {
  const totaleMezziCoinvolti = mezziConSegnalazioniAperte.length;
  const totaleSegnalazioniAperte = mezziConSegnalazioniAperte.reduce(
    (totale, voce) => totale + voce.riepilogo.totaleSegnalazioniAperte,
    0,
  );
  const tutteLeSegnalazioniAttive = mezziConSegnalazioniAperte.flatMap((voce) => voce.segnalazioniAttive);
  const totaleSegnalazioniInGestione = mezziConSegnalazioniAperte.reduce(
    (totale, voce) => totale + voce.riepilogo.totaleSegnalazioniInGestione,
    0,
  );
  const totaleSegnalazioniInCaricoAltri = tutteLeSegnalazioniAttive.filter(
    (segnalazione) =>
      segnalazione.stato !== "APERTA" &&
      segnalazione.operatorePresaInCarico?.id !== undefined &&
      segnalazione.operatorePresaInCarico?.id !== operatoreCorrenteId,
  ).length;
  const totaleSegnalazioniChiuse = cronologiaSegnalazioniChiuse.length;
  const ultimaChiusura = cronologiaSegnalazioniChiuse[0]?.segnalazione.risoltaAt;

  return (
    <section className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-4">
        <article className="rounded-[1.75rem] border border-sky-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Mezzi coinvolti
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            {totaleMezziCoinvolti}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Mezzi che hanno almeno una segnalazione ancora aperta oppure gia
            assegnata a un operatore.
          </p>
        </article>

        <article className="rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Segnalazioni aperte
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            {totaleSegnalazioniAperte}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Problemi ancora da prendere in mano oppure da verificare piu a
            fondo.
          </p>
        </article>

        <article className="rounded-[1.75rem] border border-emerald-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            In gestione
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            {totaleSegnalazioniInGestione}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Casi gia entrati nelle fasi operative successive all&apos;apertura,
            dal ritiro programmato fino alla rimessa in servizio finale.
          </p>
        </article>

        <article className="rounded-[1.75rem] border border-violet-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
            In carico ad altri
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            {totaleSegnalazioniInCaricoAltri}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Casi gia assegnati a un altro operatore e quindi non piu
            prendibili da questa sessione.
          </p>
        </article>
      </div>

      <article className="rounded-[1.85rem] border border-white/80 bg-white/92 p-6 shadow-[0_20px_54px_-30px_rgba(15,23,42,0.22)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Gestione per mezzo
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Qui trovi i mezzi che hanno segnalazioni da seguire.
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Ogni scheda raccoglie le segnalazioni ancora attive dello stesso
            mezzo, cosi il lavoro resta ordinato e consultabile nello stesso
            punto.
          </p>
        </div>
      </article>

      {mezziConSegnalazioniAperte.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {mezziConSegnalazioniAperte.map(
            ({ mezzo, riepilogo, segnalazioniAttive }) => {
              const segnalazioniInCaricoMie = segnalazioniAttive.filter(
                (segnalazione) =>
                  segnalazione.stato !== "APERTA" &&
                  segnalazione.operatorePresaInCarico?.id === operatoreCorrenteId,
              ).length;
              const segnalazioniInCaricoAltri = segnalazioniAttive.filter(
                (segnalazione) =>
                  segnalazione.stato !== "APERTA" &&
                  segnalazione.operatorePresaInCarico?.id !== undefined &&
                  segnalazione.operatorePresaInCarico?.id !== operatoreCorrenteId,
              ).length;

              return (
                <article
                  key={mezzo.id}
                  className="rounded-[2rem] border border-white/85 bg-white/96 p-5 shadow-[0_22px_62px_-34px_rgba(15,23,42,0.28)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
                          {mezzo.tipo}
                        </span>
                        <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-sky-700">
                          {formattaStatoMezzo(mezzo.stato)}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                          {mezzo.modello}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-slate-600">
                          {mezzo.codice} · {mezzo.areaServizioNome}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1.4rem] border border-slate-900/10 bg-slate-950 px-4 py-3 text-right text-white shadow-[0_16px_34px_-20px_rgba(15,23,42,0.55)]">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-sky-200">
                        Totale attivo
                      </p>
                      <p className="mt-1 text-2xl font-semibold">
                        {riepilogo.totaleSegnalazioniAperte +
                          riepilogo.totaleSegnalazioniInGestione}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4" />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.35rem] border border-slate-100 bg-slate-50/85 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Ultima categoria
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {formattaCategoriaSegnalazione(riepilogo.ultimaCategoria)}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-slate-100 bg-slate-50/85 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Ultima origine
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {formattaOrigineSegnalazione(riepilogo.ultimaOrigine)}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-slate-100 bg-slate-50/85 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Ultimo aggiornamento
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {formattaDataSegnalazione(riepilogo.ultimaSegnalazioneAt)}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-slate-100 bg-slate-50/85 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Ultimo codice
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {riepilogo.ultimoCodiceSegnalazione}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.35rem] border border-slate-100 bg-slate-50/70 px-4 py-3">
                    <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">
                        Aperte: {riepilogo.totaleSegnalazioniAperte}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                        In gestione: {riepilogo.totaleSegnalazioniInGestione}
                      </span>
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-800">
                        Tue: {segnalazioniInCaricoMie}
                      </span>
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-800">
                        Altri operatori: {segnalazioniInCaricoAltri}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        Batteria mezzo: {mezzo.batteria}%
                      </span>
                    </div>
                  </div>

                  <details className="group mt-4 overflow-hidden rounded-[1.45rem] border border-slate-100 bg-[linear-gradient(180deg,_rgba(248,250,252,0.96)_0%,_rgba(255,255,255,0.98)_100%)] shadow-[0_14px_30px_-24px_rgba(15,23,42,0.22)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Dettaglio segnalazioni
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          Apri l&apos;elenco attivo di questo mezzo
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 transition group-open:border-sky-300 group-open:bg-sky-100">
                          {riepilogo.totaleSegnalazioniAperte +
                            riepilogo.totaleSegnalazioniInGestione}{" "}
                          elementi
                        </span>
                        <span className="rounded-full border border-slate-900 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white transition group-open:border-rose-200 group-open:bg-rose-50 group-open:text-rose-700">
                          <span className="group-open:hidden">Apri</span>
                          <span className="hidden group-open:inline">Chiudi</span>
                        </span>
                      </div>
                    </summary>

                    <div className="border-t border-slate-100 bg-white/90 px-4 py-4">
                      <div className="space-y-3">
                      {segnalazioniAttive.map((segnalazione) => (
                        <article
                          key={segnalazione.id}
                          className="rounded-[1.35rem] border border-slate-100 bg-slate-50/65 px-4 py-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.16)]"
                        >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] ${classiBadgeOrigineSegnalazione(
                                segnalazione.origine,
                              )}`}
                            >
                              {formattaOrigineSegnalazione(
                                segnalazione.origine,
                              )}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] ${classiBadgeStatoSegnalazione(
                                segnalazione.stato,
                              )}`}
                            >
                              {formattaStatoSegnalazione(segnalazione.stato)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {formattaCategoriaSegnalazione(
                                segnalazione.categoria,
                              )}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {segnalazione.descrizione}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Codice
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {segnalazione.codice}
                          </p>
                        </div>
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
                            Ultimo aggiornamento
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {formattaDataSegnalazione(segnalazione.updatedAt)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Presa in carico
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {segnalazione.presaInCaricoAt
                              ? formattaDataSegnalazione(
                                  segnalazione.presaInCaricoAt,
                                )
                              : "Non ancora presa in carico"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 sm:col-span-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Operatore assegnato
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {segnalazione.operatorePresaInCarico
                              ? `${segnalazione.operatorePresaInCarico.nome} ${segnalazione.operatorePresaInCarico.cognome}`
                              : "Nessun operatore assegnato"}
                          </p>
                          {segnalazione.operatorePresaInCarico ? (
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {segnalazione.operatorePresaInCarico.email}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
                        <div className="space-y-1 rounded-[1.25rem] border border-slate-100 bg-white/85 px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Azioni operative
                          </p>
                          <p className="text-sm leading-6 text-slate-600">
                            Da qui puoi far avanzare il caso lungo tutto il
                            ciclo operativo: presa in carico, ritiro,
                            manutenzione, risoluzione e rimessa in servizio.
                          </p>
                        </div>

                        <div className="lg:justify-self-end">
                          <AzioniSegnalazioneOperatore
                            segnalazioneId={segnalazione.id}
                            stato={segnalazione.stato}
                            operatoreCorrenteId={operatoreCorrenteId}
                            operatorePresaInCaricoId={
                              segnalazione.operatorePresaInCarico?.id ?? null
                            }
                            operatorePresaInCaricoNome={
                              segnalazione.operatorePresaInCarico
                                ? `${segnalazione.operatorePresaInCarico.nome} ${segnalazione.operatorePresaInCarico.cognome}`
                                : null
                            }
                          />
                        </div>
                      </div>
                        </article>
                      ))}
                      </div>
                    </div>
                  </details>
                </article>
              );
            },
          )}
        </div>
      ) : (
        <article className="rounded-[1.75rem] border border-dashed border-sky-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.2)]">
          <p className="text-lg font-semibold text-slate-950">
            Nessuna segnalazione aperta in questo momento.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Quando un utente o un operatore registrera una nuova anomalia, la
            troverai qui raggruppata per mezzo.
          </p>
        </article>
      )}

      <article className="rounded-[1.85rem] border border-white/80 bg-white/94 p-6 shadow-[0_20px_54px_-30px_rgba(15,23,42,0.22)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">
            Cronologia chiusa
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Qui puoi rileggere le segnalazioni gia concluse.
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Lo storico resta separato dal lavoro ancora aperto, cosi puoi
            rileggere le chiusure passate senza appesantire la gestione attiva.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.45rem] border border-violet-200 bg-violet-50/75 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
              Segnalazioni chiuse
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {totaleSegnalazioniChiuse}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Archivio recente delle anomalie gia concluse e non piu attive.
            </p>
          </div>

          <div className="rounded-[1.45rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Ultima chiusura registrata
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {ultimaChiusura
                ? formattaDataSegnalazione(ultimaChiusura)
                : "Nessuna segnalazione chiusa"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              La cronologia resta disponibile per controlli successivi senza
              sovraccaricare il quadro operativo principale.
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
                Apri la cronologia delle segnalazioni concluse
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
                {totaleSegnalazioniChiuse} elementi
              </span>
              <span className="rounded-full border border-slate-900 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white transition group-open:border-violet-200 group-open:bg-violet-50 group-open:text-violet-700">
                <span className="group-open:hidden">Apri</span>
                <span className="hidden group-open:inline">Chiudi</span>
              </span>
            </div>
          </summary>

          <div className="border-t border-slate-100 bg-white/90 px-4 py-4">
            {cronologiaSegnalazioniChiuse.length > 0 ? (
              <CronologiaSegnalazioniChiuseFiltrabile
                cronologiaSegnalazioniChiuse={cronologiaSegnalazioniChiuse}
              />
            ) : (
              <article className="rounded-[1.35rem] border border-dashed border-violet-200 bg-white px-4 py-5">
                <p className="text-sm font-semibold text-slate-950">
                  Nessuna segnalazione chiusa disponibile in cronologia.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Quando una segnalazione verra conclusa, restera leggibile qui
                  senza occupare lo spazio dedicato ai casi ancora aperti.
                </p>
              </article>
            )}
          </div>
        </details>
      </article>
    </section>
  );
}
