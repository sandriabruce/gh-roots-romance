// Client-callable: verify a Paystack reference and activate if successful.
// Acts as a fallback to the webhook so plans unlock immediately even if the
// webhook is delayed or the user closed the dialog before approving on phone.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { activateFromPaystackData, verifyPaystackReference } from "../_shared/activate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const reference = body.reference as string | undefined;
    if (!reference) return json({ error: "Missing reference" }, 400);

    const data = await verifyPaystackReference(reference);
    // Defence-in-depth: ensure the reference belongs to the calling user.
    const metaUser = data?.metadata?.user_id as string | undefined;
    if (metaUser && metaUser !== userId) {
      return json({ error: "Reference does not belong to caller" }, 403);
    }

    const result = await activateFromPaystackData({
      reference,
      status: data.status,
      amount: data.amount ?? 0,
      currency: data.currency ?? "GHS",
      metadata: data.metadata ?? null,
    });
    return json({ ok: true, status: data.status, ...result });
  } catch (e) {
    console.error("paystack-verify error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}