import type { Club } from "@/types/career";
import type { ContinentalRun, CoachSeasonOutcome, CupRun, LeagueFinish } from "@/types/coach";
import { clamp, type Rng } from "@/lib/career/progression";
import { leagueForTier } from "@/data/clubs";
import {
  expectedLeagueFinishRank,
  rollLeaguePosition,
  rulesForLeague,
  zoneForPosition,
  type LeagueZone,
} from "@/lib/shared/league-season";

/** Rieesportata per compatibilità con i call site esistenti (`decisions.ts`, `coach-satisfaction.ts`,
 * i test) — la formula vive ora in `lib/shared/league-season.ts`, condivisa col motore calciatore
 * (vedi piano "Due classifiche", wiring calciatore). */
export { expectedLeagueFinishRank };

/** Piazzamento → rank continuo (0-4), stesso ordine usato per calcolare le aspettative del club
 * in base al prestigio (vedi `expectedLeagueFinishRank`) e per la formula di reputazione in
 * `lib/coach-career/engine.ts` (che riusa questa stessa tabella). **Solo matematica di
 * reputazione/boardConfidence** — mai testo utente, vedi `zoneToLeagueFinish`. */
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

/** `continental` e `promotion` condividono il rank 3 (contano allo stesso modo per sovra/
 * sottoperformare le attese del club) ma **non** sono lo stesso evento narrativo — chi mostra
 * copy all'utente deve leggere `CoachSeasonOutcome.zone`, non `leagueFinish` (vedi piano "Due
 * classifiche", criticità 2: `coach-satisfaction.ts`/`decisions.ts` leggevano `leagueFinish` per
 * l'obiettivo societario, mostrando "qualifica il club a una coppa europea" anche per una semplice
 * promozione dalla Championship). */
export function zoneToLeagueFinish(zone: LeagueZone): LeagueFinish {
  switch (zone) {
    case "title":
      return "title";
    case "continental":
    case "promotion":
      return "continental-qualification";
    case "mid-table":
      return "mid-table";
    case "relegation-battle":
      return "relegation-battle";
    case "relegated":
      return "relegated";
  }
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

/** Regole di fallback per un club il cui tier/paese non ha (più) una lega modellata in
 * `data/clubs.ts` — non dovrebbe accadere per un club realmente in gioco (il suo stesso
 * tier/country vengono sempre da lì), ma tiene `rollCoachSeasonOutcome` totale invece di
 * lanciare. */
const FALLBACK_LEAGUE_RULES = { size: 20, titleSpots: 1, continentalSpots: 0, promotionSpots: 0, relegationSpots: 0 };

/**
 * Rappresenta "cosa è successo al club questa stagione", ancorato solo a reputazione + prestigio
 * del club + fit tattico — mai una rosa reale. `fitMultiplier` scala il rank atteso (stesso ruolo
 * moltiplicativo di `tacticalFitMultiplier` sulle proiezioni statistiche del calciatore). Il
 * piazzamento vero e proprio (`position`/`zone`) viene tirato con lo stesso motore condiviso del
 * calciatore (`lib/shared/league-season.ts`) — vedi piano "Due classifiche".
 */
export function rollCoachSeasonOutcome(
  club: Club,
  reputation: number,
  fitMultiplier: number,
  rng: Rng = Math.random,
): CoachSeasonOutcome {
  const league = leagueForTier(club.country, club.tier);
  const rules = league ? rulesForLeague(league) : FALLBACK_LEAGUE_RULES;
  const expected = expectedLeagueFinishRank(club.prestige, reputation) * fitMultiplier;
  const position = rollLeaguePosition(expected, rules, rng);
  const zone = zoneForPosition(position, rules);
  const leagueFinish = zoneToLeagueFinish(zone);

  const cupRun: CupRun = club.competitions.cup
    ? rollTurnBasedRun(CUP_RUN_ORDER, CUP_RUN_BASE_CHANCE, reputation, rng)
    : "none";

  if (club.competitions.continental && reputation >= CONTINENTAL_RUN_MIN_REPUTATION) {
    const continentalRun = rollTurnBasedRun(CONTINENTAL_RUN_ORDER, CONTINENTAL_RUN_BASE_CHANCE, reputation, rng);
    return { leagueFinish, zone, position, leagueSize: rules.size, cupRun, continentalRun };
  }

  return { leagueFinish, zone, position, leagueSize: rules.size, cupRun };
}
