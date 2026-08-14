import type { Club } from "@/types/career";
import type {
  Coach,
  CoachDecisionOutcome,
  CoachDelta,
  CoachIdentity,
  CoachSeasonOutcome,
  CoachStint,
} from "@/types/coach";
import { clamp, type Rng } from "@/lib/career/progression";
import { pickWeighted } from "@/lib/shared/weighted-random";
import { accrueSalary, applyPopularityDelta, computeSigningBonusEur, resignSalary } from "@/lib/career/wallet";
import { applyShadowDelta } from "@/lib/career/shadow";
import { applyTraitsDelta, NEUTRAL_TRAITS } from "@/lib/career/traits";
import { clubTacticalSystem, tacticalFitMultiplier, type TacticalFit } from "@/lib/career/tactics";
import { LEAGUE_FINISH_RANK, rollCoachSeasonOutcome } from "./season-outcome";
import { applyCoachRelationsDelta, relationsOnNewJob } from "./coach-relations";
import { emptyCoachPersonalRecords } from "./coach-satisfaction";

/** Primo incarico "da zero" per una carriera standalone — la continuità da un calciatore
 * ritirato (Fase C) parte invece dall'età di ritiro di quest'ultimo. */
export const COACH_STARTING_AGE = 35;
export const COACH_STARTING_REPUTATION = 35;
export const COACH_STARTING_POPULARITY = 20;
/** Assegnata ad ogni NUOVO incarico — non sul rinnovo con lo stesso club. */
export const BOARD_CONFIDENCE_BASELINE = 55;

/** Stesso idioma a fasce pesate di `POTENTIAL_TIERS` (lib/career/potential.ts), numeri di
 * partenza da ritarare con l'harness di bilanciamento una volta misurabile la reputazione di
 * picco media (vedi piano, §10.1.1). */
const REPUTATION_CEILING_TIERS: { weight: number; min: number; max: number }[] = [
  { weight: 55, min: 55, max: 70 },
  { weight: 30, min: 71, max: 82 },
  { weight: 12, min: 83, max: 92 },
  { weight: 3, min: 93, max: 99 },
];

export function rollInitialReputationCeiling(rng: Rng = Math.random): number {
  const totalWeight = REPUTATION_CEILING_TIERS.reduce((sum, t) => sum + t.weight, 0);
  let roll = rng() * totalWeight;
  for (const tier of REPUTATION_CEILING_TIERS) {
    roll -= tier.weight;
    if (roll < 0) {
      return tier.min + Math.round(rng() * (tier.max - tier.min));
    }
  }
  const last = REPUTATION_CEILING_TIERS[REPUTATION_CEILING_TIERS.length - 1];
  return last.min + Math.round(rng() * (last.max - last.min));
}

export function createCoach(identity: CoachIdentity, rng: Rng = Math.random): Coach {
  return {
    ...identity,
    age: COACH_STARTING_AGE,
    reputation: COACH_STARTING_REPUTATION,
    reputationCeiling: rollInitialReputationCeiling(rng),
    club: null,
    clubHistory: [],
    trophies: [],
    awards: [],
    retired: false,
    wallet: { salaryEurPerCycle: 0, savingsEur: 0 },
    popularity: COACH_STARTING_POPULARITY,
    boardConfidence: 0,
    traits: NEUTRAL_TRAITS,
    shadow: 0,
    shadowFlags: {},
    seasonTitles: [],
    currentObjective: null,
    objectiveKindsCelebrated: [],
    records: emptyCoachPersonalRecords(),
    relations: [],
  };
}

/** Compatibilità tra il sistema preferito dell'allenatore e quello del club — a differenza del
 * calciatore (che ha anche un sistema "peggiore"), qui il fit è binario: o si è "in sistema"
 * (bonus) o "neutro" (nessun effetto), mai penalizzato per aver scelto un'identità tattica
 * diversa da quella del club. */
export function coachTacticalFit(coach: Pick<Coach, "preferredSystem">, club: Pick<Club, "id">): TacticalFit {
  return coach.preferredSystem === clubTacticalSystem(club) ? "ottimo" : "neutro";
}

/**
 * Firma per un nuovo club (offerta job-search o "cerca un club più grande" in end-of-cycle):
 * ricalcola stipendio/bonus alla firma, resetta `boardConfidence` al valore di partenza (nuovo
 * mandato) e rigenera società/stampa/capitano — mai chiamata su un rinnovo con lo stesso club,
 * che non passa da qui (vedi `lib/coach-career/decisions.ts::generateCoachEndOfCycle`).
 */
