import type {
  ArchivedCareer,
  Award,
  CycleObjective,
  CycleObjectiveKind,
  Injury,
  OvrMilestone,
  PersonalRecords,
  Player,
  PlayerDelta,
  SeasonTitleEntry,
  SeasonTitleId,
  Trophy,
} from "@/types/career";
import type { Rng } from "./progression";

export const OVR_MILESTONES = [60, 70, 80, 85, 90] as const;

export const SEASON_TITLE_LABELS: Record<SeasonTitleId, string> = {
  giantKiller: "Ammazzagigante",
  champion: "Campione",
  ballondorSeason: "Stagione da Pallone",
  nationalHero: "Eroe nazionale",
  ironWall: "Muro invalicabile",
  revelation: "Rivelazione",
  comeback: "Ritorno vincente",
  workhorse: "Inossidabile",
  toughYear: "Anno difficile",
  steady: "Stagione solida",
};

/**
 * Priorità per il "miglior titolo" di carriera (più basso = migliore). "giantKiller" è in cima:
 * richiede sia un club sottodotato sia due roll consecutivi sotto il 50%, più raro di un normale
 * "champion" da club di prestigio alto.
 */
const TITLE_RANK: Record<SeasonTitleId, number> = {
  giantKiller: 0,
  champion: 1,
  ballondorSeason: 2,
  nationalHero: 3,
  ironWall: 4,
  revelation: 5,
  comeback: 6,
  workhorse: 7,
  toughYear: 8,
  steady: 9,
};

export const SEASON_TITLES_CAP = 12;

export const RECORD_LABELS: Record<keyof PersonalRecords, string> = {
  bestSeasonGoals: "Record gol in una stagione",
  bestSeasonAssists: "Record assist in una stagione",
  bestSeasonApps: "Record presenze in una stagione",
  bestSeasonCleanSheets: "Record clean sheet in una stagione",
  peakMarketValueEur: "Nuovo picco di valore di mercato",
  firstCallupAge: "Prima convocazione in nazionale",
};

export interface SeasonTitleContext {
  age: number;
  goals: number;
  assists: number;
  apps: number;
  /** Valorizzato solo per i portieri. */
  cleanSheets?: number;
  trophies: Trophy[];
  award: Award | null;
  newInjury: Injury | null;
  injuryHealed: boolean;
  ovrDelta: number;
  nationalCallup: boolean;
  nationalGoals: number;
  /** true solo sul ciclo in cui è stata vinta una sorpresa di coppa ("Giant Killer"). */
  cupUpsetWin: boolean;
  /** Stagioni del ciclo (Intense 1 / Normal 2 / Express 3) — le soglie per-stagione si dividono per questo. */
  seasons?: number;
}

export interface CycleSatisfactionContext {
  age: number;
  ovrBefore: number;
  ovrAfter: number;
  goals: number;
  assists: number;
  apps: number;
  /** Valorizzato solo per i portieri. */
  cleanSheets?: number;
  trophies: Trophy[];
  award: Award | null;
  newInjury: Injury | null;
  injuryHealed: boolean;
  nationalCallup: boolean;
  nationalGoals: number;
  marketValueEur: number;
  wasAlreadyCalled: boolean;
  /** Stagioni del ciclo — record e confronti per-stagione si normalizzano con questo. */
  seasons?: number;
}

export function emptyPersonalRecords(peakMarketValueEur = 0): PersonalRecords {
  return {
    bestSeasonGoals: 0,
    bestSeasonAssists: 0,
    bestSeasonApps: 0,
    bestSeasonCleanSheets: 0,
    peakMarketValueEur,
    firstCallupAge: null,
  };
}

/** Soglie OVR appena crociate in questo ciclo (esclude quelle già celebrate). */
export function detectOvrMilestones(
  ovrBefore: number,
  ovrAfter: number,
  reached: OvrMilestone[],
  age: number,
): OvrMilestone[] {
  const already = new Set(reached.map((m) => m.ovr));
  const lo = Math.min(ovrBefore, ovrAfter);
  const hi = Math.max(ovrBefore, ovrAfter);
  // Solo ascesa: celebriamo quando si sale oltre la soglia
  if (ovrAfter <= ovrBefore) return [];
  return OVR_MILESTONES.filter((threshold) => !already.has(threshold) && lo < threshold && hi >= threshold).map(
    (ovr) => ({ ovr, age }),
  );
}

