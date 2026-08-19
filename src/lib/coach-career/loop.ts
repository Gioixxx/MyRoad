import type { GameSpeed, Trophy } from "@/types/career";
import type {
  Coach,
  CoachAward,
  CoachDecision,
  CoachDecisionCategory,
  CoachDecisionOption,
  CoachSeasonTitleEntry,
} from "@/types/coach";
import { type Rng } from "@/lib/career/progression";
import { SEASONS_PER_CYCLE } from "@/lib/career/engine";
import { SHADOW_SCANDAL_THRESHOLD } from "@/lib/career/shadow";
import { pickWeighted } from "@/lib/shared/weighted-random";
import {
  advanceSeasons,
  applyCoachDelta,
  baseExpectedRank,
  checkCoachRetirement,
  resolveCoachOutcome,
  retireCoach,
  sackCoach,
  signWithClub,
} from "./engine";
import { maybeSpawnCoachRival } from "./coach-relations";
import { cyclesAtClub } from "@/lib/shared/club-tenure";
import {
  evaluateCoachObjective,
  evaluateCoachSeasonTitle,
  pushCoachSeasonTitle,
  rollCoachAward,
  rollCoachCycleObjective,
  updateCoachPersonalRecords,
} from "./coach-satisfaction";
import {
  generateBoardBrief,
  generateBoardCrisisDecision,
  generateCaptainRelationsDecision,
  generateCoachEndOfCycle,
  generateCoachScandalDecision,
  generateContinentalCampaignDecision,
  generateCupRunDecision,
  generateJobOffers,
  generatePressConferenceDecision,
  generateTacticalIdentityDecision,
  generateTransferBudgetDecision,
} from "./decisions";

export interface CoachLoopContext {
  recentDecisionIds?: string[];
}

export const INITIAL_COACH_LOOP_CONTEXT: CoachLoopContext = {};

const COACH_BASE_CATEGORY_WEIGHTS: Partial<Record<CoachDecisionCategory, number>> = {
  "job-search": 30,
  "board-brief": 14,
  "tactical-identity": 10,
  "press-conference": 10,
  "captain-relations": 8,
  "transfer-window-budget": 8,
  "end-of-cycle": 10,
};
const COACH_DEFAULT_CATEGORY_WEIGHT = 5;
const COACH_REPEAT_PENALTY = 0.15;
const RECENT_CATEGORIES_WINDOW = 3;

/** Sotto questa fiducia societaria scatta la crisi forzata (vedi `shouldTriggerBoardCrisis`). */
const SACK_WARNING_THRESHOLD = 30;
const CUP_RUN_TRIGGER_CHANCE = 0.15;
const CONTINENTAL_CAMPAIGN_TRIGGER_CHANCE = 0.15;
/** Stessa soglia usata da `rollCoachSeasonOutcome` per abilitare il roll continentale. */
const CONTINENTAL_CAMPAIGN_MIN_REPUTATION = 60;

/** Categorie disponibili nel pool ordinario (pesato) — le categorie forzate (`board-crisis`/
 * `cup-run`/`continental-campaign`/`scandal`) non vi compaiono mai, sono controllate a parte in
 * `pickNextCoachDecision` prima del pool, stessa architettura del calciatore. */
export function availableCategories(coach: Coach): CoachDecisionCategory[] {
  if (!coach.club) return ["job-search"];
  return [
    "board-brief",
    "tactical-identity",
    "press-conference",
    "captain-relations",
    "transfer-window-budget",
    "end-of-cycle",
  ];
}

export function pickCoachDecisionCategory(
  categories: CoachDecisionCategory[],
  recentCategories: CoachDecisionCategory[],
  rng: Rng = Math.random,
): CoachDecisionCategory {
  return pickWeighted(
    categories,
    (category) => {
      const base = COACH_BASE_CATEGORY_WEIGHTS[category] ?? COACH_DEFAULT_CATEGORY_WEIGHT;
      return recentCategories.includes(category) ? base * COACH_REPEAT_PENALTY : base;
    },
    rng,
  );
}

