"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type VoceMenu = {
  href: string;
  etichetta: string;
  descrizione: string;
};

const VOCI_MENU: VoceMenu[] = [
  {
    href: "/dashboard",
    etichetta: "Inizio",
    descrizione: "Mezzi, mappa e noleggio attivo",
  },
  {
    href: "/dashboard/cronologia",
    etichetta: "Cronologia",
    descrizione: "Storico delle corse concluse",
  },
  {
    href: "/dashboard/metodi-pagamento",
    etichetta: "Metodi di pagamento",
    descrizione: "Salva, scegli e rimuovi i metodi per le tue corse",
  },
  {
    href: "/dashboard/dati-personali",
    etichetta: "Dati personali",
    descrizione: "Profilo, dati anagrafici e patente",
  },
];

function isVoceAttiva(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname.startsWith(href);
}

// Questa navigazione client legge il pathname corrente per mostrare chiaramente
// in quale sezione si trova l'utente senza introdurre logica server aggiuntiva.
export default function MenuDashboardUtente() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione area utente"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {VOCI_MENU.map((voce) => {
        const attiva = isVoceAttiva(pathname, voce.href);

        return (
          <Link
            key={voce.href}
            href={voce.href}
            className={`rounded-[1.5rem] border px-4 py-4 transition ${
              attiva
                ? "border-teal-200 bg-teal-50 shadow-[0_16px_40px_-28px_rgba(13,148,136,0.45)]"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
            aria-current={attiva ? "page" : undefined}
          >
            <p
              className={`text-sm font-semibold ${
                attiva ? "text-teal-800" : "text-slate-950"
              }`}
            >
              {voce.etichetta}
            </p>
            <p
              className={`mt-1 text-sm leading-6 ${
                attiva ? "text-teal-700" : "text-slate-600"
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
