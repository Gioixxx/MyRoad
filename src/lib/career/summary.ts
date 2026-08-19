import type { Club, ClubStint, Player, StatLine } from "@/types/career";
import { cyclesAtClub } from "@/lib/shared/club-tenure";

export interface ClubSummary {
  club: Club;
  ageFrom: number;
  ageTo: number;
  stats: StatLine;
  /** Quanti cicli (non stagioni) separati sono stati passati a questo club — dal wiring "Due
   * classifiche" `clubHistory` ha una riga per stagione, quindi un solo ciclo Express (3
   * stagioni consecutive nello stesso club) non deve contare come "×3" spell separati. */
  stintCount: number;
}

function sumStats(a: StatLine, b: StatLine): StatLine {
  const result: StatLine = {
    apps: a.apps + b.apps,
    goals: a.goals + b.goals,
    assists: a.assists + b.assists,
  };
  if (a.goalsAgainst !== undefined || b.goalsAgainst !== undefined) {
    result.goalsAgainst = (a.goalsAgainst ?? 0) + (b.goalsAgainst ?? 0);
  }
  if (a.cleanSheets !== undefined || b.cleanSheets !== undefined) {
    result.cleanSheets = (a.cleanSheets ?? 0) + (b.cleanSheets ?? 0);
  }
  return result;
}

/**
 * Accorpa `clubHistory` per club (una riga per club, non per ciclo), sommando le statistiche
 * di eventuali cicli separati passati nello stesso club. Preserva l'ordine di prima apparizione.
 */
export function summarizeClubHistory(clubHistory: ClubStint[]): ClubSummary[] {
  const byClub = new Map<string, ClubSummary>();
  const order: string[] = [];

  for (const stint of clubHistory) {
    const existing = byClub.get(stint.club.id);
    if (existing) {
      existing.stats = sumStats(existing.stats, stint.stats);
      existing.ageTo = Math.max(existing.ageTo, stint.ageTo);
    } else {
      byClub.set(stint.club.id, {
        club: stint.club,
        ageFrom: stint.ageFrom,
        ageTo: stint.ageTo,
        stats: { ...stint.stats },
        stintCount: 0, // ricalcolato sotto per ciclo, non per riga
      });
      order.push(stint.club.id);
    }
  }

  for (const id of order) {
    byClub.get(id)!.stintCount = cyclesAtClub(clubHistory, id);
  }

  return order.map((id) => byClub.get(id)!);
}

/** OVR più alto raggiunto in carriera (storico dei cicli + valore attuale). */
export function peakOvr(player: Pick<Player, "ovr" | "clubHistory">): number {
  return Math.max(player.ovr, ...player.clubHistory.map((s) => s.ovr));
}
