"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type VoceMenuAmministrazione = {
  href: string;
  etichetta: string;
  descrizione: string;
};

const VOCI_MENU_AMMINISTRAZIONE: VoceMenuAmministrazione[] = [
  {
    href: "/admin",
    etichetta: "Inizio",
    descrizione: "Quadro generale del servizio e della copertura urbana",
  },
  {
    href: "/admin/report-aggregati",
    etichetta: "Report aggregati",
    descrizione: "Indicatori sintetici su corse, flotta e utilizzo del servizio",
  },
  {
    href: "/admin/stato-flotta",
    etichetta: "Stato flotta",
    descrizione: "Vista dedicata all'integrita e alla disponibilita dei mezzi",
  },
  {
    href: "/admin/tratte-e-co2",
    etichetta: "Tratte e CO2",
    descrizione: "Area dedicata a tratte utilizzate e impatto ambientale",
  },
  {
    href: "/admin/anagrafiche",
    etichetta: "Anagrafiche",
    descrizione: "Consultazione utenti e patenti in area separata",
  },
  {
    href: "/admin/segnalazioni-urbane",
    etichetta: "Segnalazioni urbane",
    descrizione: "Spazio dedicato alle criticita urbane e agli interventi futuri",
  },
];

function isVoceAttiva(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

// Questa navigazione apre la prima vera separazione dell'area admin tra vista
// iniziale e reportistica, evitando una dashboard unica troppo affollata.
export default function MenuDashboardAmministrazione() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione area Pubblica Amministrazione"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      {VOCI_MENU_AMMINISTRAZIONE.map((voce) => {
        const attiva = isVoceAttiva(pathname, voce.href);

        return (
          <Link
            key={voce.href}
            href={voce.href}
            aria-current={attiva ? "page" : undefined}
            className={`rounded-[1.5rem] border px-4 py-4 transition ${
              attiva
                ? "border-cyan-200 bg-cyan-50 shadow-[0_16px_40px_-28px_rgba(8,145,178,0.45)]"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                attiva ? "text-cyan-800" : "text-slate-950"
              }`}
            >
              {voce.etichetta}
            </p>
            <p
              className={`mt-1 text-sm leading-6 ${
                attiva ? "text-cyan-700" : "text-slate-600"
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
