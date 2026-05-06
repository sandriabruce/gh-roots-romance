import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type QueueRow = {
  id: string;
  match_id: string;
  seed_user_id: string;
  recipient_user_id: string;
  trigger_message_id: string;
  trigger_message_content: string;
  reply_at: string;
  status: string;
  created_at: string;
  processed_at: string | null;
};

type Profile = { id: string; first_name: string | null; email: string | null };

const STATUS_TONE: Record<string, string> = {
  pending: "bg-ghana-gold text-ghana-brown",
  processing: "bg-ghana-brown text-white",
  sent: "bg-ghana-green text-white",
  skipped: "bg-muted text-muted-foreground",
  failed: "bg-ghana-red text-white",
};

export default function SeedRepliesAdmin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [running, setRunning] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("seed_reply_queue" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const list = (data ?? []) as QueueRow[];
    setRows(list);
    const ids = Array.from(new Set(list.flatMap((r) => [r.seed_user_id, r.recipient_user_id])));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, first_name, email")
        .in("id", ids);
      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  async function runNow() {
    setRunning(true);
    try {
      const { error } = await supabase.functions.invoke("process-seed-replies", { body: {} });
      if (error) throw error;
      toast.success("Processor triggered");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to run");
    } finally {
      setRunning(false);
    }
  }

  const term = search.trim().toLowerCase();
  const filtered = useMemo(() => rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (!term) return true;
    const seed = profiles[r.seed_user_id];
    const rec = profiles[r.recipient_user_id];
    return (
      r.trigger_message_content.toLowerCase().includes(term) ||
      r.match_id.toLowerCase().includes(term) ||
      seed?.first_name?.toLowerCase().includes(term) ||
      seed?.email?.toLowerCase().includes(term) ||
      rec?.first_name?.toLowerCase().includes(term) ||
      rec?.email?.toLowerCase().includes(term)
    );
  }), [rows, status, term, profiles]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, processing: 0, sent: 0, skipped: 0, failed: 0 };
    rows.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [rows]);

  if (authLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/app/discover" replace />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="heading-gold font-display text-2xl font-bold">Seed reply queue</h1>
        <div className="flex gap-2">
          <Button onClick={runNow} disabled={running} size="sm" className="rounded-full bg-ghana-green text-white hover:bg-ghana-green/90">
            {running ? "Running…" : "Run now"}
          </Button>
          <Button onClick={load} disabled={loading} size="sm" variant="outline" className="rounded-full">
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {(["pending","processing","sent","skipped","failed"] as const).map((s) => (
          <Card key={s} className="rounded-2xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s}</div>
            <div className="heading-gold font-display text-xl font-bold">{counts[s] ?? 0}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search content, name, email, match id…"
          className="col-span-2"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <Card className="rounded-2xl p-4 text-sm text-muted-foreground">No replies match these filters.</Card>
      )}

      {filtered.map((r) => {
        const seed = profiles[r.seed_user_id];
        const rec = profiles[r.recipient_user_id];
        const tone = STATUS_TONE[r.status] ?? "bg-muted text-foreground";
        const due = new Date(r.reply_at);
        const overdue = r.status === "pending" && due.getTime() < Date.now();
        return (
          <Card key={r.id} className="rounded-2xl p-3 text-sm space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`capitalize ${tone}`}>{r.status}</Badge>
                  {overdue && <Badge className="bg-ghana-red text-white">overdue</Badge>}
                </div>
                <div className="mt-1 text-xs text-ghana-brown">
                  <b>{seed?.first_name ?? "seed"}</b> → {rec?.first_name ?? "user"}{" "}
                  <span className="text-muted-foreground">({rec?.email ?? "—"})</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  due {due.toLocaleString()}
                  {r.processed_at && <> · processed {new Date(r.processed_at).toLocaleString()}</>}
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2 text-xs">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Trigger message</div>
              {r.trigger_message_content}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground break-all">
              match: {r.match_id}
            </div>
          </Card>
        );
      })}
    </div>
  );
}