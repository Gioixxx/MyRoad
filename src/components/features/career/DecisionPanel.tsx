"use client";

import type { Decision } from "@/types/career";
import { cn } from "@/lib/utils";
import { favorableOutcomeWeight } from "@/lib/career/decisions";

interface DecisionPanelProps {
  decision: Decision;
  onChoose: (optionId: string) => void;
}

/** Titolo condensato con barra del club + descrizione: l'apertura dei pannelli decisione Matchday. */
export function DecisionHeading({ decision }: { decision: Decision }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-3">
        <span className="md-slant md-fill w-3 shrink-0" aria-hidden="true" />
        <p className="md-heading text-2xl leading-tight text-(--color-text) sm:text-3xl">
          {decision.title}
        </p>
      </div>
      <p className="text-base text-(--color-text-muted)">{decision.description}</p>
    </div>
  );
}

export function DecisionPanel({ decision, onChoose }: DecisionPanelProps) {
  return (
    <div className="animate-step-in flex flex-col gap-5">
      <DecisionHeading decision={decision} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {decision.options.map((option) => {
          const chance = favorableOutcomeWeight(option);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChoose(option.id)}
              className={cn(
                "group flex flex-col items-start gap-1.5 border-l-4 border-(--color-text)/20 bg-(--color-text)/5 p-4 text-left",
                "transition-all duration-150 hover:translate-x-1 hover:border-(--club-primary) hover:bg-(--color-text)/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
              )}
            >
              <span className="md-heading text-xl leading-tight text-(--color-text)">
                {option.label}
              </span>
              {option.hint ? (
                <span className="text-xs text-(--color-text-muted)">{option.hint}</span>
              ) : null}
              {chance !== null ? (
                <span className="mt-auto flex w-full items-center gap-2 pt-1 text-xs text-(--color-text-muted)">
                  <span className="h-1.5 flex-1 bg-(--color-text)/10" aria-hidden="true">
                    <span className="md-fill block h-full" style={{ width: `${chance}%` }} />
                  </span>
                  <span>
                    Possibilità di andare bene:{" "}
                    <span className="font-semibold text-(--color-text)">{chance}%</span>
                  </span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
