import { useState } from "react";
import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaystackMomoFlow } from "@/components/paystack/PaystackMomoFlow";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TrialBadge } from "@/components/plan/TrialBadge";
import type { Plan } from "@/features/trial/entitlements";

const PLANS: { id: Plan; name: string; price: string; note: string; payable: boolean }[] = [
  { id: "explorer", name: "Explorer", price: "Free", note: "Browse only · 2 matches/week", payable: false },
  { id: "verified", name: "Verified", price: "GH₵80/mo", note: "Verification badge · 2 matches/week", payable: true },
  { id: "premium",  name: "Premium",  price: "GH₵180/mo", note: "Unlimited matches + chat", payable: true },
  { id: "diamond",  name: "Diamond",  price: "GH₵350/mo", note: "Everything in Premium + personal matchmaker", payable: true },
];

export default function Verify() {
  const [selected, setSelected] = useState<{ id: Plan; name: string; price: string } | null>(null);
  const { plan: currentPlan, trial } = useEntitlements();

  return (
    <div className="space-y-4">
      <SafetyBanner message="GH SUƆMƆ never asks for payment outside this app. Pay only via Paystack MoMo or card." />
      <h1 className="heading-gold font-display text-2xl font-bold">Plans & verification</h1>
      <TrialBadge />
      <div className="grid gap-3">
        {PLANS.map((p) => {
          const isCurrent = p.id === currentPlan;
          return (
            <Card
              key={p.id}
              className={`flex items-center justify-between rounded-2xl border-2 p-4 ${
                isCurrent ? "border-ghana-green bg-ghana-green/5" : "border-ghana-gold/40"
              }`}
            >
              <div>
                <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ghana-brown">
                  {p.name}
                  {isCurrent && (
                    <span className="rounded-full bg-ghana-green px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                      Current
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">{p.note}</p>
                {isCurrent && trial.active && (p.id === "explorer" || p.id === "verified") && (
                  <p className="mt-1 text-xs font-medium text-ghana-gold">
                    Premium features unlocked for {trial.daysRemaining} more day{trial.daysRemaining === 1 ? "" : "s"}.
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="font-display text-base font-bold text-ghana-green">{p.price}</div>
                <Button
                  size="sm"
                  disabled={isCurrent || !p.payable}
                  className="mt-1 bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90 disabled:opacity-60"
                  onClick={() => p.payable && !isCurrent && setSelected({ id: p.id, name: p.name, price: p.price })}
                >
                  {isCurrent ? "Current" : p.payable ? "Choose" : "Free"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <PaystackMomoFlow
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        planName={selected?.name ?? ""}
        priceLabel={selected?.price ?? ""}
        planId={selected && selected.id !== "explorer" ? (selected.id as "verified" | "premium" | "diamond") : undefined}
      />
    </div>
  );
}