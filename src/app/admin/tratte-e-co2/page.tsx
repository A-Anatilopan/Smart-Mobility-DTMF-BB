import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tratte e CO2 | E-Smart Mobility",
  description:
    "Area della Pubblica Amministrazione dedicata a tratte piu usate e impatto ambientale.",
};

export default function TratteECo2Page() {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
        Tratte e CO2
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        Questa sezione verra sviluppata nei prossimi step.
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        Abbiamo gia preparato la navigazione dedicata, cosi l&apos;area admin resta
        pulita anche mentre completiamo le prossime user stories della PA.
      </p>
    </section>
  );
}
