import type { ArchetypeId } from "@/types/career";
import type { AwardBreakdownEntry, TrophyBreakdownEntry } from "@/lib/career/trophy-breakdown";

/** Stato della pubblicazione automatica in classifica alla fine di una carriera (calciatore o
 * allenatore — stesso tipo condiviso, vedi CareerGame.tsx/CoachCareerGame.tsx). */
export type PublishStatus =
  | "idle"
  | "loading"
  | "done"
  | "error"
  | "error-nickname-taken"
  | "skipped-no-nickname";

/** Le due piste della classifica a punteggio (piano "Due classifiche", Fase 5) — non più 4
 * categorie/Pareto per singola carriera calciatore, vedi `.claude/memory/decisions.md`. */
export type LeaderboardTrack = "player" | "coach";

export const LEADERBOARD_TRACK_LABELS: Record<LeaderboardTrack, string> = {
  player: "Calciatori",
  coach: "Allenatori",
};

/** Riga raw così come torna da PostgREST (snake_case) dalla vista pubblica
 * `myroad_career_ranks_public` (supabase/career-ranks.sql) — mai dalla tabella base: niente
 * device_id/client_entry_id, mai esposti in lettura pubblica. */
export interface LeaderboardEntryRow {
  id: string;
  created_at: string;
  nickname: string;
  track: LeaderboardTrack;
  peak_rating: number;
  trophy_count: number;
  award_count: number;
  final_savings_eur: number;
  last_name: string;
  nationality: string;
  role_label: string;
  career_title: string;
  archetype_id: string | null;
  app_version: string;
  career_score: number;
  trophy_breakdown: TrophyBreakdownEntry[];
  award_breakdown: AwardBreakdownEntry<string>[];
}

/** Forma UI-facing (camelCase), quella che consuma il componente Leaderboard. */
export interface LeaderboardListItem {
  id: string;
  nickname: string;
  lastName: string;
  nationality: string;
  roleLabel: string;
  peakRating: number;
  trophyCount: number;
  awardCount: number;
  finalSavingsEur: number;
  careerTitle: string;
  archetypeId: ArchetypeId | undefined;
  careerScore: number;
  trophyBreakdown: TrophyBreakdownEntry[];
  awardBreakdown: AwardBreakdownEntry<string>[];
}

export function toLeaderboardListItem(row: LeaderboardEntryRow): LeaderboardListItem {
  return {
    id: row.id,
    nickname: row.nickname,
    lastName: row.last_name,
    nationality: row.nationality,
    roleLabel: row.role_label,
    peakRating: row.peak_rating,
    trophyCount: row.trophy_count,
    awardCount: row.award_count,
    finalSavingsEur: row.final_savings_eur,
    careerTitle: row.career_title,
    archetypeId: (row.archetype_id ?? undefined) as ArchetypeId | undefined,
    careerScore: row.career_score,
    trophyBreakdown: row.trophy_breakdown ?? [],
    awardBreakdown: row.award_breakdown ?? [],
  };
}
