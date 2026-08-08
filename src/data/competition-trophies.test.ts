import { describe, expect, it } from "vitest";
import { clubs, leagues } from "./clubs";
import { COMPETITION_TROPHIES, TROPHY_KNOWN_GAP, getCompetitionTrophy } from "./competition-trophies";

describe("COMPETITION_TROPHIES", () => {
  it("ogni URL è un hotlink https a thesportsdb.com", () => {
    for (const url of Object.values(COMPETITION_TROPHIES)) {
      expect(url).toMatch(/^https:\/\/(r2\.|www\.)?thesportsdb\.com\//);
    }
  });

  it("copre il campionato di ogni lega tranne Serie C e i gap noti", () => {
    for (const league of leagues) {
      if (league.name === "Serie C" || TROPHY_KNOWN_GAP.includes(league.name)) continue;
      expect(getCompetitionTrophy(league.name)).toBeDefined();
    }
  });

  it("copre la coppa nazionale quando esiste ed è fuori dai gap noti", () => {
    for (const league of leagues) {
      if (!league.cup) continue; // niente coppa nazionale attiva (es. Messico)
      if (TROPHY_KNOWN_GAP.includes(league.cup)) continue; // copertura TSDB nota mancante
      expect(getCompetitionTrophy(league.cup)).toBeDefined();
    }
  });

  it("copre la coppa continentale di ogni club di tier 1", () => {
    for (const c of clubs) {
      if (c.tier === 1 && c.competitions.continental) {
        expect(getCompetitionTrophy(c.competitions.continental)).toBeDefined();
      }
    }
  });

  it("restituisce undefined per una competizione sconosciuta", () => {
    expect(getCompetitionTrophy("Serie C")).toBeUndefined();
    expect(getCompetitionTrophy("Torneo inesistente")).toBeUndefined();
  });
});
