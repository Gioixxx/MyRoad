import type { ArchivedCareer } from "@/types/career";
import type { ArchivedCoachCareer } from "@/types/coach";
import { APP_VERSION } from "@/constants/app-info";
import { POSITION_LABELS } from "@/lib/career/position-labels";
import {
  toLeaderboardListItem,
  type LeaderboardEntryRow,
  type LeaderboardListItem,
  type LeaderboardTrack,
} from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const VIEW = "myroad_career_ranks_public";
export const DEFAULT_LIMIT = 20;

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

/** Parametri della RPC `myroad_submit_career_rank` (supabase/career-ranks.sql) — mapping esplicito
 * campo-per-campo (non un converter generico), coerente con `buildArchiveEntry`/
 * `buildCoachArchiveEntry`: un rename futuro nei tipi archivio non rompe silenziosamente il payload. */
interface SubmitCareerRankPayload {
  p_device_id: string;
  p_nickname: string;
  p_track: LeaderboardTrack;
  p_peak_rating: number;
  p_trophy_count: number;
  p_award_count: number;
  p_final_savings_eur: number;
  p_last_name: string;
  p_nationality: string;
  p_role_label: string;
  p_career_title: string;
  p_archetype_id: string | null;
  p_app_version: string;
  p_client_entry_id: string;
}

export function buildPlayerSubmitPayload(
  entry: ArchivedCareer,
  nickname: string,
  deviceId: string,
): SubmitCareerRankPayload {
  return {
    p_device_id: deviceId,
    p_nickname: nickname.trim(),
    p_track: "player",
    p_peak_rating: entry.peakOvr,
    p_trophy_count: entry.trophyCount,
    p_award_count: entry.awardCount,
    p_final_savings_eur: entry.finalSavingsEur,
    p_last_name: entry.lastName,
    p_nationality: entry.nationality,
    // Etichetta già tradotta (es. "ATT" non "ST") — stessa label che l'app mostra ovunque altrove
    // (PlayerCard/CareerArchive), la classifica non deve mostrare il codice interno crudo.
    p_role_label: POSITION_LABELS[entry.position],
    p_career_title: entry.careerTitle,
    p_archetype_id: entry.archetypeId ?? null,
    p_app_version: APP_VERSION,
    p_client_entry_id: entry.id,
  };
}

const COACH_ROLE_LABEL = "Allenatore";

export function buildCoachSubmitPayload(
  entry: ArchivedCoachCareer,
  nickname: string,
  deviceId: string,
): SubmitCareerRankPayload {
  return {
    p_device_id: deviceId,
    p_nickname: nickname.trim(),
    p_track: "coach",
    p_peak_rating: entry.peakReputation,
    p_trophy_count: entry.trophyCount,
    p_award_count: entry.awardCount,
    p_final_savings_eur: entry.finalSavingsEur,
    p_last_name: entry.lastName,
    p_nationality: entry.nationality,
    p_role_label: COACH_ROLE_LABEL,
    p_career_title: entry.careerTitle,
    p_archetype_id: entry.archetypeId ?? null,
    p_app_version: APP_VERSION,
    p_client_entry_id: entry.id,
  };
}

async function submitCareerRank(payload: SubmitCareerRankPayload): Promise<LeaderboardResult<true>> {
  if (!isLeaderboardConfigured()) return { ok: false, error: "not-configured" };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/myroad_submit_career_rank`, {
      method: "POST",
      headers: { ...headers(), Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // Il trigger myroad_claim_nickname (riagganciato in supabase/career-ranks.sql) rifiuta la
      // riga con questo messaggio se il nickname è già di un altro dispositivo — distinto da un
      // errore generico per poter guidare l'utente a cambiarlo nelle Impostazioni.
      const body = await res.text().catch(() => "");
      if (body.includes("NICKNAME_TAKEN")) return { ok: false, error: "nickname-taken" };
      return { ok: false, error: `http-${res.status}` };
    }
    return { ok: true, value: true };
  } catch {
    return { ok: false, error: "network" };
  }
}

export function submitPlayerCareerRank(
  entry: ArchivedCareer,
  nickname: string,
  deviceId: string,
): Promise<LeaderboardResult<true>> {
  return submitCareerRank(buildPlayerSubmitPayload(entry, nickname, deviceId));
}

export function submitCoachCareerRank(
  entry: ArchivedCoachCareer,
  nickname: string,
  deviceId: string,
): Promise<LeaderboardResult<true>> {
  return submitCareerRank(buildCoachSubmitPayload(entry, nickname, deviceId));
}

/** Controllo di disponibilità nickname (RPC `myroad_nickname_available`, sola lettura) — usato
 * per un feedback immediato "onBlur" nei form, prima ancora di pubblicare un punteggio. Stessa
 * tabella di possesso globale per entrambe le piste (vedi career-ranks.sql), nessun cambiamento
 * qui rispetto a prima della Fase 5. */
export async function checkNicknameAvailable(
  nickname: string,
  deviceId: string,
): Promise<LeaderboardResult<boolean>> {
  if (!isLeaderboardConfigured()) return { ok: false, error: "not-configured" };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/myroad_nickname_available`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ p_nickname: nickname.trim(), p_device_id: deviceId }),
    });
    if (!res.ok) return { ok: false, error: `http-${res.status}` };
    const available = (await res.json()) as boolean;
    return { ok: true, value: available };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function fetchLeaderboard(
  track: LeaderboardTrack,
  limit: number = DEFAULT_LIMIT,
): Promise<LeaderboardResult<LeaderboardListItem[]>> {
  if (!isLeaderboardConfigured()) return { ok: false, error: "not-configured" };

  const url = `${SUPABASE_URL}/rest/v1/${VIEW}?select=*&track=eq.${track}&order=career_score.desc,created_at.desc&limit=${limit}`;

  try {
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) return { ok: false, error: `http-${res.status}` };
    const rows = (await res.json()) as LeaderboardEntryRow[];
    return { ok: true, value: rows.map(toLeaderboardListItem) };
  } catch {
    return { ok: false, error: "network" };
  }
}
