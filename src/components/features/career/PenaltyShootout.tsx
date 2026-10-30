"use client";

import { useState } from "react";
import type { Decision } from "@/types/career";
import { cn } from "@/lib/utils";
import { DecisionHeading } from "./DecisionPanel";

interface PenaltyShootoutProps {
  decision: Decision;
  onChoose: (optionId: string) => void;
}

export function PenaltyShootout({ decision, onChoose }: PenaltyShootoutProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const scoreChance =
    decision.options[0]?.outcomes.find((o) => o.continentalWin || o.cupUpsetWin)?.weight ?? null;

  function handleChoose(optionId: string) {
    setSelected(optionId);
    onChoose(optionId);
  }

  return (
    <div className="animate-step-in flex flex-col gap-5">
      <DecisionHeading decision={decision} />

      <div className="flex flex-wrap items-center gap-5">
        <div className="relative flex h-40 min-w-0 flex-1 basis-64 items-end justify-center overflow-hidden border-b-4 border-(--club-primary) bg-(--color-pitch) bg-[repeating-linear-gradient(180deg,rgb(255_255_255/0.05)_0_20px,transparent_20px_40px)]">
          <div className="absolute top-6 h-16 w-32 border-2 border-white/60" aria-hidden="true" />
          <div
            className={cn(
              "mb-4 h-3 w-3 rounded-full bg-white transition-transform duration-500",
              selected === "left" && "-translate-x-10 -translate-y-16",
              selected === "right" && "translate-x-10 -translate-y-16",
            )}
            aria-hidden="true"
          />
        </div>

        {scoreChance !== null ? (
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <div
              role="img"
              aria-label={`Probabilità di segnare: ${scoreChance}%`}
              className="flex size-28 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(var(--club-primary) 0 ${scoreChance}%, color-mix(in srgb, var(--color-text) 12%, transparent) ${scoreChance}% 100%)`,
              }}
            >
              <span className="md-heading flex size-22 items-center justify-center rounded-full bg-(--color-surface) text-4xl text-(--color-text)">
                {scoreChance}%
              </span>
            </div>
            <span className="md-label text-xs text-(--color-text-muted)">Prob. di segnare</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {decision.options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            disabled={selected !== null}
            onClick={() => handleChoose(option.id)}
            className={cn(
              "md-slant md-heading min-h-14 flex-1 py-3 pr-8 pl-5 text-left text-2xl",
              index === 0 ? "md-fill" : "bg-(--color-text) text-(--color-background)",
              "transition-[transform,filter] duration-150 hover:translate-x-1 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
