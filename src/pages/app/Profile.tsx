import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TrialBadge } from "@/components/plan/TrialBadge";
import { SafeText } from "@/components/ui/SafeText";
import { Link } from "react-router-dom";

export default function Profile() {
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const { plan, planLabel, trial, limits } = useEntitlements();
  const displayName = profile?.first_name?.trim() || user?.user_metadata?.first_name || user?.email?.split("@")[0] || "Your profile";
  const email = profile?.email || user?.email;

  return (
    <div className="space-y-4">
      <SafetyBanner message="Privacy tip: Don't share your full address, workplace, or financial details on your profile." />
      <h1 className="heading-gold font-display text-2xl font-bold">Your profile</h1>
      <TrialBadge />
      <Card className="rounded-2xl p-4">
        <SafeText as="div" className="heading-gold font-display text-2xl font-bold" fallbackClassName="text-foreground">
          {displayName}
        </SafeText>
        <div className="mt-2 text-xs uppercase tracking-wider text-ghana-gold">Mode: {profile?.mode ?? "romance"}</div>
        <div className="mt-1 text-xs uppercase tracking-wider text-ghana-gold">
          Plan: {planLabel}
          {trial.active && (plan === "explorer" || plan === "verified") && (
            <span className="ml-2 normal-case tracking-normal text-ghana-brown/70">
              · trial: {trial.daysRemaining} day{trial.daysRemaining === 1 ? "" : "s"} left
            </span>
          )}
        </div>
        <div className="mt-1 text-xs uppercase tracking-wider text-ghana-gold">
          Chat: {limits.canChat ? "unlocked" : "locked"} · Matches/week: {limits.weeklyMatchLimit ?? "unlimited"}
        </div>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">
          <Link to="/app/profile/edit">Edit profile</Link>
        </Button>
        <Button variant="outline" className="border-ghana-red text-ghana-red" onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );
}