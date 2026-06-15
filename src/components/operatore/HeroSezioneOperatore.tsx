type HeroSezioneOperatoreProps = {
  soprattitolo: string;
  titolo: string;
  descrizione: string;
};

// Header condiviso per le sezioni operatore: mantiene un linguaggio visivo
// coerente tra le varie pagine del menu senza reintrodurre card piatte.
export default function HeroSezioneOperatore({
  soprattitolo,
  titolo,
  descrizione,
}: HeroSezioneOperatoreProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 lg:px-10">
      <div className="space-y-5">
        <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
          {soprattitolo}
        </span>
        <div className="space-y-4">
          <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {titolo}
          </h2>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            {descrizione}
          </p>
        </div>
      </div>
    </section>
  );
}
