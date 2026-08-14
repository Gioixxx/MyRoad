import type { Club } from "@/types/career";
import type { League } from "@/data/clubs";
import { continentalCompetition, leagueForTier } from "@/data/clubs";
import { clamp, type Rng } from "./progression";

/**
 * Probabilità di retrocessione base per un club di prestige 0, decrescente col prestigio —
 * valori provvisori, da confermare con l'harness di simulazione (src/lib/career/simulation.ts).
 */
const RELEGATION_BASE_CHANCE = 0.18;
const RELEGATION_PRESTIGE_FACTOR = 0.05;

export function relegationChance(prestige: number): number {
  return clamp(RELEGATION_BASE_CHANCE - prestige * RELEGATION_PRESTIGE_FACTOR, 0, RELEGATION_BASE_CHANCE);
}

export interface ClubTierMovementResult {
  club: Club;
  change: "promoted" | "relegated" | null;
}

export function rebuildClubForLeague(club: Club, league: League): Club {
  return {
    ...club,
    tier: league.tier,
    competitions: {
      league: league.name,
      cup: league.cup,
      continental: continentalCompetition(league, club.prestige),
    },
  };
}

/**
 * Applica un eventuale movimento di categoria al club del giocatore. Promozione: deterministica
 * se il campionato del tier corrente è stato appena vinto (nessuna animazione separata
 * nell'originale, vedi piano esplorazione aggiuntiva 4). Retrocessione: probabilistica, pesata
 * sul prestigio, tirata solo nei cicli in cui il campionato non è stato vinto — mutua esclusione
 * naturale con la promozione nello stesso ciclo. Per i paesi con un solo tier modellato,
 * `leagueForTier` ritorna undefined e la funzione è un no-op silenzioso e corretto.
 */
export function applyClubTierMovement(
  club: Club,
  wonLeagueTitle: boolean,
  rng: Rng = Math.random,
): ClubTierMovementResult {
  if (wonLeagueTitle && club.tier > 1) {
    const upperTier = leagueForTier(club.country, club.tier - 1);
    if (upperTier) {
      return { club: rebuildClubForLeague(club, upperTier), change: "promoted" };
    }
  }
  if (!wonLeagueTitle) {
    const lowerTier = leagueForTier(club.country, club.tier + 1);
    if (lowerTier && rng() < relegationChance(club.prestige)) {
      return { club: rebuildClubForLeague(club, lowerTier), change: "relegated" };
    }
  }
  return { club, change: null };
}
