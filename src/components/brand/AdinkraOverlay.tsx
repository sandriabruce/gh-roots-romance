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

// Hand-tuned scattered positions — each of the 6 symbols appears 3 times (18 total per tile).
const spots: { top: string; left: string; i: number; rot: number }[] = [
  // dwennimmen (0)
  { top: "4%",  left: "10%", i: 0, rot: -8 },
  { top: "46%", left: "52%", i: 0, rot: 14 },
  { top: "82%", left: "18%", i: 0, rot: -22 },
  // sankofa (1)
  { top: "18%", left: "72%", i: 1, rot: 10 },
  { top: "54%", left: "8%",  i: 1, rot: -12 },
  { top: "90%", left: "64%", i: 1, rot: 20 },
  // hinmeisee (2)
  { top: "10%", left: "40%", i: 2, rot: 12 },
  { top: "40%", left: "84%", i: 2, rot: -16 },
  { top: "74%", left: "44%", i: 2, rot: 6 },
  // atswa (3)
  { top: "26%", left: "24%", i: 3, rot: 18 },
  { top: "60%", left: "70%", i: 3, rot: -10 },
  { top: "94%", left: "4%",  i: 3, rot: 22 },
  // atoobi (4)
  { top: "8%",  left: "88%", i: 4, rot: -14 },
  { top: "34%", left: "4%",  i: 4, rot: 8 },
  { top: "68%", left: "30%", i: 4, rot: -18 },
  // abii (5)
  { top: "22%", left: "58%", i: 5, rot: -6 },
  { top: "56%", left: "36%", i: 5, rot: 16 },
  { top: "86%", left: "86%", i: 5, rot: -4 },
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
