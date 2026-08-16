"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Award as AwardIcon, DoorOpen, Target, TrendingDown, TrendingUp } from "lucide-react";
import type { Trophy } from "@/types/career";
import type { CoachAward } from "@/types/coach";
import { COACH_AWARD_LABELS } from "@/lib/coach-career/coach-satisfaction";
import { usePrefersReducedMotion } from "@/hooks/useMotion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ClubCrest } from "@/components/features/career/ClubCrest";
import { CompetitionBadge } from "@/components/features/career/CompetitionBadge";
import { TrophyImage } from "@/components/features/career/TrophyImage";

/**
 * Mirror strutturale di `MomentOverlay.tsx` (calciatore) — stesso shell visivo (chalk-panel,
 * confetti, focus trap, auto-dismiss), ma tipizzato su un union di moment allenatore-specifici,
 * mai sui tipi del calciatore. Duplicazione deliberata: stesso principio già seguito per l'intero
 * dominio allenatore ("dominio e orchestrazione completamente paralleli", vedi piano di design) —
 * tenere a rischio zero di regressione la UI calciatore già in produzione.
 */
export type CoachMoment =
  | { kind: "trophy"; trophy: Trophy }
  | { kind: "award"; award: CoachAward }
  | { kind: "promoted"; clubName: string; crestUrl: string }
  | { kind: "relegated"; clubName: string; crestUrl: string }
  | { kind: "sacked"; clubName: string }
  | { kind: "objective"; label: string };

const AUTO_DISMISS_MS = 6000;

interface CoachMomentOverlayProps {
  moment: CoachMoment;
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

export function CoachMomentOverlay({ moment, onContinue }: CoachMomentOverlayProps) {
  const titleId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isNegativeMoment = moment.kind === "relegated" || moment.kind === "sacked";
  const confetti = useMemo(
    () => (prefersReducedMotion || isNegativeMoment ? [] : buildConfetti()),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- moment identity drives confetti burst
    [moment, prefersReducedMotion, isNegativeMoment],
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
    detail = moment.trophy.club ? `${moment.trophy.club.name} · ${moment.trophy.age} anni` : `${moment.trophy.age} anni`;
    visual = (
      <span className="flex items-end justify-center gap-3">
        <TrophyImage competition={moment.trophy.competition} size={104} />
        <CompetitionBadge competition={moment.trophy.competition} size={44} />
      </span>
    );
  } else if (moment.kind === "award") {
    eyebrow = "Premio individuale";
    title = COACH_AWARD_LABELS[moment.award.type];
    detail = moment.award.club ? `${moment.award.club.name} · ${moment.award.age} anni` : `${moment.award.age} anni`;
    visual = (
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-ovr-gold)/20 text-(--color-ovr-gold)">
        <AwardIcon size={40} aria-hidden="true" />
      </span>
    );
  } else if (moment.kind === "promoted") {
    eyebrow = "Campionato";
    title = "Promozione";
    detail = `${moment.clubName} conquista la promozione.`;
    visual = (
      <span className="flex items-center justify-center gap-3">
        <ClubCrest crestUrl={moment.crestUrl} clubName={moment.clubName} size={72} />
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-success)/20 text-(--color-success)">
          <TrendingUp size={40} aria-hidden="true" />
        </span>
      </span>
    );
  } else if (moment.kind === "relegated") {
    eyebrow = "Campionato";
    title = "Retrocessione";
    detail = `${moment.clubName} retrocede di categoria.`;
    visual = (
      <span className="flex items-center justify-center gap-3">
        <ClubCrest crestUrl={moment.crestUrl} clubName={moment.clubName} size={72} />
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-error)/20 text-(--color-error)">
          <TrendingDown size={40} aria-hidden="true" />
        </span>
      </span>
    );
  } else if (moment.kind === "sacked") {
    eyebrow = "Panchina";
    title = "Esonerato";
    detail = `Il ${moment.clubName} ti solleva dall'incarico. Torni libero sul mercato.`;
    visual = (
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-error)/20 text-(--color-error)">
        <DoorOpen size={40} aria-hidden="true" />
      </span>
    );
  } else if (moment.kind === "objective") {
    eyebrow = "Obiettivo raggiunto";
    title = moment.label;
    detail = "Hai completato il brief della società per questa stagione.";
    visual = (
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-success)/20 text-(--color-success)">
        <Target size={40} aria-hidden="true" />
      </span>
    );
  } else {
    const _exhaustive: never = moment;
    throw new Error(`Unhandled coach moment kind: ${JSON.stringify(_exhaustive)}`);
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
        data-testid="coach-moment-panel"
        className={cn(
          "animate-moment-in relative z-2 chalk-panel flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border-2 p-8 text-center shadow-2xl sm:p-10",
          isNegativeMoment ? "border-(--color-error)/60" : "border-(--color-accent)/60",
        )}
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
              "absolute inset-x-6 bottom-3 h-1 origin-left rounded-full animate-moment-timer",
              isAutoDismissPaused && "moment-timer-paused",
              isNegativeMoment ? "bg-(--color-error)/70" : "bg-(--color-accent)/70",
            )}
            style={{ animationDuration: `${AUTO_DISMISS_MS}ms` }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function buildCoachMoments(input: {
  newTrophies: Trophy[];
  newAward: CoachAward | null;
  objectiveResult?: { label: string; met: boolean; firstTime: boolean } | null;
  clubTierChange?: "promoted" | "relegated" | null;
  sacked?: boolean;
  clubName?: string | null;
  crestUrl?: string | null;
}): CoachMoment[] {
  const moments: CoachMoment[] = [];
  for (const trophy of input.newTrophies) {
    moments.push({ kind: "trophy", trophy });
  }
  if (input.newAward) {
    moments.push({ kind: "award", award: input.newAward });
  }
  if (input.sacked && input.clubName) {
    moments.push({ kind: "sacked", clubName: input.clubName });
  }
  if (input.clubTierChange && input.clubName && input.crestUrl) {
    moments.push({ kind: input.clubTierChange, clubName: input.clubName, crestUrl: input.crestUrl });
  }
  if (input.objectiveResult?.firstTime) {
    moments.push({ kind: "objective", label: input.objectiveResult.label });
  }
  return moments;
}
