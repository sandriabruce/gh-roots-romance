import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin, roleLoaded } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && !roleLoaded) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Checking access…</div>;
  if (adminOnly && !isAdmin) return <Navigate to="/app/discover" replace />;
  // Onboarding gate: require core profile fields before accessing the app.
  const onOnboarding = location.pathname.startsWith("/onboarding");
  if (!adminOnly && !onOnboarding) {
    if (profileLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
    const incomplete =
      !profile?.first_name?.trim() ||
      !profile?.gender ||
      !profile?.interested_in ||
      !profile?.age;
    if (incomplete) return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}