import type {
  ArchetypeId,
  Decision,
  DecisionCategory,
  DecisionOption,
  GameSpeed,
  Player,
  PlayerIdentity,
} from "@/types/career";
import { createPlayer } from "./engine";
import { generateAcademyOffer } from "./decisions";
import { INITIAL_LOOP_CONTEXT, pickNextDecision, pushRecentCategory, resolveCycle, type LoopContext } from "./loop";
import type { Rng } from "./progression";
import { deriveArchetype } from "./traits";

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
  /** Archetipo dominante a fine carriera, se emerso — per misurarne la distribuzione. */
  finalArchetype: ArchetypeId | null;
  /** Debito morale finale, 0-100 — per bucket di distribuzione nel report. */
  finalShadow: number;
  /** true se è scattato almeno uno scandalo forzato durante la carriera. */
  hadScandal: boolean;
  /** true se il giocatore ha completato l'evento di redenzione dopo uno scandalo. */
  redeemed: boolean;
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

    if (player.retired) break;

    recentCategories = pushRecentCategory(recentCategories, category);
    const next = pickNextDecision(player, context, recentCategories, rng);
    decision = next.decision;
    category = next.category;
    context = next.context;
  }

  return {
    player,
    cyclesPlayed,
    injuryCount,
    categoryPicks,
    peakOvr,
    cupUpsetWinCount,
    finalArchetype: deriveArchetype(player.traits, player.shadow).primary,
    finalShadow: player.shadow,
    hadScandal: player.shadowFlags?.scandalOccurred ?? false,
    redeemed: player.shadowFlags?.redeemed ?? false,
  };
}
