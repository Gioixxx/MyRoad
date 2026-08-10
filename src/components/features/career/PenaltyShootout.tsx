"use client";

import { useState } from "react";
import type { Decision } from "@/types/career";
import { cn } from "@/lib/utils";

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
    <div className="animate-step-in flex flex-col items-center gap-5 text-center">
      <div>
        <p className="font-display text-sm tracking-[0.2em] gold-metal-text">
          {decision.title}
        </p>
        <h3 className="font-display text-2xl text-(--color-text)">{decision.description}</h3>
      </div>

      <div className="relative flex h-40 w-full max-w-sm items-end justify-center overflow-hidden rounded-xl border-2 border-(--color-pitch) bg-(--color-pitch)">
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

      <div className="flex gap-4">
        {decision.options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={selected !== null}
            onClick={() => handleChoose(option.id)}
            className={cn(
              "rounded-lg border border-(--color-border) bg-(--color-surface-raised) px-8 py-3 text-sm font-semibold text-(--color-text)",
              "transition-colors duration-150 hover:border-(--color-accent) disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {scoreChance !== null ? (
        <p className="text-xs text-(--color-text-muted)">
          Probabilità di segnare: <span className="font-semibold text-(--color-text)">{scoreChance}%</span>
        </p>
      ) : null}
    </div>
  );
}
