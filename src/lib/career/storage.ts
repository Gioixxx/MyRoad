import type { ArchivedCareer, Decision, DecisionCategory, GameSpeed, Player } from "@/types/career";
import type { LoopContext } from "./loop";
import { emptyPersonalRecords, pickBestCareerTitle } from "./satisfaction";
import { peakOvr } from "./summary";
import { NEUTRAL_TRAITS, deriveArchetype } from "./traits";
import { deriveShadowTitle } from "./shadow";
import { createAttributesFromOvr, peaksFromAttributes } from "./attributes";
import { ensureCoreRelations } from "./relations";

const STORAGE_KEY = "carriera:save";
/** 15 dal wiring "Due classifiche" (`Player.cyclesPlayed`, campi opzionali su `ClubStint` —
 * vedi `migratePlayerV15`). */
const STORAGE_VERSION = 15;

export interface SavedGame {
  version: number;
  player: Player;
  speed: GameSpeed;
  context: LoopContext;
  recentCategories: DecisionCategory[];
  /** Decisione attualmente mostrata — se assente (save pre-v12) al resume si rirolla. */
  currentDecision?: Decision | null;
  currentCategory?: DecisionCategory | null;
}

/** Arricchisce un save v1 (privo di injury/wallet/popularity) con i default, invece di scartarlo. */
function migratePlayerV1(raw: Player): Player {
  return migratePlayerV2({
    ...raw,
    injury: raw.injury ?? null,
    wallet: raw.wallet ?? { salaryEurPerCycle: 0, savingsEur: 0 },
    popularity: raw.popularity ?? 15,
  });
}

/** Arricchisce un save v2 (privo dei campi soddisfazione) con i default. */
function migratePlayerV2(raw: Player): Player {
  return migratePlayerV3({
    ...raw,
    milestonesReached: raw.milestonesReached ?? [],
    records: raw.records ?? emptyPersonalRecords(raw.marketValueEur ?? 0),
    seasonTitles: raw.seasonTitles ?? [],
    currentObjective: raw.currentObjective ?? null,
  });
}

/** Arricchisce un save v3 (privo del flag di cambio nazionalità) con il default. */
function migratePlayerV3(raw: Player): Player {
  return migratePlayerV4({
    ...raw,
    hasSwitchedNationality: raw.hasSwitchedNationality ?? false,
  });
}

/** Arricchisce un save v4 (privo di traits/shadow) con i default neutri. */
function migratePlayerV4(raw: Player): Player {
  return migratePlayerV5({
    ...raw,
    traits: raw.traits ?? NEUTRAL_TRAITS,
    shadow: raw.shadow ?? 0,
    shadowFlags: raw.shadowFlags ?? {},
  });
}

/** Arricchisce un save v5 (privo di potential) con un tetto generoso, mai contraddittorio con
 * un OVR già alto in un save esistente. */
function migratePlayerV5(raw: Player): Player {
  return migratePlayerV6({
    ...raw,
    potential: raw.potential ?? Math.max(raw.ovr, 90),
  });
}

/** Arricchisce un save v6 (privo di attributi granulari) con attributi ricostruiti attorno
 * all'OVR già raggiunto (non al neutro di partenza) — vedi createAttributesFromOvr. */
function migratePlayerV6(raw: Player): Player {
  return migratePlayerV7({
    ...raw,
    attributes: raw.attributes ?? createAttributesFromOvr(raw.position, raw.ovr, Math.random),
    trainingFocus: raw.trainingFocus ?? null,
  });
}

/** Arricchisce un save v7 (privo di playstyle) con la lista vuota di default. */
function migratePlayerV7(raw: Player): Player {
  return migratePlayerV8({
    ...raw,
    playStyles: raw.playStyles ?? [],
  });
}

/** Arricchisce un save v8 (privo del vecchio flag globale "overlay obiettivo già mostrato").
 * Il campo non esiste più nel tipo Player: la migrazione passa direttamente alla v9, che lo
 * sostituisce col nuovo tracking per tipo di obiettivo. */
function migratePlayerV8(raw: Player): Player {
  return migratePlayerV9(raw);
}

/** Arricchisce un save v9 (obiettivo "già mostrato" globale, non per tipo) sostituendolo col
 * nuovo tracking per-kind — riparte da zero: il vecchio flag booleano non distingueva il tipo di
 * obiettivo, quindi non c'è modo di ricostruire correttamente quali tipi erano già stati
 * celebrati. Chi ha già una carriera in corso vedrà al più un overlay in più per ciascun tipo. */
function migratePlayerV9(raw: Player): Player {
  return migratePlayerV10({
    ...raw,
    objectiveKindsCelebrated: raw.objectiveKindsCelebrated ?? [],
  });
}

