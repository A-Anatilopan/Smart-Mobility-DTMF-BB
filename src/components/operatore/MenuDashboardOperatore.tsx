"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type VoceMenuOperatore = {
  href: string;
  etichetta: string;
  descrizione: string;
};

const VOCI_MENU_OPERATORE: VoceMenuOperatore[] = [
  {
    href: "/operatore",
    etichetta: "Inizio",
    descrizione: "Vista generale della flotta e della mappa operativa",
  },
  {
    href: "/operatore/monitoraggio",
    etichetta: "Gestione Utente e Corse",
    descrizione: "Ricerca utenti, sospensione account e controllo noleggi aperti",
  },
  {
    href: "/operatore/priorita-flotta",
    etichetta: "Priorita flotta",
    descrizione: "Mezzi da presidiare per batteria bassa o indisponibilita",
  },
  {
    href: "/operatore/mezzi-scarichi",
    etichetta: "Gestione mezzi scarichi",
    descrizione: "Ritiro, ricarica e rimessa dei mezzi fuori disponibilita",
  },
  {
    href: "/operatore/segnalazioni",
    etichetta: "Segnalazioni",
    descrizione: "Spazio dedicato alle anomalie aperte e alla loro gestione",
  },
  {
    href: "/operatore/flotta",
    etichetta: "Flotta",
    descrizione: "Elenco completo dei mezzi con filtri operativi",
  },
];

function isVoceAttiva(pathname: string, href: string): boolean {
  if (href === "/operatore") {
    return pathname === "/operatore";
  }

  return pathname.startsWith(href);
}

// Il menu client legge il pathname attuale e rende piu chiaro in quale area si
// trova l'operatore senza introdurre logica di routing server aggiuntiva.
export default function MenuDashboardOperatore() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione area operatore"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"
    >
      {VOCI_MENU_OPERATORE.map((voce) => {
        const attiva = isVoceAttiva(pathname, voce.href);

        return (
          <Link
            key={voce.href}
            href={voce.href}
            aria-current={attiva ? "page" : undefined}
            className={`rounded-[1.5rem] border px-4 py-4 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.22)] backdrop-blur-sm transition ${
              attiva
                ? "border-sky-200 bg-[linear-gradient(180deg,_rgba(240,249,255,0.98)_0%,_rgba(224,242,254,0.96)_100%)] shadow-[0_20px_50px_-28px_rgba(14,165,233,0.4)]"
                : "border-white/80 bg-white/92 hover:border-slate-300 hover:bg-white"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                attiva ? "text-sky-800" : "text-slate-950"
              }`}
            >
              {voce.etichetta}
            </p>
            <p
              className={`mt-1 text-sm leading-6 ${
                attiva ? "text-sky-700" : "text-slate-600"
              }`}
            >
              {voce.descrizione}
            </p>
          </Link>
        );
      })}
    </nav>
  );
}
