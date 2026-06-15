"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import type { CorsaNoleggio, PrenotazioneNoleggio } from "@/types/noleggio";
import type { Mezzo } from "@/types/mobilita";

export type MezzoSintetico = Pick<
  Mezzo,
  | "id"
  | "codice"
  | "tipo"
  | "modello"
  | "areaServizioNome"
  | "batteria"
  | "patenteRichiesta"
>;

export type PrenotazioneAttivaConMezzo = PrenotazioneNoleggio & {
  mezzo: MezzoSintetico | null;
};

export type CorsaAttivaConMezzo = CorsaNoleggio & {
  mezzo: MezzoSintetico | null;
};

export type CorsaTerminataConMezzo = CorsaNoleggio & {
  mezzo: MezzoSintetico | null;
};

type PrenotazioneApiResponse = {
  errore?: string;
  messaggio?: string;
  prenotazione?: PrenotazioneNoleggio & {
    mezzo?: MezzoSintetico | null;
  };
};

type CorsaApiResponse = {
  errore?: string;
  messaggio?: string;
  corsa?: CorsaNoleggio & {
    mezzo?: MezzoSintetico | null;
  };
};

export type StatoMessaggio =
  | { tipo: "successo"; testo: string }
  | { tipo: "errore"; testo: string }
  | null;

type UseNoleggioUtenteInput = {
  prenotazioneAttivaIniziale: PrenotazioneAttivaConMezzo | null;
  corsaAttivaIniziale: CorsaAttivaConMezzo | null;
  ultimaCorsaTerminataIniziale: CorsaTerminataConMezzo | null;
};

export type NoleggioUtenteController = {
  prenotazioneAttiva: PrenotazioneAttivaConMezzo | null;
  corsaAttiva: CorsaAttivaConMezzo | null;
  ultimaCorsaTerminata: CorsaTerminataConMezzo | null;
  riepilogoConclusioneAperto: boolean;
  messaggio: StatoMessaggio;
  isSubmittingMezzoId: string | null;
  isAnnullamentoInCorso: boolean;
  isAvvioInCorso: boolean;
  isPausaInCorso: boolean;
  isTermineInCorso: boolean;
  prenotazioneBloccata: boolean;
  gestisciPrenotazione: (mezzo: Mezzo) => Promise<void>;
  gestisciAnnullamentoPrenotazione: () => Promise<void>;
  gestisciAvvioCorsa: (mezzo?: Mezzo) => Promise<void>;
  gestisciPausaCorsa: () => Promise<void>;
  gestisciTermineCorsa: () => Promise<void>;
  chiudiRiepilogoConclusione: () => void;
  setMessaggio: Dispatch<SetStateAction<StatoMessaggio>>;
  setUltimaCorsaTerminata: Dispatch<
    SetStateAction<CorsaTerminataConMezzo | null>
  >;
};

