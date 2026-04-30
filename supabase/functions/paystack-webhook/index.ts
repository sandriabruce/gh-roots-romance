// Paystack webhook — authoritative activation path.
// Configure your Paystack dashboard webhook URL to:
//   https://<project-ref>.supabase.co/functions/v1/paystack-webhook
// We verify the x-paystack-signature header against PAYSTACK_SECRET_KEY (HMAC-SHA512).

import { activateFromPaystackData, admin } from "../_shared/activate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hmacSha512Hex(key: string, message: string) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secret) return new Response("missing secret", { status: 500 });

    const raw = await req.text();
    const sigHeader = req.headers.get("x-paystack-signature") ?? "";
    const expected = await hmacSha512Hex(secret, raw);
    if (sigHeader !== expected) {
      console.warn("paystack-webhook: bad signature");
      return new Response("invalid signature", { status: 401 });
    }

    const evt = JSON.parse(raw);
    const eventType = evt?.event as string | undefined;
    const data = evt?.data ?? {};
    const reference = data?.reference as string | undefined;

    // Always log the event for audit, idempotently by event_id.
    const sb = admin();
    const eventId = `${eventType}:${reference}:${data?.id ?? ""}`;
    await sb.from("payment_events").upsert(
      {
        provider: "paystack",
        event_id: eventId,
        event_type: eventType ?? "unknown",
        reference: reference ?? null,
        payload: evt,
      },
      { onConflict: "provider,event_id" },
    );

    // Activate on success-like events.
    if (eventType === "charge.success" && reference) {
      const result = await activateFromPaystackData({
        reference,
        status: data.status ?? "success",
        amount: data.amount ?? 0,
        currency: data.currency ?? "GHS",
        metadata: data.metadata ?? null,
      });
      console.log("paystack-webhook activated", result);
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("paystack-webhook error", e);
    return new Response("error", { status: 500 });
  }
});