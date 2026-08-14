import { describe, expect, it } from "vitest";
import { getClub } from "@/data/clubs";
import { applyCoachClubTierMovement } from "./club-progression";

const TORINO = getClub("torino")!; // Serie A (tier 1), prestige 1
const SAMPDORIA = getClub("sampdoria")!; // Serie B (tier 2), prestige 1
const BENFICA = getClub("benfica")!; // unico tier modellato per il Portogallo

describe("applyCoachClubTierMovement", () => {
  it("promuove su un titolo vinto (deterministico, nessun roll)", () => {
    const result = applyCoachClubTierMovement(SAMPDORIA, "title");
    expect(result.change).toBe("promoted");
    expect(result.club.tier).toBe(1);
    expect(result.club.competitions.league).toBe("Serie A");
  });

  it("non promuove un club già al tier 1 anche con un titolo", () => {
    const result = applyCoachClubTierMovement(TORINO, "title");
    expect(result.change).toBeNull();
  });

  it("retrocede su un piazzamento 'relegated' (deterministico, nessun roll)", () => {
    const result = applyCoachClubTierMovement(TORINO, "relegated");
    expect(result.change).toBe("relegated");
    expect(result.club.tier).toBe(2);
    expect(result.club.competitions.league).toBe("Serie B");
  });

  it("nessun movimento per piazzamenti intermedi", () => {
    expect(applyCoachClubTierMovement(TORINO, "mid-table").change).toBeNull();
    expect(applyCoachClubTierMovement(TORINO, "relegation-battle").change).toBeNull();
    expect(applyCoachClubTierMovement(TORINO, "continental-qualification").change).toBeNull();
  });

  it("è un no-op per un club di un paese con un solo tier modellato", () => {
    const result = applyCoachClubTierMovement(BENFICA, "relegated");
    expect(result.change).toBeNull();
    expect(result.club).toEqual(BENFICA);
  });
});
