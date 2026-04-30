// Scheduled reconciliation: scans recent non-active subscriptions and any
// recent payment_events lacking activation, verifies them with Paystack, and
// activates the matching plan. Idempotent — safe to run on a schedule.
//
// Trigger: pg_cron hits this every 10 minutes. Can also be invoked manually
// by admins for backfills.

import { activateFromPaystackData, admin, verifyPaystackReference } from "../_shared/activate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReconResult = {
  reference: string;
  source: "subscription" | "event";
  activated: boolean;
  plan?: string;
  error?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const startedAt = Date.now();
  const sb = admin();
  const results: ReconResult[] = [];
  // Look back 7 days by default; allow override via body.
  let lookbackHours = 24 * 7;
  let singleReference: string | null = null;
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.lookbackHours === "number" && body.lookbackHours > 0) {
        lookbackHours = Math.min(body.lookbackHours, 24 * 30);
      }
      if (typeof body?.reference === "string" && body.reference.trim()) {
        singleReference = body.reference.trim();
      }
    }
  } catch {/* ignore */}

  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

  // Collect candidate references from two sources.
  const refs = new Set<string>();
  const sourceMap = new Map<string, "subscription" | "event">();

  if (singleReference) {
    refs.add(singleReference);
    sourceMap.set(singleReference, "subscription");
  } else {
  // 1. Subscriptions that aren't active yet but have a Paystack reference.
  const { data: pendingSubs, error: subsErr } = await sb
    .from("subscriptions")
    .select("paystack_reference, status, created_at")
    .neq("status", "active")
    .not("paystack_reference", "is", null)
    .gte("created_at", since)
    .limit(200);
  if (subsErr) console.warn("recon: subscriptions query failed", subsErr);
  for (const s of pendingSubs ?? []) {
    if (s.paystack_reference && !refs.has(s.paystack_reference)) {
      refs.add(s.paystack_reference);
      sourceMap.set(s.paystack_reference, "subscription");
    }
  }

  // 2. Recent charge.success events whose subscription isn't active (defensive).
  const { data: events, error: evErr } = await sb
    .from("payment_events")
    .select("reference, event_type, created_at")
    .eq("provider", "paystack")
    .eq("event_type", "charge.success")
    .gte("created_at", since)
    .limit(500);
  if (evErr) console.warn("recon: events query failed", evErr);
  for (const e of events ?? []) {
    if (e.reference && !refs.has(e.reference)) {
      refs.add(e.reference);
      sourceMap.set(e.reference, "event");
    }
  }
  }

  // Verify each reference against Paystack and activate when successful.
  for (const reference of refs) {
    const source = sourceMap.get(reference)!;
    try {
      const data = await verifyPaystackReference(reference);
      if (data?.status !== "success") {
        results.push({ reference, source, activated: false, error: `paystack status=${data?.status}` });
        continue;
      }
      const result = await activateFromPaystackData({
        reference,
        status: data.status,
        amount: data.amount ?? 0,
        currency: data.currency ?? "GHS",
        metadata: data.metadata ?? null,
      });
      results.push({
        reference,
        source,
        activated: !!result.activated,
        plan: result.plan,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("recon: failed for", reference, msg);
      results.push({ reference, source, activated: false, error: msg });
    }
  }

  const summary = {
    scanned: refs.size,
    activated: results.filter((r) => r.activated).length,
    failed: results.filter((r) => r.error).length,
    durationMs: Date.now() - startedAt,
    lookbackHours,
  };
  console.log("paystack-reconcile complete", summary);

  return new Response(JSON.stringify({ ok: true, summary, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});