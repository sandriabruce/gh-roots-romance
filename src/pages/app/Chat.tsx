import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PlanLockOverlay } from "@/components/plan/PlanLockOverlay";
import { TrialBadge } from "@/components/plan/TrialBadge";

export default function Chat() {
  const { limits, trial, plan } = useEntitlements();

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

  return (
    <div className="space-y-4">
      <SafetyBanner variant="warn" message="Never share phone numbers, WhatsApp, or money requests. Report anything suspicious." />
      {trial.active && <TrialBadge />}
      <h1 className="heading-gold font-display text-2xl font-bold">Chat</h1>
      <p className="text-sm text-muted-foreground">Open a conversation from Matches.</p>
    </div>
  );
}