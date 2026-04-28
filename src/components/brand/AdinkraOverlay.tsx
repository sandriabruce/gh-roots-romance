import dwennimmen from "@/assets/adinkra/dwennimmen.png";
import sankofa from "@/assets/adinkra/sankofa.png";
import hinmeisee from "@/assets/adinkra/hinmeisee.png";
import atswa from "@/assets/adinkra/atswa.png";
import atoobi from "@/assets/adinkra/atoobi.png";
import abii from "@/assets/adinkra/abii.png";

const symbols = [
  { src: dwennimmen, size: 64 },
  { src: sankofa, size: 56 },
  { src: hinmeisee, size: 72 },
  { src: atswa, size: 52 },
  { src: atoobi, size: 60 },
  { src: abii, size: 68 },
];

// Build a 6-col × 8-row grid (48 cells) so symbols never overlap.
// Each cell hosts one symbol; we offset into the cell and rotate lightly for a scattered feel.
const COLS = 6;
const ROWS = 8;
const spots: { top: string; left: string; i: number; rot: number }[] = (() => {
  const out: { top: string; left: string; i: number; rot: number }[] = [];
  const cellW = 100 / COLS; // ~16.66%
  const cellH = 100 / ROWS; // 12.5%
  // Deterministic pseudo-jitter (no Math.random to keep SSR/hydration stable).
  const jitterX = [0.15, 0.55, 0.30, 0.70, 0.45, 0.20];
  const jitterY = [0.25, 0.60, 0.40, 0.15, 0.70, 0.50, 0.35, 0.55];
  const rots = [-18, -12, -6, 4, 10, 16, 22, -8, 14, -20, 8, -4];
  let k = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Stagger columns on odd rows for a more organic look.
      const stagger = r % 2 === 0 ? 0 : cellW * 0.5;
      const jx = jitterX[(r + c) % jitterX.length];
      const jy = jitterY[(c + r * 2) % jitterY.length];
      const leftPct = c * cellW + stagger + (jx - 0.5) * cellW * 0.3;
      const topPct = r * cellH + (jy - 0.5) * cellH * 0.3 + cellH / 2;
      // Keep within [1%, 97%] horizontally after stagger wrap.
      const wrappedLeft = ((leftPct % 100) + 100) % 100;
      out.push({
        top: `${topPct.toFixed(2)}%`,
        left: `${wrappedLeft.toFixed(2)}%`,
        i: (r * COLS + c) % 6,
        rot: rots[k++ % rots.length],
      });
    }
  }
  return out;
})();

/**
 * Fixed, pointer-inert, gold-tinted Adinkra + Ga Samai watermark overlay.
 * Sits above backgrounds but below interactive content via z-index + pointer-events: none.
 */
export function AdinkraOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      style={{ opacity: 0.14 }}
    >
      <div className="relative h-[200vh] w-full">
        {spots.map((s, idx) => {
          const sym = symbols[s.i % symbols.length];
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                top: s.top,
                left: s.left,
                width: sym.size,
                height: sym.size,
                transform: `rotate(${s.rot}deg)`,
                backgroundColor: "hsl(var(--ghana-gold))",
                WebkitMaskImage: `url(${sym.src})`,
                maskImage: `url(${sym.src})`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
