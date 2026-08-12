import type {
  Award,
  Club,
  Decision,
  DecisionCategory,
  DecisionOption,
  GameSpeed,
  Injury,
  Player,
  PlayStyleId,
  SeasonTitleEntry,
  Trophy,
} from "@/types/career";
import {
  applyDelta,
  advanceSeasons,
  changePosition,
  checkRetirement,
  resolveOutcome,
  retire,
  signWithClub,
  switchNationality,
  SEASONS_PER_CYCLE,
} from "./engine";
import { rollInjury, tickInjury } from "./injuries";
import { clamp, projectNationalStats, type Rng } from "./progression";
import { computeMarketValue } from "./market";
import {
  brokenRecordLabels,
  buildHighlightReel,
  detectOvrMilestones,
  evaluateObjective,
  evaluateSeasonTitle,
  pushSeasonTitle,
  rollCycleObjective,
  updatePersonalRecords,
  type CycleSatisfactionContext,
} from "./satisfaction";
import { accrueSalary, applyPopularityDelta, popularityDeltaForCycle } from "./wallet";
import {
  clauseActivationChance,
  clauseActivationSuitorPool,
  generateAgentNegotiation,
  generateClauseActivationDecision,
  generateClubCrisis,
  generateClubPriority,
  generateCompetitionForSpot,
  generateContinentalFinalDecision,
  generateControversialPost,
  generateControversialStatement,
  generateCupUpsetDecision,
  generateEndOfCycle,
  generateLoanOffer,
  generateLoanReturn,
  generateNationalitySwitch,
  generatePositionChangeDecision,
  generateRedemptionDecision,
  generateReturnHome,
  generateScandalDecision,
  generateSponsorDeal,
  generateTaxTrouble,
  generateTrainingFocusDecision,
  generateTransferWindow,
  generateTriumphantReturn,
  generateUnexpectedProspect,
  isAgentEligible,
  isClubPriorityEligible,
  isNationalitySwitchEligible,
  isReturnHomeEligible,
  isSponsorEligible,
  isTaxTroubleEligible,
  isTriumphantReturnEligible,
  isUnexpectedProspectEligible,
  LIFESTYLE_DECISIONS,
  pickClauseActivationSuitor,
  pickCupUpsetOpponent,
  pickDecisionCategory,
  rollNationalCallup,
} from "./decisions";
import { rollAward, rollClubTrophies, rollNationalTrophies } from "./trophies";
import { applyClubTierMovement } from "./club-progression";
import { isRedemptionEligible, shouldTriggerScandal } from "./shadow";
import { applyTraitsDelta } from "./traits";
import { applyPotentialDelta, evaluatePotentialGrowth } from "./potential";
import { detectNewPlayStyles, playStyleInjuryMultiplier, playStyleTrophyBonus } from "./playstyles";
import { getCountry } from "@/data/countries";

/** Convocazione in nazionale come fonte di leadership (vedi §1: "capitano, difesa compagni, nazionale"). */
const NATIONAL_CALLUP_LEADERSHIP_BONUS = 6;

export interface LoopContext {
  /** Club "di appartenenza" mentre si è in prestito altrove; null se non in prestito. */
  loanParentClub: Club | null;
  /** Ultimi "kind" di evento scelti dentro club-crisis/lifestyle/narrative (anti-ripetizione). */
  recentDecisionIds?: string[];
  /**
   * Rimbalzi consecutivi ("vai in prestito altrove" scelto dentro un evento loan-return) nello
   * stesso giro di prestito. Oltre MAX_LOAN_RETURN_BOUNCES, il prossimo loan-return si risolve
   * comunque (il club lo trattiene), a prescindere dall'opzione scelta — evita che il giocatore
   * resti bloccato a ripetere loan-return indefinitamente (vedi availableCategories sotto, che
   * forza questa categoria ad ogni ciclo finché loanParentClub è valorizzato).
   */
  loanReturnBounces?: number;
}

export const INITIAL_LOOP_CONTEXT: LoopContext = { loanParentClub: null };

