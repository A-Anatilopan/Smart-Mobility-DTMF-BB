"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DivIcon,
  type LatLngBoundsExpression,
  type LatLngExpression,
  type LatLngTuple,
} from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { puntiInteresseMappaMock } from "@/lib/mappa/mock-data";
import type { Coordinate, Mezzo, PuntoInteresseMappa } from "@/types/mobilita";
import type {
  MappaServizioProps,
  ModalitaMappa,
} from "@/components/mappa/mappa-servizio.types";

const BARI_CENTRO: LatLngExpression = [41.1171, 16.8719];

const TESTI_MAPPA: Record<
  ModalitaMappa,
  { soprattitolo: string; titolo: string; descrizione: string }
> = {
  utente: {
    soprattitolo: "Mappa servizio",
    titolo: "Scegli il tuo prossimo mezzo direttamente sulla mappa",
    descrizione:
      "Guarda i mezzi disponibili vicino a te, apri il popup del veicolo che preferisci e gestisci il noleggio senza cambiare schermata.",
  },
  operatore: {
    soprattitolo: "Mappa operativa",
    titolo: "Bari, copertura territoriale e distribuzione della flotta",
    descrizione:
      "La vista operativa usa cartografia reale e sovrappone aree di servizio, mezzi monitorati e punti utili alla lettura del territorio.",
  },
  amministrazione: {
    soprattitolo: "Copertura urbana",
    titolo: "Bari su base cartografica reale",
    descrizione:
      "La vista istituzionale permette di osservare la copertura del servizio e la distribuzione del campione flotta sopra una mappa reale della citta.",
  },
};

const STATO_COLORI: Record<Mezzo["stato"], string> = {
  DISPONIBILE: "#10b981",
  PRENOTATO: "#f59e0b",
  IN_USO: "#0ea5e9",
  IN_PAUSA: "#8b5cf6",
  IN_MANUTENZIONE: "#f43f5e",
  NON_DISPONIBILE: "#64748b",
};

const STATO_LABELS: Record<Mezzo["stato"], string> = {
  DISPONIBILE: "Disponibile",
  PRENOTATO: "Prenotato",
  IN_USO: "In uso",
  IN_PAUSA: "In pausa",
  IN_MANUTENZIONE: "In manutenzione",
  NON_DISPONIBILE: "Non disponibile",
};

const TIPO_SIMBOLO: Record<Mezzo["tipo"], string> = {
  "E-Bike": "🚲",
  "E-Scooter": "🛴",
  "E-Car": "🚗",
};

function toLatLng(punto: Coordinate): LatLngExpression {
  return [punto.latitudine, punto.longitudine];
}

function toLatLngTuple(punto: Coordinate): LatLngTuple {
  return [punto.latitudine, punto.longitudine];
}

function costruisciBounds({
  aree,
  mezzi,
  puntiInteresse,
  posizioneUtente,
  riconsegneRecenti,
}: Pick<MappaServizioProps, "aree" | "mezzi" | "posizioneUtente"> & {
  puntiInteresse: PuntoInteresseMappa[];
  riconsegneRecenti: NonNullable<MappaServizioProps["riconsegneRecenti"]>;
}): LatLngBoundsExpression | null {
  const punti = [
    ...aree.flatMap((area) => area.punti),
    ...mezzi,
    ...puntiInteresse,
    ...riconsegneRecenti,
    ...(posizioneUtente ? [posizioneUtente] : []),
  ];

  if (punti.length === 0) {
    return null;
  }

  return punti.map(toLatLngTuple);
}

function AdattaMappaAiContenuti({
  bounds,
  posizioneCentrale,
}: {
  bounds: LatLngBoundsExpression | null;
  posizioneCentrale?: Coordinate | null;
}) {
  const map = useMap();
  const haGiaPosizionatoLaMappa = useRef(false);

  useEffect(() => {
    if (haGiaPosizionatoLaMappa.current) {
      return;
    }

    if (posizioneCentrale) {
      map.setView(toLatLng(posizioneCentrale), 15);
      haGiaPosizionatoLaMappa.current = true;
      return;
    }

    if (bounds) {
      map.fitBounds(bounds, { padding: [36, 36] });
      haGiaPosizionatoLaMappa.current = true;
      return;
    }

    map.setView(BARI_CENTRO, 14);
    haGiaPosizionatoLaMappa.current = true;
  }, [bounds, map, posizioneCentrale]);

  return null;
}

