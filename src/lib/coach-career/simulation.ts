import type { GameSpeed } from "@/types/career";
import type { Coach, CoachDecision, CoachDecisionCategory, CoachDecisionOption, CoachIdentity } from "@/types/coach";
import type { Rng } from "@/lib/career/progression";
import { createCoach } from "./engine";
import { generateJobOffers } from "./decisions";
import { INITIAL_COACH_LOOP_CONTEXT, pickNextCoachDecision, pushRecentCoachCategory, resolveCoachCycle, type CoachLoopContext } from "./loop";

/** Tetto di sicurezza contro loop infiniti se un bug futuro rompe checkCoachRetirement. */
const MAX_SIMULATED_CYCLES = 60;

export interface SimulatedCoachCareerResult {
  coach: Coach;
  cyclesPlayed: number;
  /** Numero di cicli in cui è stata scelta ciascuna categoria — usato per ribilanciare i pesi. */
  categoryPicks: Partial<Record<CoachDecisionCategory, number>>;
  /** Reputazione massima raggiunta durante la carriera — il finale non basta, il logorio di fine
   * carriera la abbassa. */
  peakReputation: number;
  sackCount: number;
  promotionCount: number;
  relegationCount: number;
}

/**
 * Sceglie un'opzione a caso tra quelle disponibili, senza bias — esclude "Ritirati" dal pool
 * casuale a meno che non sia l'unica opzione (stesso motivo di `pickUniformOption` calciatore:
 * senza questa esclusione un allenatore simulato smetterebbe per puro caso troppo presto).
 */
export function pickUniformCoachOption(decision: CoachDecision, rng: Rng): CoachDecisionOption {
  const nonRetiring = decision.options.filter((o) => !o.retire);
  const pool = nonRetiring.length > 0 ? nonRetiring : decision.options;
  const index = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  return pool[index];
}

/** Simula una carriera allenatore intera dal primo incarico al ritiro, per raccogliere
 * statistiche empiriche — mirror di `lib/career/simulation.ts::simulateCareer`. */
export function simulateCoachCareer(
  identity: CoachIdentity,
  speed: GameSpeed,
  rng: Rng = Math.random,
  pickOption: (decision: CoachDecision, rng: Rng) => CoachDecisionOption = pickUniformCoachOption,
): SimulatedCoachCareerResult {
  let coach = createCoach(identity, rng);
  let decision: CoachDecision | null = generateJobOffers(coach, rng);
  let category: CoachDecisionCategory = decision.category;
  let context: CoachLoopContext = INITIAL_COACH_LOOP_CONTEXT;
  let recentCategories: CoachDecisionCategory[] = [];
  let cyclesPlayed = 0;
  let peakReputation = coach.reputation;
  let sackCount = 0;
  let promotionCount = 0;
  let relegationCount = 0;
  const categoryPicks: Partial<Record<CoachDecisionCategory, number>> = {};

  while (decision && !coach.retired && cyclesPlayed < MAX_SIMULATED_CYCLES) {
    categoryPicks[category] = (categoryPicks[category] ?? 0) + 1;

    const option = pickOption(decision, rng);
    const result = resolveCoachCycle(coach, context, category, option, speed, rng);
    coach = result.coach;
    context = result.context;
    cyclesPlayed += 1;
    if (coach.reputation > peakReputation) peakReputation = coach.reputation;
    if (result.sacked) sackCount += 1;
    if (result.clubTierChange === "promoted") promotionCount += 1;
    if (result.clubTierChange === "relegated") relegationCount += 1;

    if (coach.retired) break;

    recentCategories = pushRecentCoachCategory(recentCategories, category);
    const next = pickNextCoachDecision(coach, context, recentCategories, rng);
    decision = next.decision;
    category = next.category;
    context = next.context;
  }

  return { coach, cyclesPlayed, categoryPicks, peakReputation, sackCount, promotionCount, relegationCount };
}
