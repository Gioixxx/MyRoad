const STORAGE_KEY = "carriera:leaderboard-settings";
const NICKNAME_CHARSET = /^[\p{L}\p{N} _.-]+$/u;

export interface LeaderboardSettings {
  nickname: string;
  /** Identità anonima per-device, generata pigramente (mai eager) al primo uso. */
  deviceId: string;
}

export const DEFAULT_LEADERBOARD_SETTINGS: LeaderboardSettings = { nickname: "", deviceId: "" };

export function isValidNickname(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2 && trimmed.length <= 20 && NICKNAME_CHARSET.test(trimmed);
}

/**
 * Legge le impostazioni; se manca un `deviceId` valido ne genera uno nuovo e lo persiste subito
 * (write-through) — così un utente che non tocca mai la feature non si ritrova comunque dati
 * scritti in localStorage, ma una volta generato resta stabile per sempre.
 */
export function loadLeaderboardSettings(): LeaderboardSettings {
  if (typeof window === "undefined") return DEFAULT_LEADERBOARD_SETTINGS;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  let nickname = "";
  let deviceId = "";
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<LeaderboardSettings>;
      if (typeof parsed.nickname === "string") nickname = parsed.nickname;
      if (typeof parsed.deviceId === "string") deviceId = parsed.deviceId;
    } catch {
      // ignora JSON corrotto, riparte dai default
    }
  }

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ nickname, deviceId }));
  }

  return { nickname, deviceId };
}

export function saveNickname(nickname: string): void {
  if (typeof window === "undefined") return;
  const current = loadLeaderboardSettings();
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ nickname, deviceId: current.deviceId }),
  );
}
