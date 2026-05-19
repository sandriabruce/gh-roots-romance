import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, X, MessageCircle, BadgeCheck, ShieldAlert, Flag, Ban } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { CoupleCard, SAMPLE_COUPLES } from "@/components/brand/CoupleCard";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TrialBadge } from "@/components/plan/TrialBadge";
import { PlanLockOverlay } from "@/components/plan/PlanLockOverlay";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Candidate = {
  id: string;
  first_name: string | null;
  age: number | null;
  location: string | null;
  bio: string | null;
  photos: string[];
  interests: string[];
  ethnicity: string | null;
  verified: boolean;
};

export default function Discover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { limits, plan, trial } = useEntitlements();
  const [i, setI] = useState(0);
  const [likes, setLikes] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("blocked-user-ids");
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch { return new Set(); }
  });
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDetail, setReportDetail] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [confirmBlockFor, setConfirmBlockFor] = useState<string | null>(null);
  const [galleryApi, setGalleryApi] = useState<CarouselApi | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Track active slide to render dot indicators.
  useEffect(() => {
    if (!galleryApi) return;
    const onSelect = () => setGalleryIndex(galleryApi.selectedScrollSnap());
    onSelect();
    galleryApi.on("select", onSelect);
    galleryApi.on("reInit", onSelect);
    return () => { galleryApi.off("select", onSelect); };
  }, [galleryApi]);

  // Reset to first photo whenever a new profile opens.
  useEffect(() => {
    setGalleryIndex(0);
    galleryApi?.scrollTo(0, true);
  }, [openId, galleryApi]);
  const mode = profile?.mode ?? "romance";
  const accent = mode === "spark" ? "bg-gradient-spark" : "bg-gradient-romance";
  const limit = limits.weeklyMatchLimit;
  const limitReached = limit !== null && likes >= limit;

  // Map viewer's interested_in to which seed gender(s) to show.
  const targetGenders = useMemo<string[]>(() => {
    const want = profile?.interested_in;
    if (want === "Men") return ["Man"];
    if (want === "Women") return ["Woman"];
    if (want === "Everyone") return ["Man", "Woman"];
    return ["Man", "Woman"];
  }, [profile?.interested_in]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, age, location, bio, photos, interests, ethnicity, verified")
        .eq("is_seed", true)
        .eq("banned", false)
        .in("gender", targetGenders)
        .limit(100);
      if (cancelled) return;
      if (error || !data) {
        setCandidates([]);
      } else {
        const mapped: Candidate[] = data.map((row) => ({
          id: row.id as string,
          first_name: row.first_name as string | null,
          age: row.age as number | null,
          location: row.location as string | null,
          bio: row.bio as string | null,
          photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
          interests: Array.isArray(row.interests) ? (row.interests as string[]) : [],
          ethnicity: (row.ethnicity as string | null) ?? null,
          verified: !!row.verified,
        }));
        // Filter out blocked users.
        const visible = mapped.filter((c) => !blockedIds.has(c.id));
        // Light shuffle so the deck feels fresh on every visit.
        for (let j = visible.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [visible[j], visible[k]] = [visible[k], visible[j]];
        }
        setCandidates(visible);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [targetGenders, blockedIds]);

  const person = candidates.length > 0 ? candidates[i % candidates.length] : null;
  const cover = person?.photos?.[0];
  const openPerson = candidates.find((c) => c.id === openId) ?? null;

  // Fetch the existing match (if any) with the open profile to surface status.
  const { data: openMatch } = useQuery({
    queryKey: ["match-with", user?.id, openId],
    enabled: !!user && !!openId,
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id,status,user_a,user_b")
        .or(`and(user_a.eq.${user!.id},user_b.eq.${openId!}),and(user_a.eq.${openId!},user_b.eq.${user!.id})`)
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
  });

  // Derive a richer status so the sheet shows what the other side has done.
  // - matched:       both sides connected (match is active)
  // - liked_you:     they liked you first, waiting on your response
  // - liked_by_you:  you liked them, waiting on a reply
  // - none:          no interaction yet
  const matchStatus: "matched" | "liked_you" | "liked_by_you" | "none" = openPerson
    ? openMatch?.status === "active"
      ? "matched"
      : openMatch && user
        ? openMatch.user_a === user.id
          ? "liked_by_you"
          : "liked_you"
        : likedIds.has(openPerson.id)
          ? "liked_by_you"
          : "none"
    : "none";

  const handleLike = () => {
    if (limitReached) return;
    if (person) setLikedIds((s) => new Set(s).add(person.id));
    setLikes((n) => n + 1);
    setI((x) => x + 1);
  };

  const handleLikeFromSheet = (id: string) => {
    if (limitReached) return;
    setLikedIds((s) => new Set(s).add(id));
    setLikes((n) => n + 1);
    setI((x) => x + 1);
  };

  async function openChatWith(otherId: string) {
    if (!user) return;
    setOpeningChat(true);
    try {
      // Look for an existing match between the two users.
      const { data: existing } = await supabase
        .from("matches")
        .select("id,user_a,user_b")
        .or(`and(user_a.eq.${user.id},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${user.id})`)
        .limit(1);
      let matchId = existing?.[0]?.id;
      if (!matchId) {
        const { data: created, error } = await supabase
          .from("matches")
          .insert({ user_a: user.id, user_b: otherId, status: "active", score: 80 })
          .select("id")
          .single();
        if (error) { toast.error(error.message); return; }
        matchId = created.id;
      }
      setOpenId(null);
      navigate(`/app/chat/${matchId}`);
    } finally {
      setOpeningChat(false);
    }
  }

  function persistBlocked(next: Set<string>) {
    setBlockedIds(next);
    try { localStorage.setItem("blocked-user-ids", JSON.stringify(Array.from(next))); } catch { /* ignore */ }
  }

  async function submitReport() {
    if (!user || !reportFor || !reportReason) return;
    setReportSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: reportFor,
      reason: reportReason,
      detail: reportDetail.trim() || null,
    });
    setReportSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for the report. Our team will review it.");
    setReportFor(null);
    setReportReason("");
    setReportDetail("");
  }

  function confirmBlock() {
    if (!confirmBlockFor) return;
    const next = new Set(blockedIds);
    next.add(confirmBlockFor);
    persistBlocked(next);
    toast.success("User blocked. You won't see them again.");
    setConfirmBlockFor(null);
    setOpenId(null);
    setI((x) => x + 1);
  }

  return (
    <div className="space-y-4">
      <SafetyBanner message="Tip: Real connections take time. Never send money to anyone you meet here." />
      <TrialBadge />
      {limit !== null && (
        <p className="text-xs text-muted-foreground">
          {plan === "explorer" || plan === "verified"
            ? `${Math.max(0, limit - likes)} of ${limit} weekly matches remaining on the ${plan} plan.`
            : null}
        </p>
      )}
      {limitReached ? (
        <PlanLockOverlay
          title="Weekly match limit reached"
          message={`The ${plan === "verified" ? "Verified" : "Explorer"} plan includes ${limit} matches per week. Upgrade to Premium for unlimited matches.`}
          cta="Upgrade to Premium"
        />
      ) : (
      <>
      <Card className={`relative aspect-[3/4] overflow-hidden rounded-3xl ${accent} text-white shadow-warm`}>
        <button
          type="button"
          onClick={() => person && setOpenId(person.id)}
          disabled={!person}
          className="absolute inset-0 z-10"
          aria-label={person ? `View ${person.first_name ?? "member"}'s profile` : "Profile"}
        />
        {cover && (
          <img
            src={cover}
            alt={person?.first_name ?? "Member"}
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover object-center no-snap"
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
          {loading ? (
            <h2 className="font-display text-3xl font-bold">Finding people…</h2>
          ) : person ? (
            <>
              <h2 className="font-display text-3xl font-bold">
                {person.first_name ?? "Member"}{person.age ? `, ${person.age}` : ""}
              </h2>
              {person.location && <p className="text-sm opacity-90">{person.location}</p>}
              {person.bio && <p className="mt-2 text-sm line-clamp-3">{person.bio}</p>}
              <p className="mt-2 text-xs uppercase tracking-wider opacity-80">Tap to view profile</p>
            </>
          ) : (
            <h2 className="font-display text-2xl font-bold">No profiles to show yet</h2>
          )}
        </div>
      </Card>
      <div className="relative z-20 flex justify-center gap-6">
        <Button onClick={() => setI((x) => x + 1)} size="lg" variant="outline" disabled={!person} className="h-16 w-16 rounded-full border-2 border-ghana-red"><X className="h-7 w-7 text-ghana-red" /></Button>
        <Button onClick={handleLike} size="lg" disabled={!person} className="h-16 w-16 rounded-full bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90"><Heart className="h-7 w-7 fill-white" /></Button>
      </div>
      </>
      )}
      <section>
        <h3 className="font-display text-xl font-bold text-ghana-gold">Real love stories</h3>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {SAMPLE_COUPLES.map((c) => <CoupleCard key={c.id} couple={c} />)}
        </div>
      </section>
      <InstallBanner />

      <Sheet open={!!openPerson} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl p-0">
          {openPerson && (
            <>
              {openPerson.photos.length > 0 && (
                <div className="relative h-[55vh] overflow-hidden bg-muted">
                  <Carousel
                    setApi={setGalleryApi}
                    opts={{ loop: openPerson.photos.length > 1, align: "start" }}
                    className="w-full"
                  >
                    <CarouselContent className="ml-0">
                      {openPerson.photos.map((src, idx) => (
                        <CarouselItem key={`${src}-${idx}`} className="pl-0 basis-full">
                          <img
                            src={src}
                            alt={`${openPerson.first_name ?? "Member"} photo ${idx + 1}`}
                            className="h-full w-full object-cover object-center"
                            onContextMenu={(e) => e.preventDefault()}
                            draggable={false}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {openPerson.photos.length > 1 && (
                      <>
                        <CarouselPrevious className="left-3 hidden sm:flex" />
                        <CarouselNext className="right-3 hidden sm:flex" />
                      </>
                    )}
                  </Carousel>
                  {openPerson.photos.length > 1 && (
                    <>
                      <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                        {galleryIndex + 1} / {openPerson.photos.length}
                      </div>
                      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
                        {openPerson.photos.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            aria-label={`Go to photo ${idx + 1}`}
                            onClick={() => galleryApi?.scrollTo(idx)}
                            className={`h-1.5 rounded-full transition-all ${
                              idx === galleryIndex ? "w-6 bg-white" : "w-1.5 bg-white/60"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="p-5 space-y-4">
                <SheetHeader className="text-left">
                  <SheetTitle className="font-display text-2xl text-ghana-brown flex items-center gap-2">
                    <span>
                      {openPerson.first_name ?? "Member"}{openPerson.age ? `, ${openPerson.age}` : ""}
                    </span>
                    {openPerson.verified ? (
                      <span
                        title="Verified member"
                        className="inline-flex items-center gap-1 rounded-full bg-ghana-gold/20 px-2 py-0.5 text-xs font-semibold text-ghana-brown"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : (
                      <span
                        title="This member hasn't completed photo verification yet"
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" /> Unverified
                      </span>
                    )}
                  </SheetTitle>
                  {openPerson.location && (
                    <p className="text-sm text-muted-foreground">{openPerson.location}</p>
                  )}
                  <div className="pt-1">
                    {matchStatus === "matched" && (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                        It's a match — you both liked each other
                      </Badge>
                    )}
                    {matchStatus === "liked_you" && (
                      <Badge className="bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90">
                        {openPerson.first_name ?? "They"} liked you — like back to match
                      </Badge>
                    )}
                    {matchStatus === "liked_by_you" && (
                      <Badge variant="secondary" className="rounded-full">
                        You liked them — waiting on a reply
                      </Badge>
                    )}
                  </div>
                </SheetHeader>

                {openPerson.bio && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">About</h4>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{openPerson.bio}</p>
                  </div>
                )}

                {openPerson.ethnicity && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Heritage</h4>
                    <p className="mt-1 text-sm">{openPerson.ethnicity}</p>
                  </div>
                )}

                {openPerson.interests.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interests</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {openPerson.interests.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setReportFor(openPerson.id)}
                  >
                    <Flag className="mr-1.5 h-4 w-4" /> Report
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:bg-muted"
                    onClick={() => setConfirmBlockFor(openPerson.id)}
                  >
                    <Ban className="mr-1.5 h-4 w-4" /> Block
                  </Button>
                </div>

                <div className="sticky bottom-0 -mx-5 mt-2 flex gap-3 border-t bg-background/95 px-5 py-3 backdrop-blur">
                  <Button
                    onClick={() => { handleLikeFromSheet(openPerson.id); setOpenId(null); }}
                    className="flex-1 bg-ghana-gold text-ghana-brown hover:bg-ghana-gold/90"
                    disabled={limitReached || matchStatus === "matched" || matchStatus === "liked_by_you"}
                  >
                    <Heart className="mr-2 h-4 w-4 fill-current" />
                    {matchStatus === "matched"
                      ? "Matched"
                      : matchStatus === "liked_by_you"
                        ? "Liked"
                        : matchStatus === "liked_you"
                          ? "Like back"
                          : "Like"}
                  </Button>
                  <Button
                    onClick={() => openChatWith(openPerson.id)}
                    disabled={openingChat}
                    className="flex-1 bg-green-500 text-white hover:bg-green-600"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {matchStatus === "matched" ? "Open chat" : "Message"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!reportFor} onOpenChange={(o) => { if (!o) { setReportFor(null); setReportReason(""); setReportDetail(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this profile</DialogTitle>
            <DialogDescription>
              Help us keep GH SUƆMƆ safe. Reports are confidential and reviewed by our team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {[
              "Scam or asking for money",
              "Fake or stolen photos",
              "Inappropriate or offensive",
              "Underage",
              "Harassment",
              "Other",
            ].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReportReason(r)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  reportReason === r
                    ? "border-ghana-gold bg-ghana-gold/10 text-ghana-brown"
                    : "border-border hover:bg-muted"
                }`}
              >
                {r}
              </button>
            ))}
            <textarea
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
              maxLength={500}
              placeholder="Add any details (optional)"
              className="mt-2 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportFor(null)}>Cancel</Button>
            <Button
              onClick={submitReport}
              disabled={!reportReason || reportSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {reportSubmitting ? "Sending…" : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmBlockFor} onOpenChange={(o) => !o && setConfirmBlockFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block this user?</AlertDialogTitle>
            <AlertDialogDescription>
              You won't see them in Discover again, and they won't appear in your matches. You can manage blocked users later in Safety settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBlock} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}