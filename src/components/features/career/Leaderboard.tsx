"use client";

import { useCallback, useEffect, useState } from "react";
import { Trophy as TrophyIcon } from "lucide-react";
import { countries } from "@/data/countries";
import { DEFAULT_LIMIT, fetchLeaderboardCategory, isLeaderboardConfigured } from "@/lib/leaderboard/client";
import {
  LEADERBOARD_CATEGORY_LABELS,
  type LeaderboardCategory,
  type LeaderboardListItem,
} from "@/lib/leaderboard/types";
import { ARCHETYPE_LABELS } from "@/lib/career/traits";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { CountryFlag } from "./CountryFlag";
import { OvrBadge } from "./OvrBadge";

interface LeaderboardProps {
  onBack: () => void;
}

const CATEGORIES: LeaderboardCategory[] = ["highestOvr", "mostTrophies", "richest", "mostPopular"];

const SAVINGS_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

function secondaryStat(category: LeaderboardCategory, entry: LeaderboardListItem): string {
  switch (category) {
    case "highestOvr":
      return `OVR ${entry.peakOvr}`;
    case "mostTrophies":
      return `${entry.trophyCount} ${entry.trophyCount === 1 ? "trofeo" : "trofei"}`;
    case "richest":
      return SAVINGS_FORMATTER.format(entry.finalSavingsEur);
    case "mostPopular":
      return `Pop ${entry.finalPopularity}`;
  }
}

type Status = "loading" | "error" | "ready";

export function Leaderboard({ onBack }: LeaderboardProps) {
  const [category, setCategory] = useState<LeaderboardCategory>("highestOvr");
  const [status, setStatus] = useState<Status>("loading");
  const [entries, setEntries] = useState<LeaderboardListItem[]>([]);
  const configured = isLeaderboardConfigured();

  const load = useCallback((cat: LeaderboardCategory) => {
    setStatus("loading");
    fetchLeaderboardCategory(cat).then((result) => {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch al cambio categoria
    load(category);
  }, [category, configured, load]);

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
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors",
                  c === category
                    ? "border-(--color-accent) bg-(--color-accent)/15 text-(--color-accent)"
                    : "border-(--color-border) text-(--color-text-muted) hover:text-(--color-text)",
                )}
              >
                {LEADERBOARD_CATEGORY_LABELS[c]}
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
                <Button variant="secondary" onClick={() => load(category)} className="text-xs">
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
                  return (
                    <li
                      key={entry.id}
                      className="flex flex-col gap-2 px-3 py-2.5 odd:bg-(--color-surface-raised)/40 sm:flex-row sm:items-center sm:justify-between"
                    >
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
                            {entry.position}
                          </span>
                          <OvrBadge ovr={entry.peakOvr} size="sm" />
                          {entry.archetypeId ? (
                            <span className="shrink-0 rounded bg-(--color-surface-raised) px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-text-muted) uppercase">
                              {ARCHETYPE_LABELS[entry.archetypeId]}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="pl-7 text-xs text-(--color-text-muted) sm:pl-0">
                        {secondaryStat(category, entry)}
                      </p>
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
