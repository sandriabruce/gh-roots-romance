import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type ModProfile = {
  id: string;
  first_name: string | null;
  email: string | null;
  banned: boolean;
  flagged: boolean;
  verified: boolean;
};

export default function Admin() {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ModProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  async function search() {
    if (!isAdmin) return;
    const term = q.trim();
    if (!term) { setResults([]); return; }
    setLoading(true);
    // RLS allows admins to read full profiles incl. email
    let query = supabase
      .from("profiles")
      .select("id, first_name, email, banned, flagged, verified")
      .limit(20);
    // Try uuid lookup first, otherwise search by name/email substring
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);
    query = isUuid
      ? query.eq("id", term)
      : query.or(`first_name.ilike.%${term}%,email.ilike.%${term}%`);
    const { data, error } = await query;
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setResults((data ?? []) as ModProfile[]);
  }

  return (
    <div className="space-y-4">
      <h1 className="heading-gold font-display text-2xl font-bold">Admin dashboard</h1>
      <Button asChild className="rounded-full bg-ghana-green text-white hover:bg-ghana-green/90">
        <Link to="/app/admin/payments">Open payments verification →</Link>
      </Button>
      <div className="grid grid-cols-2 gap-3">
        {[["Members","—"],["Premium","—"],["Diamond","—"],["Revenue","—"]].map(([l,v]) => (
          <Card key={l} className="rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
            <div className="heading-gold font-display text-2xl font-bold">{v}</div>
          </Card>
        ))}
      </div>

      {isAdmin ? (
        <Card className="rounded-2xl p-4 space-y-3 border-ghana-red/40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-ghana-red" />
            <h2 className="font-display text-lg font-bold text-ghana-brown">Moderation lookup</h2>
            <Badge variant="outline" className="border-ghana-red text-ghana-red">Admin only</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Search by name, email, or user id. Emails stay hidden until you click reveal — never share them outside moderation.
          </p>
          <div className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") search(); }}
              placeholder="name, email, or user id"
            />
            <Button onClick={search} disabled={loading} className="rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">
              {loading ? "Searching…" : "Search"}
            </Button>
          </div>
          <div className="space-y-2">
            {results.map((p) => {
              const shown = !!reveal[p.id];
              return (
                <div key={p.id} className="rounded-xl border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-ghana-brown">{p.first_name ?? "—"}</div>
                      <div className="font-mono text-[11px] text-muted-foreground break-all">{p.id}</div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.verified && <Badge className="bg-ghana-green text-white">Verified</Badge>}
                      {p.flagged && <Badge variant="outline" className="border-ghana-red text-ghana-red">Flagged</Badge>}
                      {p.banned && <Badge className="bg-ghana-red text-white">Banned</Badge>}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="text-muted-foreground mr-1">Email:</span>
                      <span className="font-mono">
                        {shown ? (p.email ?? "—") : "•••••••@•••••"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReveal((r) => ({ ...r, [p.id]: !r[p.id] }))}
                      className="rounded-full"
                    >
                      {shown ? <><EyeOff className="h-3 w-3 mr-1" /> Hide</> : <><Eye className="h-3 w-3 mr-1" /> Reveal</>}
                    </Button>
                  </div>
                </div>
              );
            })}
            {!loading && q && results.length === 0 && (
              <p className="text-xs text-muted-foreground">No members found.</p>
            )}
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl p-4 text-sm text-muted-foreground">Member management, manual matchmaking, and scam detection panels coming next.</Card>
      )}
    </div>
  );
}