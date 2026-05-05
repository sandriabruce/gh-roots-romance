import type { Database } from "@/integrations/supabase/types";

export type Plan = Database["public"]["Enums"]["plan_tier"];

export const TRIAL_DAYS = 7;

export interface PlanLimits {
  /** Can open and read chat threads / send messages */
  canChat: boolean;
  /** Maximum new matches per rolling 7-day window. null = unlimited */
  weeklyMatchLimit: number | null;
  /** Shows verified badge on profile */
  verifiedBadge: boolean;
  /** Eligible for concierge / personal matchmaker */
  concierge: boolean;
  /** Profile is boosted in the deck */
  priorityProfile: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  explorer: { canChat: false, weeklyMatchLimit: null, verifiedBadge: false, concierge: false, priorityProfile: false },
  verified: { canChat: false, weeklyMatchLimit: null, verifiedBadge: true, concierge: false, priorityProfile: false },
  premium:  { canChat: true,  weeklyMatchLimit: null, verifiedBadge: true, concierge: false, priorityProfile: false },
  diamond:  { canChat: true,  weeklyMatchLimit: null, verifiedBadge: true, concierge: true,  priorityProfile: true  },
};

export const PLAN_LABEL: Record<Plan, string> = {
  explorer: "Explorer",
  verified: "Verified",
  premium: "Premium",
  diamond: "Diamond",
};

export interface TrialState {
  active: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  endsAt: Date | null;
}

export function computeTrial(trialStart: string | null | undefined): TrialState {
  if (!trialStart) return { active: false, daysRemaining: 0, hoursRemaining: 0, endsAt: null };
  const start = new Date(trialStart).getTime();
  const endsAt = new Date(start + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const msLeft = endsAt.getTime() - Date.now();
  if (msLeft <= 0) return { active: false, daysRemaining: 0, hoursRemaining: 0, endsAt };
  const daysRemaining = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.ceil(msLeft / (60 * 60 * 1000));
  return { active: true, daysRemaining, hoursRemaining, endsAt };
}

/**
 * Effective limits = plan limits, lifted to Premium-equivalent while the 7-day trial is active.
 * Trial unlocks chat and unlimited matches but does NOT grant the verified badge or concierge.
 */
export function effectiveLimits(plan: Plan, trial: TrialState): PlanLimits {
  const base = PLAN_LIMITS[plan];
  if (!trial.active) return base;
  return {
    ...base,
    canChat: true,
    weeklyMatchLimit: null,
  };
}