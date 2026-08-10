"use client";

import { useEffect, useId, useMemo, useRef, type ReactNode } from "react";
import { Flag, Star } from "lucide-react";
import type { Award, Trophy } from "@/types/career";
import { AWARD_LABELS } from "@/lib/career/award-labels";
import { usePrefersReducedMotion } from "@/hooks/useMotion";
import { Button } from "@/components/ui/Button";
import { AwardBadge } from "./AwardBadge";
import { CompetitionBadge } from "./CompetitionBadge";
import { TrophyImage } from "./TrophyImage";

export type CareerMoment =
  | { kind: "trophy"; trophy: Trophy }
  | { kind: "award"; award: Award }
  | { kind: "callup" }
  | { kind: "milestone"; ovr: number };

interface MomentOverlayProps {
  moment: CareerMoment;
  onContinue: () => void;
}

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
}

const CONFETTI_COLORS = [
  "var(--color-accent)",
  "var(--color-ovr-gold)",
  "var(--color-success)",
  "var(--color-error)",
  "#ffffff",
];

function buildConfetti(count = 24): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.round(Math.random() * 100),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
    delay: Number((Math.random() * 0.5).toFixed(2)),
    duration: Number((1.6 + Math.random() * 0.8).toFixed(2)),
    size: Math.round(6 + Math.random() * 6),
    rotate: Math.round(Math.random() * 360),
  }));
}

export function MomentOverlay({ moment, onContinue }: MomentOverlayProps) {
  const titleId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const confetti = useMemo(
    () => (prefersReducedMotion ? [] : buildConfetti()),
    // Regenerate when the celebrated moment changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- moment identity drives confetti burst
    [moment, prefersReducedMotion],
  );

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    continueRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onContinue();
        return;
      }
      if (event.key !== "Tab") return;
      event.preventDefault();
      continueRef.current?.focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [onContinue]);

  let eyebrow: string;
  let title: string;
  let detail: string | null = null;
  let visual: ReactNode;

  if (moment.kind === "trophy") {
    eyebrow = "Trofeo";
    title = moment.trophy.competition;
    detail = moment.trophy.club
      ? `${moment.trophy.club.name} · ${moment.trophy.age} anni`
      : `Nazionale · ${moment.trophy.age} anni`;
    visual = (
      <span className="flex items-end justify-center gap-3">
        <TrophyImage competition={moment.trophy.competition} size={104} />
        <CompetitionBadge competition={moment.trophy.competition} size={44} />
      </span>
    );
  } else if (moment.kind === "award") {
    eyebrow = "Premio individuale";
    title = AWARD_LABELS[moment.award.type];
    detail = moment.award.club
      ? `${moment.award.club.name} · ${moment.award.age} anni`
      : `${moment.award.age} anni`;
    visual = <AwardBadge type={moment.award.type} size={88} />;
  } else if (moment.kind === "milestone") {
    eyebrow = "Traguardo";
    title = `OVR ${moment.ovr}`;
    detail = "Sei entrato in una nuova fascia di prestigio.";
    visual = (
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-ovr-gold)/20 text-(--color-ovr-gold)">
        <Star size={40} aria-hidden="true" />
      </span>
    );
  } else {
    eyebrow = "Nazionale";
    title = "Convocato in nazionale!";
    detail = "Hai ricevuto la chiamata del CT.";
    visual = (
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-accent)/20 text-(--color-accent)">
        <Flag size={40} aria-hidden="true" />
      </span>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {confetti.map((piece) => (
        <div
          key={piece.id}
          aria-hidden="true"
          className="animate-confetti-fall pointer-events-none absolute top-[-20px] rounded-sm"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            background: piece.color,
            transform: `rotate(${piece.rotate}deg)`,
            animationDuration: `${piece.duration}s`,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}

      <div className="animate-moment-in relative z-2 chalk-panel flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border-2 border-(--color-accent)/60 p-8 text-center shadow-2xl sm:p-10">
        <p className="font-display text-sm tracking-[0.25em] gold-metal-text">{eyebrow}</p>
        <div className="flex items-center justify-center">{visual}</div>
        <h2 id={titleId} className="font-display text-2xl text-(--color-text) sm:text-3xl">
          {title}
        </h2>
        {detail ? <p className="text-sm text-(--color-text-muted)">{detail}</p> : null}
        <Button ref={continueRef} onClick={onContinue} className="mt-1 w-full sm:w-auto">
          Continua
        </Button>
      </div>
    </div>
  );
}

export function buildCareerMoments(input: {
  newTrophies: Trophy[];
  newAward: Award | null;
  nationalCallup: boolean;
  newMilestones?: number[];
}): CareerMoment[] {
  const moments: CareerMoment[] = [];
  for (const trophy of input.newTrophies) {
    moments.push({ kind: "trophy", trophy });
  }
  if (input.newAward) {
    moments.push({ kind: "award", award: input.newAward });
  }
  if (input.nationalCallup) {
    moments.push({ kind: "callup" });
  }
  for (const ovr of input.newMilestones ?? []) {
    moments.push({ kind: "milestone", ovr });
  }
  return moments;
}