export function pushRecentCoachCategory(
  recentCategories: CoachDecisionCategory[],
  category: CoachDecisionCategory,
): CoachDecisionCategory[] {
  return [...recentCategories, category].slice(-RECENT_CATEGORIES_WINDOW);
}

function shouldTriggerBoardCrisis(coach: Coach, recentCategories: CoachDecisionCategory[]): boolean {
  return Boolean(coach.club) && coach.boardConfidence < SACK_WARNING_THRESHOLD && !recentCategories.includes("board-crisis");
}

function shouldTriggerCupRun(coach: Coach, rng: Rng): boolean {
  return Boolean(coach.club?.competitions.cup) && rng() < CUP_RUN_TRIGGER_CHANCE;
}

function shouldTriggerContinentalCampaign(coach: Coach, rng: Rng): boolean {
  return (
    Boolean(coach.club?.competitions.continental) &&
    coach.reputation >= CONTINENTAL_CAMPAIGN_MIN_REPUTATION &&
    rng() < CONTINENTAL_CAMPAIGN_TRIGGER_CHANCE
  );
}

/** Riscritta localmente (non riusa `shouldTriggerScandal` calciatore) perché tipizzata su
 * `DecisionCategory[]`, incompatibile con `CoachDecisionCategory[]` — stesso corpo, stessa
 * soglia `SHADOW_SCANDAL_THRESHOLD` riusata invariata da `lib/career/shadow.ts`. */
function shouldTriggerCoachScandal(coach: Coach, recentCategories: CoachDecisionCategory[]): boolean {
  return coach.shadow >= SHADOW_SCANDAL_THRESHOLD && !recentCategories.includes("scandal");
}

export interface NextCoachDecision {
  decision: CoachDecision;
  category: CoachDecisionCategory;
  context: CoachLoopContext;
}

/** Sceglie la prossima decisione del ciclo: trigger forzati in ordine di priorità (crisi
 * societaria → corsa in coppa → campagna continentale → scandalo), poi il pool pesato ordinario —
 * stessa architettura a cascata di `pickNextDecision` calciatore. */
export function pickNextCoachDecision(
  coach: Coach,
  context: CoachLoopContext,
  recentCategories: CoachDecisionCategory[],
  rng: Rng = Math.random,
): NextCoachDecision {
  if (!coach.club) {
    return { decision: generateJobOffers(coach, rng), category: "job-search", context };
  }

  if (shouldTriggerBoardCrisis(coach, recentCategories)) {
    return { decision: generateBoardCrisisDecision(coach), category: "board-crisis", context };
  }
  if (shouldTriggerCupRun(coach, rng)) {
    return { decision: generateCupRunDecision(coach), category: "cup-run", context };
  }
  if (shouldTriggerContinentalCampaign(coach, rng)) {
    return { decision: generateContinentalCampaignDecision(coach), category: "continental-campaign", context };
  }
  if (shouldTriggerCoachScandal(coach, recentCategories)) {
    return { decision: generateCoachScandalDecision(coach), category: "scandal", context };
  }

  const categories = availableCategories(coach);
  const category = pickCoachDecisionCategory(categories, recentCategories, rng);

  switch (category) {
    case "board-brief":
      return { decision: generateBoardBrief(coach), category, context };
    case "tactical-identity":
      return { decision: generateTacticalIdentityDecision(coach), category, context };
    case "press-conference":
      return { decision: generatePressConferenceDecision(coach), category, context };
    case "captain-relations":
      return { decision: generateCaptainRelationsDecision(coach), category, context };
    case "transfer-window-budget":
      return { decision: generateTransferBudgetDecision(coach), category, context };
    case "end-of-cycle":
      return { decision: generateCoachEndOfCycle(coach, rng), category, context };
    default:
      throw new Error(`Categoria di decisione non gestita nel loop allenatore: ${category}`);
  }
}

export interface CoachCycleResult {
  coach: Coach;
  context: CoachLoopContext;
  retired: boolean;
  optionLabel: string;
  outcomeText: string;
  reputationDelta: number;
  boardConfidenceDelta: number;
  seasonTitle: CoachSeasonTitleEntry | null;
  objectiveResult: { label: string; met: boolean; firstTime: boolean } | null;
  brokenRecords: string[];
  sacked: boolean;
  newTrophies: Trophy[];
  newAward: CoachAward | null;
  clubTierChange: "promoted" | "relegated" | null;
}

