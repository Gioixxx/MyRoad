import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ArchivedCareer } from "@/types/career";
import { buildSubmitPayload } from "./client";

const ENTRY: ArchivedCareer = {
  id: "rossi-123",
  lastName: "Rossi",
  nationality: "Italy",
  position: "ST",
  peakOvr: 88,
  trophyCount: 4,
  awardCount: 1,
  retiredAge: 34,
  retiredAtIso: "2026-01-01T00:00:00.000Z",
  careerApps: 320,
  careerGoals: 210,
  careerAssists: 60,
  finalSavingsEur: 5_000_000,
  finalPopularity: 82,
  careerTitle: "Leggenda",
  archetypeId: "leader",
  shadowTitle: null,
};

describe("leaderboard/client — buildSubmitPayload", () => {
  it("mappa ogni campo di ArchivedCareer sulla colonna snake_case corretta", () => {
    const payload = buildSubmitPayload(ENTRY, "  Fenomeno99  ", "device-abc");

    expect(payload).toEqual({
      device_id: "device-abc",
      nickname: "Fenomeno99",
      app_version: expect.any(String),
      client_entry_id: "rossi-123",
      last_name: "Rossi",
      nationality: "Italy",
      position: "ST",
      peak_ovr: 88,
      trophy_count: 4,
      award_count: 1,
      retired_age: 34,
      retired_at_iso: "2026-01-01T00:00:00.000Z",
      career_apps: 320,
      career_goals: 210,
      career_assists: 60,
      final_savings_eur: 5_000_000,
      final_popularity: 82,
      career_title: "Leggenda",
      archetype_id: "leader",
      shadow_title: null,
    });
  });

  it("normalizza archetypeId/shadowTitle assenti a null", () => {
    const payload = buildSubmitPayload({ ...ENTRY, archetypeId: undefined, shadowTitle: undefined }, "Nick", "d");
    expect(payload.archetype_id).toBeNull();
    expect(payload.shadow_title).toBeNull();
  });
});

describe("leaderboard/client — rete (env stubbate, modulo reimportato)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("isLeaderboardConfigured è false senza le env vars", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const mod = await import("./client");
    expect(mod.isLeaderboardConfigured()).toBe(false);
  });

  describe("con env configurate", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    });

    it("isLeaderboardConfigured è true", async () => {
      const mod = await import("./client");
      expect(mod.isLeaderboardConfigured()).toBe(true);
    });

    it("submitLeaderboardEntry chiama l'endpoint corretto con gli header giusti", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
      vi.stubGlobal("fetch", fetchMock);

      const mod = await import("./client");
      const result = await mod.submitLeaderboardEntry(ENTRY, "Nick", "device-abc");

      expect(result).toEqual({ ok: true, value: true });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://test.supabase.co/rest/v1/myroad_leaderboard_entries");
      expect(init.method).toBe("POST");
      expect(init.headers.apikey).toBe("test-anon-key");
      expect(init.headers.Authorization).toBe("Bearer test-anon-key");
      expect(init.headers.Prefer).toBe("return=minimal");
      expect(JSON.parse(init.body).nickname).toBe("Nick");
    });

    it("submitLeaderboardEntry ritorna ok:false su risposta non-ok, senza lanciare", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400 }));
      const mod = await import("./client");
      const result = await mod.submitLeaderboardEntry(ENTRY, "Nick", "device-abc");
      expect(result).toEqual({ ok: false, error: "http-400" });
    });

    it("submitLeaderboardEntry ritorna ok:false su errore di rete, senza lanciare", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
      const mod = await import("./client");
      await expect(mod.submitLeaderboardEntry(ENTRY, "Nick", "device-abc")).resolves.toEqual({
        ok: false,
        error: "network",
      });
    });

    it("fetchLeaderboardCategory costruisce la query string corretta per categoria", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
      vi.stubGlobal("fetch", fetchMock);

      const mod = await import("./client");
      await mod.fetchLeaderboardCategory("mostTrophies", 10);

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://test.supabase.co/rest/v1/myroad_leaderboard_by_trophies?select=*&order=trophy_count.desc,created_at.desc&limit=10",
      );
    });

    it("fetchLeaderboardCategory punta alla vista per-dispositivo della categoria, non al dump pubblico", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
      vi.stubGlobal("fetch", fetchMock);

      const mod = await import("./client");
      await mod.fetchLeaderboardCategory("highestOvr");
      await mod.fetchLeaderboardCategory("richest");
      await mod.fetchLeaderboardCategory("mostPopular");

      const urls = fetchMock.mock.calls.map(([url]) => url as string);
      expect(urls[0]).toContain("/rest/v1/myroad_leaderboard_by_ovr?");
      expect(urls[1]).toContain("/rest/v1/myroad_leaderboard_by_savings?");
      expect(urls[2]).toContain("/rest/v1/myroad_leaderboard_by_popularity?");
      expect(urls.every((url) => !url.includes("myroad_leaderboard_public"))).toBe(true);
    });

    it("fetchLeaderboardCategory mappa le righe raw in LeaderboardListItem", async () => {
      const row = {
        id: "row-1",
        created_at: "2026-01-01T00:00:00.000Z",
        nickname: "Nick",
        app_version: "0.11.1",
        last_name: "Rossi",
        nationality: "Italy",
        position: "ST",
        peak_ovr: 88,
        trophy_count: 4,
        award_count: 1,
        retired_age: 34,
        retired_at_iso: "2026-01-01T00:00:00.000Z",
        career_apps: 320,
        career_goals: 210,
        career_assists: 60,
        final_savings_eur: 5_000_000,
        final_popularity: 82,
        career_title: "Leggenda",
        archetype_id: "leader",
        shadow_title: null,
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [row] }));

      const mod = await import("./client");
      const result = await mod.fetchLeaderboardCategory("highestOvr");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]).toEqual({
          id: "row-1",
          nickname: "Nick",
          lastName: "Rossi",
          nationality: "Italy",
          position: "ST",
          peakOvr: 88,
          trophyCount: 4,
          awardCount: 1,
          retiredAge: 34,
          finalSavingsEur: 5_000_000,
          finalPopularity: 82,
          careerTitle: "Leggenda",
          archetypeId: "leader",
        });
      }
    });

    it("fetchLeaderboardCategory ritorna ok:false su risposta non-ok, senza lanciare", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
      const mod = await import("./client");
      const result = await mod.fetchLeaderboardCategory("richest");
      expect(result).toEqual({ ok: false, error: "http-500" });
    });
  });
});
