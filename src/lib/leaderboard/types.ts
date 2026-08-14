import type { ArchivedCareer } from "@/types/career";

/** Stato della pubblicazione automatica in classifica alla fine di una carriera. */
export type PublishStatus = "idle" | "loading" | "done" | "error" | "skipped-no-nickname";

/** Stesse 4 categorie della Hall of Fame locale (`HallOfFameRecords` in `career/satisfaction.ts`),
 * qui applicate globalmente (top-N invece di singolo vincitore). */
export type LeaderboardCategory = "highestOvr" | "mostTrophies" | "richest" | "mostPopular";

/** Colonna Postgres da ordinare per ciascuna categoria (vedi supabase/schema.sql). */
export const LEADERBOARD_CATEGORY_COLUMN: Record<LeaderboardCategory, string> = {
  highestOvr: "peak_ovr",
  mostTrophies: "trophy_count",
  richest: "final_savings_eur",
  mostPopular: "final_popularity",
};

/** Vista pubblica per categoria: una riga per dispositivo (la migliore su quell'asse).
 * Il DISTINCT ON (device_id) vive in SQL, così device_id non esce mai al client. */
export const LEADERBOARD_CATEGORY_VIEW: Record<LeaderboardCategory, string> = {
  highestOvr: "myroad_leaderboard_by_ovr",
  mostTrophies: "myroad_leaderboard_by_trophies",
  richest: "myroad_leaderboard_by_savings",
  mostPopular: "myroad_leaderboard_by_popularity",
};

export const LEADERBOARD_CATEGORY_LABELS: Record<LeaderboardCategory, string> = {
  highestOvr: "OVR più alto",
  mostTrophies: "Più trofei",
  richest: "Più ricco",
  mostPopular: "Più popolare",
};

/** Riga raw così come torna da PostgREST (snake_case) dalle viste per-categoria
 * `myroad_leaderboard_by_*` (supabase/schema.sql) — non dalla tabella base: niente
 * device_id/client_entry_id, mai esposti in lettura pubblica. */
export interface LeaderboardEntryRow {
  id: string;
  created_at: string;
  nickname: string;
  app_version: string;
  last_name: string;
  nationality: string;
  position: string;
  peak_ovr: number;
  trophy_count: number;
  award_count: number;
  retired_age: number;
  retired_at_iso: string;
  career_apps: number;
  career_goals: number;
  career_assists: number;
  final_savings_eur: number;
  final_popularity: number;
  career_title: string;
  archetype_id: string | null;
  shadow_title: string | null;
}

/** Forma UI-facing (camelCase), quella che consuma il componente Leaderboard. */
export interface LeaderboardListItem {
  id: string;
  nickname: string;
  lastName: string;
  nationality: string;
  position: ArchivedCareer["position"];
  peakOvr: number;
  trophyCount: number;
  awardCount: number;
  retiredAge: number;
  finalSavingsEur: number;
  finalPopularity: number;
  careerTitle: string;
  archetypeId: ArchivedCareer["archetypeId"];
}

export function toLeaderboardListItem(row: LeaderboardEntryRow): LeaderboardListItem {
  return {
    id: row.id,
    nickname: row.nickname,
    lastName: row.last_name,
    nationality: row.nationality,
    position: row.position as ArchivedCareer["position"],
    peakOvr: row.peak_ovr,
    trophyCount: row.trophy_count,
    awardCount: row.award_count,
    retiredAge: row.retired_age,
    finalSavingsEur: row.final_savings_eur,
    finalPopularity: row.final_popularity,
    careerTitle: row.career_title,
    archetypeId: (row.archetype_id ?? undefined) as ArchivedCareer["archetypeId"],
  };
}