function emptySatisfactionFields(): Pick<
  CoachCycleResult,
  "seasonTitle" | "objectiveResult" | "brokenRecords" | "newTrophies" | "newAward" | "clubTierChange"
> {
  return { seasonTitle: null, objectiveResult: null, brokenRecords: [], newTrophies: [], newAward: null, clubTierChange: null };
}

const OBJECTIVE_MET_POPULARITY_BONUS = 3;

/** Raccoglie i trofei vinti in **ognuna** delle stagioni del ciclo (non solo l'ultima) — un
 * ciclo Express da 3 stagioni può vincere il campionato nella prima e non nelle successive, la
 * coda overlay li mostra tutti (vedi piano "Due classifiche"). */
function newTrophiesForCycle(cycleStints: Coach["clubHistory"]): Trophy[] {
  const trophies: Trophy[] = [];
  for (const stint of cycleStints) {
    const { outcome, club, ageTo } = stint;
    if (outcome.zone === "title") {
      trophies.push({ competition: club.competitions.league, club, age: ageTo });
    }
    if (outcome.cupRun === "won" && club.competitions.cup) {
      trophies.push({ competition: club.competitions.cup, club, age: ageTo });
    }
    if (outcome.continentalRun === "won" && club.competitions.continental) {
      trophies.push({ competition: club.competitions.continental, club, age: ageTo });
    }
  }
  return trophies;
}

/** Ultimo movimento di categoria tra le stagioni del ciclo, se ce n'è stato uno — quasi sempre al
 * più uno per ciclo, ma in teoria un ciclo Express può muoversi due volte (promosso poi
 * retrocesso), da cui "ultimo" invece di "il primo trovato". */
function lastClubTierChangeInCycle(cycleStints: Coach["clubHistory"]): "promoted" | "relegated" | null {
  for (let i = cycleStints.length - 1; i >= 0; i--) {
    const change = cycleStints[i].clubTierChange;
    if (change) return change;
  }
  return null;
}

/** Applica l'esito di un'opzione scelta dall'allenatore: delta, esonero/ritiro, avanzamento
 * stagioni, trofei/premio/movimento di categoria, obiettivo/titolo di stagione, controllo ritiro —
 * mirror strutturale di `resolveCycle` calciatore. */
