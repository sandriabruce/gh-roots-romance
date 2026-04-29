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
import { ShieldCheck, Smartphone, CheckCircle2, AlertTriangle, RotateCw } from "lucide-react";
import { PAYSTACK_PUBLIC_KEY, isPaystackTestMode } from "@/lib/paystack";
import { supabase } from "@/integrations/supabase/client";

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
  planId?: "verified" | "premium" | "diamond";
}

export function PaystackMomoFlow({ open, onOpenChange, planName, priceLabel, planId }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [network, setNetwork] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<"activation" | "network" | "generic" | null>(null);
  const [attempts, setAttempts] = useState(0);

  const reset = () => {
    setStep(1);
    setNetwork("");
    setPhone("");
    setOtp("");
    setSubmitting(false);
    setReference(null);
    setErrorMsg(null);
    setErrorKind(null);
    setAttempts(0);
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

  const classifyError = (raw: string): { kind: "activation" | "network" | "generic"; message: string } => {
    const m = raw.toLowerCase();
    if (
      m.includes("test mobile money") ||
      m.includes("test mode") ||
      m.includes("activate") ||
      m.includes("not been activated") ||
      m.includes("live mode") ||
      m.includes("compliance")
    ) {
      return {
        kind: "activation",
        message:
          "Mobile Money payments aren't fully switched on yet. This usually clears within a few minutes — please try again shortly.",
      };
    }
    if (m.includes("network") || m.includes("fetch") || m.includes("timeout")) {
      return { kind: "network", message: "Network hiccup. Check your connection and try again." };
    }
    return { kind: "generic", message: raw || "Something went wrong. Please try again." };
  };

  const requestOtp = async () => {
    setErrorMsg(null);
    setErrorKind(null);
    if (!planId) {
      toast({ title: "Plan unavailable", description: "Please pick a paid plan." });
      return;
    }
    setSubmitting(true);
    setAttempts((a) => a + 1);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: { plan: planId, phone, provider: network },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReference(data.reference);
      const status = data.status as string | undefined;
      if (status === "send_otp") {
        setStep(3);
        setAttempts(0);
        toast({ title: "OTP sent", description: data.display_text || `Check ${phone} for a code from Paystack.` });
      } else if (status === "pay_offline") {
        toast({ title: "Approve on your phone", description: data.display_text || "Dial your MoMo menu to approve the charge." });
        handleClose(false);
      } else if (status === "success") {
        toast({ title: "Payment successful", description: "Your plan will activate shortly." });
        handleClose(false);
      } else {
        toast({ title: "Charge submitted", description: data.message || "Awaiting Paystack confirmation." });
        handleClose(false);
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Try again.";
      const { kind, message } = classifyError(raw);
      setErrorKind(kind);
      setErrorMsg(message);
      toast({
        title: kind === "activation" ? "Mobile Money temporarily unavailable" : "Could not start payment",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmOtp = async () => {
    setErrorMsg(null);
    setErrorKind(null);
    if (otp.length !== 6) {
      toast({ title: "Enter the 6-digit code", description: "Check your SMS from Paystack." });
      return;
    }
    if (!reference) {
      toast({ title: "Missing reference", description: "Restart the payment." });
      return;
    }
    setSubmitting(true);
    setAttempts((a) => a + 1);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-submit-otp", {
        body: { reference, otp },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "Payment submitted",
        description: "We'll confirm your upgrade once Paystack verifies the charge.",
      });
      handleClose(false);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Try again.";
      const { kind, message } = classifyError(raw);
      setErrorKind(kind);
      setErrorMsg(
        kind === "generic"
          ? "That code didn't work. Double-check the SMS from Paystack and try again."
          : message,
      );
      toast({
        title: kind === "activation" ? "Mobile Money temporarily unavailable" : "OTP not accepted",
        description: message,
      });
      setOtp("");
    } finally {
      setSubmitting(false);
    }
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
            {errorMsg && (
              <ErrorBanner kind={errorKind} message={errorMsg} attempts={attempts} />
            )}
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
                {errorMsg ? <RotateCw className="mr-2 h-4 w-4" /> : <Smartphone className="mr-2 h-4 w-4" />}
                {submitting ? "Sending OTP…" : errorMsg ? "Try again" : "Send me the OTP"}
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
            {errorMsg && (
              <ErrorBanner kind={errorKind} message={errorMsg} attempts={attempts} />
            )}
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={confirmOtp}
                disabled={submitting}
                className="w-full bg-ghana-green text-white hover:bg-ghana-green/90"
              >
                {errorMsg ? <RotateCw className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {submitting ? "Verifying…" : errorMsg ? "Try again" : "Confirm payment"}
              </Button>
              {errorKind === "activation" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(2);
                    setOtp("");
                    setReference(null);
                  }}
                  className="w-full"
                >
                  Restart payment
                </Button>
              )}
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

function ErrorBanner({
  kind,
  message,
  attempts,
}: {
  kind: "activation" | "network" | "generic" | null;
  message: string;
  attempts: number;
}) {
  const isActivation = kind === "activation";
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
        isActivation
          ? "bg-ghana-gold/15 text-ghana-brown"
          : "bg-ghana-red/10 text-ghana-red"
      }`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">{message}</p>
        {isActivation && (
          <p className="opacity-80">
            No charge was made. You can safely retry — your phone won't be billed twice.
          </p>
        )}
        {attempts >= 3 && (
          <p className="opacity-80">
            Still failing after a few tries? Contact support and we'll sort it out.
          </p>
        )}
      </div>
    </div>
  );
}