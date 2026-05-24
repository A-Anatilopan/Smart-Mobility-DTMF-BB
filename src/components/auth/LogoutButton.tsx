"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Bottone client condiviso per chiudere la sessione e riportare l'utente al login.
// Manteniamo qui la logica di logout per evitare duplicazioni tra le tre dashboard.
export default function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messaggioErrore, setMessaggioErrore] = useState<string | null>(null);

  async function handleLogout() {
    setMessaggioErrore(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const result = (await response.json().catch(() => null)) as
        | { errore?: string }
        | null;

      if (!response.ok) {
        setMessaggioErrore(
          result?.errore ??
            "Logout non riuscito. Riprova tra qualche istante."
        );
        return;
      }

      // Usiamo replace per evitare che il tasto indietro riporti subito
      // l'utente nell'area riservata appena chiusa.
      router.replace("/login");
    } catch {
      setMessaggioErrore(
        "Impossibile contattare il server in questo momento. Riprova tra poco."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-5 space-y-3">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Logout in corso..." : "Logout"}
      </button>

      {messaggioErrore ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {messaggioErrore}
        </p>
      ) : null}
    </div>
  );
}
