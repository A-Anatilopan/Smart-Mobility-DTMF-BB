import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anagrafiche | E-Smart Mobility",
  description:
    "Area della Pubblica Amministrazione dedicata alla consultazione utenti e patenti.",
};

export default function AnagrafichePage() {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
        Anagrafiche
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        Questa sezione verra sviluppata nei prossimi step.
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        La pagina e gia pronta come punto di atterraggio, cosi la navigazione
        istituzionale resta ordinata fin da ora.
      </p>
    </section>
  );
}
