import { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const DISMISS_KEY = "pwa-install-banner-dismissed-at";
const DISMISS_MS = 24 * 60 * 60 * 1000;

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_MS) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS doesn't fire beforeinstallprompt — show banner directly.
    if (isIOS()) setVisible(true);

    const onInstalled = () => {
      setVisible(false);
      localStorage.removeItem(DISMISS_KEY);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (isIOS()) {
      setShowIosModal(true);
      return;
    }
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      } else {
        dismiss();
      }
      setDeferred(null);
    }
  };

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border-2 p-3 shadow-2xl"
          style={{
            background: "#1a0f0a",
            borderColor: "#c8922a",
            color: "#fff7e6",
            pointerEvents: "auto",
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "#c8922a", color: "#1a0f0a" }}
          >
            <Download className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" style={{ color: "#c8922a" }}>
              Install GH SUƆMƆ
            </p>
            <p className="truncate text-xs opacity-80">Faster access, full-screen experience.</p>
          </div>
          <button
            onClick={install}
            className="shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition-opacity hover:opacity-90 sm:px-5"
            style={{ background: "#c8922a", color: "#1a0f0a" }}
          >
            Add to Home Screen — it's free
          </button>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-lg p-2 opacity-70 hover:opacity-100"
            style={{ color: "#fff7e6" }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <Dialog open={showIosModal} onOpenChange={setShowIosModal}>
        <DialogContent
          style={{ background: "#1a0f0a", borderColor: "#c8922a", color: "#fff7e6" }}
          className="border-2"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#c8922a" }}>Install on iPhone / iPad</DialogTitle>
            <DialogDescription style={{ color: "#fff7e6", opacity: 0.85 }}>
              Follow these two quick steps in Safari to add GH SUƆMƆ to your home screen.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-4 pt-2">
            <li className="flex items-start gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: "#c8922a", color: "#1a0f0a" }}
              >
                1
              </span>
              <div className="flex-1">
                <p className="font-semibold">
                  Tap the <span className="inline-flex items-center gap-1"><Share className="inline h-4 w-4" /> Share</span> button
                </p>
                <p className="text-sm opacity-80">It's at the bottom of Safari (or top on iPad).</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: "#c8922a", color: "#1a0f0a" }}
              >
                2
              </span>
              <div className="flex-1">
                <p className="font-semibold">
                  Choose <span className="inline-flex items-center gap-1"><Plus className="inline h-4 w-4" /> Add to Home Screen</span>
                </p>
                <p className="text-sm opacity-80">Then tap "Add" in the top-right corner.</p>
              </div>
            </li>
          </ol>
          <button
            onClick={() => setShowIosModal(false)}
            className="mt-2 w-full rounded-xl py-3 text-sm font-bold"
            style={{ background: "#c8922a", color: "#1a0f0a" }}
          >
            Got it
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}