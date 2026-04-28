import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Renders text and verifies, after mount, that the computed color is actually
 * visible. If the resolved color is transparent, fully unset, or matches the
 * element's own background (e.g. a missing CSS custom property), it swaps to
 * a safe fallback class so the text is never invisible.
 */
type SafeTextProps = {
  as?: ElementType;
  className?: string;
  /** Tailwind class used when the primary color resolves to something invisible. */
  fallbackClassName?: string;
  children: ReactNode;
};

function isInvisible(color: string, bg: string) {
  if (!color) return true;
  const c = color.replace(/\s+/g, "").toLowerCase();
  if (c === "transparent" || c === "rgba(0,0,0,0)") return true;
  // Same color as background = invisible
  if (bg && color === bg) return true;
  // Detect rgba with alpha 0
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(",");
    if (parts.length === 4 && parseFloat(parts[3]) === 0) return true;
  }
  return false;
}

export function SafeText({
  as,
  className,
  fallbackClassName = "text-ghana-brown",
  children,
}: SafeTextProps) {
  const Tag = (as ?? "span") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [needsFallback, setNeedsFallback] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    let bg = cs.backgroundColor;
    // Walk up to find a non-transparent ancestor background
    let parent: HTMLElement | null = el.parentElement;
    while (parent && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
      bg = window.getComputedStyle(parent).backgroundColor;
      parent = parent.parentElement;
    }
    if (isInvisible(cs.color, bg)) {
      console.warn(
        "[SafeText] Text color resolved to invisible — applying fallback.",
        { color: cs.color, background: bg, className }
      );
      setNeedsFallback(true);
    }
  }, [className, children]);

  return (
    <Tag
      ref={ref as never}
      className={cn(className, needsFallback && fallbackClassName)}
    >
      {children}
    </Tag>
  );
}

export default SafeText;