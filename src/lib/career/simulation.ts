import type {
  ArchetypeId,
  AttributeKey,
  Decision,
  DecisionCategory,
  DecisionOption,
  GameSpeed,
  Player,
  PlayerDelta,
  PlayerIdentity,
  Traits,
} from "@/types/career";
import { createPlayer } from "./engine";
import { generateAcademyOffer } from "./decisions";
import { INITIAL_LOOP_CONTEXT, pickNextDecision, pushRecentCategory, resolveCycle, type LoopContext } from "./loop";
import type { Rng } from "./progression";
import { deriveArchetype } from "./traits";
import { tacticalFit, type TacticalFit } from "./tactics";

/** Tetto di sicurezza contro loop infiniti se un bug futuro rompe checkRetirement. */
const MAX_SIMULATED_CYCLES = 60;

export interface SimulatedCareerResult {
  player: Player;
  cyclesPlayed: number;
  /** Cicli in cui è stato estratto un nuovo infortunio (il player.injury finale non basta: guarisce prima del ritiro). */
  injuryCount: number;
  /** Numero di cicli in cui è stata scelta ciascuna categoria — usato per ribilanciare i pesi. */
  categoryPicks: Partial<Record<DecisionCategory, number>>;
  /** OVR massimo raggiunto durante la carriera — il finale non basta, il declino di fine carriera lo abbassa. */
  peakOvr: number;
  /** Cicli "cup-upset" vinti (titolo di stagione "giantKiller" assegnato) — per misurare il win rate reale. */
  cupUpsetWinCount: number;
  /** Cicli in cui il club corrente è stato promosso/retrocesso — per verificare l'effetto
   * collaterale di clubTrophyChance (la promozione scatta solo vincendo il campionato). */
  promotionCount: number;
  relegationCount: number;
  /** Archetipo dominante a fine carriera, se emerso — per misurarne la distribuzione. */
  finalArchetype: ArchetypeId | null;
  /** Debito morale finale, 0-100 — per bucket di distribuzione nel report. */
  finalShadow: number;
  /** true se è scattato almeno uno scandalo forzato durante la carriera. */
  hadScandal: boolean;
  /** true se il giocatore ha completato l'evento di redenzione dopo uno scandalo. */
  redeemed: boolean;
  /** Clausola rescissoria all'ultimo club avuto (0 se mai firmato) — per il valore medio nel report. */
  finalReleaseClauseEur: number;
  /** Fit tattico con l'ultimo club avuto (attributi finali) — null se mai firmato. */
  finalTacticalFit: TacticalFit | null;
}

/**
 * Sceglie un'opzione a caso tra quelle disponibili, senza bias di "stile di gioco" — con
 * un'unica eccezione: esclude "Ritirati" dal pool casuale a meno che non sia l'unica opzione.
 * Senza questa esclusione un giocatore simulato smetterebbe volontariamente a 20 anni ogni volta
 * che capita per puro caso su un'opzione di ritiro, il che non riflette come gioca nessuno e
 * falserebbe tutte le frequenze misurate (la carriera durerebbe troppo poco per accumulare nulla).
 */
export function pickUniformOption(decision: Decision, rng: Rng): DecisionOption {
  const nonRetiring = decision.options.filter((o) => !o.retire);
  const pool = nonRetiring.length > 0 ? nonRetiring : decision.options;
  const index = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  return pool[index];
}

/** Valore atteso (pesato sugli esiti) di `extract(effect)` per un'opzione. */
function expectedEffectValue(option: DecisionOption, extract: (effect: PlayerDelta) => number): number {
  const totalWeight = option.outcomes.reduce((sum, o) => sum + o.weight, 0) || 1;
  const weighted = option.outcomes.reduce((sum, o) => sum + o.weight * extract(o.effect), 0);
  return weighted / totalWeight;
}

/**
 * Sceglie l'opzione (tra quelle non di ritiro) che massimizza/minimizza il valore atteso di
 * `extract(effect)` — usato dai picker "diretti" sotto per misurare la raggiungibilità reale di
 * una meccanica per un giocatore che persegue deliberatamente una direzione, a differenza del
 * pavimento pessimistico di `pickUniformOption`.
 */
