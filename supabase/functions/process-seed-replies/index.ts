import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: due, error } = await admin
    .from("seed_reply_queue")
    .select("*")
    .eq("status", "pending")
    .lte("reply_at", new Date().toISOString())
    .limit(20);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const item of due ?? []) {
    try {
      // Claim the row
      const { data: claimed } = await admin
        .from("seed_reply_queue")
        .update({ status: "processing" })
        .eq("id", item.id)
        .eq("status", "pending")
        .select()
        .maybeSingle();
      if (!claimed) continue;

      // Guard: ensure no reply from this seed already exists after the trigger message
      const { data: trigger } = await admin
        .from("messages")
        .select("created_at")
        .eq("id", item.trigger_message_id)
        .maybeSingle();

      if (trigger?.created_at) {
        const { data: existing } = await admin
          .from("messages")
          .select("id")
          .eq("match_id", item.match_id)
          .eq("sender_id", item.seed_user_id)
          .gt("created_at", trigger.created_at)
          .limit(1);
        if (existing && existing.length > 0) {
          await admin.from("seed_reply_queue")
            .update({ status: "skipped", processed_at: new Date().toISOString() })
            .eq("id", item.id);
          results.push({ id: item.id, ok: true, error: "already replied" });
          continue;
        }
      }

      const { data: seed } = await admin
        .from("profiles")
        .select("first_name, age, gender, location, city, country, bio")
        .eq("id", item.seed_user_id)
        .maybeSingle();

      const name = seed?.first_name ?? "there";
      const age = seed?.age ?? "";
      const gender = seed?.gender ?? "person";
      const location = [seed?.city, seed?.location, seed?.country].filter(Boolean).join(", ") || "Ghana";
      const bio = seed?.bio ?? "Looking for a genuine connection.";

      const systemPrompt = `You are ${name}, a ${age} year old ${gender} from ${location}. Your bio: ${bio}. You are on a Ghanaian dating app called GH SUƆMƆ. Reply warmly and naturally to this message in 1-3 sentences. Stay in character. Be genuine, culturally aware, and interested but not desperate. Do not use emojis excessively.`;

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 300,
          system: systemPrompt,
          messages: [{ role: "user", content: item.trigger_message_content }],
        }),
      });

      if (!claudeRes.ok) {
        const txt = await claudeRes.text();
        await admin.from("seed_reply_queue")
          .update({ status: "failed", processed_at: new Date().toISOString() })
          .eq("id", item.id);
        results.push({ id: item.id, ok: false, error: `claude ${claudeRes.status}: ${txt.slice(0, 200)}` });
        continue;
      }

      const claudeJson = await claudeRes.json();
      const reply: string = claudeJson?.content?.[0]?.text?.trim() || "";
      if (!reply) {
        await admin.from("seed_reply_queue")
          .update({ status: "failed", processed_at: new Date().toISOString() })
          .eq("id", item.id);
        results.push({ id: item.id, ok: false, error: "empty reply" });
        continue;
      }

      const { error: insErr } = await admin.from("messages").insert({
        match_id: item.match_id,
        sender_id: item.seed_user_id,
        content: reply,
      });
      if (insErr) {
        await admin.from("seed_reply_queue")
          .update({ status: "failed", processed_at: new Date().toISOString() })
          .eq("id", item.id);
        results.push({ id: item.id, ok: false, error: insErr.message });
        continue;
      }

      await admin.from("seed_reply_queue")
        .update({ status: "sent", processed_at: new Date().toISOString() })
        .eq("id", item.id);
      results.push({ id: item.id, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await admin.from("seed_reply_queue")
        .update({ status: "failed", processed_at: new Date().toISOString() })
        .eq("id", item.id);
      results.push({ id: item.id, ok: false, error: msg });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});