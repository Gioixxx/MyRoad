import { Award as AwardIcon, Trophy } from "lucide-react";
import type { Player } from "@/types/career";
import { cn } from "@/lib/utils";
import { ClubCrest } from "./ClubCrest";
import { OvrBadge } from "./OvrBadge";

interface CareerTableProps {
  player: Player;
  /** Testo del placeholder mostrato nell'ultima riga mentre si genera il prossimo ciclo. */
  pendingLabel?: string;
  /** Forza sempre il layout a lista (mobile), anche su schermi larghi — per colonne strette. */
  compact?: boolean;
}

function TrophyChip({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-(--color-ovr-gold)/15 px-1.5 py-0.5 text-(--color-ovr-gold)"
      title={`${count} ${count === 1 ? "trofeo vinto" : "trofei vinti"} in questo ciclo`}
    >
      <Trophy size={13} aria-hidden="true" />
      {count > 1 ? <span className="text-xs font-semibold">×{count}</span> : null}
    </span>
  );
}

function AwardChip({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-(--color-ovr-gold)/15 px-1.5 py-0.5 text-(--color-ovr-gold)"
      title={`${count} ${count === 1 ? "premio individuale" : "premi individuali"} in questo ciclo`}
    >
      <AwardIcon size={13} aria-hidden="true" />
      {count > 1 ? <span className="text-xs font-semibold">×{count}</span> : null}
    </span>
  );
}

export function CareerTable({ player, pendingLabel, compact = false }: CareerTableProps) {
  const isGoalkeeper = player.position === "GK";
  const orderedHistory = [...player.clubHistory].reverse();
  const trophiesByAge = new Map<number, number>();
  for (const trophy of player.trophies) {
    trophiesByAge.set(trophy.age, (trophiesByAge.get(trophy.age) ?? 0) + 1);
  }
  const awardsByAge = new Map<number, number>();
  for (const award of player.awards) {
    awardsByAge.set(award.age, (awardsByAge.get(award.age) ?? 0) + 1);
  }

  return (
    <div className="chalk-panel min-w-0 rounded-xl">
      {/* Mobile (o colonna stretta con compact): card rows — no horizontal scroll */}
      <ul className={cn("divide-y divide-(--color-border)", !compact && "md:hidden")}>
        {pendingLabel ? (
          <li className="animate-pulse px-3 py-2.5 text-sm text-(--color-text-muted)">
            <span className="mr-2 text-xs">{player.age}</span>
            {pendingLabel}
          </li>
        ) : null}
        {orderedHistory.map((stint, index) => {
          const trophyCount = trophiesByAge.get(stint.ageTo) ?? 0;
          const awardCount = awardsByAge.get(stint.ageTo) ?? 0;
          return (
            <li key={index} className="flex flex-col gap-2 px-3 py-2.5 odd:bg-(--color-surface-raised)/40">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-xs text-(--color-text-muted)">{stint.ageFrom}</span>
                <ClubCrest
                  crestUrl={stint.club.crestUrl}
                  clubName={stint.club.name}
                  size={16}
                  className="shrink-0"
                />
                <span className="min-w-0 truncate font-medium text-(--color-text)">
                  {stint.club.name}
                </span>
                {stint.type === "loan" ? (
                  <span className="shrink-0 text-xs text-(--color-text-muted)">(prestito)</span>
                ) : null}
                <TrophyChip count={trophyCount} />
                <AwardChip count={awardCount} />
                <OvrBadge ovr={stint.ovr} size="sm" className="ml-auto shrink-0" />
              </div>
              <p className="pl-6 text-xs text-(--color-text-muted)">
                {isGoalkeeper
                  ? `${stint.stats.apps} pres. · ${stint.stats.goalsAgainst ?? 0} gol subiti · ${stint.stats.cleanSheets ?? 0} clean sheet`
                  : `${stint.stats.apps} pres. · ${stint.stats.goals} gol · ${stint.stats.assists} assist`}
              </p>
            </li>
          );
        })}
      </ul>

      {/* Desktop (non compact): tabella a tutta larghezza */}
      <table className={cn("hidden w-full table-fixed text-sm", !compact && "md:table")}>
        <thead>
          <tr className="border-b border-(--color-border) text-left text-xs text-(--color-text-muted) uppercase">
            <th className="w-12 px-2 py-2 font-medium">Età</th>
            <th className="px-2 py-2 font-medium">Club</th>
            <th className="w-14 px-2 py-2 text-right font-medium">OVR</th>
            <th className="w-12 px-2 py-2 text-right font-medium">Pres.</th>
            <th className="w-10 px-2 py-2 text-right font-medium">{isGoalkeeper ? "GS" : "Gol"}</th>
            <th className="w-12 px-2 py-2 text-right font-medium">{isGoalkeeper ? "CS" : "Ast."}</th>
          </tr>
        </thead>
        <tbody>
          {pendingLabel ? (
            <tr className="animate-pulse">
              <td className="px-2 py-2 text-(--color-text-muted)">{player.age}</td>
              <td colSpan={5} className="px-2 py-2 text-(--color-text-muted)">
                {pendingLabel}
              </td>
            </tr>
          ) : null}
          {orderedHistory.map((stint, index) => {
            const trophyCount = trophiesByAge.get(stint.ageTo) ?? 0;
            const awardCount = awardsByAge.get(stint.ageTo) ?? 0;
            return (
              <tr
                key={index}
                className="border-b border-(--color-border) last:border-0 odd:bg-(--color-surface-raised)/40"
              >
                <td className="px-2 py-1.5 text-(--color-text-muted)">{stint.ageFrom}</td>
                <td className="max-w-0 px-2 py-1.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <ClubCrest
                      crestUrl={stint.club.crestUrl}
                      clubName={stint.club.name}
                      size={16}
                      className="shrink-0"
                    />
                    <span className="truncate font-medium text-(--color-text)">{stint.club.name}</span>
                    {stint.type === "loan" ? (
                      <span className="shrink-0 text-xs text-(--color-text-muted)">(P)</span>
                    ) : null}
                    <TrophyChip count={trophyCount} />
                    <AwardChip count={awardCount} />
                  </div>
                </td>
                <td className="px-2 py-1.5 text-right">
                  <OvrBadge ovr={stint.ovr} size="sm" className="ml-auto" />
                </td>
                <td className="px-2 py-1.5 text-right text-(--color-text)">{stint.stats.apps}</td>
                <td className="px-2 py-1.5 text-right text-(--color-text)">
                  {isGoalkeeper ? (stint.stats.goalsAgainst ?? 0) : stint.stats.goals}
                </td>
                <td className="px-2 py-1.5 text-right text-(--color-text)">
                  {isGoalkeeper ? (stint.stats.cleanSheets ?? 0) : stint.stats.assists}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