function MezzoPopup({
  mezzo,
  modalita,
  noleggioUtente,
  onApriSegnalazioneMezzo,
}: {
  mezzo: Mezzo;
  modalita: ModalitaMappa;
  noleggioUtente?: MappaServizioProps["noleggioUtente"];
  onApriSegnalazioneMezzo?: MappaServizioProps["onApriSegnalazioneMezzo"];
}) {
  const controllerNoleggio = modalita === "utente" ? noleggioUtente ?? null : null;
  const prenotazioneSulMezzo =
    controllerNoleggio?.prenotazioneAttiva?.mezzo?.id === mezzo.id;
  const corsaSulMezzo =
    controllerNoleggio?.corsaAttiva?.mezzo?.id === mezzo.id;
  const statoCorsaSulMezzo = corsaSulMezzo
    ? controllerNoleggio?.corsaAttiva?.stato
    : null;
  const puoPrenotare =
    Boolean(controllerNoleggio) &&
    mezzo.stato === "DISPONIBILE" &&
    !prenotazioneSulMezzo &&
    !corsaSulMezzo;
  const puoAvviare =
    Boolean(controllerNoleggio) &&
    (prenotazioneSulMezzo ||
      statoCorsaSulMezzo === "IN_PAUSA" ||
      (mezzo.stato === "DISPONIBILE" &&
        !(controllerNoleggio?.prenotazioneBloccata ?? false) &&
        !prenotazioneSulMezzo &&
        !corsaSulMezzo));
  const puoMettereInPausa =
    Boolean(controllerNoleggio) && statoCorsaSulMezzo === "ATTIVA";
  const puoTerminare =
    Boolean(controllerNoleggio) &&
    (statoCorsaSulMezzo === "ATTIVA" || statoCorsaSulMezzo === "IN_PAUSA");
  const mostraNotaBlocco =
    controllerNoleggio &&
    !puoPrenotare &&
    !puoAvviare &&
    !puoMettereInPausa &&
    !puoTerminare &&
    controllerNoleggio.prenotazioneBloccata;

  const pulsantePrimarioClassName =
    "inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400";
  const pulsanteSecondarioClassName =
    "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400";

  return (
    <div className="w-[252px] space-y-2 text-[11px] text-slate-700">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm"
              aria-hidden="true"
            >
              {TIPO_SIMBOLO[mezzo.tipo]}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-slate-950">
                {mezzo.modello}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                {mezzo.codice}
              </p>
            </div>
          </div>
        </div>

        <span
          className="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold"
          style={{
            backgroundColor: `${STATO_COLORI[mezzo.stato]}20`,
            color: STATO_COLORI[mezzo.stato],
          }}
        >
          {STATO_LABELS[mezzo.stato]}
        </span>
      </div>

      <div className="grid gap-1">
        <div className="grid grid-cols-2 gap-1">
          <div className="min-w-0 rounded-md bg-slate-50 px-2 py-1.5">
            <p className="truncate font-medium text-slate-700">
              <span aria-hidden="true">🔋</span> Batteria:{" "}
              <span className="font-semibold text-slate-950">{mezzo.batteria}%</span>
            </p>
          </div>
          <div className="min-w-0 rounded-md bg-slate-50 px-2 py-1.5">
            <p className="truncate font-medium text-slate-700">
              <span aria-hidden="true">👥</span> Posti:{" "}
              <span className="font-semibold text-slate-950">{mezzo.posti}</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <div className="min-w-0 rounded-md bg-slate-50 px-2 py-1.5">
            <p className="truncate font-medium text-slate-700">
              <span aria-hidden="true">🪪</span> Patente:{" "}
              <span className="font-semibold text-slate-950">
                {mezzo.patenteRichiesta}
              </span>
            </p>
          </div>
          <div className="min-w-0 rounded-md bg-slate-50 px-2 py-1.5">
            <p className="truncate font-medium text-slate-700">
              <span aria-hidden="true">🏷</span> Tipo:{" "}
              <span className="font-semibold text-slate-950">{mezzo.tipo}</span>
            </p>
          </div>
        </div>
      </div>

      {controllerNoleggio ? (
        <div className="space-y-2 border-t border-slate-200 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Azioni sul mezzo
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {puoPrenotare ? (
              <button
                type="button"
                disabled={
                  controllerNoleggio.prenotazioneBloccata ||
                  controllerNoleggio.isSubmittingMezzoId !== null ||
                  controllerNoleggio.isAnnullamentoInCorso ||
                  controllerNoleggio.isAvvioInCorso ||
                  controllerNoleggio.isPausaInCorso ||
                  controllerNoleggio.isTermineInCorso
                }
                onClick={() => {
                  void controllerNoleggio.gestisciPrenotazione(mezzo);
                }}
                className={pulsantePrimarioClassName}
              >
                <span aria-hidden="true">🕒</span>
                {controllerNoleggio.isSubmittingMezzoId === mezzo.id
                  ? "Prenotazione..."
                  : "Prenota"}
              </button>
            ) : null}

            {puoAvviare ? (
              <button
                type="button"
                disabled={
                  controllerNoleggio.isAvvioInCorso ||
                  controllerNoleggio.isSubmittingMezzoId !== null ||
                  controllerNoleggio.isAnnullamentoInCorso ||
                  controllerNoleggio.isPausaInCorso ||
                  controllerNoleggio.isTermineInCorso
                }
                onClick={() => {
                  void controllerNoleggio.gestisciAvvioCorsa(
                    prenotazioneSulMezzo || statoCorsaSulMezzo === "IN_PAUSA"
                      ? undefined
                      : mezzo,
                  );
                }}
                className={pulsantePrimarioClassName}
              >
                <span aria-hidden="true">▶</span>
                {controllerNoleggio.isAvvioInCorso
                  ? "Avvio..."
                  : "Avvia"}
              </button>
            ) : null}

            {puoMettereInPausa ? (
              <button
                type="button"
                disabled={
                  controllerNoleggio.isPausaInCorso ||
                  controllerNoleggio.isSubmittingMezzoId !== null ||
                  controllerNoleggio.isAnnullamentoInCorso ||
                  controllerNoleggio.isAvvioInCorso ||
                  controllerNoleggio.isTermineInCorso
                }
                onClick={() => {
                  void controllerNoleggio.gestisciPausaCorsa();
                }}
                className={pulsantePrimarioClassName}
              >
                <span aria-hidden="true">⏸</span>
                {controllerNoleggio.isPausaInCorso
                  ? "Pausa..."
                  : "Pausa"}
              </button>
            ) : null}

            {puoTerminare ? (
              <button
                type="button"
                disabled={
                  controllerNoleggio.isTermineInCorso ||
                  controllerNoleggio.isSubmittingMezzoId !== null ||
                  controllerNoleggio.isAnnullamentoInCorso ||
                  controllerNoleggio.isAvvioInCorso ||
                  controllerNoleggio.isPausaInCorso
                }
                onClick={() => {
                  void controllerNoleggio.gestisciTermineCorsa();
                }}
                className={pulsanteSecondarioClassName}
              >
                <span aria-hidden="true">■</span>
                {controllerNoleggio.isTermineInCorso
                  ? "Termine..."
                  : "Termina"}
              </button>
            ) : null}

            {prenotazioneSulMezzo ? (
              <button
                type="button"
                disabled={
                  controllerNoleggio.isAnnullamentoInCorso ||
                  controllerNoleggio.isSubmittingMezzoId !== null ||
                  controllerNoleggio.isAvvioInCorso ||
                  controllerNoleggio.isPausaInCorso ||
                  controllerNoleggio.isTermineInCorso
                }
                onClick={() => {
                  void controllerNoleggio.gestisciAnnullamentoPrenotazione();
                }}
                className={pulsanteSecondarioClassName}
              >
                <span aria-hidden="true">✕</span>
                {controllerNoleggio.isAnnullamentoInCorso
                  ? "Annulla..."
                  : "Annulla"}
              </button>
            ) : null}
          </div>

          {mostraNotaBlocco ? (
            <p className="text-[11px] leading-4 text-slate-500">
              Hai gia una prenotazione o una corsa in corso.
            </p>
          ) : null}
        </div>
      ) : null}

      {modalita === "utente" && onApriSegnalazioneMezzo ? (
        <div className="border-t border-slate-200 pt-2">
          <button
            type="button"
            onClick={() => {
              onApriSegnalazioneMezzo(mezzo);
            }}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-800 transition hover:bg-rose-100"
          >
            <span aria-hidden="true">⚠</span>
            Segnala un problema
          </button>
        </div>
      ) : null}
    </div>
  );
}

