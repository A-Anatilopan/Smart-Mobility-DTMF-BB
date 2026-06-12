"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AggiornamentoAutomaticoRouteProps = {
  abilitato?: boolean;
  intervalloMs: number;
};

// Questo componente mantiene allineate le viste server-side quando il dominio
// cambia nel tempo, ad esempio per prenotazioni che scadono o corse che
// modificano lo stato dei mezzi senza interazione manuale sulla pagina.
export default function AggiornamentoAutomaticoRoute({
  abilitato = true,
  intervalloMs,
}: AggiornamentoAutomaticoRouteProps) {
  const router = useRouter();

  useEffect(() => {
    if (!abilitato || intervalloMs <= 0) {
      return;
    }

    const intervallo = window.setInterval(() => {
      router.refresh();
    }, intervalloMs);

    return () => {
      window.clearInterval(intervallo);
    };
  }, [abilitato, intervalloMs, router]);

  return null;
}