export function resolveCoachCycle(
  coach: Coach,
  context: CoachLoopContext,
  category: CoachDecisionCategory,
  option: CoachDecisionOption,
  speed: GameSpeed,
  rng: Rng = Math.random,
): CoachCycleResult {
  const reputationBefore = coach.reputation;
  const boardConfidenceBefore = coach.boardConfidence;
  const pendingObjective = coach.currentObjective;

  const outcome = resolveCoachOutcome(option.outcomes, rng);
  let nextCoach = applyCoachDelta(coach, outcome.effect);

  if (option.retire) {
    nextCoach = retireCoach(nextCoach);
    return {
      coach: nextCoach,
      context,
      retired: true,
      optionLabel: option.label,
      outcomeText: outcome.resultText,
      reputationDelta: nextCoach.reputation - reputationBefore,
      boardConfidenceDelta: nextCoach.boardConfidence - boardConfidenceBefore,
      sacked: false,
      ...emptySatisfactionFields(),
    };
  }

  if (outcome.effect.sacked) {
    nextCoach = sackCoach(nextCoach);
    return {
      coach: nextCoach,
      context,
      retired: false,
      optionLabel: option.label,
      outcomeText: outcome.resultText,
      reputationDelta: nextCoach.reputation - reputationBefore,
      boardConfidenceDelta: nextCoach.boardConfidence - boardConfidenceBefore,
      sacked: true,
      ...emptySatisfactionFields(),
    };
  }

  if (option.club) {
    nextCoach = signWithClub(nextCoach, option.club);
  }
  if (option.newSystem) {
    nextCoach = { ...nextCoach, preferredSystem: option.newSystem };
  }

  const seasons = SEASONS_PER_CYCLE[speed];
  nextCoach = advanceSeasons(nextCoach, seasons, rng, option.outcomeBonus ?? 1);
  nextCoach = maybeSpawnCoachRival(nextCoach);

  const cycleStints = nextCoach.clubHistory.slice(-seasons);
  const lastStint = cycleStints[cycleStints.length - 1];

  let objectiveResult: CoachCycleResult["objectiveResult"] = null;
  if (pendingObjective && lastStint) {
    const evaluated = evaluateCoachObjective(pendingObjective, lastStint.outcome);
    const firstTime = evaluated.met && !(nextCoach.objectiveKindsCelebrated ?? []).includes(pendingObjective.kind);
    if (evaluated.met) {
      nextCoach = applyCoachDelta(nextCoach, { popularityDelta: OBJECTIVE_MET_POPULARITY_BONUS });
    }
    if (firstTime) {
      nextCoach = {
        ...nextCoach,
        objectiveKindsCelebrated: [...(nextCoach.objectiveKindsCelebrated ?? []), pendingObjective.kind],
      };
    }
    objectiveResult = { label: pendingObjective.label, met: evaluated.met, firstTime };
  }

  if (category === "board-brief" && nextCoach.club) {
    nextCoach = { ...nextCoach, currentObjective: rollCoachCycleObjective(nextCoach.club, nextCoach.reputation) };
  }

  let newTrophies: Trophy[] = [];
  let newAward: CoachAward | null = null;
  let clubTierChange: CoachCycleResult["clubTierChange"] = null;
  let seasonTitle: CoachSeasonTitleEntry | null = null;
  let brokenRecords: string[] = [];

  if (lastStint) {
    newTrophies = newTrophiesForCycle(cycleStints);
    if (newTrophies.length > 0) {
      nextCoach = { ...nextCoach, trophies: [...nextCoach.trophies, ...newTrophies] };
    }

    // Il movimento di categoria è già stato applicato stagione per stagione dentro
    // `advanceSeasons` (`nextCoach.club` riflette già lo stato finale) — qui si legge solo
    // l'ultimo cambio della finestra di ciclo per riportarlo in UI.
    clubTierChange = lastClubTierChangeInCycle(cycleStints);

    const awardType = rollCoachAward(nextCoach.reputation, lastStint.outcome, rng);
    if (awardType) {
      newAward = { type: awardType, age: nextCoach.age, club: nextCoach.club ?? undefined };
      nextCoach = { ...nextCoach, awards: [...nextCoach.awards, newAward] };
    }

    const tenureCyclesAtClub = cyclesAtClub(nextCoach.clubHistory, lastStint.club.id);
    const { records, broken } = updateCoachPersonalRecords(
      nextCoach.records,
      nextCoach.reputation,
      lastStint.outcome.leagueFinish,
      tenureCyclesAtClub,
    );
    nextCoach = { ...nextCoach, records };
    brokenRecords = broken;

    const titleEntry = evaluateCoachSeasonTitle({
      age: nextCoach.age,
      outcome: lastStint.outcome,
      expectedRank: baseExpectedRank(lastStint.club.prestige),
      sacked: false,
      survivedCrisis: category === "board-crisis",
    });
    nextCoach = { ...nextCoach, seasonTitles: pushCoachSeasonTitle(nextCoach.seasonTitles, titleEntry) };
    seasonTitle = titleEntry;
  }

  if (checkCoachRetirement(nextCoach, rng)) {
    nextCoach = retireCoach(nextCoach);
  }

  return {
    coach: nextCoach,
    context,
    retired: nextCoach.retired,
    optionLabel: option.label,
    outcomeText: outcome.resultText,
    reputationDelta: nextCoach.reputation - reputationBefore,
    boardConfidenceDelta: nextCoach.boardConfidence - boardConfidenceBefore,
    sacked: false,
    seasonTitle,
    objectiveResult,
    brokenRecords,
    newTrophies,
    newAward,
    clubTierChange,
  };
}
