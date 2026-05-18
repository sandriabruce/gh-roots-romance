import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/brand/Logo";
import { toast } from "sonner";

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase parses the recovery hash and emits PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also check existing session in case event already fired
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().min(8, "Use at least 8 characters").max(72).safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate("/app/discover", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-6">
          <Logo size="lg" />
        </Link>
        <Card className="rounded-3xl border-2 p-6 shadow-warm">
          <h2 className="heading-gold font-display text-2xl font-bold">Set a new password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready
              ? "Choose a strong password you'll remember."
              : "Validating your reset link…"}
          </p>
          {ready && (
            <form onSubmit={submit} className="mt-5 space-y-3">
              <div>
                <Label htmlFor="np">New password</Label>
                <Input id="np" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
              </div>
              <div>
                <Label htmlFor="cp">Confirm password</Label>
                <Input id="cp" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90 rounded-full h-11">
                {busy ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
          <Link to="/auth" className="mt-4 block text-center text-sm text-ghana-gold hover:underline">
            Back to sign in
          </Link>
        </Card>
      </div>
    </div>
  );
}
