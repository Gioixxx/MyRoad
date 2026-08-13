import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_LEADERBOARD_SETTINGS,
  isValidNickname,
  loadLeaderboardSettings,
  saveNickname,
} from "./settings";

describe("leaderboard/settings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("restituisce nickname vuoto e genera un deviceId al primo caricamento", () => {
    const settings = loadLeaderboardSettings();
    expect(settings.nickname).toBe(DEFAULT_LEADERBOARD_SETTINGS.nickname);
    expect(settings.deviceId).not.toBe("");
  });

  it("il deviceId resta stabile tra caricamenti successivi", () => {
    const first = loadLeaderboardSettings();
    const second = loadLeaderboardSettings();
    expect(second.deviceId).toBe(first.deviceId);
  });

  it("saveNickname aggiorna il nickname senza toccare il deviceId", () => {
    const before = loadLeaderboardSettings();
    saveNickname("Fenomeno99");
    const after = loadLeaderboardSettings();
    expect(after.nickname).toBe("Fenomeno99");
    expect(after.deviceId).toBe(before.deviceId);
  });

  it("ignora un salvataggio corrotto e riparte dai default (ma genera comunque un deviceId)", () => {
    window.localStorage.setItem("carriera:leaderboard-settings", "{not json");
    const settings = loadLeaderboardSettings();
    expect(settings.nickname).toBe("");
    expect(settings.deviceId).not.toBe("");
  });

  it("isValidNickname rifiuta vuoto, troppo corto, troppo lungo, charset non valido", () => {
    expect(isValidNickname("")).toBe(false);
    expect(isValidNickname("a")).toBe(false);
    expect(isValidNickname("a".repeat(21))).toBe(false);
    expect(isValidNickname("nick@name")).toBe(false);
    expect(isValidNickname("nick#name")).toBe(false);
  });

  it("isValidNickname accetta 2-20 caratteri, spazi, punteggiatura e lettere accentate", () => {
    expect(isValidNickname("ab")).toBe(true);
    expect(isValidNickname("a".repeat(20))).toBe(true);
    expect(isValidNickname("Il Fenomeno")).toBe(true);
    expect(isValidNickname("José_99.x")).toBe(true);
  });

  it("isValidNickname considera solo il contenuto dopo trim", () => {
    expect(isValidNickname("  ab  ")).toBe(true);
    expect(isValidNickname("  a  ")).toBe(false);
  });
});
