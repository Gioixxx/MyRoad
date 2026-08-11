"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Flag, Sparkles, Target } from "lucide-react";
import type { Award, PlayStyleId, Trophy } from "@/types/career";
import { AWARD_LABELS } from "@/lib/career/award-labels";
import { PLAY_STYLE_LABELS } from "@/lib/career/playstyles";
import { getMilestoneCopy } from "@/lib/career/milestone-labels";
import { usePrefersReducedMotion } from "@/hooks/useMotion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { AwardBadge } from "./AwardBadge";
import { CompetitionBadge } from "./CompetitionBadge";
import { TrophyImage } from "./TrophyImage";
import { OvrBadge } from "./OvrBadge";

export type CareerMoment =
  | { kind: "trophy"; trophy: Trophy }
  | { kind: "award"; award: Award }
  | { kind: "callup" }
  | { kind: "milestone"; ovr: number }
  | { kind: "playstyle"; playStyleId: PlayStyleId }
  | { kind: "objective"; label: string };

const AUTO_DISMISS_MS = 6000;

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

  const [isAutoDismissPaused, setIsAutoDismissPaused] = useState(false);
  const dismissTimerId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissRemainingMs = useRef(AUTO_DISMISS_MS);
  const dismissStartedAt = useRef<number | null>(null);

  function clearDismissTimer() {
    if (dismissTimerId.current) {
      clearTimeout(dismissTimerId.current);
      dismissTimerId.current = null;
    }
  }

  function startDismissTimer(ms: number) {
    dismissStartedAt.current = Date.now();
    dismissTimerId.current = setTimeout(onContinue, ms);
  }

  function pauseDismissTimer() {
    if (prefersReducedMotion || dismissTimerId.current === null || dismissStartedAt.current === null) return;
    clearDismissTimer();
    dismissRemainingMs.current = Math.max(0, dismissRemainingMs.current - (Date.now() - dismissStartedAt.current));
    setIsAutoDismissPaused(true);
  }

  function resumeDismissTimer() {
    if (prefersReducedMotion || dismissTimerId.current !== null || dismissRemainingMs.current <= 0) return;
    setIsAutoDismissPaused(false);
    startDismissTimer(dismissRemainingMs.current);
  }

  useEffect(() => {
    if (prefersReducedMotion) return;
    dismissRemainingMs.current = AUTO_DISMISS_MS;
    startDismissTimer(AUTO_DISMISS_MS);

    function handleVisibilityChange() {
      if (document.hidden) pauseDismissTimer();
      else resumeDismissTimer();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", pauseDismissTimer);
    window.addEventListener("focus", resumeDismissTimer);

    return () => {
      clearDismissTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", pauseDismissTimer);
      window.removeEventListener("focus", resumeDismissTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- il componente viene rimontato per intero ad ogni moment (key nel chiamante), il timer si resetta di conseguenza
  }, [onContinue, prefersReducedMotion]);

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
    const copy = getMilestoneCopy(moment.ovr);
    eyebrow = "Traguardo";
    title = copy.title;
    detail = copy.detail;
    visual = <OvrBadge ovr={moment.ovr} size="lg" className="shadow-lg" />;
  } else if (moment.kind === "playstyle") {
    eyebrow = "Stile di gioco";
    title = PLAY_STYLE_LABELS[moment.playStyleId];
    detail = "Hai sviluppato un tratto distintivo che ti rende unico in campo.";
    visual = (
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-ovr-gold)/20 text-(--color-ovr-gold)">
        <Sparkles size={40} aria-hidden="true" />
      </span>
    );
  } else if (moment.kind === "objective") {
    eyebrow = "Obiettivo raggiunto";
    title = moment.label;
    detail = "Hai completato l'obiettivo di questo ciclo.";
    visual = (
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-success)/20 text-(--color-success)">
        <Target size={40} aria-hidden="true" />
      </span>
    );
  } else if (moment.kind === "callup") {
    eyebrow = "Nazionale";
    title = "Convocato in nazionale!";
    detail = "Hai ricevuto la chiamata del CT.";
    visual = (
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-accent)/20 text-(--color-accent)">
        <Flag size={40} aria-hidden="true" />
      </span>
    );
  } else {
    const _exhaustive: never = moment;
    throw new Error(`Unhandled career moment kind: ${JSON.stringify(_exhaustive)}`);
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

      <div
        data-testid="moment-panel"
        className="animate-moment-in relative z-2 chalk-panel flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border-2 border-(--color-accent)/60 p-8 text-center shadow-2xl sm:p-10"
        onMouseEnter={pauseDismissTimer}
        onMouseLeave={resumeDismissTimer}
      >
        <p className="font-display text-sm tracking-[0.25em] gold-metal-text">{eyebrow}</p>
        <div className="flex items-center justify-center">{visual}</div>
        <h2 id={titleId} className="font-display text-2xl text-(--color-text) sm:text-3xl">
          {title}
        </h2>
        {detail ? <p className="text-sm text-(--color-text-muted)">{detail}</p> : null}
        <Button ref={continueRef} onClick={onContinue} className="mt-1 w-full sm:w-auto">
          Continua
        </Button>
        {!prefersReducedMotion ? (
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-x-6 bottom-3 h-1 origin-left rounded-full bg-(--color-accent)/70 animate-moment-timer",
              isAutoDismissPaused && "moment-timer-paused",
            )}
            style={{ animationDuration: `${AUTO_DISMISS_MS}ms` }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function buildCareerMoments(input: {
  newTrophies: Trophy[];
  newAward: Award | null;
  nationalCallup: boolean;
  newMilestones?: number[];
  newPlayStyles?: PlayStyleId[];
  objectiveResult?: { label: string; met: boolean } | null;
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
  for (const playStyleId of input.newPlayStyles ?? []) {
    moments.push({ kind: "playstyle", playStyleId });
  }
  if (input.objectiveResult?.met) {
    moments.push({ kind: "objective", label: input.objectiveResult.label });
  }
  return moments;
}
