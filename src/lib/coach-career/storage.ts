import type { GameSpeed } from "@/types/career";
import type { ArchivedCoachCareer, Coach, CoachDecision, CoachDecisionCategory } from "@/types/coach";
import type { CoachLoopContext } from "./loop";
import { pickBestCoachCareerTitle } from "./coach-satisfaction";
import { deriveArchetype } from "@/lib/career/traits";
import { deriveShadowTitle } from "@/lib/career/shadow";

const STORAGE_KEY = "carriera:coach-save";
const STORAGE_VERSION = 1;

export interface SavedCoachGame {
  version: number;
  coach: Coach;
  speed: GameSpeed;
  context: CoachLoopContext;
  recentCategories: CoachDecisionCategory[];
  currentDecision?: CoachDecision | null;
  currentCategory?: CoachDecisionCategory | null;
}

export function saveCoachGame(save: Omit<SavedCoachGame, "version">): void {
  if (typeof window === "undefined") return;
  const payload: SavedCoachGame = { version: STORAGE_VERSION, ...save };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadCoachGame(): SavedCoachGame | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SavedCoachGame;
    // Prodotto nuovo, nessun save legacy da migrare — lo switch resta pronto per accogliere
    // future migrazioni incrementali senza dover riscrivere l'ossatura (stesso pattern di
    // lib/career/storage.ts::loadGame).
    if (parsed.version !== STORAGE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCoachGame(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

const ARCHIVE_KEY = "carriera:coach-archive";
const ARCHIVE_VERSION = 1;
const ARCHIVE_MAX_ENTRIES = 100;

interface CoachArchivePayload {
  version: number;
  entries: ArchivedCoachCareer[];
}

export function buildCoachArchiveEntry(coach: Coach): ArchivedCoachCareer {
  const bestLeagueFinish = coach.clubHistory.reduce<ArchivedCoachCareer["bestLeagueFinish"]>((best, stint) => {
    if (best === null) return stint.outcome.leagueFinish;
    return best;
  }, null);

  return {
    id: `${coach.lastName}-${Date.now()}`,
    lastName: coach.lastName,
    nationality: coach.nationality,
    peakReputation: coach.records.peakReputation,
    trophyCount: coach.trophies.length,
    awardCount: coach.awards.length,
    retiredAge: coach.age,
    retiredAtIso: new Date().toISOString(),
    finalSavingsEur: coach.wallet.savingsEur,
    finalPopularity: coach.popularity,
    careerTitle: pickBestCoachCareerTitle(coach.seasonTitles),
    clubsManaged: new Set(coach.clubHistory.map((s) => s.club.id)).size,
    bestLeagueFinish: coach.records.bestLeagueFinish ?? bestLeagueFinish,
    archetypeId: deriveArchetype(coach.traits, coach.shadow).primary ?? undefined,
    shadowTitle: deriveShadowTitle(coach.shadow, coach.shadowFlags?.redeemed ?? false),
  };
}

export function loadCoachArchive(): ArchivedCoachCareer[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ARCHIVE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CoachArchivePayload;
    if (parsed.version !== ARCHIVE_VERSION) return [];
    return parsed.entries;
  } catch {
    return [];
  }
}

export function appendToCoachArchive(entry: ArchivedCoachCareer): void {
  if (typeof window === "undefined") return;
  const entries = [entry, ...loadCoachArchive()].slice(0, ARCHIVE_MAX_ENTRIES);
  const payload: CoachArchivePayload = { version: ARCHIVE_VERSION, entries };
  window.localStorage.setItem(ARCHIVE_KEY, JSON.stringify(payload));
}