/** Numero massimo di rimbalzi "vai in prestito altrove" consecutivi prima della risoluzione forzata. */
const MAX_LOAN_RETURN_BOUNCES = 1;

const MIN_CONTINENTAL_FINAL_OVR = 78;
const CONTINENTAL_FINAL_CHANCE = 0.15;

/** Un club è eleggibile alla sorpresa di coppa fino a questo prestige incluso (club "sottodotato"). */
const CUP_UPSET_MAX_CLUB_PRESTIGE = 1;
/** Sotto la chance della finale continentale, così i due eventi decisivi non competono troppo spesso. */
const CUP_UPSET_CHANCE = 0.12;

const RECENT_DECISIONS_WINDOW = 4;
const EVENT_REPEAT_PENALTY = 0.2;

interface KindedGenerator {
  kind: string;
  build: () => Decision;
}

interface PickedDecision {
  decision: Decision;
  kind: string;
}

/** Sceglie tra generatori penalizzando (non escludendo) quelli scelti di recente — stesso principio di pickDecisionCategory, applicato al singolo evento invece che alla categoria. */
function pickWeightedByKind(items: KindedGenerator[], recentDecisionIds: string[], rng: Rng): PickedDecision {
  const weighted = items.map((item) => ({
    item,
    weight: recentDecisionIds.includes(item.kind) ? EVENT_REPEAT_PENALTY : 1,
  }));
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = rng() * totalWeight;
  for (const w of weighted) {
    roll -= w.weight;
    if (roll < 0) return { decision: w.item.build(), kind: w.item.kind };
  }
  const last = weighted[weighted.length - 1].item;
  return { decision: last.build(), kind: last.kind };
}

function pushRecentDecisionId(recentDecisionIds: string[], kind: string): string[] {
  return [...recentDecisionIds, kind].slice(-RECENT_DECISIONS_WINDOW);
}

/** Categorie disponibili in un dato ciclo, in base allo stato del giocatore. */
export function availableCategories(player: Player, context: LoopContext): DecisionCategory[] {
  if (context.loanParentClub) {
    return ["loan-return"];
  }
  if (!player.club) {
    return ["end-of-cycle"];
  }
  const categories: DecisionCategory[] = [
    "transfer",
    "loan",
    "lifestyle",
    "club-crisis",
    "end-of-cycle",
    "training-focus",
  ];
  // Il cambio di ruolo funzionale non ha senso per i portieri (nessuna adiacenza GK↔outfield).
  if (player.position !== "GK") {
    categories.push("position-change");
  }
  if (
    isTaxTroubleEligible(player) ||
    isReturnHomeEligible(player) ||
    isUnexpectedProspectEligible(player) ||
    isTriumphantReturnEligible(player) ||
    isNationalitySwitchEligible(player) ||
    isRedemptionEligible(player)
  ) {
    categories.push("narrative");
  }
  if (isSponsorEligible(player)) {
    categories.push("sponsor");
  }
  if (isAgentEligible(player)) {
    categories.push("agent");
  }
  return categories;
}

export function shouldTriggerContinentalFinal(
  player: Player,
  context: LoopContext,
  rng: Rng = Math.random,
): boolean {
  if (context.loanParentClub) return false;
  if (!player.club?.competitions.continental) return false;
  if (player.ovr < MIN_CONTINENTAL_FINAL_OVR) return false;
  return rng() < CONTINENTAL_FINAL_CHANCE;
}

export function shouldTriggerCupUpset(
  player: Player,
  context: LoopContext,
  rng: Rng = Math.random,
): boolean {
  if (context.loanParentClub) return false;
  if (!player.club?.competitions.cup) return false;
  if (player.club.prestige > CUP_UPSET_MAX_CLUB_PRESTIGE) return false;
  return rng() < CUP_UPSET_CHANCE;
}

/** Un club rivale attiva la clausola rescissoria — probabilità gated su un pretendente eleggibile
 * esistente e su quanto la clausola è "conveniente" (vedi `clauseActivationChance`). */
