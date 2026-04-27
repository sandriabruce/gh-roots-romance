import logoSrc from "@/assets/logo.png";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
}

const sizes = {
  sm: { logo: 28, title: "text-base", tag: "text-[10px]" },
  md: { logo: 40, title: "text-xl", tag: "text-xs" },
  lg: { logo: 64, title: "text-3xl", tag: "text-sm" },
  xl: { logo: 96, title: "text-5xl md:text-6xl", tag: "text-base" },
};

export function Logo({ size = "md", showWordmark = true, className }: LogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img src={logoSrc} alt="GH SUƆMƆ heart logo" width={s.logo} height={s.logo} className="shrink-0" />
      {showWordmark && (
        <div className="leading-tight">
          <h1 className={cn("font-display font-extrabold tracking-tight text-rose-gold", s.title)}>
            {BRAND.name}
          </h1>
          <p className={cn("font-body uppercase tracking-[0.2em] text-white/90", s.tag)}>
            {BRAND.tagline}
          </p>
        </div>
      )}
    </div>
  );
}