export function signWithClub(coach: Coach, club: Club): Coach {
  const resigned = resignSalary(coach.wallet, coach.reputation, club.prestige);
  const wallet = {
    ...resigned,
    savingsEur: resigned.savingsEur + computeSigningBonusEur(resigned.salaryEurPerCycle),
  };
  return {
    ...coach,
    club,
    wallet,
    boardConfidence: BOARD_CONFIDENCE_BASELINE,
    relations: relationsOnNewJob(coach, club),
  };
}

/** Piazzamento atteso "di base" da società/tifosi per un club di un dato prestigio, a
 * prescindere da chi è in panchina — usato per giudicare sovra/sotto-performance (reputazione e
 * boardConfidence), distinto da `expectedLeagueFinishRank` in season-outcome.ts (che invece
 * INCLUDE la reputazione dell'allenatore per determinare cosa succede davvero in campo). */
const EXPECTED_FINISH_RANK_BY_PRESTIGE: Record<number, number> = { 0: 1.2, 1: 1.8, 2: 2.6, 3: 3.3 };

export function baseExpectedRank(prestige: number): number {
  return EXPECTED_FINISH_RANK_BY_PRESTIGE[prestige] ?? 1.2;
}

const REPUTATION_OVERPERFORM_STEP = 2.2;
const REPUTATION_CUP_WIN_BONUS = 1.5;
const REPUTATION_CUP_FINAL_BONUS = 0.6;
/** Dopo i 60, un lieve logorio anche a parità di risultati. */
const REPUTATION_AGE_DECLINE_START = 60;
const REPUTATION_AGE_DECLINE_PER_CYCLE = -0.8;
const REPUTATION_NOISE_RANGE = 1.5;

/**
 * Il vero motore nuovo del modo allenatore (non un mirror della curva OVR per età): la
 * reputazione è relativa alle aspettative del club — sovraperformare il prestigio la alza,
 * deludere le aspettative la abbassa.
 */
export function reputationDeltaForSeason(
  outcome: CoachSeasonOutcome,
  prestige: number,
  age: number,
  rng: Rng = Math.random,
): number {
  const overperformance = LEAGUE_FINISH_RANK[outcome.leagueFinish] - baseExpectedRank(prestige);
  const noise = (rng() - 0.5) * REPUTATION_NOISE_RANGE;
  const ageDecline = age >= REPUTATION_AGE_DECLINE_START ? REPUTATION_AGE_DECLINE_PER_CYCLE : 0;
  const cupBonus =
    outcome.cupRun === "won" ? REPUTATION_CUP_WIN_BONUS : outcome.cupRun === "final" ? REPUTATION_CUP_FINAL_BONUS : 0;
  return overperformance * REPUTATION_OVERPERFORM_STEP + noise + ageDecline + cupBonus;
}

const BOARD_CONFIDENCE_OVERPERFORM_STEP = 9;
/** Erosione naturale ogni ciclo: la pazienza della società non è infinita. */
const BOARD_CONFIDENCE_DECAY = -3;
const BOARD_CONFIDENCE_TROPHY_BONUS = 15;

export function boardConfidenceDeltaForSeason(outcome: CoachSeasonOutcome, prestige: number): number {
  const overperformance = LEAGUE_FINISH_RANK[outcome.leagueFinish] - baseExpectedRank(prestige);
  const trophyBonus = outcome.leagueFinish === "title" || outcome.cupRun === "won" ? BOARD_CONFIDENCE_TROPHY_BONUS : 0;
  return overperformance * BOARD_CONFIDENCE_OVERPERFORM_STEP + BOARD_CONFIDENCE_DECAY + trophyBonus;
}

/**
 * Fa avanzare l'allenatore di N stagioni al club corrente: una sola `CoachSeasonOutcome`/
 * `CoachStint` per CICLO (non per singola stagione) — stesso precedente già stabilito per il
 * calciatore (`ClubStint` è "una riga per ciclo", il roll trofeo non si ripete per ogni stagione
 * dentro un ciclo Express da 3).
 */
