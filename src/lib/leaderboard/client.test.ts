import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ArchivedCareer } from "@/types/career";
import type { ArchivedCoachCareer } from "@/types/coach";
import { buildCoachSubmitPayload, buildPlayerSubmitPayload } from "./client";

const PLAYER_ENTRY: ArchivedCareer = {
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

const COACH_ENTRY: ArchivedCoachCareer = {
  id: "bianchi-456",
  lastName: "Bianchi",
  nationality: "Italy",
  peakReputation: 72,
  trophyCount: 2,
  awardCount: 1,
  retiredAge: 68,
  retiredAtIso: "2026-01-01T00:00:00.000Z",
  finalSavingsEur: 3_000_000,
  finalPopularity: 55,
  careerTitle: "Stratega",
  clubsManaged: 3,
  bestLeagueFinish: "title",
  archetypeId: "leader",
  shadowTitle: null,
};

describe("leaderboard/client — buildPlayerSubmitPayload", () => {
  it("mappa ogni campo di ArchivedCareer sui parametri della RPC (pista player)", () => {
    const payload = buildPlayerSubmitPayload(PLAYER_ENTRY, "  Fenomeno99  ", "device-abc");

    expect(payload).toEqual({
      p_device_id: "device-abc",
      p_nickname: "Fenomeno99",
      p_track: "player",
      p_peak_rating: 88,
      p_trophy_count: 4,
      p_award_count: 1,
      p_final_savings_eur: 5_000_000,
      p_last_name: "Rossi",
      p_nationality: "Italy",
      p_role_label: "ATT",
      p_career_title: "Leggenda",
      p_archetype_id: "leader",
      p_app_version: expect.any(String),
      p_client_entry_id: "rossi-123",
    });
  });

  it("normalizza archetypeId assente a null", () => {
    const payload = buildPlayerSubmitPayload({ ...PLAYER_ENTRY, archetypeId: undefined }, "Nick", "d");
    expect(payload.p_archetype_id).toBeNull();
  });
});

describe("leaderboard/client — buildCoachSubmitPayload", () => {
  it("mappa ogni campo di ArchivedCoachCareer sui parametri della RPC (pista coach)", () => {
    const payload = buildCoachSubmitPayload(COACH_ENTRY, "  Mister99  ", "device-xyz");

    expect(payload).toEqual({
      p_device_id: "device-xyz",
      p_nickname: "Mister99",
      p_track: "coach",
      p_peak_rating: 72,
      p_trophy_count: 2,
      p_award_count: 1,
      p_final_savings_eur: 3_000_000,
      p_last_name: "Bianchi",
      p_nationality: "Italy",
      p_role_label: "Allenatore",
      p_career_title: "Stratega",
      p_archetype_id: "leader",
      p_app_version: expect.any(String),
      p_client_entry_id: "bianchi-456",
    });
  });

  it("normalizza archetypeId assente a null", () => {
    const payload = buildCoachSubmitPayload({ ...COACH_ENTRY, archetypeId: undefined }, "Nick", "d");
    expect(payload.p_archetype_id).toBeNull();
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

    it("submitPlayerCareerRank chiama l'RPC di submit con gli header/parametri giusti", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", fetchMock);

      const mod = await import("./client");
      const result = await mod.submitPlayerCareerRank(PLAYER_ENTRY, "Nick", "device-abc");

      expect(result).toEqual({ ok: true, value: true });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://test.supabase.co/rest/v1/rpc/myroad_submit_career_rank");
      expect(init.method).toBe("POST");
      expect(init.headers.apikey).toBe("test-anon-key");
      expect(init.headers.Authorization).toBe("Bearer test-anon-key");
      expect(init.headers.Prefer).toBe("return=minimal");
      const body = JSON.parse(init.body);
      expect(body.p_nickname).toBe("Nick");
      expect(body.p_track).toBe("player");
    });

    it("submitCoachCareerRank chiama la stessa RPC con track='coach'", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", fetchMock);

      const mod = await import("./client");
      const result = await mod.submitCoachCareerRank(COACH_ENTRY, "Mister99", "device-xyz");

      expect(result).toEqual({ ok: true, value: true });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://test.supabase.co/rest/v1/rpc/myroad_submit_career_rank");
      const body = JSON.parse(init.body);
      expect(body.p_nickname).toBe("Mister99");
      expect(body.p_track).toBe("coach");
    });

    it("submitPlayerCareerRank ritorna ok:false su risposta non-ok, senza lanciare", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => "" }),
      );
      const mod = await import("./client");
      const result = await mod.submitPlayerCareerRank(PLAYER_ENTRY, "Nick", "device-abc");
      expect(result).toEqual({ ok: false, error: "http-400" });
    });

    it("submitPlayerCareerRank riconosce il rifiuto per nickname già in uso (trigger myroad_claim_nickname)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 409,
          text: async () => JSON.stringify({ code: "23505", message: "NICKNAME_TAKEN" }),
        }),
      );
      const mod = await import("./client");
      const result = await mod.submitPlayerCareerRank(PLAYER_ENTRY, "Nick", "device-abc");
      expect(result).toEqual({ ok: false, error: "nickname-taken" });
    });

    it("checkNicknameAvailable chiama l'RPC e ritorna il booleano di disponibilità", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => true });
      vi.stubGlobal("fetch", fetchMock);

      const mod = await import("./client");
      const result = await mod.checkNicknameAvailable("  Nick  ", "device-abc");

      expect(result).toEqual({ ok: true, value: true });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://test.supabase.co/rest/v1/rpc/myroad_nickname_available");
      expect(JSON.parse(init.body)).toEqual({ p_nickname: "Nick", p_device_id: "device-abc" });
    });

    it("checkNicknameAvailable ritorna ok:false su errore di rete, senza lanciare", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
      const mod = await import("./client");
      await expect(mod.checkNicknameAvailable("Nick", "device-abc")).resolves.toEqual({
        ok: false,
        error: "network",
      });
    });

    it("submitPlayerCareerRank ritorna ok:false su errore di rete, senza lanciare", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
      const mod = await import("./client");
      await expect(mod.submitPlayerCareerRank(PLAYER_ENTRY, "Nick", "device-abc")).resolves.toEqual({
        ok: false,
        error: "network",
      });
    });

    it("fetchLeaderboard costruisce la query string corretta per pista", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
      vi.stubGlobal("fetch", fetchMock);

      const mod = await import("./client");
      await mod.fetchLeaderboard("coach", 10);

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://test.supabase.co/rest/v1/myroad_career_ranks_public?select=*&track=eq.coach&order=career_score.desc,created_at.desc&limit=10",
      );
    });

    it("fetchLeaderboard punta alla vista pubblica, non alla tabella base", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
      vi.stubGlobal("fetch", fetchMock);

      const mod = await import("./client");
      await mod.fetchLeaderboard("player");

      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("/rest/v1/myroad_career_ranks_public?");
      expect(url).not.toContain("myroad_career_ranks?");
    });

    it("fetchLeaderboard mappa le righe raw in LeaderboardListItem", async () => {
      const row = {
        id: "row-1",
        created_at: "2026-01-01T00:00:00.000Z",
        nickname: "Nick",
        track: "player",
        peak_rating: 88,
        trophy_count: 4,
        award_count: 1,
        final_savings_eur: 5_000_000,
        last_name: "Rossi",
        nationality: "Italy",
        role_label: "ATT",
        career_title: "Leggenda",
        archetype_id: "leader",
        app_version: "0.16.0",
        career_score: 2200,
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [row] }));

      const mod = await import("./client");
      const result = await mod.fetchLeaderboard("player");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]).toEqual({
          id: "row-1",
          nickname: "Nick",
          lastName: "Rossi",
          nationality: "Italy",
          roleLabel: "ATT",
          peakRating: 88,
          trophyCount: 4,
          awardCount: 1,
          finalSavingsEur: 5_000_000,
          careerTitle: "Leggenda",
          archetypeId: "leader",
          careerScore: 2200,
        });
      }
    });

    it("fetchLeaderboard ritorna ok:false su risposta non-ok, senza lanciare", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
      const mod = await import("./client");
      const result = await mod.fetchLeaderboard("coach");
      expect(result).toEqual({ ok: false, error: "http-500" });
    });
  });
});
