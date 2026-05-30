"use client";

import { useEffect, useMemo } from "react";
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
    titolo: "Bari in tempo reale sulla cartografia del servizio",
    descrizione:
      "La mappa usa una base reale OpenStreetMap su Bari e mostra aree coperte, mezzi disponibili e posizione utente sullo stesso piano geografico.",
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
}: Pick<MappaServizioProps, "aree" | "mezzi" | "posizioneUtente"> & {
  puntiInteresse: PuntoInteresseMappa[];
}): LatLngBoundsExpression | null {
  const punti = [
    ...aree.flatMap((area) => area.punti),
    ...mezzi,
    ...puntiInteresse,
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

  useEffect(() => {
    if (posizioneCentrale) {
      map.setView(toLatLng(posizioneCentrale), 15);
      return;
    }

    if (bounds) {
      map.fitBounds(bounds, { padding: [36, 36] });
      return;
    }

    map.setView(BARI_CENTRO, 14);
  }, [bounds, map, posizioneCentrale]);

  return null;
}

function MezzoPopup({ mezzo }: { mezzo: Mezzo }) {
  return (
    <div className="space-y-1 text-sm text-slate-700">
      <p className="font-semibold text-slate-950">
        {mezzo.modello} ({mezzo.codice})
      </p>
      <p>Tipo: {mezzo.tipo}</p>
      <p>Stato: {STATO_LABELS[mezzo.stato]}</p>
      <p>Batteria: {mezzo.batteria}%</p>
      <p>Posti: {mezzo.posti}</p>
      <p>Patente: {mezzo.patenteRichiesta}</p>
      <p>Area: {mezzo.areaServizioNome}</p>
    </div>
  );
}

function creaIconaMezzo(mezzo: Mezzo): DivIcon {
  const colore = STATO_COLORI[mezzo.stato];

  return new DivIcon({
    className: "",
    iconSize: [38, 48],
    iconAnchor: [19, 44],
    popupAnchor: [0, -38],
    tooltipAnchor: [0, -34],
    html: `
      <div style="position:relative;width:38px;height:48px;display:flex;align-items:flex-start;justify-content:center;">
        <div style="width:34px;height:34px;border-radius:9999px;background:#ffffff;border:3px solid ${colore};box-shadow:0 8px 18px rgba(15,23,42,0.22);display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;">
          ${TIPO_SIMBOLO[mezzo.tipo]}
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
}: MappaServizioProps) {
  const testi = TESTI_MAPPA[modalita];
  const mezziDisponibili = mezzi.filter((mezzo) => mezzo.stato === "DISPONIBILE");
  const mezziCritici = mezzi.filter(
    (mezzo) =>
      mezzo.batteria <= 25 ||
      mezzo.stato === "IN_MANUTENZIONE" ||
      mezzo.stato === "NON_DISPONIBILE",
  );
  const bounds = useMemo(
    () =>
      costruisciBounds({
        aree,
        mezzi,
        puntiInteresse: puntiInteresseMappaMock,
        posizioneUtente,
      }),
    [aree, mezzi, posizioneUtente],
  );

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

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Aree
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {aree.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Mezzi
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {mezzi.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Critici
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {mezziCritici.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="self-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_70px_-36px_rgba(15,23,42,0.28)]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Bari | OpenStreetMap
              </p>
              <p className="text-sm font-medium text-slate-700">
                Cartografia reale con overlay del servizio
              </p>
            </div>
            {posizioneUtente ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Posizione utente attiva
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

              {mezzi.map((mezzo) => (
                <Marker
                  key={mezzo.id}
                  position={toLatLng(mezzo)}
                  icon={creaIconaMezzo(mezzo)}
                >
                  <Popup>
                    <MezzoPopup mezzo={mezzo} />
                  </Popup>
                  <Tooltip direction="top" offset={[0, -8]}>
                    {mezzo.tipo} | {mezzo.codice}
                  </Tooltip>
                </Marker>
              ))}

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

            <div className="pointer-events-none absolute right-4 top-4 z-[500] rounded-2xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              Bari | strade reali | overlay servizio
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.3)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Legenda mezzi
            </p>
            <div className="mt-4 grid gap-2">
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
                    {mezzi.filter((mezzo) => mezzo.stato === stato).length}
                  </span>
                </div>
              ))}
            </div>
          </article>

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
              {modalita === "utente" ? (
                <p>
                  Mezzi disponibili visibili in questa vista: {mezziDisponibili.length}.
                  Il marcatore blu rappresenta la tua posizione nel campione attuale.
                </p>
              ) : modalita === "operatore" && posizioneUtente ? (
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
        </div>
      </div>
    </section>
  );
}