/** Arricchisce un save v10 (privo della clausola rescissoria) con 0 — ricalcolata correttamente
 * alla prossima firma (`signWithClub`), nel frattempo nessuna attivazione forzata la considera
 * (vedi `shouldTriggerClauseActivation`, gated anche su clausola > 0). */
function migratePlayerV10(raw: Player): Player {
  return migratePlayerV13({
    ...raw,
    releaseClauseEur: raw.releaseClauseEur ?? 0,
  });
}

function migratePlayerV13(raw: Player): Player {
  return migratePlayerV14({
    ...raw,
    attributePeaks: raw.attributePeaks ?? peaksFromAttributes(raw.attributes ?? createAttributesFromOvr(raw.position, raw.ovr)),
  });
}

function migratePlayerV14(raw: Player): Player {
  return migratePlayerV15(
    ensureCoreRelations({
      ...raw,
      relations: raw.relations ?? [],
    }),
  );
}

/** Arricchisce un save v14 con `cyclesPlayed` (dal wiring "Due classifiche") — le stint esistenti
 * in `clubHistory` restano senza `leaguePosition`/`leagueSize`/`zone`/`cupWon`/`cycleId`/
 * `clubTierChange` (campi opzionali additivi, niente da ricostruire: erano cicli, non stagioni,
 * per definizione — vedi `lib/shared/club-tenure.ts`). */
function migratePlayerV15(raw: Player): Player {
  return {
    ...raw,
    cyclesPlayed: raw.cyclesPlayed ?? 0,
  };
}

export function saveGame(save: Omit<SavedGame, "version">): void {
  if (typeof window === "undefined") return;
  const payload: SavedGame = { version: STORAGE_VERSION, ...save };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadGame(): SavedGame | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SavedGame;
    if (parsed.version === 1) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV1(parsed.player) };
    }
    if (parsed.version === 2) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV2(parsed.player) };
    }
    if (parsed.version === 3) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV3(parsed.player) };
    }
    if (parsed.version === 4) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV4(parsed.player) };
    }
    if (parsed.version === 5) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV5(parsed.player) };
    }
    if (parsed.version === 6) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV6(parsed.player) };
    }
    if (parsed.version === 7) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV7(parsed.player) };
    }
    if (parsed.version === 8) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV8(parsed.player) };
    }
    if (parsed.version === 9) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV9(parsed.player) };
    }
    if (parsed.version === 10) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV10(parsed.player) };
    }
    if (parsed.version === 11) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV13(parsed.player) };
    }
    if (parsed.version === 12) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV13(parsed.player) };
    }
    if (parsed.version === 13) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV14(parsed.player) };
    }
    if (parsed.version === 14) {
      return { ...parsed, version: STORAGE_VERSION, player: migratePlayerV15(parsed.player) };
    }
    if (parsed.version !== STORAGE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearGame(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

const ARCHIVE_KEY = "carriera:archive";
const ARCHIVE_VERSION = 2;
const ARCHIVE_MAX_ENTRIES = 100;

interface ArchivePayload {
  version: number;
  entries: ArchivedCareer[];
}

function migrateArchiveEntryV1(entry: ArchivedCareer): ArchivedCareer {
  return {
    ...entry,
    careerTitle: entry.careerTitle ?? "",
  };
}

export function buildArchiveEntry(player: Player): ArchivedCareer {
  return {
    id: `${player.lastName}-${Date.now()}`,
    lastName: player.lastName,
    nationality: player.nationality,
    position: player.position,
    peakOvr: peakOvr(player),
    trophyCount: player.trophies.length,
    awardCount: player.awards.length,
    retiredAge: player.age,
    retiredAtIso: new Date().toISOString(),
    careerApps: player.career.apps,
    careerGoals: player.career.goals,
    careerAssists: player.career.assists,
    finalSavingsEur: player.wallet.savingsEur,
    finalPopularity: player.popularity,
    careerTitle: pickBestCareerTitle(player.seasonTitles),
    archetypeId: deriveArchetype(player.traits, player.shadow).primary ?? undefined,
    shadowTitle: deriveShadowTitle(player.shadow, player.shadowFlags?.redeemed ?? false),
  };
}

export function loadArchive(): ArchivedCareer[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ARCHIVE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ArchivePayload;
    if (parsed.version === 1) {
      return parsed.entries.map(migrateArchiveEntryV1);
    }
    if (parsed.version !== ARCHIVE_VERSION) return [];
    return parsed.entries;
  } catch {
    return [];
  }
}

export function appendToArchive(entry: ArchivedCareer): void {
  if (typeof window === "undefined") return;
  const entries = [entry, ...loadArchive()].slice(0, ARCHIVE_MAX_ENTRIES);
  const payload: ArchivePayload = { version: ARCHIVE_VERSION, entries };
  window.localStorage.setItem(ARCHIVE_KEY, JSON.stringify(payload));
}
