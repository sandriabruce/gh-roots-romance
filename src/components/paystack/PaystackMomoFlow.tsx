import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, Smartphone, CheckCircle2 } from "lucide-react";
import { PAYSTACK_PUBLIC_KEY, isPaystackTestMode } from "@/lib/paystack";

const NETWORKS = [
  { id: "mtn", label: "MTN Mobile Money" },
  { id: "vod", label: "Vodafone Cash" },
  { id: "atl", label: "AirtelTigo Money" },
];

type Step = 1 | 2 | 3;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  priceLabel: string;
}

export function PaystackMomoFlow({ open, onOpenChange, planName, priceLabel }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [network, setNetwork] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep(1);
    setNetwork("");
    setPhone("");
    setOtp("");
    setSubmitting(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const phoneValid = /^0\d{9}$/.test(phone.trim());

  const goToSummary = () => {
    if (!network) {
      toast({ title: "Select a network", description: "Pick MTN, Vodafone, or AirtelTigo." });
      return;
    }
    if (!phoneValid) {
      toast({ title: "Invalid phone number", description: "Use a 10-digit Ghana number, e.g. 024XXXXXXX." });
      return;
    }
    setStep(2);
  };

  const requestOtp = () => {
    setSubmitting(true);
    // Placeholder: real charge happens via paystack-initialize edge function.
    setTimeout(() => {
      setSubmitting(false);
      setStep(3);
      toast({
        title: "OTP sent",
        description: `Check ${phone} for a 6-digit code from Paystack.`,
      });
    }, 800);
  };

  const confirmOtp = () => {
    if (otp.length !== 6) {
      toast({ title: "Enter the 6-digit code", description: "Check your SMS from Paystack." });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: "Payment submitted",
        description: "We'll confirm your upgrade once Paystack verifies the charge.",
      });
      handleClose(false);
    }, 900);
  };

  const networkLabel = NETWORKS.find((n) => n.id === network)?.label ?? "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl border-2 border-ghana-gold/40">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-ghana-brown">
            {planName} · {priceLabel}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pay securely with Paystack Mobile Money. Step {step} of 3.
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center gap-2 pb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                s <= step ? "bg-ghana-gold" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mobile money network</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your network" />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((n) => (
                    <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="momo-phone">MoMo phone number</Label>
              <Input
                id="momo-phone"
                inputMode="numeric"
                placeholder="024XXXXXXX"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />
              <p className="text-xs text-muted-foreground">
                Must match the name on your GH SUƆMƆ account.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={goToSummary} className="w-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">
                Continue
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card className="space-y-2 rounded-xl border-ghana-gold/30 bg-ghana-gold/5 p-4">
              <Row label="Plan" value={planName} />
              <Row label="Amount" value={priceLabel} />
              <Row label="Network" value={networkLabel} />
              <Row label="Phone" value={phone} />
              <Row label="Provider" value={isPaystackTestMode ? "Paystack (Test)" : "Paystack"} />
            </Card>
            <div className="flex items-start gap-2 rounded-lg bg-ghana-green/10 p-3 text-xs text-ghana-brown">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ghana-green" />
              <span>
                GH SUƆMƆ never asks for payment outside this app. You'll receive an
                OTP from Paystack to approve this charge.
              </span>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={requestOtp}
                disabled={submitting}
                className="w-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                {submitting ? "Sending OTP…" : "Send me the OTP"}
              </Button>
              <Button variant="ghost" onClick={() => setStep(1)} className="w-full">
                Back
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code Paystack sent to <span className="font-medium text-ghana-brown">{phone}</span>.
            </p>
            <div className="flex justify-center py-2">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={confirmOtp}
                disabled={submitting}
                className="w-full bg-ghana-green text-white hover:bg-ghana-green/90"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {submitting ? "Verifying…" : "Confirm payment"}
              </Button>
              <Button variant="ghost" onClick={() => setStep(2)} className="w-full">
                Back
              </Button>
            </DialogFooter>
            {isPaystackTestMode && (
              <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">
                Test mode · key {PAYSTACK_PUBLIC_KEY.slice(0, 12)}…
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-ghana-brown">{value}</span>
    </div>
  );
}