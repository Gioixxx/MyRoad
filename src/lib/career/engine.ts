import type {
  Club,
  ClubStint,
  DecisionOutcome,
  GameSpeed,
  Player,
  PlayerDelta,
  PlayerIdentity,
  Position,
  StatLine,
} from "@/types/career";
import { clamp, ovrDeltaForAge, projectOvr, projectSeasonStats, type Rng } from "./progression";
import { computeMarketValue } from "./market";
import { computeReleaseClauseEur, computeSigningBonusEur, resignSalary } from "./wallet";
import { tacticalFit, tacticalFitMultiplier } from "./tactics";
import { applyTraitsDelta, NEUTRAL_TRAITS } from "./traits";
import { applyShadowDelta } from "./shadow";
import { applyPotentialDelta, rollInitialPotential } from "./potential";
import {
  applyAttributesDelta,
  createAttributesForPosition,
  deriveOvrFromAttributes,
  distributeAttributeGrowth,
  peaksFromAttributes,
} from "./attributes";
import { applyRelationsDelta, initialAgentRelation, relationsOnSign } from "./relations";
import { rollCupTrophy } from "./trophies";
import { pickWeighted } from "../shared/weighted-random";
import { leagueForTier } from "@/data/clubs";
import {
  applySeasonToClub,
  expectedLeagueFinishRank,
  rollLeaguePosition,
  rulesForLeague,
  zoneForPosition,
} from "@/lib/shared/league-season";

export const STARTING_AGE = 16;
export const STARTING_OVR = 50;

/** Margine massimo per stagione con cui gli attributi possono "tirare" l'OVR verso il proprio
 * valore derivato — provvisorio, da tarare con `npm run simulate` (vedi Fase 2). Rinominato da
 * `ATTRIBUTE_PULL_PER_CYCLE`: il nome mentiva, era già documentato e usato come budget
 * per-stagione (moltiplicato per `seasons` per l'intero ciclo) — ora che `advanceOneSeason` è
 * genuinely per-stagione, il nome riflette il valore reale senza bisogno di moltiplicarlo. */
const ATTRIBUTE_PULL_PER_SEASON = 1.5;

/** Regole di fallback, stesso ruolo di `FALLBACK_LEAGUE_RULES` in `season-outcome.ts` — non
 * dovrebbe mai servire per un club realmente in gioco. */
const FALLBACK_LEAGUE_RULES = { size: 20, titleSpots: 1, continentalSpots: 0, promotionSpots: 0, relegationSpots: 0 };

/** Stagioni tra una decisione e l'altra per modalità — osservato sul gioco originale:
 * Normal esplicitamente "every 2 seasons"; Express osservato a passi di 3 (16→19→22...);
 * Intense non osservato direttamente, dedotto come il passo più fitto (1). */
export const SEASONS_PER_CYCLE: Record<GameSpeed, number> = {
  intense: 1,
  normal: 2,
  express: 3,
};

/** Popolarità iniziale di un giovane sconosciuto al debutto. */
export const STARTING_POPULARITY = 15;

/** Sotto questa età il ritiro non è mai possibile — allargata da 34 a 31 dopo aver osservato
 * ritiri probabilistici già a 31-34 anni sul gioco originale (vedi piano, esplorazione
 * aggiuntiva 5, 23 carriere su 3 agenti paralleli). */
const RETIREMENT_RISK_START_AGE = 31;
/** Da questa età il ritiro è automatico — soglia allineata a 3 osservazioni concordanti sul
 * gioco originale (vedi piano, esplorazione aggiuntiva 3). */
const RETIREMENT_AUTOMATIC_AGE = 40;

