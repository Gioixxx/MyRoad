import { Award as AwardIcon, Star, Trophy } from "lucide-react";
import type { Player } from "@/types/career";
import { STARTING_AGE } from "@/lib/career/engine";

const CAREER_MAX_AGE = 40;

interface CareerTimelineProps {
  player: Player;
}

function ageToPercent(age: number): number {
  const span = CAREER_MAX_AGE - STARTING_AGE;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(100, ((age - STARTING_AGE) / span) * 100));
}

export function CareerTimeline({ player }: CareerTimelineProps) {
  const progress = ageToPercent(player.age);

  const markers: { age: number; title: string; kind: "trophy" | "award" | "milestone" }[] = [];
  for (const trophy of player.trophies) {
    markers.push({
      age: trophy.age,
      title: `${trophy.competition} · ${trophy.age} anni`,
      kind: "trophy",
    });
  }
  for (const award of player.awards) {
    markers.push({
      age: award.age,
      title: `Premio · ${award.age} anni`,
      kind: "award",
    });
  }
  for (const milestone of player.milestonesReached) {
    markers.push({
      age: milestone.age,
      title: `OVR ${milestone.ovr} · ${milestone.age} anni`,
      kind: "milestone",
    });
  }

  return (
    <div className="animate-step-in chalk-panel shrink-0 rounded-xl px-4 py-3 sm:px-5">
      <p className="mb-3 text-xs font-semibold tracking-[0.12em] text-(--color-text-muted) uppercase">
        Percorso di carriera · {STARTING_AGE}–{CAREER_MAX_AGE} anni
      </p>
      <div className="relative mt-3 h-7">
        <div className="absolute inset-x-0 top-3 h-1 rounded-full bg-(--color-border)" />
        <div
          className="timeline-fill absolute top-3 left-0 h-1 rounded-full bg-(--color-accent)"
          style={{ width: `${progress}%` }}
        />
        <span
          className="absolute top-0 -translate-x-1/2 -translate-y-full rounded-full bg-(--color-accent) px-1.5 py-0.5 font-display text-[10px] leading-none whitespace-nowrap text-(--color-on-gold) transition-[left] duration-[900ms] ease-out"
          style={{ left: `${progress}%` }}
          aria-hidden="true"
        >
          {player.age} anni
        </span>
        {markers.map((m, i) => (
          <span
            key={`${m.kind}-${m.age}-${i}`}
            title={m.title}
            className="absolute top-0 -translate-x-1/2 text-(--color-ovr-gold)"
            style={{ left: `${ageToPercent(m.age)}%` }}
          >
            {m.kind === "trophy" ? (
              <Trophy size={14} aria-hidden="true" />
            ) : m.kind === "award" ? (
              <AwardIcon size={14} aria-hidden="true" />
            ) : (
              <Star size={14} aria-hidden="true" />
            )}
          </span>
        ))}
        <span
          className="absolute top-1.5 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-(--color-surface) bg-(--color-accent) transition-[left] duration-[900ms] ease-out"
          style={{
            left: `${progress}%`,
            boxShadow: "0 0 0 3px color-mix(in srgb, var(--color-accent) 30%, transparent)",
          }}
          title={`${player.age} anni`}
          aria-label={`Età attuale: ${player.age} anni`}
        />
      </div>
    </div>
  );
}
