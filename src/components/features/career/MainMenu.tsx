"use client";

import type { Player } from "@/types/career";
import { cn } from "@/lib/utils";
import { ResumeCareerCard } from "./ResumeCareerCard";

interface MainMenuProps {
  onSinglePlayer: () => void;
  onCoach: () => void;
  onSettings: () => void;
  onQuit: () => void;
  onLeaderboard: () => void;
  /** Assente se l'archivio è vuoto: il bottone "Le mie carriere" non compare. */
  onArchive?: () => void;
  /** Carriera da calciatore salvata e non ancora conclusa: mostra la card "Carriera in corso". */
  currentPlayer?: Player | null;
  onResume: () => void;
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)";

function MenuItem({
  index,
  label,
  hint,
  onClick,
  disabled,
  primary,
  compact,
}: {
  index: string;
  label: string;
  hint?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Voce principale: piena nel colore del tema (oro). */
  primary?: boolean;
  /** Voce piccola, affiancata a un'altra sulla stessa riga. */
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center text-left transition-[transform,background-color] duration-150",
        FOCUS_RING,
        compact ? "min-h-14 gap-3.5 px-4" : "gap-4 pr-6 pl-4",
        primary ? "md-fill md-slant min-h-18" : !compact && "min-h-16",
        !primary && "border-l-4 bg-(--color-text)/4",
        disabled
          ? "cursor-not-allowed border-(--color-text)/15 text-(--color-text-muted)"
          : "hover:translate-x-1.5",
        !primary && !disabled && "border-(--club-primary) text-(--color-text) hover:bg-(--color-text)/8",
      )}
    >
      <span
        className={cn(
          "md-label text-lg",
          primary ? "opacity-70" : "text-(--color-text-muted)",
        )}
        aria-hidden="true"
      >
        {index}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "md-heading block leading-none",
            primary ? "text-3xl sm:text-[2.125rem]" : compact ? "text-2xl" : "text-[1.75rem]",
          )}
        >
          {label}
        </span>
        {hint ? (
          <span className={cn("text-[13px]", !primary && "text-(--color-text-muted)")}>
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function SecondaryLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "md-label min-h-13 border border-(--color-text)/16 bg-(--color-text)/4 text-lg text-(--color-text) transition-[transform,background-color] duration-150 hover:translate-x-1.5 hover:bg-(--color-text)/8",
        FOCUS_RING,
      )}
    >
      {label}
    </button>
  );
}

export function MainMenu({
  onSinglePlayer,
  onCoach,
  onSettings,
  onQuit,
  onLeaderboard,
  onArchive,
  currentPlayer,
  onResume,
}: MainMenuProps) {
  const links = (
    <div className={cn("grid gap-2", onArchive && "grid-cols-2")}>
      {onArchive ? <SecondaryLink label="Le mie carriere" onClick={onArchive} /> : null}
      <SecondaryLink label="Classifica" onClick={onLeaderboard} />
    </div>
  );

  return (
    <div className="flex w-full flex-wrap items-center gap-8 lg:gap-12">
      <div className="flex min-w-0 flex-[1_1_32rem] flex-col gap-6 sm:gap-8">
        <div>
          <h1 className="md-heading text-7xl leading-[0.82] text-(--color-text) sm:text-8xl lg:text-[8.25rem]">
            My Road
          </h1>
          <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="md-fill md-slant md-heading py-1.5 pr-8 pl-3.5 text-2xl sm:text-[1.75rem]">
              L&apos;Ascesa
            </span>
            <span className="text-base text-(--color-text-muted)">
              Scegli chi sei, affronta le decisioni che contano, scrivi la tua leggenda.
            </span>
          </div>
        </div>

        <nav aria-label="Menu principale" className="flex max-w-xl flex-col gap-1.5">
          <MenuItem
            index="01"
            label="Giocatore singolo"
            hint={
              currentPlayer
                ? "Riprendi la carriera in corso"
                : "Dai 16 anni al ritiro, una decisione alla volta"
            }
            onClick={onSinglePlayer}
            primary
          />
          <MenuItem index="02" label="Allenatore" hint="Guida un club dalla panchina" onClick={onCoach} />
          <MenuItem index="03" label="Multiplayer" hint="In fase di sviluppo" disabled />
          <div className="grid grid-cols-2 gap-1.5">
            <MenuItem index="04" label="Impostazioni" onClick={onSettings} compact />
            <MenuItem index="05" label="Chiudi" onClick={onQuit} compact />
          </div>
        </nav>

        {currentPlayer ? null : <div className="max-w-xl">{links}</div>}
      </div>

      {currentPlayer ? (
        <div className="flex w-full max-w-md flex-[1_1_22rem] flex-col gap-3.5">
          <p className="md-label text-[15px] text-(--color-text-muted)">Carriera in corso</p>
          <ResumeCareerCard player={currentPlayer} onResume={onResume} />
          {links}
        </div>
      ) : null}
    </div>
  );
}
