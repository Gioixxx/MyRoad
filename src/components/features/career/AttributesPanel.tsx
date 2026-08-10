import type { Attributes } from "@/types/career";
import { ATTRIBUTE_LABELS, attributeKeysForPosition, isGoalkeeperAttributes } from "@/lib/career/attributes";
import { cn } from "@/lib/utils";

interface AttributesPanelProps {
  attributes: Attributes;
  className?: string;
}

function barClasses(value: number): string {
  if (value >= 80) return "bg-(--color-ovr-gold)";
  if (value >= 55) return "bg-(--color-accent)";
  return "bg-(--color-text-muted)";
}

export function AttributesPanel({ attributes, className }: AttributesPanelProps) {
  const position = isGoalkeeperAttributes(attributes) ? "GK" : "ST";
  const keys = attributeKeysForPosition(position);
  const values = attributes as unknown as Record<string, number>;

  return (
    <div className={cn("flex flex-col gap-1.5 rounded-lg bg-(--color-surface) px-3 py-2", className)}>
      {keys.map((key) => {
        const value = Math.max(0, Math.min(99, values[key]));
        return (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 text-(--color-text-muted)">{ATTRIBUTE_LABELS[key]}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--color-surface-raised)">
              <div
                className={cn("h-full rounded-full transition-all", barClasses(value))}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right font-semibold text-(--color-text) tabular-nums">
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
