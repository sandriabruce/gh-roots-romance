import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { computeTrial, effectiveLimits, PLAN_LABEL, type Plan } from "@/features/trial/entitlements";

const PLAN_RANK: Record<Plan, number> = {
  explorer: 0,
  verified: 1,
  premium: 2,
  diamond: 3,
};

function higherPlan(a: Plan, b: Plan): Plan {
  return PLAN_RANK[b] > PLAN_RANK[a] ? b : a;
}

export function useEntitlements() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: activeSubscription, isLoading: isSubscriptionLoading } = useQuery({
    queryKey: ["active-subscription", user?.id],
    enabled: !!user,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan,status,expires_at,created_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const now = Date.now();
      return data?.find((sub) => !sub.expires_at || new Date(sub.expires_at).getTime() > now) ?? null;
    },
  });
  // Tick once a minute so countdown stays fresh while the user is on the page.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const profilePlan: Plan = (profile?.plan as Plan | undefined) ?? "explorer";
  const subscriptionPlan = activeSubscription?.plan as Plan | undefined;
  const plan: Plan = subscriptionPlan ? higherPlan(profilePlan, subscriptionPlan) : profilePlan;
  const trial = computeTrial(profile?.trial_start);
  const limits = effectiveLimits(plan, trial);

  return {
    loading: isLoading || isSubscriptionLoading,
    plan,
    planLabel: PLAN_LABEL[plan],
    verified: profile?.verified ?? limits.verifiedBadge,
    trial,
    limits,
  };
}