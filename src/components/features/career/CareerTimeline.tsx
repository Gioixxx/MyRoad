import { Award as AwardIcon, Star, Trophy } from "lucide-react";
import type { Player } from "@/types/career";
import { STARTING_AGE } from "@/lib/career/engine";
import { cn } from "@/lib/utils";

const CAREER_MAX_AGE = 40;

interface CareerTimelineProps {
  player: Player;
}

function ageToPercent(age: number): number {
  const span = CAREER_MAX_AGE - STARTING_AGE;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(100, ((age - STARTING_AGE) / span) * 100));
}

type MarkerKind = "trophy" | "award" | "milestone";

const MARKER_PRIORITY: Record<MarkerKind, number> = { trophy: 3, award: 2, milestone: 1 };

/**
 * Ticker a caselle, un'età per casella (grafica Matchday): passate piene, attuale nel colore
 * del club, future vuote. Sotto `sm` resta la barra continua, 25 caselle non ci stanno.
 */
function AgeTicker({
  age,
  markersByAge,
}: {
  age: number;
  markersByAge: Map<number, { kind: MarkerKind; titles: string[] }>;
}) {
  const ages = Array.from({ length: CAREER_MAX_AGE - STARTING_AGE + 1 }, (_, i) => STARTING_AGE + i);
  return (
    <ol
      className="hidden gap-[3px] sm:grid"
      style={{ gridTemplateColumns: `repeat(${ages.length}, minmax(0, 1fr))` }}
      aria-label={`Età attuale: ${age} anni, su una carriera dai ${STARTING_AGE} ai ${CAREER_MAX_AGE}`}
    >
      {ages.map((a) => {
        const marker = markersByAge.get(a);
        return (
          <li
            key={a}
            title={marker?.titles.join(" · ")}
            className={cn(
              "md-label flex h-7 items-center justify-center gap-0.5 text-xs transition-colors duration-500",
              a === age
                ? "md-fill"
                : a < age
                  ? "bg-(--color-text)/20 text-(--color-text)"
                  : "bg-(--color-text)/5 text-(--color-text-muted)",
            )}
          >
            {marker ? (
              marker.kind === "trophy" ? (
                <Trophy size={12} aria-hidden="true" />
              ) : marker.kind === "award" ? (
                <AwardIcon size={12} aria-hidden="true" />
              ) : (
                <Star size={12} aria-hidden="true" />
              )
            ) : (
              a
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function CareerTimeline({ player }: CareerTimelineProps) {
  const progress = ageToPercent(player.age);

  const markers: { age: number; title: string; kind: MarkerKind }[] = [];
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

  const markersByAge = new Map<number, { kind: MarkerKind; titles: string[] }>();
  for (const m of markers) {
    const entry = markersByAge.get(m.age);
    if (!entry) {
      markersByAge.set(m.age, { kind: m.kind, titles: [m.title] });
      continue;
    }
    entry.titles.push(m.title);
    if (MARKER_PRIORITY[m.kind] > MARKER_PRIORITY[entry.kind]) entry.kind = m.kind;
  }

  return (
    <div className="animate-step-in shrink-0">
      <AgeTicker age={player.age} markersByAge={markersByAge} />
      <div className="md-panel px-4 py-3 sm:hidden">
        <p className="md-label mb-3 text-xs text-(--color-text-muted)">
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
              className="absolute top-0 -translate-x-1/2 text-(--color-accent)"
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
    </div>
  );
}
