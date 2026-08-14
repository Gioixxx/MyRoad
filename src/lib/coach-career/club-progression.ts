import type { Club } from "@/types/career";
import type { LeagueFinish } from "@/types/coach";
import { leagueForTier } from "@/data/clubs";
import { rebuildClubForLeague } from "@/lib/career/club-progression";

export interface CoachClubTierMovementResult {
  club: Club;
  change: "promoted" | "relegated" | null;
}

/**
 * Movimento di categoria per l'allenatore — a differenza del calciatore (`applyClubTierMovement`,
 * probabilistico), qui è deterministico: `rollCoachSeasonOutcome` ha già deciso "relegated"/
 * "title" come outcome discreto della stagione, quindi non c'è un secondo roll di probabilità da
 * fare (evita di far scontare due volte la stessa fortuna/sfortuna).
 */
export function applyCoachClubTierMovement(club: Club, leagueFinish: LeagueFinish): CoachClubTierMovementResult {
  if (leagueFinish === "title" && club.tier > 1) {
    const upperTier = leagueForTier(club.country, club.tier - 1);
    if (upperTier) {
      return { club: rebuildClubForLeague(club, upperTier), change: "promoted" };
    }
  }
  if (leagueFinish === "relegated") {
    const lowerTier = leagueForTier(club.country, club.tier + 1);
    if (lowerTier) {
      return { club: rebuildClubForLeague(club, lowerTier), change: "relegated" };
    }
  }
  return { club, change: null };
}
