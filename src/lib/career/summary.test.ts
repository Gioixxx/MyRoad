import { describe, expect, it } from "vitest";
import type { ClubStint, Player } from "@/types/career";
import { getClub } from "@/data/clubs";
import { peakOvr, summarizeClubHistory } from "./summary";

const JUVENTUS = getClub("juventus")!;
const SEVILLA = getClub("sevilla")!;

function stint(overrides: Partial<ClubStint>): ClubStint {
  return {
    club: JUVENTUS,
    ageFrom: 16,
    ageTo: 18,
    type: "permanent",
    stats: { apps: 10, goals: 2, assists: 1 },
    ovr: 55,
    ...overrides,
  };
}

describe("summarizeClubHistory", () => {
  it("restituisce un array vuoto per una clubHistory vuota", () => {
    expect(summarizeClubHistory([])).toEqual([]);
  });

  it("mantiene righe separate per club diversi, nell'ordine di prima apparizione", () => {
    const history = [stint({ club: JUVENTUS }), stint({ club: SEVILLA, ageFrom: 18, ageTo: 20 })];
    const result = summarizeClubHistory(history);
    expect(result.map((r) => r.club.id)).toEqual(["juventus", "sevilla"]);
  });

  it("accorpa cicli separati nello stesso club sommando le statistiche", () => {
    const history = [
      stint({ ageFrom: 16, ageTo: 18, stats: { apps: 10, goals: 2, assists: 1 } }),
      stint({ ageFrom: 20, ageTo: 22, stats: { apps: 15, goals: 4, assists: 3 } }),
    ];
    const result = summarizeClubHistory(history);
    expect(result).toHaveLength(1);
    expect(result[0].stintCount).toBe(2);
    expect(result[0].ageFrom).toBe(16);
    expect(result[0].ageTo).toBe(22);
    expect(result[0].stats).toEqual({ apps: 25, goals: 6, assists: 4 });
  });

  it("non conta come cicli separati più stagioni consecutive dello stesso ciclo (cycleId condiviso)", () => {
    // 3 stint (una per stagione, ciclo Express) con lo stesso cycleId: un solo vero "ciclo" a
    // questo club, non "×3" spell separati — vedi piano "Due classifiche", criticità 1.
    const history = [
      stint({ ageFrom: 16, ageTo: 17, cycleId: 1 }),
      stint({ ageFrom: 17, ageTo: 18, cycleId: 1 }),
      stint({ ageFrom: 18, ageTo: 19, cycleId: 1 }),
    ];
    const result = summarizeClubHistory(history);
    expect(result).toHaveLength(1);
    expect(result[0].stintCount).toBe(1);
  });

  it("conta cicli distinti allo stesso club anche con cycleId diversi", () => {
    const history = [
      stint({ ageFrom: 16, ageTo: 18, cycleId: 1 }),
      stint({ ageFrom: 20, ageTo: 22, cycleId: 2 }),
    ];
    const result = summarizeClubHistory(history);
    expect(result[0].stintCount).toBe(2);
  });
});

describe("peakOvr", () => {
  it("restituisce l'ovr attuale se la clubHistory è vuota", () => {
    const player = { ovr: 60, clubHistory: [] } satisfies Pick<Player, "ovr" | "clubHistory">;
    expect(peakOvr(player)).toBe(60);
  });

  it("restituisce l'ovr storico più alto anche se superiore a quello attuale", () => {
    const player = {
      ovr: 70,
      clubHistory: [stint({ ovr: 82 }), stint({ ovr: 75 })],
    } satisfies Pick<Player, "ovr" | "clubHistory">;
    expect(peakOvr(player)).toBe(82);
  });
});