function risolviStatoEffettivoMezzo(
  mezzo: Mezzo,
  modalita: ModalitaMappa,
  noleggioUtente?: MappaServizioProps["noleggioUtente"],
): Mezzo["stato"] {
  if (modalita !== "utente" || !noleggioUtente) {
    return mezzo.stato;
  }

  const prenotazioneSulMezzo =
    noleggioUtente.prenotazioneAttiva?.mezzo?.id === mezzo.id;
  const corsaSulMezzo =
    noleggioUtente.corsaAttiva?.mezzo?.id === mezzo.id;

  if (corsaSulMezzo) {
    return noleggioUtente.corsaAttiva?.stato === "IN_PAUSA"
      ? "IN_PAUSA"
      : "IN_USO";
  }

  if (prenotazioneSulMezzo) {
    return "PRENOTATO";
  }

  return mezzo.stato;
}

function creaIconaMezzo(stato: Mezzo["stato"], tipo: Mezzo["tipo"]): DivIcon {
  const colore = STATO_COLORI[stato];

  return new DivIcon({
    className: "",
    iconSize: [38, 48],
    iconAnchor: [19, 44],
    popupAnchor: [0, -38],
    tooltipAnchor: [0, -34],
    html: `
      <div style="position:relative;width:38px;height:48px;display:flex;align-items:flex-start;justify-content:center;">
        <div style="width:34px;height:34px;border-radius:9999px;background:#ffffff;border:3px solid ${colore};box-shadow:0 8px 18px rgba(15,23,42,0.22);display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;">
          ${TIPO_SIMBOLO[tipo]}
        </div>
        <div style="position:absolute;left:50%;bottom:5px;width:12px;height:12px;background:#ffffff;border-right:3px solid ${colore};border-bottom:3px solid ${colore};transform:translateX(-50%) rotate(45deg);box-shadow:3px 3px 10px rgba(15,23,42,0.10);"></div>
      </div>
    `,
  });
}

