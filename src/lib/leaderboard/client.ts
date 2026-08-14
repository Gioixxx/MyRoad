import type { ArchivedCareer } from "@/types/career";
import { APP_VERSION } from "@/constants/app-info";
import {
  LEADERBOARD_CATEGORY_COLUMN,
  LEADERBOARD_CATEGORY_VIEW,
  toLeaderboardListItem,
  type LeaderboardCategory,
  type LeaderboardEntryRow,
  type LeaderboardListItem,
} from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TABLE = "myroad_leaderboard_entries";
const DEFAULT_LIMIT = 20;

export type LeaderboardResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Guardia per build senza `.env` (es. fork/CI) — la UI mostra "non disponibile" invece di crashare. */
export function isLeaderboardConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function headers(): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY ?? "",
    Authorization: `Bearer ${SUPABASE_ANON_KEY ?? ""}`,
    "Content-Type": "application/json",
  };
}

/** Mapping esplicito campo-per-campo (non un converter generico) — coerente con `buildArchiveEntry`
 * in `career/storage.ts`: un rename futuro in `ArchivedCareer` non rompe silenziosamente il payload. */
export function buildSubmitPayload(entry: ArchivedCareer, nickname: string, deviceId: string) {
  return {
    device_id: deviceId,
    nickname: nickname.trim(),
    app_version: APP_VERSION,
    client_entry_id: entry.id,
    last_name: entry.lastName,
    nationality: entry.nationality,
    position: entry.position,
    peak_ovr: entry.peakOvr,
    trophy_count: entry.trophyCount,
    award_count: entry.awardCount,
    retired_age: entry.retiredAge,
    retired_at_iso: entry.retiredAtIso,
    career_apps: entry.careerApps,
    career_goals: entry.careerGoals,
    career_assists: entry.careerAssists,
    final_savings_eur: entry.finalSavingsEur,
    final_popularity: entry.finalPopularity,
    career_title: entry.careerTitle,
    archetype_id: entry.archetypeId ?? null,
    shadow_title: entry.shadowTitle ?? null,
  };
}

export async function submitLeaderboardEntry(
  entry: ArchivedCareer,
  nickname: string,
  deviceId: string,
): Promise<LeaderboardResult<true>> {
  if (!isLeaderboardConfigured()) return { ok: false, error: "not-configured" };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: { ...headers(), Prefer: "return=minimal" },
      body: JSON.stringify(buildSubmitPayload(entry, nickname, deviceId)),
    });
    if (!res.ok) return { ok: false, error: `http-${res.status}` };
    return { ok: true, value: true };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function fetchLeaderboardCategory(
  category: LeaderboardCategory,
  limit: number = DEFAULT_LIMIT,
): Promise<LeaderboardResult<LeaderboardListItem[]>> {
  if (!isLeaderboardConfigured()) return { ok: false, error: "not-configured" };

  // Vista per-categoria: DISTINCT ON (device_id) lato SQL, senza esporre device_id.
  const view = LEADERBOARD_CATEGORY_VIEW[category];
  const column = LEADERBOARD_CATEGORY_COLUMN[category];
  const url = `${SUPABASE_URL}/rest/v1/${view}?select=*&order=${column}.desc,created_at.desc&limit=${limit}`;

  try {
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) return { ok: false, error: `http-${res.status}` };
    const rows = (await res.json()) as LeaderboardEntryRow[];
    return { ok: true, value: rows.map(toLeaderboardListItem) };
  } catch {
    return { ok: false, error: "network" };
  }
}
