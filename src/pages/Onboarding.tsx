import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/brand/Logo";
import { GHANA_CITIES, RELIGIONS, ETHNICITIES, INTERESTS, PROMPTS } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { imageHasFace } from "@/features/face/detectFace";
import { Upload, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  "Ghana", "United Kingdom", "United States", "Canada",
  "Germany", "Netherlands", "Italy", "France", "South Africa",
  "Nigeria", "Other",
];

const GENDERS = ["Woman", "Man", "Non-binary"];
const INTERESTED_IN = ["Women", "Men", "Everyone"];
const HAS_CHILDREN = ["No children", "Have children, living with me", "Have children, grown / not at home", "Prefer not to say"];
const RELATIONSHIP_TYPES = [
  "Marriage",
  "Long-term relationship",
  "Companionship",
  "Dating, see what happens",
  "Friendship first",
];

type StepId =
  | "welcome" | "first_name" | "dob" | "gender" | "interested_in"
  | "country" | "city" | "ethnicity" | "religion" | "has_children"
  | "relationship_type" | "bio" | "photo" | "interests" | "prompt" | "review";

interface FormState {
  first_name: string;
  date_of_birth: string; // yyyy-mm-dd
  gender: string;
  interested_in: string;
  country: string;
  city: string;
  ethnicity: string;
  religion: string;
  has_children: string;
  relationship_type: string;
  bio: string;
  photo: string; // signed URL
  interests: string[];
  prompt_q: string;
  prompt_a: string;
}

const initialForm: FormState = {
  first_name: "", date_of_birth: "", gender: "", interested_in: "",
  country: "", city: "", ethnicity: "", religion: "", has_children: "",
  relationship_type: "", bio: "", photo: "",
  interests: [], prompt_q: "", prompt_a: "",
};

