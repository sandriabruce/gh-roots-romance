import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { message: string; variant?: "info" | "warn"; className?: string }

export function SafetyBanner({ message, variant = "info", className }: Props) {
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-2xl border-2 p-3 text-sm",
      variant === "warn" ? "border-ghana-red/40 bg-ghana-red/5 text-ghana-brown" : "border-ghana-green/30 bg-ghana-green/5 text-ghana-brown",
      className,
    )}>
      <ShieldAlert className={cn("mt-0.5 h-5 w-5 shrink-0", variant === "warn" ? "text-ghana-red" : "text-ghana-green")} />
      <p className="leading-snug">{message}</p>
    </div>
  );
}