/** Un solo titolo per ciclo, priorità fissa. */
export function evaluateSeasonTitle(ctx: SeasonTitleContext): SeasonTitleEntry {
  const id = pickSeasonTitleId(ctx);
  return { age: ctx.age, id, label: SEASON_TITLE_LABELS[id] };
}

const IRON_WALL_CLEAN_SHEETS_PER_SEASON = 15;
const WORKHORSE_APPS_PER_SEASON = 32;
const BALLONDOR_GOALS_PER_SEASON = 25;
const REVELATION_GOALS_PER_SEASON = 12;

function perSeason(total: number, seasons: number | undefined): number {
  return total / Math.max(seasons ?? 1, 1);
}

function pickSeasonTitleId(ctx: SeasonTitleContext): SeasonTitleId {
  const goalsRate = perSeason(ctx.goals, ctx.seasons);
  const appsRate = perSeason(ctx.apps, ctx.seasons);
  const cleanSheetsRate = perSeason(ctx.cleanSheets ?? 0, ctx.seasons);
  if (ctx.cupUpsetWin) return "giantKiller";
  if (ctx.trophies.length > 0) return "champion";
  if (ctx.award || goalsRate >= BALLONDOR_GOALS_PER_SEASON) return "ballondorSeason";
  if (cleanSheetsRate >= IRON_WALL_CLEAN_SHEETS_PER_SEASON) return "ironWall";
  if (ctx.nationalCallup && ctx.nationalGoals > 0) return "nationalHero";
  if (ctx.age <= 21 && (ctx.ovrDelta >= 3 || goalsRate >= REVELATION_GOALS_PER_SEASON)) return "revelation";
  if (ctx.injuryHealed) return "comeback";
  if (appsRate >= WORKHORSE_APPS_PER_SEASON) return "workhorse";
  if (ctx.newInjury || ctx.ovrDelta <= -2) return "toughYear";
  return "steady";
}

export function pushSeasonTitle(
  titles: SeasonTitleEntry[],
  entry: SeasonTitleEntry,
): SeasonTitleEntry[] {
  return [...titles, entry].slice(-SEASON_TITLES_CAP);
}

export function pickBestCareerTitle(titles: SeasonTitleEntry[]): string {
  if (titles.length === 0) return "Carriera solida";
  let best = titles[0]!;
  for (const title of titles) {
    if (TITLE_RANK[title.id] < TITLE_RANK[best.id]) best = title;
  }
  return best.label;
}

export function evaluateObjective(
  objective: CycleObjective,
  ctx: CycleSatisfactionContext,
): { met: boolean; reward: PlayerDelta } {
  const met = isObjectiveMet(objective, ctx);
  if (!met) return { met: false, reward: {} };

  const reward: PlayerDelta =
    objective.kind === "trophy" || objective.kind === "callup"
      ? { popularityDelta: 4 }
      : objective.kind === "ovr-gain"
        ? { popularityDelta: 3, savingsDelta: 5_000 }
        : { popularityDelta: 2 };

  return { met: true, reward };
}

function isObjectiveMet(objective: CycleObjective, ctx: CycleSatisfactionContext): boolean {
  switch (objective.kind) {
    case "goals":
      return ctx.goals >= objective.target;
    case "apps":
      return ctx.apps >= objective.target;
    case "trophy":
      return ctx.trophies.length >= objective.target;
    case "no-injury":
      return ctx.newInjury === null;
    case "callup":
      return ctx.nationalCallup;
    case "ovr-gain":
      return ctx.ovrAfter - ctx.ovrBefore >= objective.target;
    default: {
      const _exhaustive: never = objective.kind;
      return _exhaustive;
    }
  }
}

/** Genera l'obiettivo del ciclo successivo in base allo stato del giocatore.
 * `seasons` scala i target gol/presenze (valori Intense × stagioni del ciclo). */
