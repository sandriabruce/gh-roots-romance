import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, ShieldAlert, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

type Sub = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  provider: string;
  paystack_reference: string | null;
  created_at: string;
  expires_at: string | null;
};

type Profile = { id: string; first_name: string | null; email: string | null; plan: string; verified: boolean };

type PaymentEvent = {
  id: string;
  provider: string;
  event_id: string;
  event_type: string | null;
  reference: string | null;
  created_at: string;
  payload: any;
};

const STATUS_TONE: Record<string, string> = {
  active: "bg-ghana-green text-white",
  trial: "bg-ghana-gold text-ghana-brown",
  expired: "bg-muted text-muted-foreground",
  canceled: "bg-ghana-red text-white",
  failed: "bg-ghana-red text-white",
};

export default function PaymentsAdmin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  async function load() {
    setLoading(true);
    const [subsRes, evtRes] = await Promise.all([
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("payment_events").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setLoading(false);
    if (subsRes.error) { toast.error(subsRes.error.message); return; }
    if (evtRes.error) { toast.error(evtRes.error.message); return; }
    const subRows = (subsRes.data ?? []) as Sub[];
    setSubs(subRows);
    setEvents((evtRes.data ?? []) as PaymentEvent[]);
    const ids = Array.from(new Set(subRows.map((s) => s.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, first_name, email, plan, verified")
        .in("id", ids);
      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (authLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/app/discover" replace />;

  const term = filter.trim().toLowerCase();
  const filteredSubs = term
    ? subs.filter((s) => {
        const p = profiles[s.user_id];
        return (
          s.paystack_reference?.toLowerCase().includes(term) ||
          s.user_id.toLowerCase().includes(term) ||
          s.plan.toLowerCase().includes(term) ||
          s.status.toLowerCase().includes(term) ||
          p?.email?.toLowerCase().includes(term) ||
          p?.first_name?.toLowerCase().includes(term)
        );
      })
    : subs;

  const counts = {
    active: subs.filter((s) => s.status === "active").length,
    trial: subs.filter((s) => s.status === "trial").length,
    failed: subs.filter((s) => s.status === "failed" || s.status === "canceled").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="heading-gold font-display text-2xl font-bold">Payments verification</h1>
        <Button onClick={load} disabled={loading} size="sm" variant="outline" className="rounded-full">
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-ghana-gold/40 bg-ghana-gold/10 p-3 text-xs text-ghana-brown">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          A user unlocks chat the moment their subscription row flips to <b>active</b>. Webhook
          inserts land in <b>payment_events</b> — cross-reference by Paystack reference to confirm.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-2xl p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-ghana-green" /> Active
          </div>
          <div className="heading-gold font-display text-2xl font-bold">{counts.active}</div>
        </Card>
        <Card className="rounded-2xl p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3 w-3 text-ghana-gold" /> Trial / pending
          </div>
          <div className="heading-gold font-display text-2xl font-bold">{counts.trial}</div>
        </Card>
        <Card className="rounded-2xl p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <XCircle className="h-3 w-3 text-ghana-red" /> Failed
          </div>
          <div className="heading-gold font-display text-2xl font-bold">{counts.failed}</div>
        </Card>
      </div>

      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by name, email, plan, status, or reference"
      />

      <Card className="rounded-2xl p-4 space-y-3">
        <h2 className="font-display text-lg font-bold text-ghana-brown">Subscriptions</h2>
        {filteredSubs.length === 0 && (
          <p className="text-sm text-muted-foreground">No subscriptions match.</p>
        )}
        {filteredSubs.map((s) => {
          const p = profiles[s.user_id];
          const matchingEvents = events.filter((e) => e.reference && e.reference === s.paystack_reference);
          const tone = STATUS_TONE[s.status] ?? "bg-muted text-foreground";
          return (
            <div key={s.id} className="rounded-xl border p-3 text-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-ghana-brown truncate">
                    {p?.first_name ?? "—"} <span className="text-muted-foreground font-normal">· {p?.email ?? "no email"}</span>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground break-all">{s.user_id}</div>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  <Badge className="bg-ghana-brown text-white capitalize">{s.plan}</Badge>
                  <Badge className={`capitalize ${tone}`}>{s.status}</Badge>
                  {p?.plan && p.plan !== s.plan && (
                    <Badge variant="outline" className="border-ghana-red text-ghana-red">profile: {p.plan}</Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <div>Amount: <span className="text-foreground">{s.amount} {s.currency}</span></div>
                <div>Provider: <span className="text-foreground">{s.provider}</span></div>
                <div className="col-span-2 break-all">
                  Ref: <span className="font-mono text-foreground">{s.paystack_reference ?? "—"}</span>
                </div>
                <div>Created: <span className="text-foreground">{new Date(s.created_at).toLocaleString()}</span></div>
                {s.expires_at && (
                  <div>Expires: <span className="text-foreground">{new Date(s.expires_at).toLocaleString()}</span></div>
                )}
              </div>
              {matchingEvents.length > 0 && (
                <div className="rounded-lg bg-muted/50 p-2 text-[11px]">
                  <div className="mb-1 font-semibold text-ghana-brown">Webhook events ({matchingEvents.length})</div>
                  <ul className="space-y-1">
                    {matchingEvents.map((e) => (
                      <li key={e.id} className="flex justify-between gap-2">
                        <span className="font-mono">{e.event_type ?? "event"}</span>
                        <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {s.status === "trial" && matchingEvents.length === 0 && (
                <p className="text-[11px] text-ghana-red">No webhook event yet — payment not confirmed.</p>
              )}
            </div>
          );
        })}
      </Card>

      <Card className="rounded-2xl p-4 space-y-2">
        <h2 className="font-display text-lg font-bold text-ghana-brown">Recent Paystack events</h2>
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground">No payment events recorded yet.</p>
        )}
        {events.map((e) => (
          <div key={e.id} className="rounded-xl border p-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="font-mono font-semibold">{e.event_type ?? "event"}</span>
              <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
            </div>
            <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
              ref: {e.reference ?? "—"} · id: {e.event_id}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}