function calcAge(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [stepIndex, setStepIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const steps: StepId[] = useMemo(() => [
    "welcome", "first_name", "dob", "gender", "interested_in",
    "country", "city", "ethnicity", "religion", "has_children",
    "relationship_type", "bio", "photo", "interests", "prompt", "review",
  ], []);
  const step = steps[stepIndex];
  const total = steps.length - 1; // exclude welcome from progress denominator visually
  const progress = Math.max(0, Math.min(100, (stepIndex / (steps.length - 1)) * 100));

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const age = calcAge(form.date_of_birth);

  const canContinue = (() => {
    switch (step) {
      case "welcome": return true;
      case "first_name": return form.first_name.trim().length >= 2;
      case "dob": return age !== null && age >= 40 && age <= 110;
      case "gender": return !!form.gender;
      case "interested_in": return !!form.interested_in;
      case "country": return !!form.country;
      case "city": return form.city.trim().length >= 2;
      case "ethnicity": return !!form.ethnicity;
      case "religion": return !!form.religion;
      case "has_children": return !!form.has_children;
      case "relationship_type": return !!form.relationship_type;
      case "bio": return form.bio.trim().length >= 20;
      case "photo": return !!form.photo;
      case "interests": return form.interests.length >= 3;
      case "prompt": return !!form.prompt_q && form.prompt_a.trim().length >= 5;
      case "review": return true;
    }
  })();

  async function uploadPhoto(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const check = await imageHasFace(file);
      if (!check.ok) {
        toast.error(`Photo rejected: ${check.reason}`, { description: check.tip });
        return;
      }
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: false });
      if (error) { toast.error(error.message); return; }
      const { data: urlData } = await supabase.storage
        .from("profile-photos")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (urlData?.signedUrl) update("photo", urlData.signedUrl);
    } finally {
      setUploading(false);
    }
  }

  async function finish() {
    if (!user) return;
    setSubmitting(true);
    const payload = {
      first_name: form.first_name.trim(),
      date_of_birth: form.date_of_birth,
      age,
      gender: form.gender,
      interested_in: form.interested_in,
      country: form.country,
      city: form.city.trim(),
      location: form.city.trim(),
      ethnicity: form.ethnicity,
      religion: form.religion,
      has_children: form.has_children,
      relationship_type: form.relationship_type,
      bio: form.bio.trim(),
      values_text: form.bio.trim(),
      photos: [form.photo],
      interests: form.interests,
      prompts: [{ q: form.prompt_q, a: form.prompt_a.trim() }],
      onboarded: true,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome to GH SUƆMƆ — your profile is live.");
    navigate("/app/discover");
  }

  const next = () => setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  const back = () => setStepIndex((i) => Math.max(0, i - 1));

  return (
    <div className="min-h-screen bg-gradient-warm px-4 py-6">
      <div className="mx-auto max-w-xl">
        <Logo size="sm" className="mb-4" />
        {step !== "welcome" && (
          <>
            <Progress value={progress} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Step {stepIndex} of {total}
            </p>
          </>
        )}

        <Card className="mt-4 rounded-3xl p-6 shadow-card min-h-[420px] flex flex-col">
          <div className="flex-1">
            {step === "welcome" && (
              <div className="text-center py-6">
                <h2 className="heading-gold font-display text-3xl font-bold">Akwaaba 👋</h2>
                <p className="mt-3 text-base text-muted-foreground">
                  Let's set up your profile. It takes about 3 minutes — one question at a time, just like a friendly chat.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  GH SUƆMƆ is for grown people 40+. Take your time.
                </p>
              </div>
            )}

            {step === "first_name" && (
              <Question title="What's your first name?" hint="This is how you'll appear to matches.">
                <Input
                  autoFocus value={form.first_name} maxLength={50}
                  placeholder="e.g. Ama"
                  onChange={(e) => update("first_name", e.target.value)}
                />
              </Question>
            )}

            {step === "dob" && (
              <Question title="When's your birthday?" hint="We use this to confirm you're 40+. We'll only show your age, never your full date of birth.">
                <Input
                  type="date" value={form.date_of_birth}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => update("date_of_birth", e.target.value)}
                />
                {age !== null && age < 40 && (
                  <p className="mt-2 text-xs text-destructive">GH SUƆMƆ is for members 40 and older.</p>
                )}
                {age !== null && age >= 40 && (
                  <p className="mt-2 text-xs text-muted-foreground">You're {age} — perfect.</p>
                )}
              </Question>
            )}

            {step === "gender" && (
              <Question title="How do you identify?">
                <Choices options={GENDERS} value={form.gender} onChange={(v) => update("gender", v)} />
              </Question>
            )}

            {step === "interested_in" && (
              <Question title="Who are you interested in meeting?">
                <Choices options={INTERESTED_IN} value={form.interested_in} onChange={(v) => update("interested_in", v)} />
              </Question>
            )}

            {step === "country" && (
              <Question title="Which country do you live in?" hint="At home in Ghana or across the diaspora — both are welcome.">
                <Choices options={COUNTRIES} value={form.country} onChange={(v) => update("country", v)} />
              </Question>
            )}

            {step === "city" && (
              <Question title="Which city or town?" hint={form.country === "Ghana" ? "Pick the one closest to you." : "Type the name of your city."}>
                {form.country === "Ghana" ? (
                  <Choices options={GHANA_CITIES} value={form.city} onChange={(v) => update("city", v)} />
                ) : (
                  <Input
                    autoFocus value={form.city} maxLength={80}
                    placeholder="e.g. London"
                    onChange={(e) => update("city", e.target.value)}
                  />
                )}
              </Question>
            )}

            {step === "ethnicity" && (
              <Question title="What's your heritage?" hint="Optional — helps with cultural matching.">
                <Choices options={[...ETHNICITIES, "Prefer not to say"]} value={form.ethnicity} onChange={(v) => update("ethnicity", v)} />
              </Question>
            )}

            {step === "religion" && (
              <Question title="What's your faith?">
                <Choices options={RELIGIONS} value={form.religion} onChange={(v) => update("religion", v)} />
              </Question>
            )}

            {step === "has_children" && (
              <Question title="Do you have children?">
                <Choices options={HAS_CHILDREN} value={form.has_children} onChange={(v) => update("has_children", v)} />
              </Question>
            )}

            {step === "relationship_type" && (
              <Question title="What kind of relationship are you looking for?">
                <Choices options={RELATIONSHIP_TYPES} value={form.relationship_type} onChange={(v) => update("relationship_type", v)} />
              </Question>
            )}

            {step === "bio" && (
              <Question title="Tell us a little about yourself" hint="A few warm sentences. What matters to you, what makes you smile? (At least 20 characters)">
                <textarea
                  className="mt-1 min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.bio} maxLength={600}
                  placeholder="I'm a calm, family-oriented person who loves Sunday afternoons with good food and good company…"
                  onChange={(e) => update("bio", e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground text-right">{form.bio.length}/600</p>
              </Question>
            )}

            {step === "photo" && (
              <Question title="Add a clear photo of you" hint="Solo, face visible, no sunglasses. We use face detection to keep things real.">
                <div className="mt-2 flex flex-col items-center gap-3">
                  <div className="aspect-square w-48 rounded-2xl border-2 border-dashed bg-muted overflow-hidden flex items-center justify-center">
                    {form.photo ? (
                      <img src={form.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-xs text-muted-foreground">
                        <Upload className="h-6 w-6 mb-1" />
                        {uploading ? "Checking…" : "Tap to upload"}
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
                      </label>
                    )}
                  </div>
                  {form.photo && (
                    <Button variant="outline" size="sm" className="rounded-full"
                      onClick={() => update("photo", "")}>Replace photo</Button>
                  )}
                </div>
              </Question>
            )}

            {step === "review" && (
              <div>
                <h2 className="heading-gold font-display text-2xl font-bold">Looks good?</h2>
                <p className="text-sm text-muted-foreground mt-1">Review your details. You can edit them anytime from your profile.</p>
                <dl className="mt-4 grid grid-cols-1 gap-2 text-sm">
                  <Row label="Name" value={form.first_name} />
                  <Row label="Age" value={age != null ? `${age}` : ""} />
                  <Row label="Gender" value={form.gender} />
                  <Row label="Interested in" value={form.interested_in} />
                  <Row label="Lives in" value={`${form.city}, ${form.country}`} />
                  <Row label="Heritage" value={form.ethnicity} />
                  <Row label="Faith" value={form.religion} />
                  <Row label="Children" value={form.has_children} />
                  <Row label="Looking for" value={form.relationship_type} />
                  <Row label="About" value={form.bio} multiline />
                </dl>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between gap-2">
            <Button variant="outline" onClick={back} disabled={stepIndex === 0} className="rounded-full">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step !== "review" ? (
              <Button onClick={next} disabled={!canContinue}
                className="rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">
                {step === "welcome" ? "Let's begin" : "Continue"} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={submitting}
                className="rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">
                <Check className="h-4 w-4 mr-1" /> {submitting ? "Saving…" : "Finish & meet people"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Question({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="heading-gold font-display text-2xl font-bold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Choices({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={cn(
            "rounded-2xl border-2 px-4 py-3 text-left text-sm transition",
            value === o
              ? "border-transparent ring-2 ring-ghana-gold bg-card font-medium"
              : "border-border bg-background hover:bg-muted/50"
          )}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex gap-3 border-b border-border/50 pb-2">
      <dt className="w-28 flex-shrink-0 text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn("flex-1 text-foreground", multiline ? "whitespace-pre-wrap" : "")}>
        {value || <span className="text-muted-foreground italic">—</span>}
      </dd>
    </div>
  );
}
