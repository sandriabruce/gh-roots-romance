import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PlanLockOverlay } from "@/components/plan/PlanLockOverlay";
import { TrialBadge } from "@/components/plan/TrialBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { toast } from "sonner";

const FREE_MESSAGE_LIMIT = 2;

export default function Chat() {
  const { limits, trial, plan } = useEntitlements();
  const { id: matchId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const draftKey = matchId && user ? `chat-draft:${user.id}:${matchId}` : null;

  // Restore any saved draft (e.g. after an upgrade redirect).
  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) setDraft(saved);
    } catch { /* ignore */ }
  }, [draftKey]);

  const { data: messages } = useQuery({
    queryKey: ["messages", matchId],
    enabled: !!matchId && !!user && limits.canChat,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id,sender_id,content,created_at")
        .eq("match_id", matchId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  if (!limits.canChat) {
    return (
      <div className="space-y-4">
        <SafetyBanner variant="warn" message="Never share phone numbers, WhatsApp, or money requests. Report anything suspicious." />
        <TrialBadge />
        <PlanLockOverlay
          title="Chat is a Premium feature"
          message={`The ${plan === "verified" ? "Verified" : "Explorer"} plan doesn't include messaging. Upgrade to Premium or Diamond to chat with your matches.`}
          cta="Unlock chat"
        />
      </div>
    );
  }

  if (!matchId) {
    return (
      <div className="space-y-4">
        <SafetyBanner variant="warn" message="Never share phone numbers, WhatsApp, or money requests. Report anything suspicious." />
        {trial.active && <TrialBadge />}
        <h1 className="heading-gold font-display text-2xl font-bold">Chat</h1>
        <p className="text-sm text-muted-foreground">Open a conversation from Matches.</p>
      </div>
    );
  }

  const myMessageCount = (messages ?? []).filter((m) => m.sender_id === user?.id).length;
  const isFreePlan = plan === "explorer" || plan === "verified";
  const overFreeLimit = isFreePlan && !trial.active && myMessageCount >= FREE_MESSAGE_LIMIT;

  // When the user hits the cap with text in the box, persist it and send them to upgrade.
  useEffect(() => {
    if (!overFreeLimit || !draftKey) return;
    if (draft.trim()) {
      try { localStorage.setItem(draftKey, draft); } catch { /* ignore */ }
      toast.message("We saved your message. Upgrade to send it.");
      navigate("/app/verify");
    }
  }, [overFreeLimit, draft, draftKey, navigate]);

  async function send() {
    if (!draft.trim() || !user || !matchId) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: user.id,
      content: draft.trim(),
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setDraft("");
    if (draftKey) { try { localStorage.removeItem(draftKey); } catch { /* ignore */ } }
    qc.invalidateQueries({ queryKey: ["messages", matchId] });
  }

  return (
    <div className="flex flex-col gap-3">
      <SafetyBanner variant="warn" message="Never share phone numbers, WhatsApp, or money requests. Report anything suspicious." />
      {trial.active && <TrialBadge />}
      <div ref={scrollRef} className="min-h-[300px] max-h-[55vh] overflow-y-auto rounded-2xl border bg-card p-3 space-y-2">
        {(messages ?? []).length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Say hello 👋</p>
        ) : (
          (messages ?? []).map((m) => (
            <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === user?.id ? "bg-ghana-gold text-ghana-brown" : "bg-muted text-foreground"}`}>
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      {overFreeLimit ? (
        <div className="rounded-2xl border-2 border-ghana-gold/50 bg-gradient-to-br from-ghana-gold/15 via-background to-ghana-red/10 p-5 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ghana-gold text-ghana-brown">
            <Lock className="h-5 w-5" />
          </div>
          <p className="mt-3 font-display text-base font-semibold text-ghana-brown">
            Upgrade to Premium to keep the conversation going
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            You've sent {myMessageCount} messages on the {plan === "verified" ? "Verified" : "Explorer"} plan. Premium and Diamond unlock unlimited messaging.
          </p>
          {draft.trim() && (
            <p className="mt-2 text-xs text-ghana-brown">
              Your draft is saved — it'll be waiting here after you upgrade.
            </p>
          )}
          <Button asChild className="mt-3 bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">
            <Link
              to="/app/verify"
              onClick={() => {
                if (draftKey && draft.trim()) {
                  try { localStorage.setItem(draftKey, draft); } catch { /* ignore */ }
                }
              }}
            >
              Upgrade to Premium
            </Link>
          </Button>
        </div>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); send(); }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message…"
            disabled={sending}
            maxLength={500}
          />
          <Button type="submit" disabled={sending || !draft.trim()} className="bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">
            Send
          </Button>
        </form>
      )}
    </div>
  );
}