export function rollCycleObjective(player: Player, rng: Rng = Math.random, seasons = 1): CycleObjective {
  const seasonCount = Math.max(seasons, 1);
  const candidates: { kind: CycleObjectiveKind; weight: number; build: () => CycleObjective }[] = [];

  if (player.club) {
    const goalTarget = goalTargetForPlayer(player) * seasonCount;
    if (goalTarget > 0) {
      candidates.push({
        kind: "goals",
        weight: 30,
        build: () => ({
          id: `goals-${goalTarget}`,
          kind: "goals",
          target: goalTarget,
          label: `Segna almeno ${goalTarget} gol`,
        }),
      });
    }

    const appsTarget = (player.age < 20 ? 20 : 30) * seasonCount;
    candidates.push({
      kind: "apps",
      weight: 22,
      build: () => ({
        id: `apps-${appsTarget}`,
        kind: "apps",
        target: appsTarget,
        label: `Raggiungi ${appsTarget} presenze`,
      }),
    });

    if (player.club.prestige >= 1) {
      candidates.push({
        kind: "trophy",
        weight: 18,
        build: () => ({
          id: "trophy-1",
          kind: "trophy",
          target: 1,
          label: "Vinci un trofeo",
        }),
      });
    }
  }

  candidates.push({
    kind: "no-injury",
    weight: 15,
    build: () => ({
      id: "no-injury",
      kind: "no-injury",
      target: 1,
      label: "Resta sano per tutto il ciclo",
    }),
  });

  if (!player.nationalTeam.called && player.ovr >= 70) {
    candidates.push({
      kind: "callup",
      weight: 12,
      build: () => ({
        id: "callup",
        kind: "callup",
        target: 1,
        label: "Ottieni una convocazione in nazionale",
      }),
    });
  }

  if (player.age < 31) {
    const ovrTarget = player.age < 22 ? 3 : 2;
    candidates.push({
      kind: "ovr-gain",
      weight: 20,
      build: () => ({
        id: `ovr-${ovrTarget}`,
        kind: "ovr-gain",
        target: ovrTarget,
        label: `Guadagna almeno +${ovrTarget} OVR`,
      }),
    });
  }

  const pool = candidates.length > 0 ? candidates : [
    {
      kind: "no-injury" as const,
      weight: 1,
      build: () => ({
        id: "no-injury",
        kind: "no-injury" as const,
        target: 1,
        label: "Resta sano per tutto il ciclo",
      }),
    },
  ];

  const total = pool.reduce((sum, c) => sum + c.weight, 0);
  let roll = rng() * total;
  for (const candidate of pool) {
    roll -= candidate.weight;
    if (roll < 0) return candidate.build();
  }
  return pool[pool.length - 1]!.build();
}

function goalTargetForPlayer(player: Player): number {
  const isForward = player.position === "ST" || player.position === "LW" || player.position === "RW";
  const isAttackingMid = player.position === "CAM" || player.position === "LM" || player.position === "RM";
  if (isForward) return player.ovr >= 80 ? 18 : player.ovr >= 70 ? 12 : 8;
  if (isAttackingMid) return player.ovr >= 80 ? 10 : 6;
  if (player.position === "GK") return 0;
  return player.ovr >= 75 ? 5 : 3;
}

export function updatePersonalRecords(
  records: PersonalRecords,
  ctx: CycleSatisfactionContext,
): { records: PersonalRecords; broken: (keyof PersonalRecords)[] } {
  const next = { ...records };
  const broken: (keyof PersonalRecords)[] = [];
  const seasonGoals = Math.round(perSeason(ctx.goals, ctx.seasons));
  const seasonAssists = Math.round(perSeason(ctx.assists, ctx.seasons));
  const seasonApps = Math.round(perSeason(ctx.apps, ctx.seasons));
  const seasonCleanSheets =
    ctx.cleanSheets !== undefined ? Math.round(perSeason(ctx.cleanSheets, ctx.seasons)) : undefined;

  if (seasonGoals > records.bestSeasonGoals) {
    next.bestSeasonGoals = seasonGoals;
    broken.push("bestSeasonGoals");
  }
  if (seasonAssists > records.bestSeasonAssists) {
    next.bestSeasonAssists = seasonAssists;
    broken.push("bestSeasonAssists");
  }
  if (seasonApps > records.bestSeasonApps) {
    next.bestSeasonApps = seasonApps;
    broken.push("bestSeasonApps");
  }
  if (seasonCleanSheets !== undefined && seasonCleanSheets > (records.bestSeasonCleanSheets ?? 0)) {
    next.bestSeasonCleanSheets = seasonCleanSheets;
    broken.push("bestSeasonCleanSheets");
  }
  if (ctx.marketValueEur > records.peakMarketValueEur) {
    next.peakMarketValueEur = ctx.marketValueEur;
    broken.push("peakMarketValueEur");
  }
  if (ctx.nationalCallup && records.firstCallupAge === null && !ctx.wasAlreadyCalled) {
    next.firstCallupAge = ctx.age;
    broken.push("firstCallupAge");
  }

  return { records: next, broken };
}

