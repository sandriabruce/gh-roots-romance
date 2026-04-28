import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { Card } from "@/components/ui/card";
import { TrialBadge } from "@/components/plan/TrialBadge";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function Matches() {
  const { limits, plan } = useEntitlements();
  return (
    <div className="space-y-4">
      <SafetyBanner variant="warn" message="Romance scammers target mature singles. Never send money — even if the story sounds urgent." />
      <TrialBadge />
      <h1 className="heading-gold font-display text-2xl font-bold">Your matches</h1>
      <p className="text-sm text-muted-foreground">No matches yet. Start swiping in Discover.</p>
      <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground">Matches will appear here.</Card>
      {!limits.canChat && (
        <p className="text-xs text-muted-foreground">
          Heads up: messaging your matches requires the Premium plan.
        </p>
      )}
    </div>
  );
}