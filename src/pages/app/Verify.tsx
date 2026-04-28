import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLANS = [
  { name: "Explorer", price: "Free", note: "Browse only · 2 matches/week" },
  { name: "Verified", price: "GH₵80/mo", note: "Verification badge" },
  { name: "Premium", price: "GH₵180/mo", note: "Unlimited matches + chat" },
  { name: "Diamond", price: "GH₵350/mo", note: "Personal matchmaker call" },
];

export default function Verify() {
  return (
    <div className="space-y-4">
      <SafetyBanner message="GH SUƆMƆ never asks for payment outside this app. Pay only via Paystack MoMo or card." />
      <h1 className="font-display text-2xl font-bold text-ghana-brown">Plans & verification</h1>
      <div className="grid gap-3">
        {PLANS.map((p) => (
          <Card key={p.name} className="flex items-center justify-between rounded-2xl border-2 border-ghana-gold/40 p-4">
            <div>
              <h3 className="font-display text-lg font-bold text-ghana-brown">{p.name}</h3>
              <p className="text-xs text-muted-foreground">{p.note}</p>
            </div>
            <div className="text-right">
              <div className="font-display text-base font-bold text-ghana-green">{p.price}</div>
              <Button size="sm" className="mt-1 bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">Choose</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}