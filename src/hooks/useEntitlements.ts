import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { computeTrial, effectiveLimits, PLAN_LABEL, type Plan } from "@/features/trial/entitlements";

export function useEntitlements() {
  const { data: profile, isLoading } = useProfile();
  // Tick once a minute so countdown stays fresh while the user is on the page.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const plan: Plan = (profile?.plan as Plan | undefined) ?? "explorer";
  const trial = computeTrial(profile?.trial_start);
  const limits = effectiveLimits(plan, trial);

  return {
    loading: isLoading,
    plan,
    planLabel: PLAN_LABEL[plan],
    verified: profile?.verified ?? limits.verifiedBadge,
    trial,
    limits,
  };
}