export function pickExtremeOption(
  decision: Decision,
  extract: (effect: PlayerDelta) => number,
  direction: "max" | "min" = "max",
): DecisionOption {
  const nonRetiring = decision.options.filter((o) => !o.retire);
  const pool = nonRetiring.length > 0 ? nonRetiring : decision.options;
  const sign = direction === "max" ? 1 : -1;
  return pool.reduce((best, option) =>
    sign * expectedEffectValue(option, extract) > sign * expectedEffectValue(best, extract) ? option : best,
  pool[0]);
}

/** Picker "diretto": persegue sempre le scelte più rischiose (massimo shadowDelta atteso). */
export function pickRiskSeekingOption(decision: Decision): DecisionOption {
  return pickExtremeOption(decision, (effect) => effect.shadowDelta ?? 0, "max");
}

/** Picker "diretto": sceglie sempre il focus di allenamento su un attributo specifico quando disponibile. */
export function makeTrainingFocusPicker(target: AttributeKey): (decision: Decision, rng: Rng) => DecisionOption {
  return (decision, rng) => {
    if (decision.category === "training-focus") {
      const match = decision.options.find((o) => o.trainingFocus === target);
      if (match) return match;
    }
    return pickUniformOption(decision, rng);
  };
}

/** Picker "diretto": persegue sempre il massimo/minimo di un vettore di traitsDelta. */
export function makeTraitDirectedPicker(
  vector: keyof Traits,
  direction: "max" | "min" = "max",
): (decision: Decision, rng: Rng) => DecisionOption {
  return (decision) => pickExtremeOption(decision, (effect) => effect.traitsDelta?.[vector] ?? 0, direction);
}

/** Simula una carriera intera dal debutto al ritiro, per raccogliere statistiche empiriche. */
export function simulateCareer(
  identity: PlayerIdentity,
  speed: GameSpeed,
  rng: Rng = Math.random,
  pickOption: (decision: Decision, rng: Rng) => DecisionOption = pickUniformOption,
): SimulatedCareerResult {
  let player = createPlayer(identity, rng);
  let decision: Decision | null = generateAcademyOffer(identity, rng);
  let category: DecisionCategory = decision.category;
  let context: LoopContext = INITIAL_LOOP_CONTEXT;
  let recentCategories: DecisionCategory[] = [];
  let cyclesPlayed = 0;
  let injuryCount = 0;
  let peakOvr = player.ovr;
  let cupUpsetWinCount = 0;
  let promotionCount = 0;
  let relegationCount = 0;
  const categoryPicks: Partial<Record<DecisionCategory, number>> = {};

  while (decision && !player.retired && cyclesPlayed < MAX_SIMULATED_CYCLES) {
    categoryPicks[category] = (categoryPicks[category] ?? 0) + 1;

    const option = pickOption(decision, rng);
    const result = resolveCycle(player, context, category, option, speed, rng);
    player = result.player;
    context = result.context;
    cyclesPlayed += 1;
    if (result.newInjury) injuryCount += 1;
    if (player.ovr > peakOvr) peakOvr = player.ovr;
    if (result.seasonTitle?.id === "giantKiller") cupUpsetWinCount += 1;
    if (result.clubTierChange === "promoted") promotionCount += 1;
    if (result.clubTierChange === "relegated") relegationCount += 1;

    if (player.retired) break;

    recentCategories = pushRecentCategory(recentCategories, category);
    const next = pickNextDecision(player, context, recentCategories, rng);
    decision = next.decision;
    category = next.category;
    context = next.context;
  }

  const lastClub = player.club ?? player.clubHistory[player.clubHistory.length - 1]?.club ?? null;

  return {
    player,
    cyclesPlayed,
    injuryCount,
    categoryPicks,
    peakOvr,
    cupUpsetWinCount,
    promotionCount,
    relegationCount,
    finalArchetype: deriveArchetype(player.traits, player.shadow).primary,
    finalShadow: player.shadow,
    hadScandal: player.shadowFlags?.scandalOccurred ?? false,
    redeemed: player.shadowFlags?.redeemed ?? false,
    finalReleaseClauseEur: player.releaseClauseEur,
    finalTacticalFit: lastClub ? tacticalFit(player, lastClub) : null,
  };
}
