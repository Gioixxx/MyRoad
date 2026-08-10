"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onMutedChange: (muted: boolean) => void;
  onBack: () => void;
}

export function SettingsPanel({
  volume,
  muted,
  onVolumeChange,
  onMutedChange,
  onBack,
}: SettingsPanelProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <p className="font-display text-sm tracking-[0.2em] gold-metal-text">Audio</p>
        <h2 className="font-display text-xl text-(--color-text)">Musica di sottofondo</h2>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onMutedChange(!muted)}
          aria-label={muted ? "Riattiva l'audio" : "Disattiva l'audio"}
          aria-pressed={muted}
          className={cn(
            "shrink-0 rounded-md p-2 text-(--color-text-muted) transition-colors duration-150",
            "hover:text-(--color-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
          )}
        >
          {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(volume * 100)}
          disabled={muted}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          aria-label="Volume musica di sottofondo"
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-(--color-border) accent-(--color-accent) disabled:cursor-not-allowed disabled:opacity-40"
        />

        <span className="w-9 shrink-0 text-right text-sm tabular-nums text-(--color-text-muted)">
          {muted ? "Off" : `${Math.round(volume * 100)}%`}
        </span>
      </div>

      <Button variant="secondary" onClick={onBack} className="self-center">
        Torna al menu
      </Button>
    </div>
  );
}
