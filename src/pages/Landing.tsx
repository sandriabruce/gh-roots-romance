import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { CoupleCard, SAMPLE_COUPLES } from "@/components/brand/CoupleCard";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-warm">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo size="sm" />
        <Link to="/auth"><Button variant="ghost" className="text-ghana-brown">Sign in</Button></Link>
      </header>
      <section className="mx-auto max-w-3xl px-4 py-12 text-center">
        <Logo size="xl" showWordmark className="justify-center" />
        <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/80">
          Ghanaian dating for the 40+ generation. At home and across the diaspora — built for real love, with real safety.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/auth"><Button size="lg" className="bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">Start free 7-day trial</Button></Link>
          <Link to="/app/safety"><Button size="lg" variant="outline" className="border-ghana-red text-ghana-red">Safety first</Button></Link>
        </div>
        <div className="mt-10 grid grid-cols-4 gap-3 text-center">
          {[["94+","couples"],["21","countries"],["2.8k+","members"],["7","weddings"]].map(([n,l]) => (
            <div key={l} className="rounded-2xl border-2 border-ghana-gold/40 bg-card p-3">
              <div className="font-display text-xl font-bold text-ghana-brown">{n}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="font-display text-2xl font-bold text-ghana-gold">Real love stories</h2>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {SAMPLE_COUPLES.map((c) => <CoupleCard key={c.id} couple={c} />)}
        </div>
      </section>
    </div>
  );
}