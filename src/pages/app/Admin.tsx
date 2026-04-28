import { Card } from "@/components/ui/card";

export default function Admin() {
  return (
    <div className="space-y-4">
      <h1 className="heading-gold font-display text-2xl font-bold">Admin dashboard</h1>
      <div className="grid grid-cols-2 gap-3">
        {[["Members","—"],["Premium","—"],["Diamond","—"],["Revenue","—"]].map(([l,v]) => (
          <Card key={l} className="rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
            <div className="heading-gold font-display text-2xl font-bold">{v}</div>
          </Card>
        ))}
      </div>
      <Card className="rounded-2xl p-4 text-sm text-muted-foreground">Member management, manual matchmaking, and scam detection panels coming next.</Card>
    </div>
  );
}