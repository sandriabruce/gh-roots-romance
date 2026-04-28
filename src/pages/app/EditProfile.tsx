import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import {
  type AppMode,
  promptsForMode,
  interestsForMode,
  isPromptAllowed,
  isInterestAllowed,
} from "@/lib/brand";
import { imageHasFace, type FaceCheckCode } from "@/features/face/detectFace";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, X, AlertTriangle, Loader2, Heart, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

type PromptItem = { q: string; a: string };

type RejectedPhoto = {
  id: string;
  fileName: string;
  previewUrl: string;
  code: FaceCheckCode;
  reason: string;
  tip?: string;
};

export default function EditProfile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [mode, setMode] = useState<AppMode>("romance");
  const [pendingMode, setPendingMode] = useState<AppMode | null>(null);
  const [sparkConsent, setSparkConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rejected, setRejected] = useState<RejectedPhoto[]>([]);
  const [uploadingNames, setUploadingNames] = useState<string[]>([]);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? "");
    setPhotos(Array.isArray(profile.photos) ? (profile.photos as string[]) : []);
    setInterests(Array.isArray(profile.interests) ? (profile.interests as string[]) : []);
    const p = Array.isArray(profile.prompts) ? (profile.prompts as PromptItem[]) : [];
    const m: AppMode = (profile.mode === "spark" ? "spark" : "romance");
    setMode(m);
    setPrompts(p.length ? p : [{ q: promptsForMode(m)[0], a: "" }]);
  }, [profile]);

  const allowedPrompts = promptsForMode(mode);
  const allowedInterests = interestsForMode(mode);
  const blockedInterests = interests.filter((i) => !isInterestAllowed(i, mode));
  const blockedPromptIdxs = prompts
    .map((p, idx) => ({ p, idx }))
    .filter(({ p }) => !isPromptAllowed(p.q, mode))
    .map(({ idx }) => idx);

  async function uploadPhotos(files: File[]) {
    if (!user || files.length === 0) return;
    const remaining = Math.max(0, 6 - photos.length);
    if (remaining === 0) { toast.error("You already have 6 photos. Remove one to add another."); return; }
    const toProcess = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.message(`Only the first ${remaining} photo${remaining === 1 ? "" : "s"} will be processed (6 max).`);
    }

    const newRejections: RejectedPhoto[] = [];
    let acceptedCount = 0;

    for (const file of toProcess) {
      setUploadingNames((arr) => [...arr, file.name]);
      try {
        const check = await imageHasFace(file);
        if (!check.ok) {
          newRejections.push({
            id: `${Date.now()}-${file.name}-${Math.random()}`,
            fileName: file.name,
            previewUrl: URL.createObjectURL(file),
            code: check.code,
            reason: check.reason ?? "This photo couldn't be uploaded.",
            tip: check.tip,
          });
          continue;
        }
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: false });
        if (error) {
          newRejections.push({
            id: `${Date.now()}-${file.name}-${Math.random()}`,
            fileName: file.name,
            previewUrl: URL.createObjectURL(file),
            code: "unreadable",
            reason: error.message,
            tip: "Try again, or use a different file.",
          });
          continue;
        }
        const { data: urlData } = await supabase.storage.from("profile-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
        if (urlData?.signedUrl) {
          setPhotos((arr) => [...arr, urlData.signedUrl]);
          acceptedCount++;
        }
      } finally {
        setUploadingNames((arr) => {
          const idx = arr.indexOf(file.name);
          if (idx === -1) return arr;
          const next = arr.slice();
          next.splice(idx, 1);
          return next;
        });
      }
    }

    if (newRejections.length > 0) {
      setRejected((arr) => [...newRejections, ...arr]);
      const names = newRejections.map((r) => r.fileName).join(", ");
      toast.error(
        newRejections.length === 1
          ? `"${newRejections[0].fileName}" was rejected — see details below.`
          : `${newRejections.length} photos rejected: ${names}. See details below.`
      );
    }
    if (acceptedCount > 0) {
      toast.success(`${acceptedCount} photo${acceptedCount === 1 ? "" : "s"} added.`);
    }
  }

  function dismissRejection(id: string) {
    setRejected((arr) => {
      const target = arr.find((r) => r.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return arr.filter((r) => r.id !== id);
    });
  }

  function clearAllRejections() {
    rejected.forEach((r) => URL.revokeObjectURL(r.previewUrl));
    setRejected([]);
  }

  useEffect(() => {
    return () => { rejected.forEach((r) => URL.revokeObjectURL(r.previewUrl)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function removePhoto(idx: number) {
    setPhotos((arr) => arr.filter((_, i) => i !== idx));
  }

  function toggleInterest(i: string) {
    if (!isInterestAllowed(i, mode)) {
      toast.error(`"${i}" isn't available in ${modeLabel(mode)} mode.`);
      return;
    }
    setInterests((arr) =>
      arr.includes(i) ? arr.filter((x) => x !== i) : arr.length < 8 ? [...arr, i] : arr
    );
  }

  function addPrompt() {
    if (prompts.length >= 3) return;
    const first = allowedPrompts[0];
    if (!first) return;
    setPrompts((p) => [...p, { q: first, a: "" }]);
  }

  function updatePrompt(idx: number, patch: Partial<PromptItem>) {
    if (patch.q && !isPromptAllowed(patch.q, mode)) {
      toast.error(`That prompt isn't available in ${modeLabel(mode)} mode.`);
      return;
    }
    setPrompts((p) => p.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removePrompt(idx: number) {
    setPrompts((p) => p.filter((_, i) => i !== idx));
  }

  async function save() {
    if (!user) return;
    if (firstName.trim().length < 2) {
      toast.error("First name must be at least 2 characters.");
      return;
    }
    if (blockedInterests.length > 0) {
      toast.error(
        `Remove interests not allowed in ${modeLabel(mode)} mode: ${blockedInterests.join(", ")}`
      );
      return;
    }
    if (blockedPromptIdxs.length > 0) {
      toast.error(
        `One or more prompts aren't allowed in ${modeLabel(mode)} mode. Change them before saving.`
      );
      return;
    }
    const validInterests = interests.filter((i) => isInterestAllowed(i, mode));
    if (validInterests.length < 3) {
      toast.error("Pick at least 3 interests.");
      return;
    }
    const cleanPrompts = prompts
      .filter((p) => isPromptAllowed(p.q, mode))
      .map((p) => ({ q: p.q, a: p.a.trim() }))
      .filter((p) => p.a.length > 0);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        mode,
        photos,
        interests: validInterests,
        prompts: cleanPrompts,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success(`Profile updated. You're in the ${modeLabel(mode)} pool.`);
    navigate("/app/profile");
  }

  function requestModeChange(next: AppMode) {
    if (next === mode) return;
    setSparkConsent(false);
    setPendingMode(next);
  }

  function confirmModeChange() {
    if (!pendingMode) return;
    if (pendingMode === "spark" && !sparkConsent) return;
    const next = pendingMode;
    // Strip incompatible items.
    const droppedInterests = interests.filter((i) => !isInterestAllowed(i, next));
    const droppedPrompts = prompts.filter((p) => !isPromptAllowed(p.q, next));
    setInterests((arr) => arr.filter((i) => isInterestAllowed(i, next)));
    setPrompts((arr) => {
      const filtered = arr.filter((p) => isPromptAllowed(p.q, next));
      if (filtered.length === 0) {
        const first = promptsForMode(next)[0];
        return first ? [{ q: first, a: "" }] : [];
      }
      return filtered;
    });
    setMode(next);
    setPendingMode(null);
    const removedCount = droppedInterests.length + droppedPrompts.length;
    toast.success(
      removedCount > 0
        ? `Switched to ${modeLabel(next)}. Removed ${droppedInterests.length} interest${
            droppedInterests.length === 1 ? "" : "s"
          } and ${droppedPrompts.length} prompt${droppedPrompts.length === 1 ? "" : "s"} not allowed in this mode.`
        : `Switched to ${modeLabel(next)} mode.`
    );
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/profile")} className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="heading-gold font-display text-2xl font-bold">Edit profile</h1>
      </div>

      <Card className="rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ghana-gold">Member pool</h2>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Currently: {modeLabel(mode)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your mode controls which members you see and who can match you. Some prompts and interests are reserved for one pool.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: "romance" as const, title: "Romance", desc: "Serious connections.", icon: Heart, ring: "ring-ghana-gold", color: "text-ghana-gold" },
              { id: "spark" as const, title: "Spark (18+)", desc: "Casual adult.", icon: Sparkles, ring: "ring-ghana-red", color: "text-ghana-red" },
            ]
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => requestModeChange(opt.id)}
              className={cn(
                "rounded-2xl border-2 p-3 text-left transition",
                mode === opt.id
                  ? `border-transparent ring-2 ${opt.ring} bg-card`
                  : "border-border bg-background hover:bg-muted/50"
              )}
              aria-pressed={mode === opt.id}
            >
              <div className="flex items-center gap-2">
                <opt.icon className={cn("h-5 w-5", opt.color)} />
                <div>
                  <p className="text-sm font-semibold">{opt.title}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="rounded-2xl p-4 space-y-3">
        <h2 className="font-display text-lg font-bold text-ghana-gold">Name</h2>
        <div>
          <Label htmlFor="first_name">First name</Label>
          <Input
            id="first_name"
            value={firstName}
            maxLength={50}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
      </Card>

      <Card className="rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ghana-gold">Photos</h2>
          <span className="text-xs text-muted-foreground">{photos.length}/6</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Use clear, solo photos of yourself (face visible, no sunglasses, under 8 MB). JPG or PNG work best.
        </p>
        {rejected.length > 0 && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-xl border border-destructive/60 bg-destructive/10 p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-semibold">
                  {rejected.length} photo{rejected.length === 1 ? "" : "s"} couldn't be added
                </p>
              </div>
              <button
                type="button"
                onClick={clearAllRejections}
                className="text-xs text-destructive hover:underline"
              >
                Dismiss all
              </button>
            </div>
            <ul className="space-y-2">
              {rejected.map((r) => (
                <li key={r.id} className="flex items-start gap-3 rounded-lg bg-background/60 p-2">
                  <img
                    src={r.previewUrl}
                    alt=""
                    className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground" title={r.fileName}>
                      {r.fileName}
                    </p>
                    <p className="text-xs text-destructive">{r.reason}</p>
                    {r.tip && <p className="mt-0.5 text-xs text-muted-foreground">{r.tip}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissRejection(r.id)}
                    aria-label={`Dismiss rejection for ${r.fileName}`}
                    className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {uploadingNames.length > 0 && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking {uploadingNames.length} photo{uploadingNames.length === 1 ? "" : "s"}…
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="relative aspect-square rounded-2xl border-2 border-dashed bg-muted overflow-hidden flex items-center justify-center">
              {photos[i] ? (
                <>
                  <img src={photos[i]} alt="" className="h-full w-full object-cover no-snap" onContextMenu={(e) => e.preventDefault()} />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label="Remove photo"
                    className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-xs text-muted-foreground">
                  <Upload className="h-5 w-5 mb-1" />
                  Add
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length) uploadPhotos(files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ghana-gold">Prompts</h2>
          {prompts.length < 3 && (
            <Button variant="outline" size="sm" className="rounded-full" onClick={addPrompt}>Add prompt</Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Showing prompts for <span className="font-medium">{modeLabel(mode)}</span> mode.
        </p>
        <div className="space-y-3">
          {prompts.map((p, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded-xl border p-3 space-y-2",
                blockedPromptIdxs.includes(idx) && "border-destructive/60 bg-destructive/5"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs flex items-center gap-1">
                  Question
                  {blockedPromptIdxs.includes(idx) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
                      <Lock className="h-3 w-3" /> Not allowed in {modeLabel(mode)}
                    </span>
                  )}
                </Label>
                {prompts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrompt(idx)}
                    className="text-xs text-destructive hover:underline"
                    aria-label="Remove prompt"
                  >
                    Remove
                  </button>
                )}
              </div>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={p.q}
                onChange={(e) => updatePrompt(idx, { q: e.target.value })}
              >
                {!isPromptAllowed(p.q, mode) && (
                  <option value={p.q} disabled>
                    {p.q} (not allowed)
                  </option>
                )}
                {allowedPrompts.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
              <textarea
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={p.a}
                maxLength={500}
                onChange={(e) => updatePrompt(idx, { a: e.target.value })}
                placeholder="Your answer…"
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ghana-gold">Interests</h2>
          <span className="text-xs text-muted-foreground">{interests.length}/8 (min 3)</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing interests for <span className="font-medium">{modeLabel(mode)}</span> mode.
        </p>
        {blockedInterests.length > 0 && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/60 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <p className="font-semibold flex items-center gap-1">
              <Lock className="h-3 w-3" /> Remove before saving:
            </p>
            <p className="mt-1">
              {blockedInterests.join(", ")} — not available in {modeLabel(mode)} mode.
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {allowedInterests.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleInterest(i)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition",
                interests.includes(i) ? "bg-ghana-gold text-ghana-brown border-ghana-gold" : "bg-background"
              )}
            >
              {i}
            </button>
          ))}
          {blockedInterests.map((i) => (
            <button
              key={`blocked-${i}`}
              type="button"
              onClick={() => setInterests((arr) => arr.filter((x) => x !== i))}
              className="rounded-full border border-destructive/60 bg-destructive/10 px-3 py-1.5 text-sm text-destructive line-through"
              title={`Click to remove (not allowed in ${modeLabel(mode)} mode)`}
            >
              {i} ✕
            </button>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-2 pb-4">
        <Button variant="outline" className="rounded-full" onClick={() => navigate("/app/profile")} disabled={saving}>Cancel</Button>
        <Button
          className="rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90"
          onClick={save}
          disabled={saving || blockedInterests.length > 0 || blockedPromptIdxs.length > 0}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <AlertDialog open={pendingMode !== null} onOpenChange={(open) => { if (!open) setPendingMode(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {pendingMode ? modeLabel(pendingMode) : ""} mode?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMode === "spark"
                ? "Spark is an adult (18+) pool focused on casual connections. Some Romance prompts and interests will be removed because they aren't allowed here."
                : "You'll move to the Romance pool. Spark-only prompts and interests will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingMode === "spark" && (
            <label className="flex items-start gap-2 rounded-xl border bg-muted p-3 text-sm">
              <Checkbox
                checked={sparkConsent}
                onCheckedChange={(v) => setSparkConsent(v === true)}
              />
              <span>I confirm I am 18 years or older and consent to seeing adult-oriented content.</span>
            </label>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                if (pendingMode === "spark" && !sparkConsent) {
                  e.preventDefault();
                  toast.error("Please confirm you are 18+ to switch to Spark.");
                  return;
                }
                confirmModeChange();
              }}
            >
              Confirm switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function modeLabel(m: AppMode) {
  return m === "spark" ? "Spark" : "Romance";
}