export function shouldTriggerClauseActivation(
  player: Player,
  context: LoopContext,
  rng: Rng = Math.random,
): boolean {
  if (context.loanParentClub) return false;
  if (!player.club) return false;
  if (player.releaseClauseEur <= 0) return false;
  if (clauseActivationSuitorPool(player).length === 0) return false;
  return rng() < clauseActivationChance(player);
}

/** "Finish high school" ha senso solo a inizio carriera — unico evento del pool con un gate d'età. */
function pickStaticDecision(
  category: DecisionCategory,
  player: Player,
  recentDecisionIds: string[],
  rng: Rng,
): PickedDecision {
  const pool = LIFESTYLE_DECISIONS.filter((d) => {
    if (d.category !== category) return false;
    if (d.id === "finish-high-school" && player.age > 17) return false;
    return true;
  });
  const items: KindedGenerator[] = pool.map((d) => ({ kind: d.id, build: () => d }));
  return pickWeightedByKind(items, recentDecisionIds, rng);
}

function pickClubCrisisDecision(player: Player, recentDecisionIds: string[], rng: Rng): PickedDecision {
  const generators: KindedGenerator[] = [
    { kind: "club-crisis", build: () => generateClubCrisis(player, rng) },
    { kind: "competition-for-spot", build: () => generateCompetitionForSpot(player, rng) },
    { kind: "controversial-statement", build: () => generateControversialStatement(player, rng) },
    { kind: "controversial-post", build: () => generateControversialPost(player, rng) },
  ];
  if (isClubPriorityEligible(player)) {
    generators.push({ kind: "club-priority", build: () => generateClubPriority(player) });
  }
  return pickWeightedByKind(generators, recentDecisionIds, rng);
}

function pickNarrativeDecision(player: Player, recentDecisionIds: string[], rng: Rng): PickedDecision {
  const generators: KindedGenerator[] = [];
  if (isTaxTroubleEligible(player)) {
    generators.push({ kind: "tax-trouble", build: () => generateTaxTrouble(player, rng) });
  }
  if (isReturnHomeEligible(player)) {
    generators.push({ kind: "return-home", build: () => generateReturnHome(player, rng) });
  }
  if (isUnexpectedProspectEligible(player)) {
    generators.push({ kind: "unexpected-prospect", build: () => generateUnexpectedProspect(player, rng) });
  }
  if (isTriumphantReturnEligible(player)) {
    generators.push({ kind: "triumphant-return", build: () => generateTriumphantReturn(player) });
  }
  if (isNationalitySwitchEligible(player)) {
    generators.push({ kind: "nationality-switch", build: () => generateNationalitySwitch(player, rng) });
  }
  if (isRedemptionEligible(player)) {
    generators.push({ kind: "redemption", build: () => generateRedemptionDecision(player) });
  }
  if (generators.length === 0) {
    throw new Error("Nessun evento narrativo disponibile per questo giocatore");
  }
  return pickWeightedByKind(generators, recentDecisionIds, rng);
}

export interface NextDecision {
  decision: Decision;
  category: DecisionCategory;
  context: LoopContext;
}

