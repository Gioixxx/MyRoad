import { Award as AwardIcon, Trophy } from "lucide-react";
import type { Coach, CoachStint, CupRun } from "@/types/coach";
import { cn } from "@/lib/utils";
import { ClubCrest } from "@/components/features/career/ClubCrest";
import { OvrBadge } from "@/components/features/career/OvrBadge";

interface CoachHistoryTableProps {
  coach: Coach;
  /** Testo del placeholder mostrato nell'ultima riga mentre si genera il prossimo ciclo. */
  pendingLabel?: string;
  /** Forza sempre il layout a lista (mobile), anche su schermi larghi — per colonne strette. */
  compact?: boolean;
}

/** Piazzamento reale ("12° · Serie A") invece dell'etichetta a 5 valori derivata
 * (`LeagueFinish`/`continental-qualification` confonderebbe una promozione dalla Championship con
 * una vera qualificazione europea, vedi piano "Due classifiche", criticità 2) — save precedenti
 * al wiring per-stagione non hanno `outcome.position`, niente migrazione inventata: si mostra solo
 * il nome del club per quelle righe. */
function seasonFinishLabel(stint: CoachStint): string {
  if (stint.outcome.position === undefined) return stint.club.competitions.league;
  return `${stint.outcome.position}° · ${stint.club.competitions.league}`;
}

const CUP_RUN_LABELS: Record<CupRun, string> = {
  none: "—",
  quarterfinal: "Quarti di coppa",
  semifinal: "Semifinale di coppa",
  final: "Finale di coppa",
  won: "Coppa vinta",
};

function TrophyChip({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-(--color-ovr-gold)/15 px-1.5 py-0.5 text-(--color-ovr-gold)"
      title={`${count} ${count === 1 ? "trofeo vinto" : "trofei vinti"} in questa stagione`}
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
      title={`${count} ${count === 1 ? "premio individuale" : "premi individuali"} in questa stagione`}
    >
      <AwardIcon size={13} aria-hidden="true" />
      {count > 1 ? <span className="text-xs font-semibold">×{count}</span> : null}
    </span>
  );
}

export function CoachHistoryTable({ coach, pendingLabel, compact = false }: CoachHistoryTableProps) {
  const orderedHistory = [...coach.clubHistory].reverse();
  const trophiesByAge = new Map<number, number>();
  for (const trophy of coach.trophies) {
    trophiesByAge.set(trophy.age, (trophiesByAge.get(trophy.age) ?? 0) + 1);
  }
  const awardsByAge = new Map<number, number>();
  for (const award of coach.awards) {
    awardsByAge.set(award.age, (awardsByAge.get(award.age) ?? 0) + 1);
  }

  return (
    <div className="chalk-panel min-w-0 rounded-xl">
      {/* Mobile (o colonna stretta con compact): card rows — no horizontal scroll */}
      <ul className={cn("divide-y divide-(--color-border)", !compact && "md:hidden")}>
        {pendingLabel ? (
          <li className="animate-pulse px-3 py-2.5 text-sm text-(--color-text-muted)">
            <span className="mr-2 text-xs">{coach.age}</span>
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
                <ClubCrest crestUrl={stint.club.crestUrl} clubName={stint.club.name} size={16} className="shrink-0" />
                <span className="min-w-0 truncate font-medium text-(--color-text)">{stint.club.name}</span>
                <TrophyChip count={trophyCount} />
                <AwardChip count={awardCount} />
                <OvrBadge ovr={stint.reputation} size="sm" className="ml-auto shrink-0" />
              </div>
              <p className="pl-6 text-xs text-(--color-text-muted)">
                {seasonFinishLabel(stint)} · {CUP_RUN_LABELS[stint.outcome.cupRun]}
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
            <th className="w-14 px-2 py-2 text-right font-medium">Rep.</th>
            <th className="px-2 py-2 font-medium">Campionato</th>
            <th className="px-2 py-2 font-medium">Coppa</th>
          </tr>
        </thead>
        <tbody>
          {pendingLabel ? (
            <tr className="animate-pulse">
              <td className="px-2 py-2 text-(--color-text-muted)">{coach.age}</td>
              <td colSpan={4} className="px-2 py-2 text-(--color-text-muted)">
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
                    <ClubCrest crestUrl={stint.club.crestUrl} clubName={stint.club.name} size={16} className="shrink-0" />
                    <span className="truncate font-medium text-(--color-text)">{stint.club.name}</span>
                    <TrophyChip count={trophyCount} />
                    <AwardChip count={awardCount} />
                  </div>
                </td>
                <td className="px-2 py-1.5 text-right">
                  <OvrBadge ovr={stint.reputation} size="sm" className="ml-auto" />
                </td>
                <td className="px-2 py-1.5 text-(--color-text)">{seasonFinishLabel(stint)}</td>
                <td className="px-2 py-1.5 text-(--color-text)">{CUP_RUN_LABELS[stint.outcome.cupRun]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
