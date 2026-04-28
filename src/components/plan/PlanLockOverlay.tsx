import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PlanLockOverlay({
  title,
  message,
  cta = "See plans",
}: {
  title: string;
  message: string;
  cta?: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-ghana-gold/50 bg-gradient-to-br from-ghana-gold/15 via-background to-ghana-red/10 p-6 text-center shadow-warm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ghana-gold text-ghana-brown">
        <Lock className="h-6 w-6" />
      </div>
      <h3 className="mt-3 font-display text-lg font-bold text-ghana-brown">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button asChild className="mt-4 bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">
        <Link to="/app/verify">{cta}</Link>
      </Button>
    </div>
  );
}