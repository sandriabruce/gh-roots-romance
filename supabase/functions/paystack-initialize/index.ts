import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Plan -> amount in GHS (major units). Kept server-side so clients cannot tamper.
const PLAN_AMOUNTS: Record<string, number> = {
  verified: 80,
  premium: 180,
  diamond: 350,
};

type Plan = keyof typeof PLAN_AMOUNTS;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return json({ error: "PAYSTACK_SECRET_KEY not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claims.claims.sub as string;
    const email = (claims.claims.email as string) || "user@example.com";

    const body = await req.json().catch(() => ({}));
    const plan = body.plan as Plan | undefined;
    const phone = (body.phone as string | undefined)?.trim();
    const provider = (body.provider as string | undefined) || "mtn"; // mtn | vod | atl

    if (!plan || !(plan in PLAN_AMOUNTS)) {
      return json({ error: "Invalid plan" }, 400);
    }
    if (!phone || !/^0\d{9}$/.test(phone)) {
      return json({ error: "Invalid phone (use 10-digit Ghana number)" }, 400);
    }
    const providerMap: Record<string, string> = { mtn: "mtn", vod: "vod", atl: "atl" };
    const momoProvider = providerMap[provider];
    if (!momoProvider) return json({ error: "Invalid provider" }, 400);

    const amountGhs = PLAN_AMOUNTS[plan];
    const amountKobo = amountGhs * 100; // GHS minor units (pesewas)
    const reference = `gs_${plan}_${userId.slice(0, 8)}_${Date.now()}`;

    // Paystack charge with mobile_money. Returns send_otp / pay_offline / success.
    const psRes = await fetch("https://api.paystack.co/charge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: "GHS",
        reference,
        mobile_money: { phone, provider: momoProvider },
        metadata: { user_id: userId, plan },
      }),
    });
    const psJson = await psRes.json();
    if (!psRes.ok || !psJson.status) {
      console.error("Paystack charge failed", psJson);
      return json({ error: psJson.message || "Paystack charge failed", details: psJson }, 400);
    }

    // Record a pending subscription using service role (bypass RLS for trusted server insert).
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await admin.from("subscriptions").insert({
      user_id: userId,
      plan,
      provider: "paystack",
      currency: "GHS",
      amount: amountGhs,
      status: "trial", // will become 'active' on webhook success
      paystack_reference: reference,
    });

    return json({
      reference,
      status: psJson.data?.status, // 'send_otp' | 'pay_offline' | 'success' | 'failed'
      display_text: psJson.data?.display_text,
      message: psJson.message,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}