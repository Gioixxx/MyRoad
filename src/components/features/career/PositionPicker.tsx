"use client";

import { cn } from "@/lib/utils";
import type { Position } from "@/types/career";
import { POSITION_LABELS } from "@/lib/career/position-labels";

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

const PITCH_LINE = "border-white/40";

/** Campo verde visto dall'alto con un bottone per ruolo; quello scelto è pieno con alone. */
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
        "relative flex min-w-0 flex-col justify-between overflow-hidden border-[3px]",
        PITCH_LINE,
        compact ? "gap-1 p-2" : "gap-2 px-2.5 py-4",
        className,
      )}
      style={{
        backgroundColor: "var(--color-pitch)",
        backgroundImage:
          "repeating-linear-gradient(180deg, rgb(255 255 255 / 0.06) 0 3.25rem, transparent 3.25rem 6.5rem)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 bg-white/40"
        aria-hidden="true"
      />
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
          PITCH_LINE,
          compact ? "h-10 w-10" : "h-20 w-20",
        )}
        aria-hidden="true"
      />
      <div
        className={cn("pointer-events-none absolute inset-x-[22%] top-0 h-[13%] border-2 border-t-0", PITCH_LINE)}
        aria-hidden="true"
      />
      <div
        className={cn("pointer-events-none absolute inset-x-[22%] bottom-0 h-[13%] border-2 border-b-0", PITCH_LINE)}
        aria-hidden="true"
      />
      {PITCH_ROWS.map((row, i) => (
        <div key={i} className="relative z-10 flex items-center justify-around">
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
                  "md-label flex shrink-0 items-center justify-center rounded-full border-2 tracking-normal",
                  "transition-[transform,background-color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
                  compact ? "h-8 w-8 text-[11px]" : "h-12 w-12 text-base sm:h-13 sm:w-13 sm:text-[17px]",
                  selected
                    ? "md-fill scale-105 border-white/80 shadow-[0_0_0_4px_color-mix(in_srgb,var(--club-primary)_35%,transparent),0_0_22px_color-mix(in_srgb,var(--club-primary)_70%,transparent)]"
                    : "border-white/55 bg-black/45 text-white hover:scale-105 hover:border-white",
                )}
              >
                {POSITION_LABELS[position]}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
