import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TrialBadge } from "@/components/plan/TrialBadge";

export default function Profile() {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { plan, planLabel, trial, limits } = useEntitlements();
  return (
    <div className="space-y-4">
      <SafetyBanner message="Privacy tip: Don't share your full address, workplace, or financial details on your profile." />
      <h1 className="heading-gold font-display text-2xl font-bold">Your profile</h1>
      <TrialBadge />
      <Card className="rounded-2xl p-4">
        <div className="font-display text-lg font-bold text-romance-foreground">{profile?.first_name ?? "—"}</div>
        <div className="mt-2 text-xs uppercase tracking-wider text-[#edf8f2]">Mode: {profile?.mode ?? "romance"}</div>
        <div className="mt-1 text-xs uppercase tracking-wider text-[#f1f9f5]">
          Plan: {planLabel}
          {trial.active && (plan === "explorer" || plan === "verified") && (
            <span className="ml-2 normal-case tracking-normal text-ghana-brown/70">
              · trial: {trial.daysRemaining} day{trial.daysRemaining === 1 ? "" : "s"} left
            </span>
          )}
        </div>
        <div className="mt-1 text-xs uppercase tracking-wider text-[#edf8f2]">
          Chat: {limits.canChat ? "unlocked" : "locked"} · Matches/week: {limits.weeklyMatchLimit ?? "unlimited"}
        </div>
      </Card>
      <Button variant="outline" className="border-ghana-red text-ghana-red" onClick={signOut}>Sign out</Button>
    </div>
  );
}