"use client";

import { cn } from "@/lib/utils";
import type { Position } from "@/types/career";

interface PositionPickerProps {
  value: Position | null;
  onChange: (position: Position) => void;
  compact?: boolean;
  className?: string;
}

const PITCH_ROWS: Position[][] = [
  ["LW", "ST", "RW"],
  ["CAM"],
  ["LM", "CM", "RM"],
  ["CDM"],
  ["LB", "CB", "RB"],
  ["GK"],
];

export function PositionPicker({
  value,
  onChange,
  compact = false,
  className,
}: PositionPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Ruolo in campo"
      className={cn(
        "relative flex min-w-0 flex-col justify-between overflow-x-hidden overflow-y-auto rounded-xl border-2 border-white/20 lg:min-h-0 lg:overflow-hidden",
        compact ? "gap-1 p-2" : "gap-2 p-3 sm:gap-3 sm:p-4",
        className,
      )}
      style={{
        backgroundImage: `
          linear-gradient(180deg, color-mix(in srgb, #0d2a1c 70%, transparent), color-mix(in srgb, #0a1f15 80%, transparent)),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 14px,
            color-mix(in srgb, #1a4a32 35%, transparent) 14px,
            color-mix(in srgb, #1a4a32 35%, transparent) 28px
          ),
          linear-gradient(180deg, #14352b, #0f2a20)
        `,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/20"
        aria-hidden="true"
      />
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20",
          compact ? "h-10 w-10" : "h-12 w-12 sm:h-16 sm:w-16",
        )}
        aria-hidden="true"
      />
      {PITCH_ROWS.map((row, i) => (
        <div
          key={i}
          className={cn("relative z-10 flex justify-center", compact ? "gap-1.5" : "gap-2 sm:gap-3")}
        >
          {row.map((position) => {
            const selected = position === value;
            return (
              <button
                key={position}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(position)}
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full font-bold",
                  "border border-white/25 backdrop-blur-[2px]",
                  "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
                  compact
                    ? "h-7 w-9 text-[10px]"
                    : "h-11 w-12 text-[11px] sm:h-12 sm:w-14 sm:text-xs",
                  selected
                    ? "selection-glow scale-105 bg-white/25 text-white"
                    : "bg-white/10 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-white/20 hover:scale-105",
                )}
              >
                {position}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
