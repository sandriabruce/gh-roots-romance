import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function Profile() {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  return (
    <div className="space-y-4">
      <SafetyBanner message="Privacy tip: Don't share your full address, workplace, or financial details on your profile." />
      <h1 className="heading-gold font-display text-2xl font-bold">Your profile</h1>
      <Card className="rounded-2xl p-4">
        <div className="font-display text-lg font-bold text-ghana-brown">{profile?.first_name ?? "—"}</div>
        <div className="text-sm text-muted-foreground">{profile?.email}</div>
        <div className="mt-2 text-xs uppercase tracking-wider text-ghana-green">Mode: {profile?.mode ?? "romance"}</div>
        <div className="mt-1 text-xs uppercase tracking-wider text-ghana-green">Plan: {profile?.plan ?? "explorer"}</div>
      </Card>
      <Button variant="outline" className="border-ghana-red text-ghana-red" onClick={signOut}>Sign out</Button>
    </div>
  );
}