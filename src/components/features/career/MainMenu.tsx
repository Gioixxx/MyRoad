"use client";

import { ClipboardList, LogOut, Settings, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainMenuProps {
  onSinglePlayer: () => void;
  onCoach: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

function MenuButton({
  icon,
  label,
  hint,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border-2 border-(--color-border) bg-(--color-background)/50 px-4 py-3.5 text-left transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-(--color-accent)/50 hover:bg-(--color-surface-raised) active:scale-[0.99]",
      )}
    >
      <span className="text-(--color-accent)" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold text-(--color-text)">{label}</span>
        {hint ? (
          <span className="block text-xs text-(--color-text-muted)">{hint}</span>
        ) : null}
      </span>
    </button>
  );
}

export function MainMenu({ onSinglePlayer, onCoach, onSettings, onQuit }: MainMenuProps) {
  return (
    <nav aria-label="Menu principale" className="flex w-full flex-col gap-2.5">
      <MenuButton icon={<User size={20} />} label="Giocatore singolo" onClick={onSinglePlayer} />
      <MenuButton icon={<ClipboardList size={20} />} label="Allenatore" onClick={onCoach} />
      <MenuButton
        icon={<Users size={20} />}
        label="Multiplayer"
        hint="In fase di sviluppo"
        disabled
      />
      <MenuButton icon={<Settings size={20} />} label="Impostazioni" onClick={onSettings} />
      <MenuButton icon={<LogOut size={20} />} label="Chiudi" onClick={onQuit} />
    </nav>
  );
}
