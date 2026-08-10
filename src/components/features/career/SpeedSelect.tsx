"use client";

import { useState } from "react";
import type { GameSpeed } from "@/types/career";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface SpeedSelectProps {
  onSelect: (speed: GameSpeed) => void;
}

const SPEED_ORDER: GameSpeed[] = ["intense", "normal", "express"];

export const SPEED_LABELS: Record<GameSpeed, string> = {
  intense: "Intensa",
  normal: "Normale",
  express: "Rapida",
};

const SPEED_DESCRIPTIONS: Record<GameSpeed, string> = {
  intense:
    "Una decisione ogni stagione: il ritmo più serrato, per vivere ogni singolo bivio della carriera.",
  normal: "Una decisione ogni 2 stagioni: un'esperienza bilanciata tra ritmo e profondità.",
  express: "Una decisione ogni 3 stagioni: scorri veloce verso i momenti che contano davvero.",
};

export function SpeedSelect({ onSelect }: SpeedSelectProps) {
  const [speed, setSpeed] = useState<GameSpeed>("normal");

  return (
    <div className="flex min-w-0 flex-col items-center gap-5 text-center">
      <div>
        <p className="font-display text-sm tracking-[0.2em] gold-metal-text">Passo 1 di 2</p>
        <h2 className="font-display text-2xl text-(--color-text)">Scegli il ritmo di carriera</h2>
      </div>

      <div
        role="radiogroup"
        aria-label="Ritmo di carriera"
        className="flex w-full flex-col gap-3 sm:flex-row"
      >
        {SPEED_ORDER.map((option) => {
          const selected = option === speed;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setSpeed(option)}
              className={cn(
                "flex-1 rounded-xl border-2 p-4 text-left transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
                selected
                  ? "selection-glow border-(--color-accent) bg-(--color-surface-raised)"
                  : "border-(--color-border) bg-(--color-background)/50 hover:border-(--color-accent)/50",
              )}
            >
              <p
                className={cn(
                  "mb-1.5 text-sm font-bold",
                  selected ? "gold-metal-text" : "text-(--color-text)",
                )}
              >
                {SPEED_LABELS[option]}
              </p>
              <p className="text-xs leading-snug text-(--color-text-muted)">
                {SPEED_DESCRIPTIONS[option]}
              </p>
            </button>
          );
        })}
      </div>

      <Button onClick={() => onSelect(speed)}>Inizia la carriera</Button>
    </div>
  );
}