// Questa versione usa una vera cartografia OpenStreetMap su Bari e lascia al
// progetto la responsabilita di sovrapporre aree, mezzi e posizione utente.
export default function MappaServizioLeaflet({
  aree,
  mezzi,
  modalita,
  posizioneUtente = null,
  noleggioUtente,
  onApriSegnalazioneMezzo,
  riconsegneRecenti = [],
  mostraPuntiChiave,
  mostraPuntiInteresse = true,
}: MappaServizioProps) {
  const testi = TESTI_MAPPA[modalita];
  const [statiDinamiciServer, setStatiDinamiciServer] = useState<
    Record<string, Mezzo["stato"]>
  >({});
  const mezziConStatoEffettivo = useMemo(
    () =>
      mezzi.map((mezzo) => ({
        ...mezzo,
        stato: risolviStatoEffettivoMezzo(mezzo, modalita, noleggioUtente),
      })),
    [mezzi, modalita, noleggioUtente],
  );
  const mezziRenderizzati = useMemo(
    () =>
      mezziConStatoEffettivo.map((mezzo) => ({
        ...mezzo,
        stato: statiDinamiciServer[mezzo.id] ?? mezzo.stato,
      })),
    [mezziConStatoEffettivo, statiDinamiciServer],
  );
  const mezziDisponibili = mezziRenderizzati.filter(
    (mezzo) => mezzo.stato === "DISPONIBILE",
  );
  const conteggioPerTipoUtente = useMemo(
    () => ({
      eBike: mezziDisponibili.filter((mezzo) => mezzo.tipo === "E-Bike").length,
      eScooter: mezziDisponibili.filter((mezzo) => mezzo.tipo === "E-Scooter")
        .length,
      eCar: mezziDisponibili.filter((mezzo) => mezzo.tipo === "E-Car").length,
    }),
    [mezziDisponibili],
  );
  const mezziCritici = mezziRenderizzati.filter(
    (mezzo) =>
      mezzo.batteria <= 25 ||
      mezzo.stato === "IN_MANUTENZIONE" ||
      mezzo.stato === "NON_DISPONIBILE",
  );
  const puntiChiaveVisibili = mostraPuntiChiave ?? modalita !== "utente";
  const bounds = useMemo(
    () =>
      costruisciBounds({
        aree,
        mezzi: mezziRenderizzati,
        puntiInteresse: puntiInteresseMappaMock,
        posizioneUtente,
        riconsegneRecenti,
      }),
    [aree, mezziRenderizzati, posizioneUtente, riconsegneRecenti],
  );

  useEffect(() => {
    if (modalita === "utente" || mezzi.length === 0) {
      return;
    }

    let annullata = false;

    async function aggiornaStatiMezzi() {
      try {
        const response = await fetch("/api/mezzi/stati", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mezzoIds: mezzi.map((mezzo) => mezzo.id),
          }),
        });

        const result = (await response.json().catch(() => null)) as
          | { mezzi?: Array<{ id: string; stato: Mezzo["stato"] }> }
          | null;

        if (!response.ok || !result?.mezzi || annullata) {
          return;
        }

        setStatiDinamiciServer(
          Object.fromEntries(
            result.mezzi.map((mezzo) => [mezzo.id, mezzo.stato]),
          ) as Record<string, Mezzo["stato"]>,
        );
      } catch {
        // In caso di errore temporaneo manteniamo l'ultimo stato noto senza
        // disturbare l'esperienza d'uso della mappa.
      }
    }

    void aggiornaStatiMezzi();
    const intervallo = window.setInterval(() => {
      void aggiornaStatiMezzi();
    }, 5000);

    return () => {
      annullata = true;
      window.clearInterval(intervallo);
    };
  }, [mezzi, modalita]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            {testi.soprattitolo}
          </p>
          <h2 className="text-3xl font-semibold text-slate-950">{testi.titolo}</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            {testi.descrizione}
          </p>
        </div>

        {modalita === "utente" ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="flex min-h-[92px] flex-col items-start justify-start gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-left">
              <p className="whitespace-nowrap text-left text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-slate-500">
                Aree
              </p>
              <p className="text-left text-[1.95rem] font-semibold leading-none text-slate-950">
                {aree.length}
              </p>
            </div>
            <div className="flex min-h-[92px] flex-col items-start justify-start gap-4 rounded-2xl border border-teal-200 bg-teal-50 px-6 py-5 text-left">
              <p className="whitespace-nowrap text-left text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-teal-700">
                Disponibili
              </p>
              <p className="text-left text-[1.95rem] font-semibold leading-none text-slate-950">
                {mezziDisponibili.length}
              </p>
            </div>
            <div className="flex min-h-[92px] flex-col items-start justify-start gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-left">
              <p className="whitespace-nowrap text-left text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-slate-500">
                E-Bike
              </p>
              <p className="text-left text-[1.95rem] font-semibold leading-none text-slate-950">
                {conteggioPerTipoUtente.eBike}
              </p>
            </div>
            <div className="flex min-h-[92px] flex-col items-start justify-start gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-left">
              <p className="whitespace-nowrap text-left text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-slate-500">
                E-Scooter
              </p>
              <p className="text-left text-[1.95rem] font-semibold leading-none text-slate-950">
                {conteggioPerTipoUtente.eScooter}
              </p>
            </div>
            <div className="flex min-h-[92px] flex-col items-start justify-start gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-left">
              <p className="whitespace-nowrap text-left text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-slate-500">
                E-Car
              </p>
              <p className="text-left text-[1.95rem] font-semibold leading-none text-slate-950">
                {conteggioPerTipoUtente.eCar}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left">
              <p className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Aree
              </p>
              <p className="mt-1 text-left text-2xl font-semibold text-slate-950">
                {aree.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left">
              <p className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Mezzi
              </p>
              <p className="mt-1 text-left text-2xl font-semibold text-slate-950">
                {mezzi.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left">
              <p className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Critici
              </p>
              <p className="mt-1 text-left text-2xl font-semibold text-slate-950">
                {mezziCritici.length}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="self-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_70px_-36px_rgba(15,23,42,0.28)]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {modalita === "utente" ? "Bari" : "Bari | OpenStreetMap"}
              </p>
              <p className="text-sm font-medium text-slate-700">
                {modalita === "utente"
                  ? "Apri un mezzo sulla mappa per prenotarlo o iniziare la corsa"
                  : "Cartografia reale con overlay del servizio"}
              </p>
            </div>
            {posizioneUtente ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {modalita === "utente" ? "La tua posizione" : "Posizione utente attiva"}
              </span>
            ) : (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Vista territoriale
              </span>
            )}
          </div>

          <div className="relative">
            <MapContainer
              center={BARI_CENTRO}
              zoom={14}
              keyboard={false}
              scrollWheelZoom
              className="service-map-container h-[520px] w-full [&_.leaflet-control-attribution]:text-[11px] [&_.leaflet-control-attribution]:font-medium [&_.leaflet-control-attribution]:text-slate-700 [&_.leaflet-control-zoom_a]:text-slate-700"
            >
              <AdattaMappaAiContenuti
                bounds={bounds}
                posizioneCentrale={posizioneUtente}
              />

              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {aree.map((area) => (
                <Polygon
                  key={area.id}
                  positions={area.punti.map(toLatLng)}
                  className="pointer-events-none"
                  interactive={false}
                  pathOptions={{
                    color: area.colore,
                    fillColor: area.colore,
                    fillOpacity: 0.18,
                    weight: 2,
                  }}
                />
              ))}

              {mezziRenderizzati.map((mezzo) => (
                <Marker
                  key={mezzo.id}
                  position={toLatLng(mezzo)}
                  icon={creaIconaMezzo(mezzo.stato, mezzo.tipo)}
                >
                  <Popup
                    className="mezzo-popup-compatto"
                    maxWidth={272}
                    minWidth={248}
                    closeButton
                  >
                    <MezzoPopup
                      mezzo={mezzo}
                      modalita={modalita}
                      noleggioUtente={noleggioUtente}
                      onApriSegnalazioneMezzo={onApriSegnalazioneMezzo}
                    />
                  </Popup>
                  <Tooltip direction="top" offset={[0, -8]}>
                    {mezzo.tipo} | {mezzo.codice}
                  </Tooltip>
                </Marker>
              ))}

              {modalita === "operatore"
                ? riconsegneRecenti.map((riconsegna) => (
                    <CircleMarker
                      key={riconsegna.id}
                      center={toLatLng(riconsegna)}
                      radius={9}
                      pathOptions={{
                        color: "#ffffff",
                        weight: 2,
                        fillColor: "#f97316",
                        fillOpacity: 0.95,
                      }}
                    >
                      <Popup>
                        <div className="space-y-1 text-sm text-slate-700">
                          <p className="font-semibold text-slate-950">
                            {riconsegna.etichetta}
                          </p>
                          <p>{riconsegna.descrizione}</p>
                          <p>
                            Coordinate: {riconsegna.latitudine.toFixed(5)},{" "}
                            {riconsegna.longitudine.toFixed(5)}
                          </p>
                        </div>
                      </Popup>
                      <Tooltip direction="top" offset={[0, -10]}>
                        {riconsegna.etichetta}
                      </Tooltip>
                    </CircleMarker>
                  ))
                : null}

              {posizioneUtente ? (
                <CircleMarker
                  center={toLatLng(posizioneUtente)}
                  radius={12}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 3,
                    fillColor: "#2563eb",
                    fillOpacity: 1,
                  }}
                >
                  <Popup>
                    <div className="space-y-1 text-sm text-slate-700">
                      <p className="font-semibold text-slate-950">
                        {posizioneUtente.etichetta}
                      </p>
                      <p>
                        Coordinate: {posizioneUtente.latitudine.toFixed(4)},{" "}
                        {posizioneUtente.longitudine.toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                  <Tooltip permanent direction="top" offset={[0, -12]}>
                    {posizioneUtente.etichetta}
                  </Tooltip>
                </CircleMarker>
              ) : null}
            </MapContainer>
            {modalita !== "utente" ? (
              <div className="pointer-events-none absolute right-4 top-4 z-[500] rounded-2xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                Bari | strade reali | overlay servizio
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.3)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Legenda mezzi
            </p>
            <div className="mt-4 grid gap-2">
              {modalita === "utente" ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: STATO_COLORI.DISPONIBILE }}
                      aria-hidden="true"
                    />
                    Disponibili
                  </span>
                  <span className="text-sm font-semibold text-slate-950">
                    {mezziDisponibili.length}
                  </span>
                </div>
              ) : (
                <>
                  {Object.entries(STATO_LABELS).map(([stato, label]) => (
                    <div
                      key={stato}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: STATO_COLORI[stato as Mezzo["stato"]] }}
                          aria-hidden="true"
                        />
                        {label}
                      </span>
                      <span className="text-sm font-semibold text-slate-950">
                        {mezziRenderizzati.filter((mezzo) => mezzo.stato === stato).length}
                      </span>
                    </div>
                  ))}
                  {modalita === "operatore" && riconsegneRecenti.length > 0 ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: "#f97316" }}
                          aria-hidden="true"
                        />
                        Riconsegne recenti
                      </span>
                      <span className="text-sm font-semibold text-slate-950">
                        {riconsegneRecenti.length}
                      </span>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </article>

          {puntiChiaveVisibili ? (
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.3)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                Punti chiave
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  La mappa usa cartografia reale di Bari caricata dai tile pubblici
                  OpenStreetMap e non una base illustrata generata a mano.
                </p>
                <p>
                  Aree di servizio, mezzi e posizione utente condividono le stesse
                  coordinate geografiche, quindi ogni overlay resta agganciato alla
                  posizione corretta sulla mappa.
                </p>
                <p>
                  In questa fase la copertura e rappresentata da un unico grande
                  perimetro urbano di Bari, cosi il servizio appare come una zona
                  continua e non come isole scollegate tra loro.
                </p>
                {modalita === "operatore" && posizioneUtente ? (
                  <p>
                    La mappa si apre gia sulla posizione operativa corrente, cosi
                    l&apos;operatore vede subito l&apos;area in cui si trova mentre
                    controlla i mezzi sul territorio.
                  </p>
                ) : (
                  <p>
                    La vista supporta una lettura territoriale piu realistica del
                    servizio per monitoraggio operativo e istituzionale.
                  </p>
                )}
              </div>
            </article>
          ) : null}

          {mostraPuntiInteresse ? (
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.3)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                Punti di interesse
              </p>
              <div className="mt-4 grid gap-2">
                {puntiInteresseMappaMock.map((punto) => (
                  <div
                    key={punto.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {punto.nome}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Bari
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}
