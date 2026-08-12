"use client";

import { useEffect, useRef, useState } from "react";
import { Award as AwardIcon, HeartCrack, Target, Trophy as TrophyIcon } from "lucide-react";
import type { Player, AttributeKey } from "@/types/career";
import { countries } from "@/data/countries";
import { useCountUp } from "@/hooks/useMotion";
import { ARCHETYPE_LABELS, deriveArchetype } from "@/lib/career/traits";
import { SHADOW_RUMOR_THRESHOLD } from "@/lib/career/shadow";
import { ATTRIBUTE_LABELS } from "@/lib/career/attributes";
import { PLAY_STYLE_LABELS } from "@/lib/career/playstyles";
import { tacticalFit, TACTICAL_FIT_LABELS } from "@/lib/career/tactics";
import { prospectStatusLine } from "@/lib/career/decisions";
import { RELATION_LABELS, formatAffinity } from "@/lib/career/relations";
import { cn } from "@/lib/utils";
import { AttributesPanel } from "./AttributesPanel";
import { ClubCrest } from "./ClubCrest";
import { JerseyBadge } from "./JerseyBadge";
import { OvrBadge } from "./OvrBadge";
import { PopularityMeter } from "./PopularityMeter";

interface PlayerCardProps {
  player: Player;
  /** Compact layout for mobile playing shell */
  compact?: boolean;
  /** Label dei record appena battuti (flash UI). */
  flashRecords?: string[];
  onTrainingFocus?: (key: AttributeKey | null) => void;
}

