import { NavLink, Outlet } from "react-router-dom";
import { Compass, Heart, MessageCircle, ShieldCheck, User, ShieldAlert, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { computeTrial } from "@/features/trial/entitlements";
import { toast } from "sonner";

const tabs = [
  { to: "/app/discover", label: "Discover", icon: Compass },
  { to: "/app/matches", label: "Matches", icon: Heart },
  { to: "/app/chat", label: "Chat", icon: MessageCircle },
  { to: "/app/verify", label: "Verify", icon: ShieldCheck },
  { to: "/app/profile", label: "Profile", icon: User },
  { to: "/app/safety", label: "Safety", icon: ShieldAlert },
];

export function AppShell() {
  const { isAdmin } = useAuth();
  const { data: profile } = useProfile();
  const allTabs = isAdmin ? [...tabs, { to: "/app/admin", label: "Admin", icon: Crown }] : tabs;

  // One-time toast confirming Premium activation + new trial end date.
  useEffect(() => {
    if (!profile?.id) return;
    if (profile.plan !== "premium" && profile.plan !== "diamond") return;
    const key = `premium-activated-notice:${profile.id}`;
    if (localStorage.getItem(key)) return;
    const trial = computeTrial(profile.trial_start);
    const endsAt = trial.endsAt
      ? trial.endsAt.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
      : null;
    toast.success("Premium activated 🎉", {
      description: endsAt
        ? `Your trial now runs through ${endsAt}. Enjoy unlimited matches and chat.`
        : "Enjoy unlimited matches, chat, and the verified badge.",
      duration: 8000,
    });
    localStorage.setItem(key, new Date().toISOString());
  }, [profile?.id, profile?.plan, profile?.trial_start]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-warm">
      <header className="sticky top-0 z-30 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <Logo size="sm" />
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-stretch justify-between px-2">
          {allTabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                  isActive ? "text-ghana-green" : "text-muted-foreground",
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}