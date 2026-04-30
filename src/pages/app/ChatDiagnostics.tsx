import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MessageCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Match = {
  id: string;
  user_a: string;
  user_b: string;
  status: string;
  created_at: string;
};

type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  flagged: boolean;
  created_at: string;
};

type Profile = { id: string; first_name: string | null; email: string | null };

type Row = {
  match: Match;
  last: Message | null;
  count: number;
  participants: Profile[];
  bySender: Record<string, { count: number; last: Message | null }>;
};

export default function ChatDiagnostics() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [writeStatus, setWriteStatus] = useState<{ matchId: string; ok: boolean; detail: string } | null>(null);

  async function load() {
    setLoading(true);
    const [matchesRes, msgsRes] = await Promise.all([
      supabase.from("matches").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    setLoading(false);
    if (matchesRes.error) { toast.error(matchesRes.error.message); return; }
    if (msgsRes.error) { toast.error(msgsRes.error.message); return; }
    const matches = (matchesRes.data ?? []) as Match[];
    const msgs = (msgsRes.data ?? []) as Message[];

    const byMatch: Record<string, Message[]> = {};
    msgs.forEach((m) => { (byMatch[m.match_id] ||= []).push(m); });

    const userIds = Array.from(new Set(matches.flatMap((m) => [m.user_a, m.user_b])));
    const profMap: Record<string, Profile> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, first_name, email")
        .in("id", userIds);
      (profs ?? []).forEach((p: any) => { profMap[p.id] = p; });
    }
    setProfiles(profMap);

    const built: Row[] = matches.map((match) => {
      const list = (byMatch[match.id] ?? []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const bySender: Record<string, { count: number; last: Message | null }> = {};
      [match.user_a, match.user_b].forEach((sid) => { bySender[sid] = { count: 0, last: null }; });
      list.forEach((m) => {
        const slot = (bySender[m.sender_id] ||= { count: 0, last: null });
        slot.count += 1;
        if (!slot.last) slot.last = m;
      });
      return {
        match,
        last: list[0] ?? null,
        count: list.length,
        participants: [match.user_a, match.user_b].map((id) => profMap[id] ?? { id, first_name: null, email: null }),
        bySender,
      };
    });
    setRows(built);
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  async function probeRead(matchId: string) {
    const { data, error } = await supabase
      .from("messages")
      .select("id, created_at, sender_id")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) { toast.error(`Read failed: ${error.message}`); return; }
    toast.success(data?.length ? `Read OK · last ${new Date(data[0].created_at).toLocaleString()}` : "Read OK · no messages");
  }

  async function probeWrite(matchId: string) {
    setWriteStatus(null);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { toast.error("Not signed in"); return; }
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: auth.user.id,
      content: `[diagnostic ping ${new Date().toISOString()}]`,
    });
    if (error) {
      setWriteStatus({ matchId, ok: false, detail: error.message });
      toast.error(`Write blocked: ${error.message}`);
      return;
    }
    setWriteStatus({ matchId, ok: true, detail: "Insert succeeded" });
    toast.success("Write OK");
    load();
  }

  if (authLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/app/discover" replace />;

  const term = filter.trim().toLowerCase();
  const filtered = term
    ? rows.filter((r) => {
        return (
          r.match.id.toLowerCase().includes(term) ||
          r.match.user_a.toLowerCase().includes(term) ||
          r.match.user_b.toLowerCase().includes(term) ||
          r.participants.some((p) => p.first_name?.toLowerCase().includes(term) || p.email?.toLowerCase().includes(term))
        );
      })
    : rows;

  const totalMessages = rows.reduce((n, r) => n + r.count, 0);
  const silentMatches = rows.filter((r) => r.count === 0).length;
  const oneSided = rows.filter((r) => r.count > 0 && Object.values(r.bySender).some((s) => s.count === 0)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="heading-gold font-display text-2xl font-bold">Chat diagnostics</h1>
        <Button onClick={load} disabled={loading} size="sm" variant="outline" className="rounded-full">
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-2xl p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <MessageCircle className="h-3 w-3" /> Messages
          </div>
          <div className="heading-gold font-display text-2xl font-bold">{totalMessages}</div>
        </Card>
        <Card className="rounded-2xl p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Silent matches</div>
          <div className="heading-gold font-display text-2xl font-bold">{silentMatches}</div>
        </Card>
        <Card className="rounded-2xl p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">One-sided</div>
          <div className="heading-gold font-display text-2xl font-bold">{oneSided}</div>
        </Card>
      </div>

      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by match id, user id, name, or email"
      />

      <Card className="rounded-2xl p-4 space-y-3">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
        {filtered.map((r) => (
          <div key={r.match.id} className="rounded-xl border p-3 text-sm space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono text-[11px] text-muted-foreground break-all">match {r.match.id}</div>
                <div className="font-semibold text-ghana-brown">
                  {r.participants.map((p) => p.first_name ?? p.email ?? p.id.slice(0, 6)).join(" ↔ ")}
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                <Badge className="bg-ghana-brown text-white capitalize">{r.match.status}</Badge>
                <Badge variant="outline">{r.count} msg</Badge>
              </div>
            </div>

            <div className="grid gap-1 text-xs">
              {[r.match.user_a, r.match.user_b].map((sid) => {
                const slot = r.bySender[sid];
                const p = profiles[sid];
                return (
                  <div key={sid} className="flex items-center justify-between gap-2 rounded bg-muted/40 px-2 py-1">
                    <div className="min-w-0">
                      <div className="truncate">
                        <span className="text-muted-foreground">sender </span>
                        <span className="font-semibold">{p?.first_name ?? p?.email ?? sid.slice(0, 8)}</span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground break-all">{sid}</div>
                    </div>
                    <div className="text-right">
                      <div>{slot.count} sent</div>
                      <div className="text-[10px] text-muted-foreground">
                        {slot.last ? `last ${new Date(slot.last.created_at).toLocaleString()}` : "never wrote"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {r.last && (
              <div className="rounded bg-background border p-2 text-xs">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>last message</span>
                  <span>{new Date(r.last.created_at).toLocaleString()}</span>
                </div>
                <div className="mt-1 truncate">{r.last.content}</div>
                {r.last.flagged && (
                  <Badge variant="outline" className="mt-1 border-ghana-red text-ghana-red">
                    <AlertTriangle className="h-3 w-3 mr-1" /> flagged
                  </Badge>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => probeRead(r.match.id)}>
                Probe read
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => probeWrite(r.match.id)}>
                Probe write (as me)
              </Button>
              {writeStatus?.matchId === r.match.id && (
                <span className={`flex items-center text-[11px] ${writeStatus.ok ? "text-ghana-green" : "text-ghana-red"}`}>
                  {writeStatus.ok ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                  {writeStatus.detail}
                </span>
              )}
            </div>
          </div>
        ))}
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Probe write only succeeds for matches you are a participant in (RLS). Use it to confirm send permission for a real
        member account; for other matches expect a policy error — that itself is the diagnostic signal.
      </p>
    </div>
  );
}