export function createPlayer(identity: PlayerIdentity, rng: Rng = Math.random): Player {
  const attributes = createAttributesForPosition(identity.position, rng);
  return {
    ...identity,
    age: STARTING_AGE,
    ovr: STARTING_OVR,
    potential: rollInitialPotential(rng),
    marketValueEur: computeMarketValue(STARTING_OVR, STARTING_AGE),
    career: { apps: 0, goals: 0, assists: 0 },
    club: null,
    clubHistory: [],
    nationalTeam: { called: false, apps: 0, goals: 0, assists: 0 },
    trophies: [],
    awards: [],
    retired: false,
    injury: null,
    wallet: { salaryEurPerCycle: 0, savingsEur: 0 },
    popularity: STARTING_POPULARITY,
    milestonesReached: [],
    records: {
      bestSeasonGoals: 0,
      bestSeasonAssists: 0,
      bestSeasonApps: 0,
      peakMarketValueEur: computeMarketValue(STARTING_OVR, STARTING_AGE),
      firstCallupAge: null,
    },
    seasonTitles: [],
    currentObjective: null,
    objectiveKindsCelebrated: [],
    traits: NEUTRAL_TRAITS,
    shadow: 0,
    shadowFlags: {},
    attributes,
    trainingFocus: null,
    playStyles: [],
    releaseClauseEur: 0,
    attributePeaks: peaksFromAttributes(attributes),
    relations: [initialAgentRelation(identity.lastName, identity.nationality)],
  };
}

/** Cambia il ruolo in campo del giocatore — gli attributi restano invariati, ma da questo
 * momento vengono ripesati automaticamente per il nuovo ruolo (deriveOvrFromAttributes/
 * ROLE_WEIGHTS sono già chiavati per Position). Nessun rimappaggio manuale necessario. */
export function changePosition(player: Player, newPosition: Position): Player {
  return { ...player, position: newPosition };
}

/**
 * Firma per un nuovo club (academy offer, transfer window, prestito): aggiorna anche stipendio e
 * clausola rescissoria. Il bonus alla firma si applica solo su un vero cambio di club, non su
 * "resta"/rinnovo (stesso club di prima).
 */
export function signWithClub(player: Player, club: Club): Player {
  const isNewClub = player.club?.id !== club.id;
  let wallet = resignSalary(player.wallet, player.ovr, club.prestige);
  if (isNewClub) {
    wallet = { ...wallet, savingsEur: wallet.savingsEur + computeSigningBonusEur(wallet.salaryEurPerCycle) };
  }
  return {
    ...player,
    club,
    wallet,
    releaseClauseEur: computeReleaseClauseEur(player.marketValueEur, player.age, club.prestige),
    relations: relationsOnSign(player, club, isNewClub),
  };
}

/** Cambia la nazionalità del giocatore (evento "nonno di un altro paese", non ripetibile). */
export function switchNationality(player: Player, nationality: string): Player {
  return { ...player, nationality, hasSwitchedNationality: true };
}

export function sumStats(a: StatLine, b: StatLine): StatLine {
  const result: StatLine = {
    apps: a.apps + b.apps,
    goals: a.goals + b.goals,
    assists: a.assists + b.assists,
  };
  if (a.goalsAgainst !== undefined || b.goalsAgainst !== undefined) {
    result.goalsAgainst = (a.goalsAgainst ?? 0) + (b.goalsAgainst ?? 0);
  }
  if (a.cleanSheets !== undefined || b.cleanSheets !== undefined) {
    result.cleanSheets = (a.cleanSheets ?? 0) + (b.cleanSheets ?? 0);
  }
  return result;
}

interface OneSeasonResult {
  stint: ClubStint;
  nextClub: Club;
  nextOvr: number;
  nextAttributes: ReturnType<typeof distributeAttributeGrowth>;
}

/**
 * Fa avanzare il giocatore di **una** stagione al club dato: tira il piazzamento (motore
 * condiviso `lib/shared/league-season.ts`, stessa formula "rating→rank atteso" dell'allenatore
 * con l'OVR al posto della reputazione), aggiorna OVR/attributi/statistiche di questa sola
 * stagione, applica l'eventuale movimento di categoria **prima** di restituire il club per la
 * stagione successiva dello stesso ciclo — mirror di `advanceOneSeason` allenatore.
 */
