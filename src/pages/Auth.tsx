import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
  first_name: z.string().trim().min(2).max(60).optional(),
});

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, first_name: mode === "signup" ? firstName : undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app/discover`,
            data: { first_name: firstName },
          },
        });
        if (error) throw error;
        toast.success("Welcome! Check your inbox to confirm your email.");
        navigate("/onboarding");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/app/discover");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
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
          <h2 className="font-display text-2xl font-bold text-ghana-brown">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? "Built for Ghanaians 40+ ready for something real." : "Good to see you again."}
          </p>
          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === "signup" && (
              <div>
                <Label htmlFor="fn">First name</Label>
                <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ama" required />
              </div>
            )}
            <div>
              <Label htmlFor="em">Email</Label>
              <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90 rounded-full h-11">
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-4 w-full text-sm text-ghana-green underline-offset-4 hover:underline"
          >
            {mode === "signup" ? "Already a member? Sign in" : "New here? Create an account"}
          </button>
        </Card>
      </div>
    </div>
  );
}