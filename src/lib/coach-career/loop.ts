import type { GameSpeed } from "@/types/career";
import type {
  Coach,
  CoachDecision,
  CoachDecisionCategory,
  CoachDecisionOption,
  CoachSeasonTitleEntry,
} from "@/types/coach";
import { type Rng } from "@/lib/career/progression";
import { SEASONS_PER_CYCLE } from "@/lib/career/engine";
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
import {
  evaluateCoachObjective,
  evaluateCoachSeasonTitle,
  pushCoachSeasonTitle,
  rollCoachCycleObjective,
  updateCoachPersonalRecords,
} from "./coach-satisfaction";
import {
  generateBoardBrief,
  generateCoachEndOfCycle,
  generateJobOffers,
  generateTacticalIdentityDecision,
} from "./decisions";

export interface CoachLoopContext {
  recentDecisionIds?: string[];
}

export const INITIAL_COACH_LOOP_CONTEXT: CoachLoopContext = {};

const COACH_BASE_CATEGORY_WEIGHTS: Partial<Record<CoachDecisionCategory, number>> = {
  "job-search": 30,
  "board-brief": 14,
  "tactical-identity": 10,
  "end-of-cycle": 10,
};
const COACH_DEFAULT_CATEGORY_WEIGHT = 5;
const COACH_REPEAT_PENALTY = 0.15;
const RECENT_CATEGORIES_WINDOW = 3;

/** Categorie disponibili in un dato ciclo — Fase A: senza club solo `job-search` (mirror esatto
 * di `!player.club` calciatore), con club le 3 categorie con generatore già scritto. Le
 * categorie Fase B (`board-crisis`/`press-conference`/`captain-relations`/
 * `transfer-window-budget`/`cup-run`/`continental-campaign`/`scandal`/`narrative`) restano nel
 * tipo `CoachDecisionCategory` ma non ancora generate da questo loop. */
export function availableCategories(coach: Coach): CoachDecisionCategory[] {
  if (!coach.club) return ["job-search"];
  return ["board-brief", "tactical-identity", "end-of-cycle"];
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

export interface NextCoachDecision {
  decision: CoachDecision;
  category: CoachDecisionCategory;
  context: CoachLoopContext;
}

/** Sceglie la prossima decisione del ciclo — Fase A: nessun trigger forzato ancora (board-crisis/
 * cup-run/continental-campaign/scandal arrivano in Fase B, stessa architettura a cascata di
 * `pickNextDecision` calciatore, solo senza i controlli aggiuntivi per ora). */
export function pickNextCoachDecision(
  coach: Coach,
  context: CoachLoopContext,
  recentCategories: CoachDecisionCategory[],
  rng: Rng = Math.random,
): NextCoachDecision {
  if (!coach.club) {
    return { decision: generateJobOffers(coach, rng), category: "job-search", context };
  }

  const categories = availableCategories(coach);
  const category = pickCoachDecisionCategory(categories, recentCategories, rng);

  switch (category) {
    case "board-brief":
      return { decision: generateBoardBrief(coach), category, context };
    case "tactical-identity":
      return { decision: generateTacticalIdentityDecision(coach), category, context };
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
}

function emptySatisfactionFields(): Pick<CoachCycleResult, "seasonTitle" | "objectiveResult" | "brokenRecords"> {
  return { seasonTitle: null, objectiveResult: null, brokenRecords: [] };
}

const OBJECTIVE_MET_POPULARITY_BONUS = 3;

/** Applica l'esito di un'opzione scelta dall'allenatore: delta, esonero/ritiro, avanzamento
 * stagioni, obiettivo/titolo di stagione, controllo ritiro — mirror strutturale di `resolveCycle`
 * calciatore. */
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
  nextCoach = advanceSeasons(nextCoach, seasons, rng);
  nextCoach = maybeSpawnCoachRival(nextCoach);

  const lastStint = nextCoach.clubHistory[nextCoach.clubHistory.length - 1];

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

  let seasonTitle: CoachSeasonTitleEntry | null = null;
  let brokenRecords: string[] = [];
  if (lastStint) {
    const tenureCyclesAtClub = nextCoach.clubHistory.filter((s) => s.club.id === lastStint.club.id).length;
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
      survivedCrisis: false,
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
  };
}
