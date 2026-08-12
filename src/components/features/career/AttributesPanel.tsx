import type { AttributeKey, Attributes } from "@/types/career";
import { ATTRIBUTE_LABELS, attributeKeysForPosition, isGoalkeeperAttributes } from "@/lib/career/attributes";
import { cn } from "@/lib/utils";

interface AttributesPanelProps {
  attributes: Attributes;
  className?: string;
  trainingFocus?: AttributeKey | null;
  onTrainingFocus?: (key: AttributeKey | null) => void;
}

function barClasses(value: number): string {
  if (value >= 80) return "bg-(--color-ovr-gold)";
  if (value >= 55) return "bg-(--color-accent)";
  return "bg-(--color-text-muted)";
}

export function AttributesPanel({
  attributes,
  className,
  trainingFocus = null,
  onTrainingFocus,
}: AttributesPanelProps) {
  const position = isGoalkeeperAttributes(attributes) ? "GK" : "ST";
  const keys = attributeKeysForPosition(position);
  const values = attributes as unknown as Record<string, number>;
  const interactive = Boolean(onTrainingFocus);

  return (
    <div className={cn("flex flex-col gap-1.5 rounded-lg bg-(--color-surface) px-3 py-2", className)}>
      {keys.map((key) => {
        const value = Math.max(0, Math.min(99, values[key]));
        const focused = trainingFocus === key;
        const label = ATTRIBUTE_LABELS[key];
        return (
          <button
            key={key}
            type="button"
            disabled={!interactive}
            aria-pressed={focused}
            aria-label={
              focused
                ? `Togli il focus da ${label}`
                : `Concentra l'allenamento su ${label}`
            }
            onClick={() => onTrainingFocus?.(focused ? null : key)}
            className={cn(
              "flex items-center gap-2 text-xs rounded-md px-1 py-0.5 -mx-1",
              interactive &&
                "cursor-pointer hover:bg-(--color-surface-raised) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
              !interactive && "cursor-default",
              focused && "bg-(--color-accent)/15",
            )}
          >
            <span
              className={cn(
                "w-20 shrink-0 text-left",
                focused ? "font-semibold text-(--color-accent)" : "text-(--color-text-muted)",
              )}
            >
              {label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--color-surface-raised)">
              <div
                className={cn("h-full rounded-full transition-all", barClasses(value))}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right font-semibold text-(--color-text) tabular-nums">
              {value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
