import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, X } from "lucide-react";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { CoupleCard, SAMPLE_COUPLES } from "@/components/brand/CoupleCard";

const SAMPLE_PEOPLE = [
  { name: "Akua", age: 48, location: "Accra", bio: "Faith, family, and fresh kelewele on Sunday." },
  { name: "Yaw", age: 54, location: "London", bio: "Engineer, widower, looking for a soft landing." },
  { name: "Esi", age: 46, location: "Kumasi", bio: "Teacher, mother of two grown sons, ready for love again." },
  { name: "Kofi", age: 59, location: "Toronto", bio: "Believer in slow love and good kontomire." },
];

export default function Discover() {
  const { data: profile } = useProfile();
  const [i, setI] = useState(0);
  const mode = profile?.mode ?? "romance";
  const person = SAMPLE_PEOPLE[i % SAMPLE_PEOPLE.length];
  const accent = mode === "spark" ? "bg-gradient-spark" : "bg-gradient-romance";
  return (
    <div className="space-y-4">
      <SafetyBanner message="Tip: Real connections take time. Never send money to anyone you meet here." />
      <Card className={`relative aspect-[3/4] overflow-hidden rounded-3xl ${accent} text-white shadow-warm`}>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
          <h2 className="font-display text-3xl font-bold">{person.name}, {person.age}</h2>
          <p className="text-sm opacity-90">{person.location}</p>
          <p className="mt-2 text-sm">{person.bio}</p>
        </div>
      </Card>
      <div className="flex justify-center gap-6">
        <Button onClick={() => setI((x) => x + 1)} size="lg" variant="outline" className="h-16 w-16 rounded-full border-2 border-ghana-red"><X className="h-7 w-7 text-ghana-red" /></Button>
        <Button onClick={() => setI((x) => x + 1)} size="lg" className="h-16 w-16 rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90"><Heart className="h-7 w-7 fill-white" /></Button>
      </div>
      <section>
        <h3 className="font-display text-xl font-bold text-ghana-brown">Real love stories</h3>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {SAMPLE_COUPLES.map((c) => <CoupleCard key={c.id} couple={c} />)}
        </div>
      </section>
    </div>
  );
}