const VALUE_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function PlayerCard({ player, compact = false, flashRecords, onTrainingFocus }: PlayerCardProps) {
  const country = countries.find((c) => c.name === player.nationality);
  const trophyCount = player.trophies.length;
  const awardCount = player.awards.length;

  const isGoalkeeper = player.position === "GK";
  const archetype = deriveArchetype(player.traits, player.shadow);
  const showArchetypeChip = player.clubHistory.length >= 4 && archetype.primary !== null;
  const showRumorsChip = player.shadow >= SHADOW_RUMOR_THRESHOLD;
  const clubFit = player.club ? tacticalFit(player, player.club) : null;
  const prospectLine = compact ? null : prospectStatusLine(player);
  const displayOvr = useCountUp(player.ovr, 800);
  const displayApps = useCountUp(player.career.apps, 800);
  const displayGoals = useCountUp(player.career.goals, 800);
  const displayAssists = useCountUp(player.career.assists, 800);
  const displayGoalsAgainst = useCountUp(player.career.goalsAgainst ?? 0, 800);
  const displayCleanSheets = useCountUp(player.career.cleanSheets ?? 0, 800);

  const prevCounts = useRef({ trophies: trophyCount, awards: awardCount });
  const [flashTrophies, setFlashTrophies] = useState(false);
  const [flashAwards, setFlashAwards] = useState(false);
  const recordsFlashKey = flashRecords?.join("|") ?? "";

  useEffect(() => {
    const prev = prevCounts.current;
    let trophyTimer: ReturnType<typeof setTimeout> | undefined;
    let awardTimer: ReturnType<typeof setTimeout> | undefined;

    if (trophyCount > prev.trophies) {
      setFlashTrophies(true);
      trophyTimer = setTimeout(() => setFlashTrophies(false), 1200);
    }
    if (awardCount > prev.awards) {
      setFlashAwards(true);
      awardTimer = setTimeout(() => setFlashAwards(false), 1200);
    }
    prevCounts.current = { trophies: trophyCount, awards: awardCount };

    return () => {
      if (trophyTimer) clearTimeout(trophyTimer);
      if (awardTimer) clearTimeout(awardTimer);
    };
  }, [trophyCount, awardCount]);

  return (
    <div
      className={cn(
        "dossier-perforated chalk-panel flex flex-col rounded-2xl gold-metal-border",
        compact ? "gap-2.5 p-3 sm:p-4 lg:gap-4 lg:p-5" : "gap-4 p-5",
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <JerseyBadge
          number={player.number}
          lastName={player.lastName}
          country={country}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <span className="rounded bg-(--color-surface) px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-(--color-text-muted) uppercase">
            {player.position}
          </span>
          {player.injury ? (
            <span
              className="ml-1.5 inline-flex items-center gap-1 rounded bg-(--color-error)/15 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-(--color-error) uppercase"
              title={`${player.injury.label} — fuori per ${player.injury.turnsRemaining} ${player.injury.turnsRemaining === 1 ? "ciclo" : "cicli"}`}
            >
              <HeartCrack size={10} aria-hidden="true" />
              Infortunato
            </span>
          ) : null}
          {showArchetypeChip ? (
            <span className="ml-1.5 rounded bg-(--color-accent)/15 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-(--color-accent) uppercase">
              Stile: {ARCHETYPE_LABELS[archetype.primary!]}
            </span>
          ) : null}
          {showRumorsChip ? (
            <span
              className="ml-1.5 rounded bg-(--color-warning)/15 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-(--color-warning) uppercase"
              title="Girano voci poco lusinghiere sul tuo conto"
            >
              Rumors
            </span>
          ) : null}
          {player.trainingFocus ? (
            <span
              className="ml-1.5 rounded bg-(--color-accent)/15 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-(--color-accent) uppercase"
              title="Attributo su cui ti stai concentrando in allenamento"
            >
              Focus: {ATTRIBUTE_LABELS[player.trainingFocus]}
            </span>
          ) : null}
          {player.playStyles.length > 0 ? (
            <span
              className="ml-1.5 rounded bg-(--color-ovr-gold)/15 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-(--color-ovr-gold) uppercase"
              title={player.playStyles.map((id) => PLAY_STYLE_LABELS[id]).join(", ")}
            >
              {player.playStyles.length === 1
                ? PLAY_STYLE_LABELS[player.playStyles[0]]
                : `${player.playStyles.length} stili di gioco`}
            </span>
          ) : null}
          {clubFit && clubFit !== "neutro" ? (
            <span
              className={cn(
                "ml-1.5 rounded px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
                clubFit === "ottimo"
                  ? "bg-(--color-success)/15 text-(--color-success)"
                  : "bg-(--color-error)/15 text-(--color-error)",
              )}
              title="Compatibilità tra il tuo stile e il sistema di gioco del club"
            >
              Fit tattico: {TACTICAL_FIT_LABELS[clubFit]}
            </span>
          ) : null}
          {player.relations.map((rel) => (
            <span
              key={rel.id}
              className={cn(
                "ml-1.5 rounded bg-(--color-surface) px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-(--color-text-muted) uppercase",
                compact && "hidden sm:inline-flex",
              )}
              title={`${rel.name} · affinità ${formatAffinity(rel.affinity)}`}
            >
              {RELATION_LABELS[rel.id]} {formatAffinity(rel.affinity)}
            </span>
          ))}
          <p
            className={cn(
              "font-display truncate leading-tight text-(--color-text)",
              compact ? "text-xl lg:text-2xl" : "text-2xl",
            )}
          >
            {player.lastName.toUpperCase()}
          </p>
          <p className="flex items-center gap-1.5 truncate text-xs text-(--color-text-muted)">
            {player.club ? (
              <ClubCrest crestUrl={player.club.crestUrl} clubName={player.club.name} size={14} />
            ) : null}
            {player.club ? player.club.name : "Svincolato"} · {player.age} anni
          </p>
          {prospectLine ? (
            <p className="truncate text-[11px] text-(--color-text-muted)">{prospectLine}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <OvrBadge ovr={displayOvr} />
          {player.potential > player.ovr ? (
            <span
              className="text-[10px] font-semibold tracking-wide text-(--color-text-muted)"
              title="Potenziale massimo raggiungibile"
            >
              pot. {player.potential}
            </span>
          ) : null}
        </div>
      </div>

      {player.currentObjective ? (
        <div className="flex items-start gap-2 rounded-lg border border-(--color-accent)/25 bg-(--color-surface) px-3 py-2">
          <Target size={14} className="mt-0.5 shrink-0 text-(--color-accent)" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-(--color-accent) uppercase">
              Obiettivo
            </p>
            <p className="truncate text-xs text-(--color-text)">{player.currentObjective.label}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5 rounded-lg bg-(--color-surface) px-3 py-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-(--color-text-muted)">Valore</span>
          <span className="font-semibold text-(--color-text)">
            {VALUE_FORMATTER.format(player.marketValueEur)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-(--color-text-muted)">Patrimonio</span>
          <span className="font-semibold text-(--color-text)">
            {VALUE_FORMATTER.format(player.wallet.savingsEur)}
          </span>
        </div>
        {player.club && player.releaseClauseEur > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-(--color-text-muted)">Clausola</span>
            <span className="font-semibold text-(--color-text)">
              {VALUE_FORMATTER.format(player.releaseClauseEur)}
            </span>
          </div>
        ) : null}
        <PopularityMeter value={player.popularity} />
      </div>

      <AttributesPanel
        attributes={player.attributes}
        trainingFocus={player.trainingFocus}
        onTrainingFocus={onTrainingFocus}
        className={cn(compact && !onTrainingFocus && "hidden sm:flex")}
      />

      <div
        key={recordsFlashKey || "records"}
        className={cn("grid grid-cols-3 gap-2 text-center", compact && "hidden sm:grid")}
      >
        <div className="rounded-lg bg-(--color-surface) py-2">
          <p
            className={cn(
              "font-display text-lg",
              (isGoalkeeper ? recordsFlashKey.includes("clean sheet") : recordsFlashKey.includes("gol"))
                ? "text-(--color-ovr-gold)"
                : "text-(--color-text)",
            )}
          >
            {isGoalkeeper ? (player.records.bestSeasonCleanSheets ?? 0) : player.records.bestSeasonGoals}
          </p>
          <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">
            {isGoalkeeper ? "Best CS" : "Best gol"}
          </p>
        </div>
        <div className="rounded-lg bg-(--color-surface) py-2">
          <p
            className={cn(
              "font-display text-lg",
              recordsFlashKey.includes("assist") ? "text-(--color-ovr-gold)" : "text-(--color-text)",
            )}
          >
            {player.records.bestSeasonAssists}
          </p>
          <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">Best ast</p>
        </div>
        <div className="rounded-lg bg-(--color-surface) py-2">
          <p
            className={cn(
              "font-display text-lg",
              recordsFlashKey.includes("presenze") ? "text-(--color-ovr-gold)" : "text-(--color-text)",
            )}
          >
            {player.records.bestSeasonApps}
          </p>
          <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">Best pr</p>
        </div>
      </div>

      <div className={cn("grid grid-cols-3 gap-2 text-center", compact && "hidden sm:grid")}>
        <div className="rounded-lg bg-(--color-surface) py-2">
          <p className="font-display text-lg text-(--color-text)">{displayApps}</p>
          <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">Pres.</p>
        </div>
        <div className="rounded-lg bg-(--color-surface) py-2">
          <p className="font-display text-lg text-(--color-text)">
            {isGoalkeeper ? displayGoalsAgainst : displayGoals}
          </p>
          <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">
            {isGoalkeeper ? "Gol subiti" : "Gol"}
          </p>
        </div>
        <div className="rounded-lg bg-(--color-surface) py-2">
          <p className="font-display text-lg text-(--color-text)">
            {isGoalkeeper ? displayCleanSheets : displayAssists}
          </p>
          <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">
            {isGoalkeeper ? "Clean sheet" : "Assist"}
          </p>
        </div>
      </div>

      {compact ? (
        <div className="flex items-center justify-between gap-2 text-xs sm:hidden">
          <span className="text-(--color-text-muted)">
            {VALUE_FORMATTER.format(player.marketValueEur)}
          </span>
          <span className="text-(--color-text-muted)">
            {isGoalkeeper
              ? `${displayApps}P · ${displayGoalsAgainst}GS · ${displayCleanSheets}CS`
              : `${displayApps}P · ${displayGoals}G · ${displayAssists}A`}
          </span>
        </div>
      ) : null}

      <div
        className={cn(
          "flex items-center gap-4 border-t border-(--color-border) text-xs",
          compact ? "pt-2 lg:pt-3" : "pt-3",
        )}
      >
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors",
            flashTrophies && "animate-count-flash bg-(--color-ovr-gold)/20",
          )}
          title={trophyCount > 0 ? `${trophyCount} trofei vinti` : "Nessun trofeo vinto finora"}
        >
          <TrophyIcon
            size={14}
            aria-hidden="true"
            className={trophyCount > 0 ? "text-(--color-ovr-gold)" : "text-(--color-text-muted)"}
          />
          <span
            className={
              trophyCount > 0 ? "font-semibold text-(--color-text)" : "text-(--color-text-muted)"
            }
          >
            {trophyCount} {trophyCount === 1 ? "trofeo" : "trofei"}
          </span>
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors",
            flashAwards && "animate-count-flash bg-(--color-ovr-gold)/20",
          )}
          title={
            awardCount > 0 ? `${awardCount} premi individuali` : "Nessun premio individuale finora"
          }
        >
          <AwardIcon
            size={14}
            aria-hidden="true"
            className={awardCount > 0 ? "text-(--color-ovr-gold)" : "text-(--color-text-muted)"}
          />
          <span
            className={
              awardCount > 0 ? "font-semibold text-(--color-text)" : "text-(--color-text-muted)"
            }
          >
            {awardCount} {awardCount === 1 ? "premio" : "premi"}
          </span>
        </span>
      </div>
    </div>
  );
}
