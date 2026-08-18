import type { Club } from "@/types/career";
import type {
  ArchivedCoachCareer,
  CoachAwardType,
  CoachCycleObjective,
  CoachCycleObjectiveKind,
  CoachPersonalRecords,
  CoachSeasonOutcome,
  CoachSeasonTitleEntry,
  CoachSeasonTitleId,
  LeagueFinish,
} from "@/types/coach";
import { clamp, type Rng } from "@/lib/career/progression";
import { expectedLeagueFinishRank, LEAGUE_FINISH_RANK } from "./season-outcome";

export const COACH_AWARD_LABELS: Record<CoachAwardType, string> = {
  "manager-of-the-season": "Allenatore della stagione",
  "manager-of-the-year": "Allenatore dell'anno",
};

export const COACH_SEASON_TITLE_LABELS: Record<CoachSeasonTitleId, string> = {
  miracle: "Miracolo salvezza",
  champion: "Campione",
  cupSpecialist: "Specialista di coppa",
  continentalGlory: "Gloria continentale",
  steadyHand: "Mano ferma",
  underFire: "Sotto pressione",
  sacked: "Esonerato",
  toughSeason: "Stagione difficile",
};

/** Priorità di visualizzazione (numero più basso = titolo più prestigioso) — stesso principio di
 * TITLE_RANK per il calciatore, usato per scegliere il "miglior titolo" da mostrare in archivio. */
const COACH_TITLE_RANK: Record<CoachSeasonTitleId, number> = {
  champion: 0,
  continentalGlory: 1,
  cupSpecialist: 2,
  miracle: 3,
  steadyHand: 4,
  underFire: 5,
  toughSeason: 6,
  sacked: 7,
};

const COACH_SEASON_TITLES_CAP = 12;

export interface CoachSeasonTitleContext {
  age: number;
  outcome: CoachSeasonOutcome;
  expectedRank: number;
  sacked: boolean;
  /** true se boardConfidence era sotto la soglia di allarme in questo ciclo ma non si è arrivati
   * all'esonero — un ciclo "salvato all'ultimo", distinto da una stagione tranquilla. */
  survivedCrisis: boolean;
}

function pickCoachSeasonTitleId(ctx: CoachSeasonTitleContext): CoachSeasonTitleId {
  if (ctx.sacked) return "sacked";
  const actualRank = LEAGUE_FINISH_RANK[ctx.outcome.leagueFinish];
  if (ctx.outcome.leagueFinish === "title") return "champion";
  if (ctx.outcome.continentalRun === "won") return "continentalGlory";
  if (ctx.outcome.cupRun === "won") return "cupSpecialist";
  if (ctx.survivedCrisis && actualRank >= LEAGUE_FINISH_RANK["mid-table"]) return "miracle";
  if (ctx.outcome.leagueFinish === "relegated") return "toughSeason";
  if (ctx.survivedCrisis) return "underFire";
  if (actualRank >= Math.round(ctx.expectedRank)) return "steadyHand";
  return "toughSeason";
}

export function evaluateCoachSeasonTitle(ctx: CoachSeasonTitleContext): CoachSeasonTitleEntry {
  const id = pickCoachSeasonTitleId(ctx);
  return { age: ctx.age, id, label: COACH_SEASON_TITLE_LABELS[id] };
}

export function pushCoachSeasonTitle(
  titles: CoachSeasonTitleEntry[],
  entry: CoachSeasonTitleEntry,
): CoachSeasonTitleEntry[] {
  return [...titles, entry].slice(-COACH_SEASON_TITLES_CAP);
}

export function pickBestCoachCareerTitle(titles: CoachSeasonTitleEntry[]): string {
  if (titles.length === 0) return "Carriera in panchina solida";
  let best = titles[0]!;
  for (const title of titles) {
    if (COACH_TITLE_RANK[title.id] < COACH_TITLE_RANK[best.id]) best = title;
  }
  return best.label;
}

const OBJECTIVE_LEAGUE_FINISH_LABELS: Record<LeagueFinish, string> = {
  relegated: "evita la retrocessione",
  "relegation-battle": "esci dalla zona salvezza",
  "mid-table": "porta il club a metà classifica",
  "continental-qualification": "qualifica il club a una coppa europea",
  title: "vinci il campionato",
};

const LEAGUE_FINISH_BY_RANK: LeagueFinish[] = [
  "relegated",
  "relegation-battle",
  "mid-table",
  "continental-qualification",
  "title",
];

/**
 * Brief della società per il ciclo corrente — Fase A copre solo `"league-finish"` (piazzamento
 * minimo atteso in base a prestigio/reputazione, stessa formula di `rollCoachSeasonOutcome`);
 * `"cup-run"`/`"no-sacking"`/`"reputation-gain"` restano pronti nel tipo per la Fase B.
 */
export function rollCoachCycleObjective(club: Club, reputation: number): CoachCycleObjective {
  const target = Math.min(4, Math.max(0, Math.round(expectedLeagueFinishRank(club.prestige, reputation))));
  const kind: CoachCycleObjectiveKind = "league-finish";
  return {
    id: `league-finish-${target}`,
    kind,
    target,
    label: `La società chiede: ${OBJECTIVE_LEAGUE_FINISH_LABELS[LEAGUE_FINISH_BY_RANK[target]]}`,
  };
}

