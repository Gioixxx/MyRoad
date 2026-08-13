"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_LEADERBOARD_SETTINGS,
  loadLeaderboardSettings,
  saveNickname as persistNickname,
} from "@/lib/leaderboard/settings";

export interface UseLeaderboardSettings {
  nickname: string;
  deviceId: string;
  setNickname: (nickname: string) => void;
}

/** Stesso schema di `useBackgroundMusic`: lettura di localStorage in un mount effect (non un
 * lazy initializer di useState) per evitare un hydration mismatch SSR/client. */
export function useLeaderboardSettings(): UseLeaderboardSettings {
  const [nickname, setNicknameState] = useState(DEFAULT_LEADERBOARD_SETTINGS.nickname);
  const [deviceId, setDeviceId] = useState(DEFAULT_LEADERBOARD_SETTINGS.deviceId);

  useEffect(() => {
    const settings = loadLeaderboardSettings();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage non esiste in SSR
    setNicknameState(settings.nickname);
    setDeviceId(settings.deviceId);
  }, []);

  const setNickname = useCallback((next: string) => {
    setNicknameState(next);
    persistNickname(next);
  }, []);

  return { nickname, deviceId, setNickname };
}
