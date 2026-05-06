import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TrialBadge } from "@/components/plan/TrialBadge";
import { SafeText } from "@/components/ui/SafeText";
import { Link } from "react-router-dom";
import { User as UserIcon } from "lucide-react";

export default function Profile() {
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const { plan, planLabel, trial, limits } = useEntitlements();
  const displayName = profile?.first_name?.trim() || user?.user_metadata?.first_name || user?.email?.split("@")[0] || "Your profile";
  const email = profile?.email || user?.email;
  const photos = Array.isArray(profile?.photos) ? (profile!.photos as string[]) : [];
  const mainPhoto = photos[0];
  const interests = Array.isArray(profile?.interests) ? (profile!.interests as string[]) : [];

  const fields: Array<[string, string | number | null | undefined]> = [
    ["Age", profile?.age],
    ["Gender", profile?.gender],
    ["Interested in", profile?.interested_in],
    ["Location", [profile?.city, profile?.location, profile?.country].filter(Boolean).join(", ") || null],
    ["Ethnicity", profile?.ethnicity],
    ["Religion", profile?.religion],
    ["Has children", profile?.has_children],
    ["Relationship goal", profile?.relationship_type],
    ["Values", profile?.values_text],
    ["Email", email],
  ];

  return (
    <div className="space-y-4">
      <SafetyBanner message="Privacy tip: Don't share your full address, workplace, or financial details on your profile." />
      <h1 className="heading-gold font-display text-2xl font-bold">Your profile</h1>
      <TrialBadge />

      <Card className="rounded-2xl overflow-hidden">
        <div className="relative aspect-[4/3] bg-muted flex items-center justify-center">
          {mainPhoto ? (
            <img
              src={mainPhoto}
              alt={`${displayName}'s profile photo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <UserIcon className="h-16 w-16" />
              <span className="text-xs">No photo uploaded yet</span>
            </div>
          )}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-2">
            {photos.slice(1).map((p, i) => (
              <img key={i} src={p} alt={`Photo ${i + 2}`} className="h-16 w-16 rounded-lg object-cover shrink-0" />
            ))}
          </div>
        )}
      </Card>

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

      {profile?.bio && (
        <Card className="rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wider text-ghana-gold mb-1">About</div>
          <SafeText as="p" className="text-sm text-foreground whitespace-pre-wrap" fallbackClassName="text-muted-foreground">
            {profile.bio}
          </SafeText>
        </Card>
      )}

      <Card className="rounded-2xl p-4 space-y-2">
        <div className="text-xs uppercase tracking-wider text-ghana-gold mb-1">Details</div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {fields.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 border-b border-border/40 pb-1">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-foreground text-right break-words">
                {value !== null && value !== undefined && String(value).length > 0 ? String(value) : <span className="text-muted-foreground/60">—</span>}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      {interests.length > 0 && (
        <Card className="rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wider text-ghana-gold mb-2">Interests</div>
          <div className="flex flex-wrap gap-2">
            {interests.map((i) => (
              <span key={i} className="rounded-full bg-ghana-gold/15 px-3 py-1 text-xs text-ghana-brown">{i}</span>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">
          <Link to="/app/profile/edit">Edit profile</Link>
        </Button>
        <Button variant="outline" className="border-ghana-red text-ghana-red" onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );
}