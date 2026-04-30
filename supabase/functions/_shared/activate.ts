// Shared helper: verify a Paystack reference and activate the user's plan.
// Idempotent — safe to call from webhook, OTP submit, and client-initiated verify.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export type Plan = "verified" | "premium" | "diamond";

const PLAN_RANK: Record<string, number> = {
  explorer: 0,
  verified: 1,
  premium: 2,
  diamond: 3,
};

export function higherPlan(a: string | null | undefined, b: string | null | undefined): string {
  const ra = PLAN_RANK[a ?? "explorer"] ?? 0;
  const rb = PLAN_RANK[b ?? "explorer"] ?? 0;
  return ra >= rb ? (a ?? "explorer") : (b ?? "explorer");
}

export function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/**
 * Verify a Paystack transaction by reference. Returns the transaction data
 * (including status, amount, currency, customer, metadata) or throws.
 */
export async function verifyPaystackReference(reference: string) {
  const key = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!key) throw new Error("PAYSTACK_SECRET_KEY not configured");
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Paystack verification failed");
  }
  return json.data;
}

/**
 * Activate the subscription + profile plan for a successful Paystack payment.
 * - Marks the matching subscriptions row as 'active' (or inserts one if missing).
 * - Sets profiles.plan to the highest of (current, paid) — never downgrades.
 * - Idempotent: re-calling with the same reference is safe.
 * Returns { activated: boolean, plan, userId, reference }.
 */
export async function activateFromPaystackData(data: {
  reference: string;
  status: string;
  amount: number; // minor units (pesewas)
  currency?: string;
  metadata?: { user_id?: string; plan?: string } | null;
}) {
  const sb = admin();
  const reference = data.reference;
  if (data.status !== "success") {
    return { activated: false, reason: `status=${data.status}`, reference };
  }

  // Resolve user_id + plan: prefer metadata, fall back to the subscriptions row we recorded at initialize time.
  let userId = data.metadata?.user_id ?? null;
  let plan = (data.metadata?.plan as Plan | undefined) ?? null;

  const { data: existing } = await sb
    .from("subscriptions")
    .select("id, user_id, plan, status")
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (!userId && existing?.user_id) userId = existing.user_id;
  if (!plan && existing?.plan) plan = existing.plan as Plan;

  if (!userId || !plan) {
    throw new Error(`Cannot activate: missing user_id/plan for reference ${reference}`);
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const amountMajor = Math.round((data.amount ?? 0)) / 100;

  if (existing) {
    if (existing.status !== "active") {
      await sb
        .from("subscriptions")
        .update({
          status: "active",
          plan,
          amount: amountMajor || undefined,
          currency: data.currency ?? "GHS",
          expires_at: expiresAt,
        })
        .eq("id", existing.id);
    }
  } else {
    await sb.from("subscriptions").insert({
      user_id: userId,
      plan,
      provider: "paystack",
      currency: data.currency ?? "GHS",
      amount: amountMajor || 0,
      status: "active",
      paystack_reference: reference,
      expires_at: expiresAt,
    });
  }

  // Upgrade profile plan (never downgrade).
  const { data: profile } = await sb
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  const nextPlan = higherPlan(profile?.plan, plan);
  if (nextPlan !== profile?.plan) {
    await sb.from("profiles").update({ plan: nextPlan, updated_at: new Date().toISOString() }).eq("id", userId);
  }

  return { activated: true, userId, plan: nextPlan, reference };
}