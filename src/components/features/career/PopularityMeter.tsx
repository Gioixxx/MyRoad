import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PopularityMeterProps {
  value: number;
  className?: string;
}

function barClasses(value: number): string {
  if (value >= 80) return "bg-(--color-ovr-gold)";
  if (value >= 40) return "bg-(--color-accent)";
  return "bg-(--color-text-muted)";
}

export function PopularityMeter({ value, className }: PopularityMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Star
        size={14}
        aria-hidden="true"
        className={clamped >= 80 ? "text-(--color-accent)" : "text-(--color-text-muted)"}
      />
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--color-surface)">
        <div
          className={cn("h-full rounded-full transition-all", barClasses(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-(--color-text-muted) tabular-nums">
        {clamped}
      </span>
    </div>
  );
}