/** Sceglie la prossima decisione del ciclo, gestendo eventi speciali (coppa continentale) e categorie ordinarie. */
export function pickNextDecision(
  player: Player,
  context: LoopContext,
  recentCategories: DecisionCategory[],
  rng: Rng = Math.random,
): NextDecision {
  if (shouldTriggerContinentalFinal(player, context, rng)) {
    return {
      decision: generateContinentalFinalDecision(player, player.club!.competitions.continental!, rng),
      category: "continental-final",
      context,
    };
  }

  if (shouldTriggerCupUpset(player, context, rng)) {
    const opponent = pickCupUpsetOpponent(player.club!, rng);
    return {
      decision: generateCupUpsetDecision(player, opponent, player.club!.competitions.cup!, rng),
      category: "cup-upset",
      context,
    };
  }

  if (shouldTriggerClauseActivation(player, context, rng)) {
    const suitor = pickClauseActivationSuitor(player, rng)!;
    return {
      decision: generateClauseActivationDecision(player, suitor),
      category: "clause-activation",
      context,
    };
  }

  if (shouldTriggerScandal(player, recentCategories)) {
    return { decision: generateScandalDecision(player), category: "scandal", context };
  }

  const categories = availableCategories(player, context);
  const category = pickDecisionCategory(categories, recentCategories, rng);
  const recentDecisionIds = context.recentDecisionIds ?? [];

  switch (category) {
    case "transfer":
      return { decision: generateTransferWindow(player, rng), category, context };
    case "loan":
      return { decision: generateLoanOffer(player, rng), category, context };
    case "loan-return": {
      if (!context.loanParentClub) {
        throw new Error("loan-return richiede un club di appartenenza nel contesto");
      }
      return { decision: generateLoanReturn(player, context.loanParentClub, rng), category, context };
    }
    case "club-crisis": {
      const picked = pickClubCrisisDecision(player, recentDecisionIds, rng);
      return {
        decision: picked.decision,
        category,
        context: { ...context, recentDecisionIds: pushRecentDecisionId(recentDecisionIds, picked.kind) },
      };
    }
    case "end-of-cycle":
      return { decision: generateEndOfCycle(player, rng), category, context };
    case "lifestyle": {
      const picked = pickStaticDecision(category, player, recentDecisionIds, rng);
      return {
        decision: picked.decision,
        category,
        context: { ...context, recentDecisionIds: pushRecentDecisionId(recentDecisionIds, picked.kind) },
      };
    }
    case "position-change":
      return { decision: generatePositionChangeDecision(player, rng), category, context };
    case "training-focus":
      return { decision: generateTrainingFocusDecision(player), category, context };
    case "narrative": {
      const picked = pickNarrativeDecision(player, recentDecisionIds, rng);
      return {
        decision: picked.decision,
        category,
        context: { ...context, recentDecisionIds: pushRecentDecisionId(recentDecisionIds, picked.kind) },
      };
    }
    case "sponsor":
      return { decision: generateSponsorDeal(player, rng), category, context };
    case "agent":
      return { decision: generateAgentNegotiation(player), category, context };
    default:
      throw new Error(`Categoria di decisione non gestita nel loop: ${category}`);
  }
}

/** Calcola il prossimo contesto (club di appartenenza in prestito) dopo aver risolto un'opzione. */
export function nextLoopContext(
  category: DecisionCategory,
  option: DecisionOption,
  playerBeforeChange: Player,
  context: LoopContext,
): LoopContext {
  if (category === "loan") {
    return { loanParentClub: playerBeforeChange.club };
  }
  if (category === "loan-return") {
    if (option.id === "sign-permanent") {
      return { loanParentClub: null };
    }
    const bounces = context.loanReturnBounces ?? 0;
    if (bounces >= MAX_LOAN_RETURN_BOUNCES) {
      return { loanParentClub: null };
    }
    return { ...context, loanReturnBounces: bounces + 1 };
  }
  if (option.club) {
    return { loanParentClub: null };
  }
  return context;
}

export interface CycleResult {
  player: Player;
  context: LoopContext;
  retired: boolean;
  optionLabel: string;
  outcomeText: string;
  newTrophies: Trophy[];
  newAward: Award | null;
  nationalCallup: boolean;
  newInjury: Injury | null;
  injuryHealed: boolean;
  newMilestones: number[];
  seasonTitle: SeasonTitleEntry | null;
  objectiveResult: { label: string; met: boolean; firstTime: boolean } | null;
  brokenRecords: string[];
  highlights: string[];
  clubTierChange: "promoted" | "relegated" | null;
  newPlayStyles: PlayStyleId[];
}

function emptySatisfactionFields(): Pick<
  CycleResult,
  "newMilestones" | "seasonTitle" | "objectiveResult" | "brokenRecords" | "highlights"
> {
  return {
    newMilestones: [],
    seasonTitle: null,
    objectiveResult: null,
    brokenRecords: [],
    highlights: [],
  };
}

