import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!ANTHROPIC_API_KEY) {
      return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const { sender_id, receiver_id, message_content } = body ?? {};
    if (!sender_id || !receiver_id || !message_content) {
      return json({ error: "sender_id, receiver_id, message_content required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify receiver is a seed
    const { data: seed, error: seedErr } = await admin
      .from("profiles")
      .select("id, is_seed, first_name, age, gender, location, city, country, bio")
      .eq("id", receiver_id)
      .maybeSingle();
    if (seedErr) return json({ error: seedErr.message }, 500);
    if (!seed || !seed.is_seed) {
      return json({ skipped: true, reason: "receiver is not a seed" }, 200);
    }

    // Find the match between these two users
    const { data: match, error: matchErr } = await admin
      .from("matches")
      .select("id, user_a, user_b")
      .or(`and(user_a.eq.${sender_id},user_b.eq.${receiver_id}),and(user_a.eq.${receiver_id},user_b.eq.${sender_id})`)
      .maybeSingle();
    if (matchErr) return json({ error: matchErr.message }, 500);
    if (!match) return json({ error: "no match between users" }, 404);

    const name = seed.first_name ?? "there";
    const age = seed.age ?? "";
    const gender = seed.gender ?? "person";
    const location = [seed.city, seed.location, seed.country].filter(Boolean).join(", ") || "Ghana";
    const bio = seed.bio ?? "Looking for a genuine connection.";

    const systemPrompt = `You are ${name}, a ${age}-year-old ${gender} from ${location}, Ghana. You are culturally grounded, mature (40+ mindset), warm, respectful, and faith- and family-aware. Bio: ${bio}. You are chatting on GH SUƆMƆ, a Ghanaian dating app. Reply to the user's message warmly and naturally in 1-3 sentences. Stay fully in character as ${name}. Be genuine and curious without being desperate. Avoid excessive emojis. Do not mention being an AI.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: message_content }],
      }),
    });

    if (!claudeRes.ok) {
      const txt = await claudeRes.text();
      return json({ error: `claude ${claudeRes.status}: ${txt.slice(0, 300)}` }, 502);
    }
    const claudeJson = await claudeRes.json();
    const reply: string = claudeJson?.content?.[0]?.text?.trim() || "";
    if (!reply) return json({ error: "empty reply from model" }, 502);

    const { data: inserted, error: insErr } = await admin
      .from("messages")
      .insert({
        match_id: match.id,
        sender_id: receiver_id,
        content: reply,
      })
      .select()
      .maybeSingle();
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, message: inserted, reply }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}