// Questo hook centralizza lo stato client del noleggio utente, cosi la stessa
// logica potra essere riusata sia nel pannello dashboard sia nei popup mappa.
export function useNoleggioUtente({
  prenotazioneAttivaIniziale,
  corsaAttivaIniziale,
  ultimaCorsaTerminataIniziale,
}: UseNoleggioUtenteInput): NoleggioUtenteController {
  const [prenotazioneAttiva, setPrenotazioneAttiva] =
    useState<PrenotazioneAttivaConMezzo | null>(prenotazioneAttivaIniziale);
  const [corsaAttiva, setCorsaAttiva] =
    useState<CorsaAttivaConMezzo | null>(corsaAttivaIniziale);
  const [ultimaCorsaTerminata, setUltimaCorsaTerminata] =
    useState<CorsaTerminataConMezzo | null>(ultimaCorsaTerminataIniziale);
  const [isSubmittingMezzoId, setIsSubmittingMezzoId] = useState<string | null>(null);
  const [isAnnullamentoInCorso, setIsAnnullamentoInCorso] = useState(false);
  const [isAvvioInCorso, setIsAvvioInCorso] = useState(false);
  const [isPausaInCorso, setIsPausaInCorso] = useState(false);
  const [isTermineInCorso, setIsTermineInCorso] = useState(false);
  const [riepilogoConclusioneAperto, setRiepilogoConclusioneAperto] =
    useState(false);
  const [messaggio, setMessaggio] = useState<StatoMessaggio>(null);

  const prenotazioneBloccata = Boolean(prenotazioneAttiva || corsaAttiva);

  // Quando scade il tempo della prenotazione, la UI lato utente deve
  // liberare subito il mezzo senza aspettare un refresh manuale.
  useEffect(() => {
    if (!prenotazioneAttiva || prenotazioneAttiva.stato !== "ATTIVA") {
      return;
    }

    const scadenza = new Date(prenotazioneAttiva.scadeAt).getTime();
    const adesso = Date.now();
    const ritardo = Math.max(scadenza - adesso, 0);

    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          await fetch("/api/noleggio/prenotazioni/scadenza", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prenotazioneId: prenotazioneAttiva.id,
            }),
          });
        } catch {
          // Se il server non risponde subito, la UI si libera comunque e il
          // riallineamento DB avverra alla prossima sincronizzazione disponibile.
        } finally {
          setPrenotazioneAttiva((corrente) => {
            if (!corrente || corrente.id !== prenotazioneAttiva.id) {
              return corrente;
            }

            return null;
          });
          setMessaggio({
            tipo: "successo",
            testo:
              "La prenotazione e scaduta automaticamente e il mezzo e tornato disponibile.",
          });
        }
      })();
    }, ritardo + 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [prenotazioneAttiva]);

  function pulisciRiepilogoTerminato() {
    setUltimaCorsaTerminata(null);
  }

  function creaMezzoSintetico(mezzo: Mezzo): MezzoSintetico {
    return {
      id: mezzo.id,
      codice: mezzo.codice,
      tipo: mezzo.tipo,
      modello: mezzo.modello,
      areaServizioNome: mezzo.areaServizioNome,
      batteria: mezzo.batteria,
      patenteRichiesta: mezzo.patenteRichiesta,
    };
  }

  async function gestisciPrenotazione(mezzo: Mezzo): Promise<void> {
    setMessaggio(null);
    pulisciRiepilogoTerminato();
    setIsSubmittingMezzoId(mezzo.id);

    try {
      const response = await fetch("/api/noleggio/prenotazioni", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mezzoId: mezzo.id,
        }),
      });

      const result =
        (await response.json().catch(() => null)) as PrenotazioneApiResponse | null;

      if (!response.ok) {
        setMessaggio({
          tipo: "errore",
          testo:
            result?.errore ??
            "Prenotazione non disponibile in questo momento. Riprova tra poco.",
        });
        return;
      }

      setPrenotazioneAttiva(
        result?.prenotazione
          ? {
              ...result.prenotazione,
              mezzo: result.prenotazione.mezzo ?? creaMezzoSintetico(mezzo),
            }
          : null,
      );
      setMessaggio({
        tipo: "successo",
        testo:
          result?.messaggio ??
          "Prenotazione creata con successo.",
      });
    } catch {
      setMessaggio({
        tipo: "errore",
        testo:
          "Impossibile contattare il server in questo momento. Verifica che l'applicazione sia avviata e riprova.",
      });
    } finally {
      setIsSubmittingMezzoId(null);
    }
  }

  async function gestisciAnnullamentoPrenotazione(): Promise<void> {
    if (!prenotazioneAttiva) {
      setMessaggio({
        tipo: "errore",
        testo: "Non c'e nessuna prenotazione attiva da annullare.",
      });
      return;
    }

    setMessaggio(null);
    setIsAnnullamentoInCorso(true);

    try {
      const response = await fetch("/api/noleggio/prenotazioni/annulla", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prenotazioneId: prenotazioneAttiva.id,
        }),
      });

      const result =
        (await response.json().catch(() => null)) as PrenotazioneApiResponse | null;

      if (!response.ok) {
        setMessaggio({
          tipo: "errore",
          testo:
            result?.errore ??
            "Annullamento prenotazione non disponibile in questo momento. Riprova tra poco.",
        });
        return;
      }

      setPrenotazioneAttiva(null);
      setMessaggio({
        tipo: "successo",
        testo:
          result?.messaggio ??
          "Prenotazione annullata con successo.",
      });
    } catch {
      setMessaggio({
        tipo: "errore",
        testo:
          "Impossibile contattare il server in questo momento. Verifica che l'applicazione sia avviata e riprova.",
      });
    } finally {
      setIsAnnullamentoInCorso(false);
    }
  }

  async function gestisciAvvioCorsa(mezzo?: Mezzo): Promise<void> {
    const corsaInPausa = corsaAttiva?.stato === "IN_PAUSA" ? corsaAttiva : null;

    if (!prenotazioneAttiva && !corsaInPausa && !mezzo) {
      setMessaggio({
        tipo: "errore",
        testo:
          "Non c'e nessuna prenotazione, corsa in pausa o mezzo diretto da avviare.",
      });
      return;
    }

    setMessaggio(null);
    pulisciRiepilogoTerminato();
    setIsAvvioInCorso(true);

    try {
      const response = await fetch(
        corsaInPausa
          ? "/api/noleggio/corse/ripresa"
          : "/api/noleggio/corse/avvio",
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prenotazioneId: prenotazioneAttiva?.id,
          corsaId: corsaInPausa?.id,
          mezzoId: mezzo?.id,
        }),
      });

      const result =
        (await response.json().catch(() => null)) as CorsaApiResponse | null;

      if (!response.ok) {
        setMessaggio({
          tipo: "errore",
          testo:
            result?.errore ??
            "Avvio corsa non disponibile in questo momento. Riprova tra poco.",
        });
        return;
      }

      setCorsaAttiva(
        result?.corsa
          ? {
              ...result.corsa,
              mezzo:
                result.corsa.mezzo ??
                prenotazioneAttiva?.mezzo ??
                (mezzo ? creaMezzoSintetico(mezzo) : null) ??
                corsaInPausa?.mezzo ??
                null,
            }
          : null,
      );
      if (prenotazioneAttiva) {
        setPrenotazioneAttiva(null);
      }
      setMessaggio({
        tipo: "successo",
        testo:
          result?.messaggio ??
          (corsaInPausa
            ? "Corsa ripresa con successo."
            : mezzo
              ? "Corsa avviata direttamente dal mezzo con successo."
              : "Corsa avviata con successo."),
      });
    } catch {
      setMessaggio({
        tipo: "errore",
        testo:
          "Impossibile contattare il server in questo momento. Verifica che l'applicazione sia avviata e riprova.",
      });
    } finally {
      setIsAvvioInCorso(false);
    }
  }

  async function gestisciPausaCorsa(): Promise<void> {
    if (!corsaAttiva) {
      setMessaggio({
        tipo: "errore",
        testo: "Non c'e nessuna corsa attiva da mettere in pausa.",
      });
      return;
    }

    setMessaggio(null);
    setIsPausaInCorso(true);

    try {
      const response = await fetch("/api/noleggio/corse/pausa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          corsaId: corsaAttiva.id,
        }),
      });

      const result =
        (await response.json().catch(() => null)) as CorsaApiResponse | null;

      if (!response.ok) {
        setMessaggio({
          tipo: "errore",
          testo:
            result?.errore ??
            "Pausa corsa non disponibile in questo momento. Riprova tra poco.",
        });
        return;
      }

      setCorsaAttiva(
        result?.corsa
          ? {
              ...result.corsa,
              mezzo: result.corsa.mezzo ?? corsaAttiva.mezzo,
            }
          : null,
      );
      setMessaggio({
        tipo: "successo",
        testo:
          result?.messaggio ??
          "Corsa messa in pausa con successo.",
      });
    } catch {
      setMessaggio({
        tipo: "errore",
        testo:
          "Impossibile contattare il server in questo momento. Verifica che l'applicazione sia avviata e riprova.",
      });
    } finally {
      setIsPausaInCorso(false);
    }
  }

  async function gestisciTermineCorsa(): Promise<void> {
    if (!corsaAttiva) {
      setMessaggio({
        tipo: "errore",
        testo: "Non c'e nessuna corsa da terminare.",
      });
      return;
    }

    setMessaggio(null);
    setIsTermineInCorso(true);

    try {
      const response = await fetch("/api/noleggio/corse/termine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          corsaId: corsaAttiva.id,
        }),
      });

      const result =
        (await response.json().catch(() => null)) as CorsaApiResponse | null;

      if (!response.ok) {
        setMessaggio({
          tipo: "errore",
          testo:
            result?.errore ??
            "Termine corsa non disponibile in questo momento. Riprova tra poco.",
        });
        return;
      }

      const corsaTerminata = result?.corsa
        ? {
            ...result.corsa,
            mezzo: result.corsa.mezzo ?? corsaAttiva.mezzo,
          }
        : null;

      setUltimaCorsaTerminata(corsaTerminata);
      setCorsaAttiva(null);
      setRiepilogoConclusioneAperto(Boolean(corsaTerminata));
      setMessaggio({
        tipo: "successo",
        testo:
          result?.messaggio ??
          "Corsa terminata con successo.",
      });
    } catch {
      setMessaggio({
        tipo: "errore",
        testo:
          "Impossibile contattare il server in questo momento. Verifica che l'applicazione sia avviata e riprova.",
      });
    } finally {
      setIsTermineInCorso(false);
    }
  }

  return {
    prenotazioneAttiva,
    corsaAttiva,
    ultimaCorsaTerminata,
    riepilogoConclusioneAperto,
    messaggio,
    isSubmittingMezzoId,
    isAnnullamentoInCorso,
    isAvvioInCorso,
    isPausaInCorso,
    isTermineInCorso,
    prenotazioneBloccata,
    gestisciPrenotazione,
    gestisciAnnullamentoPrenotazione,
    gestisciAvvioCorsa,
    gestisciPausaCorsa,
    gestisciTermineCorsa,
    chiudiRiepilogoConclusione: () => {
      setRiepilogoConclusioneAperto(false);
    },
    setMessaggio,
    setUltimaCorsaTerminata,
  };
}