/** Fa avanzare l'infortunio del giocatore di un ciclo, o ne estrae uno nuovo, aggiustando l'OVR. */
function processInjuries(
  player: Player,
  seasons: number,
  rng: Rng,
): { player: Player; newInjury: Injury | null; injuryHealed: boolean } {
  if (player.injury) {
    const ticked = tickInjury(player.injury);
    if (ticked === null) {
      const restoredOvr = clamp(player.ovr + player.injury.ovrPenalty, 30, player.potential);
      return {
        player: {
          ...player,
          injury: null,
          ovr: restoredOvr,
          marketValueEur: computeMarketValue(restoredOvr, player.age),
        },
        newInjury: null,
        injuryHealed: true,
      };
    }
    return { player: { ...player, injury: ticked }, newInjury: null, injuryHealed: false };
  }

  const rolled = rollInjury(player.age, player.position, seasons, rng, playStyleInjuryMultiplier(player.playStyles));
  if (!rolled) {
    return { player, newInjury: null, injuryHealed: false };
  }
  const penalizedOvr = clamp(player.ovr - rolled.ovrPenalty, 30, player.potential);
  return {
    player: {
      ...player,
      injury: rolled,
      ovr: penalizedOvr,
      marketValueEur: computeMarketValue(penalizedOvr, player.age),
    },
    newInjury: rolled,
    injuryHealed: false,
  };
}

