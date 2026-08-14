import type { Club } from "@/types/career";
import type { ContinentalRun, CoachSeasonOutcome, CupRun, LeagueFinish } from "@/types/coach";
import { clamp, type Rng } from "@/lib/career/progression";

/** Piazzamento → rank continuo (0-4), stesso ordine usato per calcolare le aspettative del club
 * in base al prestigio (vedi `expectedLeagueFinishRank`) e per la formula di reputazione in
 * `lib/coach-career/engine.ts` (che riusa questa stessa tabella). */
export const LEAGUE_FINISH_RANK: Record<LeagueFinish, number> = {
  relegated: 0,
  "relegation-battle": 1,
  "mid-table": 2,
  "continental-qualification": 3,
  title: 4,
};

export const LEAGUE_FINISH_ORDER: LeagueFinish[] = [
  "relegated",
  "relegation-battle",
  "mid-table",
  "continental-qualification",
  "title",
];

/** Punti di "rank atteso" per stella di prestigio del club. */
const LEAGUE_FINISH_PRESTIGE_WEIGHT = 0.55;
/** Reputazione alta sposta il rank atteso verso l'alto — reputazione parte da 35 (vedi
 * COACH_STARTING_REPUTATION), non da 50 come l'OVR calciatore. */
const LEAGUE_FINISH_REPUTATION_DIVISOR = 40;
const LEAGUE_FINISH_NOISE_RANGE = 1.6; // rumore ±0.8

/** Rank atteso continuo (non ancora discretizzato in un `LeagueFinish`) per un club di un dato
 * prestigio, sotto un allenatore di una data reputazione. */
export function expectedLeagueFinishRank(prestige: number, reputation: number): number {
  return prestige * LEAGUE_FINISH_PRESTIGE_WEIGHT + reputation / LEAGUE_FINISH_REPUTATION_DIVISOR;
}

const CUP_RUN_ORDER: CupRun[] = ["none", "quarterfinal", "semifinal", "final", "won"];
const CONTINENTAL_RUN_ORDER: ContinentalRun[] = [
  "none",
  "group-stage",
  "knockout",
  "semifinal",
  "final",
  "won",
];

const CUP_RUN_BASE_CHANCE = 0.35;
const CONTINENTAL_RUN_BASE_CHANCE = 0.3;
const CONTINENTAL_RUN_MIN_REPUTATION = 60;
/** Bonus di reputazione ad ogni turno di coppa — stesso stile di CLUB_TROPHY_OVR_BONUS_CAP. */
const RUN_REPUTATION_BONUS_DIVISOR = 300;
const RUN_REPUTATION_BONUS_CAP = 0.15;
const RUN_REPUTATION_BASELINE = 60;

/** Avanza turno per turno finché il roll non fallisce (ogni turno dimezza la chance del
 * precedente) — stessa idea di più template/round successivi già usata per le finali del
 * calciatore, qui generalizzata su un ordine di stadi qualsiasi (coppa o coppa continentale). */
function rollTurnBasedRun<T extends string>(
  order: readonly T[],
  baseChance: number,
  reputation: number,
  rng: Rng,
): T {
  const reputationBonus = clamp(
    (reputation - RUN_REPUTATION_BASELINE) / RUN_REPUTATION_BONUS_DIVISOR,
    0,
    RUN_REPUTATION_BONUS_CAP,
  );
  let stage = 0;
  let chance = baseChance;
  while (stage < order.length - 1 && rng() < chance + reputationBonus) {
    stage += 1;
    chance /= 2;
  }
  return order[stage];
}

/**
 * L'unico vero nuovo sotto-sistema di simulazione del motore allenatore: rappresenta "cosa è
 * successo al club questa stagione/e", ancorato solo a reputazione + prestigio del club + fit
 * tattico — mai una rosa reale. `fitMultiplier` scala il rank atteso (stesso ruolo moltiplicativo
 * di `tacticalFitMultiplier` sulle proiezioni statistiche del calciatore).
 */
export function rollCoachSeasonOutcome(
  club: Club,
  reputation: number,
  fitMultiplier: number,
  rng: Rng = Math.random,
): CoachSeasonOutcome {
  const expected = expectedLeagueFinishRank(club.prestige, reputation) * fitMultiplier;
  const noise = (rng() - 0.5) * LEAGUE_FINISH_NOISE_RANGE;
  const rank = clamp(Math.round(expected + noise), 0, 4);
  const leagueFinish = LEAGUE_FINISH_ORDER[rank];

  const cupRun: CupRun = club.competitions.cup
    ? rollTurnBasedRun(CUP_RUN_ORDER, CUP_RUN_BASE_CHANCE, reputation, rng)
    : "none";

  if (club.competitions.continental && reputation >= CONTINENTAL_RUN_MIN_REPUTATION) {
    const continentalRun = rollTurnBasedRun(CONTINENTAL_RUN_ORDER, CONTINENTAL_RUN_BASE_CHANCE, reputation, rng);
    return { leagueFinish, cupRun, continentalRun };
  }

  return { leagueFinish, cupRun };
}