export function evaluateCoachObjective(
  objective: CoachCycleObjective,
  outcome: CoachSeasonOutcome,
): { met: boolean } {
  if (objective.kind !== "league-finish") return { met: false };
  return { met: LEAGUE_FINISH_RANK[outcome.leagueFinish] >= objective.target };
}

export function emptyCoachPersonalRecords(): CoachPersonalRecords {
  return { peakReputation: 0, bestLeagueFinish: null, longestTenureClub: 0 };
}

export function updateCoachPersonalRecords(
  records: CoachPersonalRecords,
  reputation: number,
  leagueFinish: LeagueFinish,
  tenureCyclesAtClub: number,
): { records: CoachPersonalRecords; broken: (keyof CoachPersonalRecords)[] } {
  const next = { ...records };
  const broken: (keyof CoachPersonalRecords)[] = [];

  if (reputation > records.peakReputation) {
    next.peakReputation = reputation;
    broken.push("peakReputation");
  }
  if (records.bestLeagueFinish === null || LEAGUE_FINISH_RANK[leagueFinish] > LEAGUE_FINISH_RANK[records.bestLeagueFinish]) {
    next.bestLeagueFinish = leagueFinish;
    broken.push("bestLeagueFinish");
  }
  if (tenureCyclesAtClub > records.longestTenureClub) {
    next.longestTenureClub = tenureCyclesAtClub;
    broken.push("longestTenureClub");
  }

  return { records: next, broken };
}

const COACH_AWARD_CHANCE_CAP = 0.5;
const COACH_AWARD_REPUTATION_BASELINE = 60;
const COACH_AWARD_REPUTATION_DIVISOR = 60;
const MANAGER_OF_YEAR_MIN_REPUTATION = 85;
const MANAGER_OF_YEAR_ROLL_CHANCE = 0.25;

/**
 * Premio individuale del ciclo — rollato solo su una stagione già di per sé notevole (piazzamento
 * almeno da qualificazione europea, o un trofeo/coppa vinti), stessa forma di `awardChance`
 * calciatore ma con soglie proprie sulla reputazione (che parte da 35, non da 50 come l'OVR).
 */
export function rollCoachAward(
  reputation: number,
  outcome: CoachSeasonOutcome,
  rng: Rng = Math.random,
): CoachAwardType | null {
  const notableSeason =
    LEAGUE_FINISH_RANK[outcome.leagueFinish] >= LEAGUE_FINISH_RANK["continental-qualification"] ||
    outcome.cupRun === "won" ||
    outcome.continentalRun === "won";
  if (!notableSeason) return null;

  const chance = clamp((reputation - COACH_AWARD_REPUTATION_BASELINE) / COACH_AWARD_REPUTATION_DIVISOR, 0, COACH_AWARD_CHANCE_CAP);
  if (rng() >= chance) return null;

  if (reputation >= MANAGER_OF_YEAR_MIN_REPUTATION && outcome.leagueFinish === "title" && rng() < MANAGER_OF_YEAR_ROLL_CHANCE) {
    return "manager-of-the-year";
  }
  return "manager-of-the-season";
}

/** Hall of Fame sull'archivio multi-carriera allenatore — mirror di `computeHallOfFame`/
 * `hallOfFameWinsFor` (lib/career/satisfaction.ts) sui 4 assi rinominati OVR→reputazione. */
export interface CoachHallOfFameRecords {
  highestReputation: ArchivedCoachCareer | null;
  mostTrophies: ArchivedCoachCareer | null;
  richest: ArchivedCoachCareer | null;
  mostPopular: ArchivedCoachCareer | null;
}

export function computeCoachHallOfFame(entries: ArchivedCoachCareer[]): CoachHallOfFameRecords {
  if (entries.length === 0) {
    return { highestReputation: null, mostTrophies: null, richest: null, mostPopular: null };
  }
  const by = (pick: (e: ArchivedCoachCareer) => number) =>
    entries.reduce((best, e) => (pick(e) > pick(best) ? e : best));
  return {
    highestReputation: by((e) => e.peakReputation),
    mostTrophies: by((e) => e.trophyCount),
    richest: by((e) => e.finalSavingsEur),
    mostPopular: by((e) => e.finalPopularity),
  };
}

export function coachHallOfFameWinsFor(
  entry: ArchivedCoachCareer,
  archive: ArchivedCoachCareer[],
): Array<"highestReputation" | "mostTrophies" | "richest" | "mostPopular"> {
  const others = archive.filter((e) => e.id !== entry.id);
  const wins: Array<"highestReputation" | "mostTrophies" | "richest" | "mostPopular"> = [];
  if (others.every((e) => entry.peakReputation >= e.peakReputation)) wins.push("highestReputation");
  if (others.every((e) => entry.trophyCount >= e.trophyCount)) wins.push("mostTrophies");
  if (others.every((e) => entry.finalSavingsEur >= e.finalSavingsEur)) wins.push("richest");
  if (others.every((e) => entry.finalPopularity >= e.finalPopularity)) wins.push("mostPopular");
  return wins;
}
