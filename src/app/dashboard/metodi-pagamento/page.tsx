import type { Metadata } from "next";
import DashboardMetodiPagamentoClient from "@/components/pagamenti/DashboardMetodiPagamentoClient";
import { elencaMetodiPagamentoUtente } from "@/lib/metodi-pagamento";
import { RUOLI } from "@/lib/ruoli";
import { richiediRuolo } from "@/lib/session";

// Questa sezione ospita la gestione reale dei metodi di pagamento in uno spazio
// separato dalla home, cosi la mappa e il noleggio restano piu leggeri.
export const metadata: Metadata = {
  title: "Metodi di pagamento | E-Smart Mobility",
  description:
    "Area riservata utente per la gestione dei metodi di pagamento.",
};

export default async function DashboardMetodiPagamentoPage() {
  const utente = await richiediRuolo(RUOLI.UTENTE);
  const metodi = await elencaMetodiPagamentoUtente(utente.id);

  return (
    <DashboardMetodiPagamentoClient
      nomeUtente={utente.nome}
      metodiIniziali={metodi}
    />
  );
}
