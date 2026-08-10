"use client";

import type { Decision } from "@/types/career";
import { cn } from "@/lib/utils";
import { favorableOutcomeWeight } from "@/lib/career/decisions";

interface DecisionPanelProps {
  decision: Decision;
  onChoose: (optionId: string) => void;
}

export function DecisionPanel({ decision, onChoose }: DecisionPanelProps) {
  return (
    <div className="animate-step-in flex flex-col gap-4">
      <div>
        <p className="font-display text-sm tracking-[0.2em] gold-metal-text">
          {decision.title}
        </p>
        <p className="text-sm text-(--color-text-muted)">{decision.description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {decision.options.map((option) => {
          const chance = favorableOutcomeWeight(option);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChoose(option.id)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border border-(--color-border) bg-(--color-surface-raised) p-4 text-left",
                "transition-all duration-150 hover:-translate-y-0.5 hover:border-(--color-accent) hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
              )}
            >
              <span className="text-sm font-semibold text-(--color-text)">{option.label}</span>
              {option.hint ? (
                <span className="text-xs text-(--color-text-muted)">{option.hint}</span>
              ) : null}
              {chance !== null ? (
                <span className="text-xs text-(--color-text-muted)">
                  Possibilità di andare bene:{" "}
                  <span className="font-semibold text-(--color-text)">{chance}%</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
