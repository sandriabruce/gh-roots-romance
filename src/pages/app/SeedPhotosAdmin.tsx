import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2, Upload, ImagePlus, Search } from "lucide-react";

type SeedRow = {
  id: string;
  first_name: string | null;
  age: number | null;
  gender: string | null;
  location: string | null;
  photos: unknown;
};

const MAX_PHOTOS = 6;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per file

export default function SeedPhotosAdmin() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<SeedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SeedRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadList(term = "") {
    if (!isAdmin) return;
    setLoading(true);
    let q = supabase
      .from("profiles")
      .select("id, first_name, age, gender, location, photos")
      .eq("is_seed", true)
      .order("first_name", { ascending: true })
      .limit(200);
    if (term.trim()) {
      q = q.or(`first_name.ilike.%${term}%,location.ilike.%${term}%,id.eq.${term}`);
    }
    const { data, error } = await q;
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as SeedRow[]);
  }

  useEffect(() => { loadList(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [isAdmin]);

  async function refreshSelected(id: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, age, gender, location, photos")
      .eq("id", id)
      .maybeSingle();
    if (data) {
      setSelected(data as SeedRow);
      setRows((rs) => rs.map((r) => (r.id === id ? (data as SeedRow) : r)));
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!selected || !files || files.length === 0) return;
    const current = Array.isArray(selected.photos) ? (selected.photos as string[]) : [];
    const room = MAX_PHOTOS - current.length;
    if (room <= 0) { toast.error(`Already at ${MAX_PHOTOS} photos. Remove one first.`); return; }
    const list = Array.from(files).slice(0, room);
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of list) {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name}: not an image`); continue; }
      if (file.size > MAX_BYTES) { toast.error(`${file.name}: over 5 MB`); continue; }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${selected.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) { toast.error(`${file.name}: ${error.message}`); continue; }
      const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
      uploaded.push(pub.publicUrl);
    }
    if (uploaded.length > 0) {
      const next = [...current, ...uploaded];
      const { error } = await supabase.from("profiles").update({ photos: next }).eq("id", selected.id);
      if (error) toast.error(`Saved photos but DB update failed: ${error.message}`);
      else toast.success(`Added ${uploaded.length} photo(s)`);
      await refreshSelected(selected.id);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function removePhoto(url: string) {
    if (!selected) return;
    const current = Array.isArray(selected.photos) ? (selected.photos as string[]) : [];
    const next = current.filter((u) => u !== url);
    // Best-effort storage cleanup: derive object path from public URL
    const marker = "/profile-photos/";
    const idx = url.indexOf(marker);
    if (idx >= 0) {
      const objectPath = url.slice(idx + marker.length);
      await supabase.storage.from("profile-photos").remove([objectPath]);
    }
    const { error } = await supabase.from("profiles").update({ photos: next }).eq("id", selected.id);
    if (error) toast.error(error.message);
    else toast.success("Photo removed");
    await refreshSelected(selected.id);
  }

  const photos = selected && Array.isArray(selected.photos) ? (selected.photos as string[]) : [];

  return (
    <div className="space-y-4">
      <h1 className="heading-gold font-display text-2xl font-bold">Seed photos</h1>
      <p className="text-sm text-muted-foreground">
        Upload real photos to seed/demo profiles. Max {MAX_PHOTOS} photos per profile, 5 MB each.
      </p>

      <Card className="rounded-2xl p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") loadList(search); }}
            placeholder="Search by first name, location, or paste a profile id"
          />
          <Button onClick={() => loadList(search)} disabled={loading} className="rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">
            <Search className="h-4 w-4 mr-1" /> {loading ? "Searching…" : "Search"}
          </Button>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y rounded-xl border">
          {rows.map((r) => {
            const count = Array.isArray(r.photos) ? (r.photos as unknown[]).length : 0;
            const isSel = selected?.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-muted ${isSel ? "bg-muted" : ""}`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-ghana-brown truncate">
                    {r.first_name ?? "—"}{r.age ? `, ${r.age}` : ""} · <span className="text-muted-foreground">{r.gender ?? "—"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{r.location ?? "—"} · <span className="font-mono">{r.id.slice(0, 8)}…</span></div>
                </div>
                <Badge variant={count > 0 ? "default" : "outline"} className={count > 0 ? "bg-ghana-green text-white" : "border-ghana-red text-ghana-red"}>
                  {count}/{MAX_PHOTOS}
                </Badge>
              </button>
            );
          })}
          {!loading && rows.length === 0 && (
            <div className="p-3 text-xs text-muted-foreground">No seed profiles found.</div>
          )}
        </div>
      </Card>

      {selected && (
        <Card className="rounded-2xl p-4 space-y-3 border-ghana-gold/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-display text-lg font-bold text-ghana-brown">
                {selected.first_name ?? "—"}{selected.age ? `, ${selected.age}` : ""}
              </div>
              <div className="text-xs text-muted-foreground">{selected.location ?? "—"} · <span className="font-mono">{selected.id}</span></div>
            </div>
            <Badge className="bg-ghana-gold text-ghana-brown">{photos.length}/{MAX_PHOTOS}</Badge>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Add photos</Label>
            <div className="mt-1 flex gap-2 items-center">
              <Input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleUpload(e.target.files)}
                disabled={uploading || photos.length >= MAX_PHOTOS}
              />
              {uploading && <span className="text-xs text-muted-foreground"><Upload className="h-3 w-3 inline mr-1" />Uploading…</span>}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Pick up to {MAX_PHOTOS - photos.length} image(s). JPG/PNG/WebP, max 5 MB each.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {photos.map((url) => (
              <div key={url} className="relative group rounded-xl overflow-hidden border bg-muted aspect-square">
                <img src={url} alt="" className="h-full w-full object-cover object-center" />
                <button
                  onClick={() => removePhoto(url)}
                  className="absolute top-1 right-1 rounded-full bg-ghana-red text-white p-1 opacity-90 hover:opacity-100"
                  title="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {photos.length === 0 && (
              <div className="col-span-3 rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                <ImagePlus className="h-5 w-5 mx-auto mb-1" /> No photos yet — upload above.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}