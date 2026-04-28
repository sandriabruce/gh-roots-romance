import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { message: string; variant?: "info" | "warn"; className?: string }

// Styled to match the "Safety first" outline button on the landing page:
// red border, red text, transparent background.
export function SafetyBanner({ message, className }: Props) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border-2 border-ghana-red bg-transparent p-3 text-sm text-ghana-red",
        className,
      )}
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-ghana-red" />
      <p className="leading-snug">{message}</p>
    </div>
  );
}