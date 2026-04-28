import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { INTERESTS, PROMPTS } from "@/lib/brand";
import { imageHasFace } from "@/features/face/detectFace";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PromptItem = { q: string; a: string };

export default function EditProfile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? "");
    setPhotos(Array.isArray(profile.photos) ? (profile.photos as string[]) : []);
    setInterests(Array.isArray(profile.interests) ? (profile.interests as string[]) : []);
    const p = Array.isArray(profile.prompts) ? (profile.prompts as PromptItem[]) : [];
    setPrompts(p.length ? p : [{ q: PROMPTS[0], a: "" }]);
  }, [profile]);

  async function uploadPhoto(file: File) {
    if (!user) return;
    if (photos.length >= 6) { toast.error("You can have up to 6 photos."); return; }
    const check = await imageHasFace(file);
    if (!check.ok) { toast.error(check.reason!); return; }
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return; }
    const { data: urlData } = await supabase.storage.from("profile-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (urlData?.signedUrl) setPhotos((arr) => [...arr, urlData.signedUrl]);
  }

  function removePhoto(idx: number) {
    setPhotos((arr) => arr.filter((_, i) => i !== idx));
  }

  function toggleInterest(i: string) {
    setInterests((arr) =>
      arr.includes(i) ? arr.filter((x) => x !== i) : arr.length < 8 ? [...arr, i] : arr
    );
  }

  function addPrompt() {
    if (prompts.length >= 3) return;
    setPrompts((p) => [...p, { q: PROMPTS[0], a: "" }]);
  }

  function updatePrompt(idx: number, patch: Partial<PromptItem>) {
    setPrompts((p) => p.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removePrompt(idx: number) {
    setPrompts((p) => p.filter((_, i) => i !== idx));
  }

  async function save() {
    if (!user) return;
    if (firstName.trim().length < 2) { toast.error("First name must be at least 2 characters."); return; }
    if (interests.length < 3) { toast.error("Pick at least 3 interests."); return; }
    const cleanPrompts = prompts
      .map((p) => ({ q: p.q, a: p.a.trim() }))
      .filter((p) => p.a.length > 0);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        photos,
        interests,
        prompts: cleanPrompts,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Profile updated.");
    navigate("/app/profile");
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
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }}
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
        <div className="space-y-3">
          {prompts.map((p, idx) => (
            <div key={idx} className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Question</Label>
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
                {PROMPTS.map((q) => <option key={q} value={q}>{q}</option>)}
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
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
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
        </div>
      </Card>

      <div className="flex justify-end gap-2 pb-4">
        <Button variant="outline" className="rounded-full" onClick={() => navigate("/app/profile")} disabled={saving}>Cancel</Button>
        <Button
          className="rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
