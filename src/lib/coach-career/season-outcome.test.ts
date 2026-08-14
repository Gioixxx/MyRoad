import { describe, expect, it } from "vitest";
import type { Club } from "@/types/career";
import type { Rng } from "@/lib/career/progression";
import { expectedLeagueFinishRank, LEAGUE_FINISH_RANK, rollCoachSeasonOutcome } from "./season-outcome";

const NO_NOISE_RNG: Rng = () => 0.5;

function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: "test-club",
    name: "Test FC",
    country: "Italy",
    tier: 1,
    prestige: 1,
    competitions: { league: "Serie A", cup: "Coppa Italia" },
    crestUrl: "https://r2.thesportsdb.com/images/media/team/badge/test.png",
    ...overrides,
  };
}

describe("expectedLeagueFinishRank", () => {
  it("cresce con prestigio e reputazione", () => {
    expect(expectedLeagueFinishRank(3, 90)).toBeGreaterThan(expectedLeagueFinishRank(0, 30));
  });
});

describe("rollCoachSeasonOutcome", () => {
  it("produce sempre un leagueFinish valido", () => {
    const club = makeClub();
    const outcome = rollCoachSeasonOutcome(club, 50, 1, NO_NOISE_RNG);
    expect(Object.keys(LEAGUE_FINISH_RANK)).toContain(outcome.leagueFinish);
  });

  it("cupRun resta 'none' se il club non ha coppa nazionale", () => {
    const club = makeClub({ competitions: { league: "Serie A" } });
    const outcome = rollCoachSeasonOutcome(club, 80, 1, () => 0);
    expect(outcome.cupRun).toBe("none");
  });

  it("continentalRun assente sotto la soglia minima di reputazione", () => {
    const club = makeClub({ competitions: { league: "Serie A", continental: "Champions League" } });
    const outcome = rollCoachSeasonOutcome(club, 30, 1, () => 0);
    expect(outcome.continentalRun).toBeUndefined();
  });

  it("continentalRun presente sopra la soglia minima di reputazione", () => {
    const club = makeClub({ competitions: { league: "Serie A", continental: "Champions League" } });
    const outcome = rollCoachSeasonOutcome(club, 80, 1, () => 0);
    expect(outcome.continentalRun).toBeDefined();
  });

  it("un club di prestigio alto e reputazione alta tende a un piazzamento migliore", () => {
    const strongClub = makeClub({ prestige: 3 });
    const weakClub = makeClub({ prestige: 0 });
    const strong = rollCoachSeasonOutcome(strongClub, 90, 1, NO_NOISE_RNG);
    const weak = rollCoachSeasonOutcome(weakClub, 30, 1, NO_NOISE_RNG);
    expect(LEAGUE_FINISH_RANK[strong.leagueFinish]).toBeGreaterThan(LEAGUE_FINISH_RANK[weak.leagueFinish]);
  });
});