function advanceOneSeason(
  player: Pick<Player, "position" | "potential" | "trainingFocus" | "playStyles">,
  club: Club,
  ovr: number,
  attributes: OneSeasonResult["nextAttributes"],
  age: number,
  cycleId: number,
  stintType: "permanent" | "loan",
  fitMultiplier: number,
  trophyChanceBonus: number,
  rng: Rng,
): OneSeasonResult {
  const ageFrom = age;
  const ageTo = age + 1;

  const ageBasedOvr = projectOvr(ovr, ageFrom, 1, player.potential, rng);

  // Gli attributi crescono in parallelo (budget derivato dalla stessa curva età-based) e
  // "tirano" l'OVR verso il proprio valore derivato, ma solo entro un margine bounded per
  // stagione — mai abbastanza da sovrastare la curva già calibrata o cancellare un ovrDelta
  // narrativo appena applicato (vedi piano, Fase 2).
  const growthBudget = ovrDeltaForAge(ageFrom);
  const nextAttributes = distributeAttributeGrowth({
    attributes,
    position: player.position,
    totalGrowthBudget: growthBudget,
    focusAttribute: player.trainingFocus,
    rng,
  });
  const derivedOvr = deriveOvrFromAttributes(nextAttributes, player.position);
  const pull = clamp(derivedOvr - ageBasedOvr, -ATTRIBUTE_PULL_PER_SEASON, ATTRIBUTE_PULL_PER_SEASON);
  const nextOvr = clamp(Math.round(ageBasedOvr + pull), 35, player.potential);

  const seasonStats = projectSeasonStats(ovr, player.position, club.tier, rng, player.playStyles, fitMultiplier);

  const league = leagueForTier(club.country, club.tier);
  const rules = league ? rulesForLeague(league) : FALLBACK_LEAGUE_RULES;
  const expectedRank = expectedLeagueFinishRank(club.prestige, ovr) * fitMultiplier;
  const position = rollLeaguePosition(expectedRank, rules, rng);
  const zone = zoneForPosition(position, rules);
  const cupWon = rollCupTrophy(club, ovr, rng, trophyChanceBonus);

  const movement = applySeasonToClub(club, zone);

  const stint: ClubStint = {
    club,
    ageFrom,
    ageTo,
    type: stintType,
    stats: seasonStats,
    ovr: nextOvr,
    leaguePosition: position,
    leagueSize: rules.size,
    zone,
    cupWon,
    cycleId,
    clubTierChange: movement.change,
  };

  return { stint, nextClub: movement.club, nextOvr, nextAttributes };
}

/**
 * Fa avanzare il giocatore di N stagioni al club corrente: **una `ClubStint` per stagione** (era
 * una per ciclo prima del wiring "Due classifiche") — tutte le stint create qui condividono lo
 * stesso `cycleId`, incrementato una volta per chiamata (non per stagione).
 */
export function advanceSeasons(
  player: Player,
  seasons: number,
  rng: Rng = Math.random,
  stintType: "permanent" | "loan" = "permanent",
  /** Bonus percentuale additivo alla chance di coppa nazionale (playstyle "Muro difensivo") —
   * applicato ad ogni stagione del ciclo, stesso ruolo di prima quando era applicato una sola
   * volta per ciclo dentro `rollClubTrophies` (chiamato da `loop.ts`). */
  trophyChanceBonus = 0,
): Player {
  if (!player.club) {
    throw new Error("Il giocatore deve avere un club per accumulare stagioni");
  }
  if (seasons <= 0) {
    throw new Error("Il numero di stagioni deve essere positivo");
  }

  const cycleId = (player.cyclesPlayed ?? 0) + 1;
  const fitMultiplier = tacticalFitMultiplier(tacticalFit(player, player.club));

  let club = player.club;
  let ovr = player.ovr;
  let attributes = player.attributes;
  let age = player.age;
  let career = player.career;
  const stints: ClubStint[] = [];

  for (let i = 0; i < seasons; i++) {
    const result = advanceOneSeason(
      player,
      club,
      ovr,
      attributes,
      age,
      cycleId,
      stintType,
      fitMultiplier,
      trophyChanceBonus,
      rng,
    );
    stints.push(result.stint);
    club = result.nextClub;
    ovr = result.nextOvr;
    attributes = result.nextAttributes;
    career = sumStats(career, result.stint.stats);
    age += 1;
  }

  const nextPeaks = (() => {
    const current = peaksFromAttributes(attributes);
    const prev = player.attributePeaks ?? current;
    return {
      pace: Math.max(prev.pace, current.pace),
      physical: Math.max(prev.physical, current.physical),
    };
  })();

  return {
    ...player,
    age,
    ovr,
    attributes,
    attributePeaks: nextPeaks,
    marketValueEur: computeMarketValue(ovr, age),
    career,
    club,
    clubHistory: [...player.clubHistory, ...stints],
    cyclesPlayed: cycleId,
  };
}

