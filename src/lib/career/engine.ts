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
import { clamp, projectOvr, projectStats, sumOvrDeltaForAge, type Rng } from "./progression";
import { computeMarketValue } from "./market";
import { resignSalary } from "./wallet";
import { applyTraitsDelta, NEUTRAL_TRAITS } from "./traits";
import { applyShadowDelta } from "./shadow";
import { applyPotentialDelta, rollInitialPotential } from "./potential";
import {
  applyAttributesDelta,
  createAttributesForPosition,
  deriveOvrFromAttributes,
  distributeAttributeGrowth,
} from "./attributes";

export const STARTING_AGE = 16;
export const STARTING_OVR = 50;

/** Margine massimo (per stagione nel ciclo) con cui gli attributi possono "tirare" l'OVR verso
 * il proprio valore derivato — provvisorio, da tarare con `npm run simulate` (vedi Fase 2). */
const ATTRIBUTE_PULL_PER_CYCLE = 1.5;

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
    objectiveMomentShown: false,
    traits: NEUTRAL_TRAITS,
    shadow: 0,
    shadowFlags: {},
    attributes: createAttributesForPosition(identity.position, rng),
    trainingFocus: null,
    playStyles: [],
  };
}

/** Cambia il ruolo in campo del giocatore — gli attributi restano invariati, ma da questo
 * momento vengono ripesati automaticamente per il nuovo ruolo (deriveOvrFromAttributes/
 * ROLE_WEIGHTS sono già chiavati per Position). Nessun rimappaggio manuale necessario. */
export function changePosition(player: Player, newPosition: Position): Player {
  return { ...player, position: newPosition };
}

/** Firma per un nuovo club (academy offer, transfer window, prestito): aggiorna anche lo stipendio. */
export function signWithClub(player: Player, club: Club): Player {
  return { ...player, club, wallet: resignSalary(player.wallet, player.ovr, club.prestige) };
}

/** Cambia la nazionalità del giocatore (evento "nonno di un altro paese", non ripetibile). */
export function switchNationality(player: Player, nationality: string): Player {
  return { ...player, nationality, hasSwitchedNationality: true };
}

function sumStats(a: StatLine, b: StatLine): StatLine {
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

/**
 * Fa avanzare il giocatore di N stagioni al club corrente: aggiorna età, OVR, valore
 * di mercato, statistiche cumulative e aggiunge una riga a `clubHistory` per il ciclo
 * (replica il comportamento osservato: una riga per ciclo, non un accorpamento per club).
 */
export function advanceSeasons(
  player: Player,
  seasons: number,
  rng: Rng = Math.random,
  stintType: "permanent" | "loan" = "permanent",
): Player {
  if (!player.club) {
    throw new Error("Il giocatore deve avere un club per accumulare stagioni");
  }
  if (seasons <= 0) {
    throw new Error("Il numero di stagioni deve essere positivo");
  }

  const ageFrom = player.age;
  const ageTo = ageFrom + seasons;
  const ageBasedOvr = projectOvr(player.ovr, ageFrom, seasons, player.potential, rng);

  // Gli attributi crescono in parallelo (budget derivato dalla stessa curva età-based) e
  // "tirano" l'OVR verso il proprio valore derivato, ma solo entro un margine bounded per
  // ciclo — mai abbastanza da sovrastare la curva già calibrata o cancellare un ovrDelta
  // narrativo appena applicato (vedi piano, Fase 2).
  const growthBudget = sumOvrDeltaForAge(ageFrom, seasons);
  const nextAttributes = distributeAttributeGrowth({
    attributes: player.attributes,
    position: player.position,
    totalGrowthBudget: growthBudget,
    focusAttribute: player.trainingFocus,
    rng,
  });
  const derivedOvr = deriveOvrFromAttributes(nextAttributes, player.position);
  const pull = clamp(
    derivedOvr - ageBasedOvr,
    -ATTRIBUTE_PULL_PER_CYCLE * seasons,
    ATTRIBUTE_PULL_PER_CYCLE * seasons,
  );
  const nextOvr = clamp(Math.round(ageBasedOvr + pull), 35, player.potential);

  const seasonStats = projectStats(
    player.ovr,
    player.position,
    player.club.tier,
    seasons,
    rng,
    player.playStyles,
  );

  const stint: ClubStint = {
    club: player.club,
    ageFrom,
    ageTo,
    type: stintType,
    stats: seasonStats,
    ovr: nextOvr,
  };

  return {
    ...player,
    age: ageTo,
    ovr: nextOvr,
    attributes: nextAttributes,
    marketValueEur: computeMarketValue(nextOvr, ageTo),
    career: sumStats(player.career, seasonStats),
    clubHistory: [...player.clubHistory, stint],
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
  const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
  const roll = rng() * totalWeight;
  let cumulative = 0;
  for (const outcome of outcomes) {
    cumulative += outcome.weight;
    if (roll < cumulative) return outcome;
  }
  return outcomes[outcomes.length - 1];
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