export function brokenRecordLabels(broken: (keyof PersonalRecords)[]): string[] {
  return broken.map((key) => RECORD_LABELS[key]);
}

/** 1–3 frasi narrative derivate dalle stats del ciclo. */
export function buildHighlightReel(ctx: CycleSatisfactionContext, rng: Rng = Math.random): string[] {
  const pool: string[] = [];

  if (ctx.goals >= 20 * Math.max(ctx.seasons ?? 1, 1)) pool.push("Caccia al capocannoniere: stagione da bomber assoluto");
  else if (ctx.goals >= 12 * Math.max(ctx.seasons ?? 1, 1)) pool.push("Doppietta nel derby di campionato");
  else if (ctx.goals >= 6 * Math.max(ctx.seasons ?? 1, 1)) pool.push("Gol decisivo sotto i tre pali");

  if (ctx.assists >= 12 * Math.max(ctx.seasons ?? 1, 1)) pool.push("Regista silenzioso: assist a raffica");
  else if (ctx.assists >= 6 * Math.max(ctx.seasons ?? 1, 1)) pool.push("Assist decisivo in coppa");

  if ((ctx.cleanSheets ?? 0) >= 15 * Math.max(ctx.seasons ?? 1, 1)) pool.push("Muro invalicabile: clean sheet a raffica");
  else if ((ctx.cleanSheets ?? 0) >= 8 * Math.max(ctx.seasons ?? 1, 1)) pool.push("Serata da titolare: porta blindata");

  if (ctx.apps >= 32 * Math.max(ctx.seasons ?? 1, 1)) pool.push("Mai fuori dal undici titolare");
  else if (ctx.apps >= 24 * Math.max(ctx.seasons ?? 1, 1)) pool.push("Presenze da maratoneta");

  if (ctx.trophies.length > 0) {
    const name = ctx.trophies[0]!.competition;
    pool.push(`Alza al cielo ${name}`);
  }
  if (ctx.award) pool.push("Premio individuale: la critica applaude");
  if (ctx.nationalCallup) pool.push("Prima maglia azzurra (o quasi): convocazione ufficiale");
  if (ctx.newInjury) pool.push("Stagione spezzata dall'infortunio");
  if (ctx.injuryHealed) pool.push("Rientro da manuale dopo il stop forzato");
  if (ctx.ovrAfter - ctx.ovrBefore >= 4) pool.push("Crescita esplosiva: l'OVR vola");

  if (pool.length === 0) {
    return ["Ciclo senza scosse, lavoro quotidiano in silenzio"];
  }

  // Shuffle stabile via rng e prendi fino a 3
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, 3);
}

export interface HallOfFameRecords {
  highestOvr: ArchivedCareer | null;
  mostTrophies: ArchivedCareer | null;
  richest: ArchivedCareer | null;
  mostPopular: ArchivedCareer | null;
}

export function computeHallOfFame(entries: ArchivedCareer[]): HallOfFameRecords {
  if (entries.length === 0) {
    return { highestOvr: null, mostTrophies: null, richest: null, mostPopular: null };
  }

  const by = <T extends number>(pick: (e: ArchivedCareer) => T) =>
    entries.reduce((best, e) => (pick(e) > pick(best) ? e : best));

  return {
    highestOvr: by((e) => e.peakOvr),
    mostTrophies: by((e) => e.trophyCount),
    richest: by((e) => e.finalSavingsEur),
    mostPopular: by((e) => e.finalPopularity),
  };
}

/** Quali record HoF batte questa carriera rispetto all'archivio (esclusa sé stessa se già presente). */
export function hallOfFameWinsFor(
  entry: ArchivedCareer,
  archive: ArchivedCareer[],
): Array<"highestOvr" | "mostTrophies" | "richest" | "mostPopular"> {
  const others = archive.filter((e) => e.id !== entry.id);
  const wins: Array<"highestOvr" | "mostTrophies" | "richest" | "mostPopular"> = [];
  if (others.every((e) => entry.peakOvr >= e.peakOvr)) wins.push("highestOvr");
  if (others.every((e) => entry.trophyCount >= e.trophyCount)) wins.push("mostTrophies");
  if (others.every((e) => entry.finalSavingsEur >= e.finalSavingsEur)) wins.push("richest");
  if (others.every((e) => entry.finalPopularity >= e.finalPopularity)) wins.push("mostPopular");
  return wins;
}