export function advanceSeasons(
  coach: Coach,
  seasons: number,
  rng: Rng = Math.random,
  /** Moltiplicatore aggiuntivo temporaneo (es. scelta tattica pre-corsa in coppa, vedi
   * `CoachDecisionOption.outcomeBonus` in Fase B) — 1 = nessun bonus, stesso ruolo di
   * `trophyChanceBonus` in `rollClubTrophies` calciatore. */
  outcomeBonusMultiplier = 1,
): Coach {
  if (!coach.club) {
    throw new Error("L'allenatore deve avere un club per accumulare stagioni");
  }
  if (seasons <= 0) {
    throw new Error("Il numero di stagioni deve essere positivo");
  }

  const club = coach.club;
  const ageFrom = coach.age;
  const ageTo = ageFrom + seasons;

  const fitMultiplier = tacticalFitMultiplier(coachTacticalFit(coach, club)) * outcomeBonusMultiplier;
  const outcome = rollCoachSeasonOutcome(club, coach.reputation, fitMultiplier, rng);

  const repDelta = reputationDeltaForSeason(outcome, club.prestige, ageTo, rng);
  const nextReputation = clamp(Math.round(coach.reputation + repDelta), 1, coach.reputationCeiling);

  const boardDelta = boardConfidenceDeltaForSeason(outcome, club.prestige);
  const nextBoardConfidence = clamp(Math.round(coach.boardConfidence + boardDelta), 0, 100);

  const stint: CoachStint = { club, ageFrom, ageTo, outcome, reputation: nextReputation };

  return {
    ...coach,
    age: ageTo,
    reputation: nextReputation,
    boardConfidence: nextBoardConfidence,
    clubHistory: [...coach.clubHistory, stint],
    wallet: accrueSalary(coach.wallet, seasons),
  };
}

/** Applica l'effetto di un outcome di decisione (reputazione, board, popolarità, ecc.). */
export function applyCoachDelta(coach: Coach, delta: CoachDelta): Coach {
  const nextReputation = clamp(coach.reputation + (delta.reputationDelta ?? 0), 1, coach.reputationCeiling);
  const nextBoardConfidence = clamp(coach.boardConfidence + (delta.boardConfidenceDelta ?? 0), 0, 100);
  const nextPopularity =
    delta.popularityDelta !== undefined ? applyPopularityDelta(coach.popularity, delta.popularityDelta) : coach.popularity;

  return {
    ...coach,
    reputation: nextReputation,
    boardConfidence: nextBoardConfidence,
    popularity: nextPopularity,
    wallet:
      delta.savingsDelta !== undefined
        ? { ...coach.wallet, savingsEur: coach.wallet.savingsEur + delta.savingsDelta }
        : coach.wallet,
    traits: delta.traitsDelta ? applyTraitsDelta(coach.traits, delta.traitsDelta) : coach.traits,
    shadow: delta.shadowDelta !== undefined ? applyShadowDelta(coach.shadow, delta.shadowDelta) : coach.shadow,
    shadowFlags: delta.shadowFlags ? { ...coach.shadowFlags, ...delta.shadowFlags } : coach.shadowFlags,
    relations: delta.relationsDelta ? applyCoachRelationsDelta(coach.relations, delta.relationsDelta) : coach.relations,
  };
}

export function resolveCoachOutcome(outcomes: CoachDecisionOutcome[], rng: Rng = Math.random): CoachDecisionOutcome {
  if (outcomes.length === 0) {
    throw new Error("Un'opzione di decisione deve avere almeno un outcome");
  }
  return pickWeighted(outcomes, (o) => o.weight, rng);
}

/** Rischio dai 55 anni, automatico a 75 — finestra più ampia del calciatore (31→40), a
 * riflettere carriere da panchina realisticamente più lunghe (vedi piano, §10.1). */
export const COACH_RETIREMENT_RISK_START_AGE = 55;
export const COACH_RETIREMENT_AUTOMATIC_AGE = 75;

export function checkCoachRetirement(coach: Coach, rng: Rng = Math.random): boolean {
  if (coach.age >= COACH_RETIREMENT_AUTOMATIC_AGE) return true;
  if (coach.age < COACH_RETIREMENT_RISK_START_AGE) return false;
  const progress =
    (coach.age - COACH_RETIREMENT_RISK_START_AGE) / (COACH_RETIREMENT_AUTOMATIC_AGE - COACH_RETIREMENT_RISK_START_AGE);
  const chance = clamp(Math.pow(progress, 3), 0, 1);
  return rng() < chance;
}

export function retireCoach(coach: Coach): Coach {
  return { ...coach, retired: true, club: null };
}

const SACK_POPULARITY_MALUS = -6;

/** Esonero: torna libero, la carriera continua (mai un game over) — vedi decisione di scope. */
export function sackCoach(coach: Coach): Coach {
  return {
    ...coach,
    club: null,
    boardConfidence: 0,
    popularity: applyPopularityDelta(coach.popularity, SACK_POPULARITY_MALUS),
  };
}