/** Applica l'esito di un'opzione scelta dal giocatore: delta, cambio club/ritiro, avanzamento stagioni, trofei/award/nazionale. */
export function resolveCycle(
  player: Player,
  context: LoopContext,
  category: DecisionCategory,
  option: DecisionOption,
  speed: GameSpeed,
  rng: Rng = Math.random,
): CycleResult {
  const ovrBefore = player.ovr;
  const wasAlreadyCalled = player.nationalTeam.called;
  const pendingObjective = player.currentObjective;

  const outcome = resolveOutcome(option.outcomes, rng);
  let nextPlayer = applyDelta(player, outcome.effect);

  if (option.retire) {
    nextPlayer = retire(nextPlayer);
    return {
      player: nextPlayer,
      context,
      retired: true,
      optionLabel: option.label,
      outcomeText: outcome.resultText,
      newTrophies: [],
      newAward: null,
      nationalCallup: false,
      newInjury: null,
      injuryHealed: false,
      clubTierChange: null,
      newPlayStyles: [],
      ...emptySatisfactionFields(),
    };
  }

  if (option.club) {
    nextPlayer = signWithClub(nextPlayer, option.club);
  }

  if (option.newNationality) {
    nextPlayer = switchNationality(nextPlayer, option.newNationality);
  }

  if (option.newPosition) {
    nextPlayer = changePosition(nextPlayer, option.newPosition);
  }

  if (option.trainingFocus !== undefined) {
    nextPlayer = { ...nextPlayer, trainingFocus: option.trainingFocus };
  }

  const nextContext = nextLoopContext(category, option, player, context);
  const stintType = nextContext.loanParentClub ? "loan" : "permanent";
  const seasons = SEASONS_PER_CYCLE[speed];
  nextPlayer = advanceSeasons(nextPlayer, seasons, rng, stintType);

  // Rilevato subito dopo la crescita degli attributi del ciclo, così un playstyle appena
  // sbloccato si applica già ai roll (infortunio/trofeo/callup) dello stesso ciclo.
  const newPlayStyles = detectNewPlayStyles(nextPlayer);
  if (newPlayStyles.length > 0) {
    nextPlayer = { ...nextPlayer, playStyles: [...nextPlayer.playStyles, ...newPlayStyles] };
  }

  const injuryResult = processInjuries(nextPlayer, seasons, rng);
  nextPlayer = injuryResult.player;
  nextPlayer = { ...nextPlayer, wallet: accrueSalary(nextPlayer.wallet, seasons) };

  const newTrophies: Trophy[] = nextPlayer.club
    ? rollClubTrophies(nextPlayer.club, nextPlayer.ovr, nextPlayer.age, rng, playStyleTrophyBonus(nextPlayer.playStyles))
    : [];

  if (category === "continental-final" && nextPlayer.club?.competitions.continental) {
    if (outcome.continentalWin === true) {
      newTrophies.push({
        competition: nextPlayer.club.competitions.continental,
        club: nextPlayer.club,
        age: nextPlayer.age,
      });
    }
  }

  if (category === "cup-upset" && nextPlayer.club?.competitions.cup) {
    if (outcome.cupUpsetWin === true) {
      newTrophies.push({
        competition: nextPlayer.club.competitions.cup,
        club: nextPlayer.club,
        age: nextPlayer.age,
      });
    }
  }

  let clubTierChange: "promoted" | "relegated" | null = null;
  if (nextPlayer.club) {
    const wonLeagueTitle = newTrophies.some(
      (t) => t.competition === nextPlayer.club!.competitions.league,
    );
    const movement = applyClubTierMovement(nextPlayer.club, wonLeagueTitle, rng);
    if (movement.change) {
      nextPlayer = { ...nextPlayer, club: movement.club };
      clubTierChange = movement.change;
    }
  }

  let nationalCallup = false;
  let nationalGoalsThisCycle = 0;
  if (rollNationalCallup(nextPlayer, rng)) {
    nextPlayer = {
      ...nextPlayer,
      nationalTeam: { ...nextPlayer.nationalTeam, called: true },
      traits: applyTraitsDelta(nextPlayer.traits, { leadership: NATIONAL_CALLUP_LEADERSHIP_BONUS }),
    };
    nationalCallup = true;
  }

  if (nextPlayer.nationalTeam.called) {
    const natStats = projectNationalStats(nextPlayer.ovr, nextPlayer.position, seasons, rng, nextPlayer.playStyles);
    nationalGoalsThisCycle = natStats.goals;
    nextPlayer = {
      ...nextPlayer,
      nationalTeam: {
        called: true,
        apps: nextPlayer.nationalTeam.apps + natStats.apps,
        goals: nextPlayer.nationalTeam.goals + natStats.goals,
        assists: nextPlayer.nationalTeam.assists + natStats.assists,
        ...(nextPlayer.position === "GK"
          ? {
              goalsAgainst: (nextPlayer.nationalTeam.goalsAgainst ?? 0) + (natStats.goalsAgainst ?? 0),
              cleanSheets: (nextPlayer.nationalTeam.cleanSheets ?? 0) + (natStats.cleanSheets ?? 0),
            }
          : {}),
      },
    };
    const confederation = getCountry(nextPlayer.nationality)?.confederation ?? "UEFA";
    newTrophies.push(...rollNationalTrophies(true, nextPlayer.ovr, nextPlayer.age, confederation, rng));
  }

  if (newTrophies.length > 0) {
    nextPlayer = { ...nextPlayer, trophies: [...nextPlayer.trophies, ...newTrophies] };
  }

  const lastStint = nextPlayer.clubHistory[nextPlayer.clubHistory.length - 1];
  const newAward = rollAward(nextPlayer, lastStint?.stats ?? { apps: 0, goals: 0, assists: 0 }, nextPlayer.age, rng);
  if (newAward) {
    nextPlayer = { ...nextPlayer, awards: [...nextPlayer.awards, newAward] };
  }

  const popularityDelta = popularityDeltaForCycle({
    goals: lastStint?.stats.goals ?? 0,
    cleanSheets: lastStint?.stats.cleanSheets,
    trophiesWon: newTrophies.length,
    awardsWon: newAward ? 1 : 0,
  });
  nextPlayer = {
    ...nextPlayer,
    popularity: applyPopularityDelta(nextPlayer.popularity, popularityDelta),
  };

  const satCtx: CycleSatisfactionContext = {
    age: nextPlayer.age,
    ovrBefore,
    ovrAfter: nextPlayer.ovr,
    goals: lastStint?.stats.goals ?? 0,
    assists: lastStint?.stats.assists ?? 0,
    apps: lastStint?.stats.apps ?? 0,
    cleanSheets: lastStint?.stats.cleanSheets,
    trophies: newTrophies,
    award: newAward,
    newInjury: injuryResult.newInjury,
    injuryHealed: injuryResult.injuryHealed,
    nationalCallup,
    nationalGoals: nationalGoalsThisCycle,
    marketValueEur: nextPlayer.marketValueEur,
    wasAlreadyCalled,
  };

  const newMilestoneEntries = detectOvrMilestones(
    ovrBefore,
    nextPlayer.ovr,
    nextPlayer.milestonesReached,
    nextPlayer.age,
  );
  if (newMilestoneEntries.length > 0) {
    nextPlayer = {
      ...nextPlayer,
      milestonesReached: [...nextPlayer.milestonesReached, ...newMilestoneEntries],
    };
  }

  let objectiveResult: { label: string; met: boolean; firstTime: boolean } | null = null;
  if (pendingObjective) {
    const evaluated = evaluateObjective(pendingObjective, satCtx);
    const alreadyCelebrated = nextPlayer.objectiveKindsCelebrated?.includes(pendingObjective.kind) ?? false;
    const firstTime = evaluated.met && !alreadyCelebrated;
    objectiveResult = { label: pendingObjective.label, met: evaluated.met, firstTime };
    if (evaluated.met) {
      nextPlayer = applyDelta(nextPlayer, evaluated.reward);
      if (firstTime) {
        nextPlayer = {
          ...nextPlayer,
          objectiveKindsCelebrated: [...(nextPlayer.objectiveKindsCelebrated ?? []), pendingObjective.kind],
        };
      }
    }
  }

  const seasonTitle = evaluateSeasonTitle({
    age: nextPlayer.age,
    goals: satCtx.goals,
    assists: satCtx.assists,
    apps: satCtx.apps,
    cleanSheets: satCtx.cleanSheets,
    trophies: newTrophies,
    award: newAward,
    newInjury: injuryResult.newInjury,
    injuryHealed: injuryResult.injuryHealed,
    ovrDelta: nextPlayer.ovr - ovrBefore,
    nationalCallup,
    nationalGoals: nationalGoalsThisCycle,
    cupUpsetWin: outcome.cupUpsetWin === true,
  });
  nextPlayer = {
    ...nextPlayer,
    seasonTitles: pushSeasonTitle(nextPlayer.seasonTitles, seasonTitle),
  };

  const recordsUpdate = updatePersonalRecords(nextPlayer.records, satCtx);
  nextPlayer = { ...nextPlayer, records: recordsUpdate.records };
  const brokenRecords = brokenRecordLabels(recordsUpdate.broken);

  const potentialGrowth = evaluatePotentialGrowth(
    {
      age: nextPlayer.age,
      objectiveMet: objectiveResult?.met ?? false,
      seasonTitleId: seasonTitle.id,
      brokeRecord: recordsUpdate.broken.length > 0,
    },
    rng,
  );
  if (potentialGrowth > 0) {
    nextPlayer = { ...nextPlayer, potential: applyPotentialDelta(nextPlayer.potential, potentialGrowth) };
  }

  const highlights = buildHighlightReel(satCtx, rng);

  if (checkRetirement(nextPlayer, rng)) {
    nextPlayer = retire(nextPlayer);
  }

  if (!nextPlayer.retired) {
    nextPlayer = { ...nextPlayer, currentObjective: rollCycleObjective(nextPlayer, rng) };
  } else {
    nextPlayer = { ...nextPlayer, currentObjective: null };
  }

  return {
    player: nextPlayer,
    context: nextContext,
    retired: nextPlayer.retired,
    optionLabel: option.label,
    outcomeText: outcome.resultText,
    newTrophies,
    newAward,
    nationalCallup,
    newInjury: injuryResult.newInjury,
    injuryHealed: injuryResult.injuryHealed,
    newMilestones: newMilestoneEntries.map((m) => m.ovr),
    seasonTitle,
    objectiveResult,
    brokenRecords,
    highlights,
    clubTierChange,
    newPlayStyles,
  };
}

const RECENT_CATEGORIES_WINDOW = 3;

export function pushRecentCategory(
  recentCategories: DecisionCategory[],
  category: DecisionCategory,
): DecisionCategory[] {
  return [...recentCategories, category].slice(-RECENT_CATEGORIES_WINDOW);
}
