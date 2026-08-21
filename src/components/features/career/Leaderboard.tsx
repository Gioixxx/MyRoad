"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Trophy as TrophyIcon } from "lucide-react";
import type { AwardType } from "@/types/career";
import type { CoachAwardType } from "@/types/coach";
import { countries } from "@/data/countries";
import { DEFAULT_LIMIT, fetchLeaderboard, isLeaderboardConfigured } from "@/lib/leaderboard/client";
import {
  LEADERBOARD_TRACK_LABELS,
  type LeaderboardListItem,
  type LeaderboardTrack,
} from "@/lib/leaderboard/types";
import { ARCHETYPE_LABELS } from "@/lib/career/traits";
import { AWARD_LABELS } from "@/lib/career/award-labels";
import { COACH_AWARD_LABELS } from "@/lib/coach-career/coach-satisfaction";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { CountryFlag } from "./CountryFlag";

function awardLabelFor(type: string, track: LeaderboardTrack): string {
  if (track === "coach") return COACH_AWARD_LABELS[type as CoachAwardType] ?? type;
  return AWARD_LABELS[type as AwardType] ?? type;
}

interface LeaderboardProps {
  onBack: () => void;
}

const TRACKS: LeaderboardTrack[] = ["player", "coach"];

const SAVINGS_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

type Status = "loading" | "error" | "ready";

export function Leaderboard({ onBack }: LeaderboardProps) {
  const [track, setTrack] = useState<LeaderboardTrack>("player");
  const [status, setStatus] = useState<Status>("loading");
  const [entries, setEntries] = useState<LeaderboardListItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const configured = isLeaderboardConfigured();

  const load = useCallback((t: LeaderboardTrack) => {
    setStatus("loading");
    setExpandedId(null);
    fetchLeaderboard(t).then((result) => {
      if (result.ok) {
        setEntries(result.value);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    });
  }, []);

  useEffect(() => {
    if (!configured) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch al cambio pista
    load(track);
  }, [track, configured, load]);

  return (
    <div className="flex min-w-0 flex-col items-center gap-5 text-center">
      <div>
        <p className="font-display text-sm tracking-[0.2em] gold-metal-text">Globale</p>
        <h2 className="font-display text-2xl text-(--color-text)">Classifica</h2>
        <p className="text-xs text-(--color-text-muted)">Top {DEFAULT_LIMIT}</p>
      </div>

      {!configured ? (
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-(--color-border) px-6 py-8 text-center">
          <TrophyIcon size={20} aria-hidden="true" className="text-(--color-text-muted)/60" />
          <p className="text-sm text-(--color-text-muted)">Classifica non disponibile in questa build.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-2">
            {TRACKS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrack(t)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors",
                  t === track
                    ? "border-(--color-accent) bg-(--color-accent)/15 text-(--color-accent)"
                    : "border-(--color-border) text-(--color-text-muted) hover:text-(--color-text)",
                )}
              >
                {LEADERBOARD_TRACK_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="w-full min-w-0 chalk-panel rounded-xl text-left">
            {status === "loading" ? (
              <p className="px-3 py-8 text-center text-sm text-(--color-text-muted)">
                Carico la classifica…
              </p>
            ) : status === "error" ? (
              <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
                <p className="text-sm text-(--color-text-muted)">Impossibile caricare la classifica.</p>
                <Button variant="secondary" onClick={() => load(track)} className="text-xs">
                  Riprova
                </Button>
              </div>
            ) : entries.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-(--color-text-muted)">
                Nessun punteggio pubblicato ancora. Sii il primo!
              </p>
            ) : (
              <ul className="divide-y divide-(--color-border)">
                {entries.map((entry, i) => {
                  const country = countries.find((c) => c.name === entry.nationality);
                  const isExpanded = expandedId === entry.id;
                  const hasDetail = entry.trophyBreakdown.length > 0 || entry.awardBreakdown.length > 0;
                  return (
                    <li key={entry.id} className="flex flex-col gap-2 px-3 py-2.5 odd:bg-(--color-surface-raised)/40">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="w-5 shrink-0 text-right text-xs font-semibold text-(--color-text-muted) tabular-nums">
                              {i + 1}
                            </span>
                            {country ? (
                              <CountryFlag
                                code={country.code}
                                name={country.name}
                                fallbackEmoji={country.flag}
                                size={16}
                              />
                            ) : null}
                            <span className="min-w-0 flex-1 truncate font-semibold text-(--color-text) sm:flex-initial">
                              {entry.nickname}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 pl-7 sm:pl-0">
                            <span className="shrink-0 text-[11px] text-(--color-text-muted)">
                              {entry.lastName.toUpperCase()}
                            </span>
                            <span className="shrink-0 rounded bg-(--color-surface-raised) px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-text-muted) uppercase">
                              {entry.roleLabel}
                            </span>
                            {entry.archetypeId ? (
                              <span className="shrink-0 rounded bg-(--color-surface-raised) px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-text-muted) uppercase">
                                {ARCHETYPE_LABELS[entry.archetypeId]}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 pl-7 sm:pl-0">
                          <div className="flex flex-col items-end">
                            <p className="font-display text-sm leading-none text-(--color-ovr-gold)">
                              {entry.careerScore.toLocaleString("it-IT")}
                            </p>
                            <p className="text-[11px] text-(--color-text-muted)">
                              {entry.peakRating} · {entry.trophyCount}{" "}
                              {entry.trophyCount === 1 ? "trofeo" : "trofei"} ·{" "}
                              {SAVINGS_FORMATTER.format(entry.finalSavingsEur)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "Nascondi dettaglio trofei" : "Mostra dettaglio trofei"}
                            className="shrink-0 rounded-full p-1 text-(--color-text-muted) transition-colors hover:text-(--color-text)"
                          >
                            <ChevronDown
                              size={16}
                              aria-hidden="true"
                              className={cn("transition-transform", isExpanded && "rotate-180")}
                            />
                          </button>
                        </div>
                      </div>
                      {isExpanded ? (
                        <div className="flex flex-col gap-2 border-t border-(--color-border) pt-2 pl-7 text-xs">
                          {!hasDetail ? (
                            <p className="text-(--color-text-muted)">
                              Dettaglio non disponibile per questa pubblicazione.
                            </p>
                          ) : (
                            <>
                              {entry.trophyBreakdown.length > 0 ? (
                                <div>
                                  <p className="mb-1 font-semibold text-(--color-text)">Trofei</p>
                                  <ul className="flex flex-wrap gap-x-3 gap-y-1 text-(--color-text-muted)">
                                    {entry.trophyBreakdown.map((t) => (
                                      <li key={t.competition}>
                                        {t.count}× {t.competition}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                              {entry.awardBreakdown.length > 0 ? (
                                <div>
                                  <p className="mb-1 font-semibold text-(--color-text)">Premi</p>
                                  <ul className="flex flex-wrap gap-x-3 gap-y-1 text-(--color-text-muted)">
                                    {entry.awardBreakdown.map((a) => (
                                      <li key={a.type}>
                                        {a.count}× {awardLabelFor(a.type, track)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      <Button variant="secondary" onClick={onBack}>
        Torna
      </Button>
    </div>
  );
}
