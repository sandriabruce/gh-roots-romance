import { Sparkles, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEntitlements } from "@/hooks/useEntitlements";

export function TrialBadge({ className = "" }: { className?: string }) {
  const { trial, plan } = useEntitlements();
  if (plan !== "explorer" && plan !== "verified") return null;

  if (trial.active) {
    return (
      <Link
        to="/app/verify"
        className={`flex items-center justify-between gap-2 rounded-2xl border-2 border-ghana-gold/60 bg-ghana-gold/15 px-3 py-2 text-xs ${className}`}
      >
        <span className="flex items-center gap-2 font-medium text-ghana-brown">
          <Sparkles className="h-4 w-4 text-ghana-gold" />
          Free trial active — Premium features unlocked
        </span>
        <span className="flex items-center gap-1 font-display font-bold text-ghana-green">
          <Clock className="h-3.5 w-3.5" />
          {trial.daysRemaining}d left
        </span>
      </Link>
    );
  }

  return (
    <Link
      to="/app/verify"
      className={`flex items-center justify-between gap-2 rounded-2xl border-2 border-ghana-red/40 bg-ghana-red/10 px-3 py-2 text-xs text-ghana-red ${className}`}
    >
      <span className="font-medium text-ghana-brown">Your free trial has ended.</span>
      <span className="font-display font-bold text-ghana-red">Upgrade →</span>
    </Link>
  );
}