/** Applica l'effetto di un outcome di decisione (es. +3 OVR, -2 OVR, infortunio, popolarità). */
export function applyDelta(player: Player, delta: PlayerDelta): Player {
  const nextPotential =
    delta.potentialDelta !== undefined
      ? applyPotentialDelta(player.potential, delta.potentialDelta)
      : player.potential;
  const nextOvr = clamp(player.ovr + (delta.ovrDelta ?? 0), 30, nextPotential);
  const nextPopularity = clamp(player.popularity + (delta.popularityDelta ?? 0), 0, 100);
  const nextInjury = delta.injury !== undefined ? delta.injury : player.injury;
  return {
    ...player,
    ovr: nextOvr,
    potential: nextPotential,
    marketValueEur: computeMarketValue(nextOvr, player.age),
    popularity: nextPopularity,
    injury: nextInjury,
    wallet:
      delta.savingsDelta !== undefined
        ? { ...player.wallet, savingsEur: player.wallet.savingsEur + delta.savingsDelta }
        : player.wallet,
    traits: delta.traitsDelta ? applyTraitsDelta(player.traits, delta.traitsDelta) : player.traits,
    shadow: delta.shadowDelta !== undefined ? applyShadowDelta(player.shadow, delta.shadowDelta) : player.shadow,
    shadowFlags: delta.shadowFlags ? { ...player.shadowFlags, ...delta.shadowFlags } : player.shadowFlags,
    attributes: delta.attributesDelta
      ? applyAttributesDelta(player.attributes, delta.attributesDelta)
      : player.attributes,
    releaseClauseEur: delta.releaseClauseEur ?? player.releaseClauseEur,
    relations: delta.relationsDelta
      ? applyRelationsDelta(player.relations ?? [], delta.relationsDelta)
      : (player.relations ?? []),
  };
}

/** Estrae un outcome pesato tra quelli disponibili per un'opzione di decisione. */
export function resolveOutcome(
  outcomes: DecisionOutcome[],
  rng: Rng = Math.random,
): DecisionOutcome {
  if (outcomes.length === 0) {
    throw new Error("Un'opzione di decisione deve avere almeno un outcome");
  }
  return pickWeighted(outcomes, (o) => o.weight, rng);
}

/** Ritiro probabilistico crescente dai 31 anni, automatico da 40 (vedi costanti sopra). */
export function checkRetirement(player: Player, rng: Rng = Math.random): boolean {
  if (player.age < RETIREMENT_RISK_START_AGE) return false;
  if (player.age >= RETIREMENT_AUTOMATIC_AGE) return true;
  const progress =
    (player.age - RETIREMENT_RISK_START_AGE) /
    (RETIREMENT_AUTOMATIC_AGE - RETIREMENT_RISK_START_AGE);
  // Cubica invece di quadratica: con la finestra allargata a 31 anni, il quadrato da solo
  // spostava troppo peso verso i ritiri anticipati (~50% a 40 anni scendeva a ~22%, contro un
  // ~50% osservato nella ricerca sull'originale) — il cubo tiene il grosso della probabilità
  // vicino al taglio automatico (40) aggiungendo solo una coda minoritaria a 32-34 anni,
  // verificato con `npm run simulate` (vedi [[decisions]]).
  const chance = clamp(progress * progress * progress, 0, 1);
  return rng() < chance;
}

export function retire(player: Player): Player {
  return { ...player, retired: true, club: null };
}
