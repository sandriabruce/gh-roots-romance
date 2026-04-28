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
  { src: atoobi, size: 58 },
  { src: abii, size: 66 },
];

// Hand-tuned scattered positions (percent) across a 3x2 tile repeat.
const spots: { top: string; left: string; i: number; rot: number }[] = [
  { top: "6%", left: "8%", i: 0, rot: -8 },
  { top: "14%", left: "48%", i: 2, rot: 12 },
  { top: "9%", left: "82%", i: 4, rot: -14 },
  { top: "32%", left: "22%", i: 3, rot: 18 },
  { top: "38%", left: "68%", i: 5, rot: -6 },
  { top: "52%", left: "6%", i: 1, rot: 10 },
  { top: "58%", left: "44%", i: 0, rot: -20 },
  { top: "60%", left: "86%", i: 2, rot: 6 },
  { top: "78%", left: "20%", i: 4, rot: -4 },
  { top: "82%", left: "58%", i: 3, rot: 16 },
  { top: "88%", left: "90%", i: 5, rot: -10 },
  { top: "24%", left: "92%", i: 1, rot: 22 },
];

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
