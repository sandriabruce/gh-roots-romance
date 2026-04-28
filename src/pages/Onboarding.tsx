import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/brand/Logo";
import { ALL_LOCATIONS, INTERESTS, PROMPTS, RELIGIONS, ETHNICITIES } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { imageHasFace } from "@/features/face/detectFace";
import { Heart, Sparkles, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any>({
    mode: "romance", consent18: false,
    age: 45, gender: "", interested_in: "",
    first_name: "", location: "",
    photos: [] as string[],
    promptIndex: 0, promptAnswer: "",
    religion: "", ethnicity: "", values_text: "",
    interests: [] as string[],
    notifications_enabled: true, privacy_strict: false,
  });
  const totalSteps = 8;
  const next = () => setStep((s) => Math.min(totalSteps, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  async function uploadPhoto(file: File) {
    if (!user) return;
    const check = await imageHasFace(file);
    if (!check.ok) { toast.error(check.reason!); return; }
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return; }
    const { data: urlData } = await supabase.storage.from("profile-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (urlData?.signedUrl) setData((d: any) => ({ ...d, photos: [...d.photos, urlData.signedUrl] }));
  }

  async function finish() {
    if (!user) return;
    const payload = {
      first_name: data.first_name || null,
      age: data.age,
      gender: data.gender || null,
      interested_in: data.interested_in || null,
      location: data.location || null,
      ethnicity: data.ethnicity || null,
      religion: data.religion || null,
      values_text: data.values_text || null,
      mode: data.mode,
      photos: data.photos,
      interests: data.interests,
      prompts: [{ q: PROMPTS[data.promptIndex], a: data.promptAnswer }],
      notifications_enabled: data.notifications_enabled,
      privacy_strict: data.privacy_strict,
      onboarded: true,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile ready! Welcome to GH SUƆMƆ.");
    navigate("/app/discover");
  }

  const toggleInterest = (i: string) =>
    setData((d: any) => ({ ...d, interests: d.interests.includes(i) ? d.interests.filter((x: string) => x !== i) : d.interests.length < 8 ? [...d.interests, i] : d.interests }));

  const sparkBlocked = data.mode === "spark" && !data.consent18;
  const canAdvance = (() => {
    if (step === 1) return !sparkBlocked;
    if (step === 2) return data.age >= 40 && data.gender && data.interested_in;
    if (step === 3) return data.first_name.length >= 2 && data.location;
    if (step === 4) return data.photos.length >= 1;
    if (step === 5) return data.promptAnswer.trim().length > 5;
    if (step === 6) return data.mode === "romance" ? data.religion && data.values_text : data.values_text;
    if (step === 7) return data.interests.length >= 3;
    return true;
  })();

  return (
    <div className="min-h-screen bg-gradient-warm px-4 py-6">
      <div className="mx-auto max-w-xl">
        <Logo size="sm" className="mb-4" />
        <Progress value={(step / totalSteps) * 100} className="h-2" />
        <p className="mt-2 text-xs text-muted-foreground">Step {step} of {totalSteps}</p>

        <Card className="mt-4 rounded-3xl p-6 shadow-card">
          {step === 1 && (
            <>
              <h2 className="font-display text-2xl font-bold">Choose your path</h2>
              <p className="text-sm text-muted-foreground mt-1">You can switch later in your profile.</p>
              <div className="mt-4 grid gap-3">
                {[
                  { id: "romance", title: "Romance", desc: "Serious relationships, marriage, lasting connection.", icon: Heart, ring: "ring-ghana-gold" },
                  { id: "spark", title: "Spark (18+)", desc: "Casual adult connections with grown matches.", icon: Sparkles, ring: "ring-ghana-red" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setData((d: any) => ({ ...d, mode: opt.id }))}
                    className={cn("rounded-2xl border-2 p-4 text-left transition", data.mode === opt.id ? `border-transparent ring-2 ${opt.ring} bg-card` : "border-border bg-background")}
                  >
                    <div className="flex items-center gap-3">
                      <opt.icon className={cn("h-6 w-6", opt.id === "romance" ? "text-ghana-gold" : "text-ghana-red")} />
                      <div>
                        <p className="font-semibold">{opt.title}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
                {data.mode === "spark" && (
                  <label className="flex items-start gap-2 rounded-xl border bg-muted p-3 text-sm">
                    <Checkbox checked={data.consent18} onCheckedChange={(v) => setData((d: any) => ({ ...d, consent18: v === true }))} />
                    <span>I confirm I am 18 years or older and consent to seeing adult-oriented content.</span>
                  </label>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-2xl font-bold">About you</h2>
              <div className="mt-4 grid gap-3">
                <div>
                  <Label>Age</Label>
                  <Input type="number" min={40} value={data.age} onChange={(e) => setData((d: any) => ({ ...d, age: parseInt(e.target.value || "40") }))} />
                  <p className="text-xs text-muted-foreground mt-1">GH SUƆMƆ is for members 40+.</p>
                </div>
                <div>
                  <Label>I am</Label>
                  <div className="flex gap-2 mt-1">
                    {["Woman", "Man", "Non-binary"].map((g) => (
                      <button key={g} onClick={() => setData((d: any) => ({ ...d, gender: g }))} className={cn("rounded-full border px-4 py-1.5 text-sm", data.gender === g ? "bg-ghana-gold text-ghana-brown border-ghana-gold" : "")}>{g}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Interested in</Label>
                  <div className="flex gap-2 mt-1">
                    {["Women", "Men", "Everyone"].map((g) => (
                      <button key={g} onClick={() => setData((d: any) => ({ ...d, interested_in: g }))} className={cn("rounded-full border px-4 py-1.5 text-sm", data.interested_in === g ? "bg-ghana-gold text-ghana-brown border-ghana-gold" : "")}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display text-2xl font-bold">Your name & home</h2>
              <div className="mt-4 grid gap-3">
                <div><Label>First name</Label><Input value={data.first_name} onChange={(e) => setData((d: any) => ({ ...d, first_name: e.target.value }))} /></div>
                <div>
                  <Label>Where you live</Label>
                  <select className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={data.location} onChange={(e) => setData((d: any) => ({ ...d, location: e.target.value }))}>
                    <option value="">Select a location…</option>
                    {ALL_LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-display text-2xl font-bold">Your photos</h2>
              <p className="text-sm text-muted-foreground mt-1">Add up to 6 photos. We use face detection to keep things real.</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl border-2 border-dashed bg-muted overflow-hidden flex items-center justify-center">
                    {data.photos[i] ? (
                      <img src={data.photos[i]} alt="" className="h-full w-full object-cover no-snap" onContextMenu={(e) => e.preventDefault()} />
                    ) : (
                      <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-xs text-muted-foreground">
                        <Upload className="h-5 w-5 mb-1" />
                        Add
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="font-display text-2xl font-bold">A prompt about you</h2>
              <select className="mt-3 w-full rounded-md border bg-background px-3 py-2" value={data.promptIndex} onChange={(e) => setData((d: any) => ({ ...d, promptIndex: parseInt(e.target.value) }))}>
                {PROMPTS.map((p, i) => <option key={i} value={i}>{p}</option>)}
              </select>
              <textarea className="mt-3 min-h-32 w-full rounded-md border bg-background px-3 py-2" value={data.promptAnswer} onChange={(e) => setData((d: any) => ({ ...d, promptAnswer: e.target.value }))} placeholder="Write your answer…" />
            </>
          )}

          {step === 6 && (
            <>
              <h2 className="font-display text-2xl font-bold">{data.mode === "romance" ? "Faith & values" : "Discretion preferences"}</h2>
              <div className="mt-4 grid gap-3">
                {data.mode === "romance" && (
                  <>
                    <div>
                      <Label>Religion</Label>
                      <select className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={data.religion} onChange={(e) => setData((d: any) => ({ ...d, religion: e.target.value }))}>
                        <option value="">Select…</option>
                        {RELIGIONS.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Ethnicity (optional)</Label>
                      <select className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={data.ethnicity} onChange={(e) => setData((d: any) => ({ ...d, ethnicity: e.target.value }))}>
                        <option value="">Prefer not to say</option>
                        {ETHNICITIES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <Label>{data.mode === "romance" ? "What you value most" : "How discreet do you need to be?"}</Label>
                  <Input value={data.values_text} onChange={(e) => setData((d: any) => ({ ...d, values_text: e.target.value }))} placeholder={data.mode === "romance" ? "e.g. honesty, family, faith" : "e.g. very private, no public photos"} />
                </div>
              </div>
            </>
          )}

          {step === 7 && (
            <>
              <h2 className="font-display text-2xl font-bold">Pick at least 3 interests</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <button key={i} onClick={() => toggleInterest(i)} className={cn("rounded-full border px-3 py-1.5 text-sm", data.interests.includes(i) ? "bg-ghana-gold text-ghana-brown border-ghana-gold" : "")}>{i}</button>
                ))}
              </div>
            </>
          )}

          {step === 8 && (
            <>
              <h2 className="font-display text-2xl font-bold">Notifications & privacy</h2>
              <div className="mt-4 space-y-3">
                <label className="flex items-start gap-2"><Checkbox checked={data.notifications_enabled} onCheckedChange={(v) => setData((d: any) => ({ ...d, notifications_enabled: v === true }))} /><span className="text-sm">Email me about new matches and messages.</span></label>
                <label className="flex items-start gap-2"><Checkbox checked={data.privacy_strict} onCheckedChange={(v) => setData((d: any) => ({ ...d, privacy_strict: v === true }))} /><span className="text-sm">Strict privacy — only show me to verified members.</span></label>
              </div>
            </>
          )}

          <div className="mt-6 flex justify-between gap-2">
            <Button variant="outline" onClick={back} disabled={step === 1} className="rounded-full">Back</Button>
            {step < totalSteps ? (
              <Button onClick={next} disabled={!canAdvance} className="rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">Continue</Button>
            ) : (
              <Button onClick={finish} className="rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">Finish</Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}