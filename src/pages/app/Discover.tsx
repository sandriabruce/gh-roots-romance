import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { CoupleCard, SAMPLE_COUPLES } from "@/components/brand/CoupleCard";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TrialBadge } from "@/components/plan/TrialBadge";
import { PlanLockOverlay } from "@/components/plan/PlanLockOverlay";
import { InstallBanner } from "@/components/pwa/InstallBanner";

type Candidate = {
  id: string;
  first_name: string | null;
  age: number | null;
  location: string | null;
  bio: string | null;
  photos: string[];
};

export default function Discover() {
  const { data: profile } = useProfile();
  const { limits, plan, trial } = useEntitlements();
  const [i, setI] = useState(0);
  const [likes, setLikes] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const mode = profile?.mode ?? "romance";
  const accent = mode === "spark" ? "bg-gradient-spark" : "bg-gradient-romance";
  const limit = limits.weeklyMatchLimit;
  const limitReached = limit !== null && likes >= limit;

  // Map viewer's interested_in to which seed gender(s) to show.
  const targetGenders = useMemo<string[]>(() => {
    const want = profile?.interested_in;
    if (want === "Men") return ["Man"];
    if (want === "Women") return ["Woman"];
    if (want === "Everyone") return ["Man", "Woman"];
    return ["Man", "Woman"];
  }, [profile?.interested_in]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, age, location, bio, photos")
        .eq("is_seed", true)
        .eq("banned", false)
        .in("gender", targetGenders)
        .limit(100);
      if (cancelled) return;
      if (error || !data) {
        setCandidates([]);
      } else {
        const mapped: Candidate[] = data.map((row) => ({
          id: row.id as string,
          first_name: row.first_name as string | null,
          age: row.age as number | null,
          location: row.location as string | null,
          bio: row.bio as string | null,
          photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
        }));
        // Light shuffle so the deck feels fresh on every visit.
        for (let j = mapped.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [mapped[j], mapped[k]] = [mapped[k], mapped[j]];
        }
        setCandidates(mapped);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [targetGenders]);

  const person = candidates.length > 0 ? candidates[i % candidates.length] : null;
  const cover = person?.photos?.[0];

  const handleLike = () => {
    if (limitReached) return;
    setLikes((n) => n + 1);
    setI((x) => x + 1);
  };

  return (
    <div className="space-y-4">
      <SafetyBanner message="Tip: Real connections take time. Never send money to anyone you meet here." />
      <TrialBadge />
      {limit !== null && (
        <p className="text-xs text-muted-foreground">
          {plan === "explorer" || plan === "verified"
            ? `${Math.max(0, limit - likes)} of ${limit} weekly matches remaining on the ${plan} plan.`
            : null}
        </p>
      )}
      {limitReached ? (
        <PlanLockOverlay
          title="Weekly match limit reached"
          message={`The ${plan === "verified" ? "Verified" : "Explorer"} plan includes ${limit} matches per week. Upgrade to Premium for unlimited matches.`}
          cta="Upgrade to Premium"
        />
      ) : (
      <>
      <Card className={`relative aspect-[3/4] overflow-hidden rounded-3xl ${accent} text-white shadow-warm`}>
        {cover && (
          <img
            src={cover}
            alt={person?.first_name ?? "Member"}
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover no-snap"
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
          {loading ? (
            <h2 className="font-display text-3xl font-bold">Finding people…</h2>
          ) : person ? (
            <>
              <h2 className="font-display text-3xl font-bold">
                {person.first_name ?? "Member"}{person.age ? `, ${person.age}` : ""}
              </h2>
              {person.location && <p className="text-sm opacity-90">{person.location}</p>}
              {person.bio && <p className="mt-2 text-sm line-clamp-3">{person.bio}</p>}
            </>
          ) : (
            <h2 className="font-display text-2xl font-bold">No profiles to show yet</h2>
          )}
        </div>
      </Card>
      <div className="flex justify-center gap-6">
        <Button onClick={() => setI((x) => x + 1)} size="lg" variant="outline" disabled={!person} className="h-16 w-16 rounded-full border-2 border-ghana-red"><X className="h-7 w-7 text-ghana-red" /></Button>
        <Button onClick={handleLike} size="lg" disabled={!person} className="h-16 w-16 rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90"><Heart className="h-7 w-7 fill-white" /></Button>
      </div>
      </>
      )}
      <section>
        <h3 className="font-display text-xl font-bold text-ghana-gold">Real love stories</h3>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {SAMPLE_COUPLES.map((c) => <CoupleCard key={c.id} couple={c} />)}
        </div>
      </section>
      <InstallBanner />
    </div>
  );
}