import { describe, expect, it } from "vitest";
import type { GoalkeeperAttributes, OutfieldAttributes } from "@/types/career";
import {
  detectNewPlayStyles,
  playStyleAssistsMultiplier,
  playStyleCallupBonus,
  playStyleCleanSheetMultiplier,
  playStyleConcededMultiplier,
  playStyleGoalsMultiplier,
  playStyleInjuryMultiplier,
  playStyleTrophyBonus,
} from "./playstyles";

const LOW_OUTFIELD: OutfieldAttributes = {
  kind: "outfield",
  pace: 50,
  shooting: 50,
  passing: 50,
  defending: 50,
  physical: 50,
};

describe("detectNewPlayStyles", () => {
  it("non dovrebbe sbloccare nulla se nessun attributo supera la soglia", () => {
    const result = detectNewPlayStyles({ attributes: LOW_OUTFIELD, position: "ST", playStyles: [] });
    expect(result).toEqual([]);
  });

  it("dovrebbe sbloccare 'curler' quando shooting supera la soglia per un attaccante", () => {
    const attrs: OutfieldAttributes = { ...LOW_OUTFIELD, shooting: 90 };
    const result = detectNewPlayStyles({ attributes: attrs, position: "ST", playStyles: [] });
    expect(result).toContain("curler");
  });

  it("non dovrebbe ri-proporre un playstyle già sbloccato", () => {
    const attrs: OutfieldAttributes = { ...LOW_OUTFIELD, shooting: 90 };
    const result = detectNewPlayStyles({ attributes: attrs, position: "ST", playStyles: ["curler"] });
    expect(result).not.toContain("curler");
  });

  it("'brickwall' dovrebbe sbloccarsi solo per i ruoli difensivi eleggibili", () => {
    const attrs: OutfieldAttributes = { ...LOW_OUTFIELD, defending: 90 };
    const cbResult = detectNewPlayStyles({ attributes: attrs, position: "CB", playStyles: [] });
    const stResult = detectNewPlayStyles({ attributes: attrs, position: "ST", playStyles: [] });
    expect(cbResult).toContain("brickwall");
    expect(stResult).not.toContain("brickwall");
  });

  it("'catlike' dovrebbe sbloccarsi solo per i portieri", () => {
    const gkAttrs: GoalkeeperAttributes = {
      kind: "goalkeeper",
      reflexes: 90,
      handling: 50,
      kicking: 50,
      positioning: 50,
    };
    const result = detectNewPlayStyles({ attributes: gkAttrs, position: "GK", playStyles: [] });
    expect(result).toContain("catlike");
  });
});

describe("moltiplicatori/bonus", () => {
  it("dovrebbero essere neutri (1 o 0) senza il playstyle corrispondente", () => {
    expect(playStyleGoalsMultiplier([])).toBe(1);
    expect(playStyleAssistsMultiplier([])).toBe(1);
    expect(playStyleInjuryMultiplier([])).toBe(1);
    expect(playStyleTrophyBonus([])).toBe(0);
    expect(playStyleCallupBonus([])).toBe(0);
    expect(playStyleConcededMultiplier([])).toBe(1);
    expect(playStyleCleanSheetMultiplier([])).toBe(1);
  });

  it("dovrebbero applicare il bonus quando il playstyle è presente", () => {
    expect(playStyleGoalsMultiplier(["curler"])).toBeGreaterThan(1);
    expect(playStyleAssistsMultiplier(["playmaker"])).toBeGreaterThan(1);
    expect(playStyleInjuryMultiplier(["sprinter"])).toBeLessThan(1);
    expect(playStyleTrophyBonus(["brickwall"])).toBeGreaterThan(0);
    expect(playStyleCallupBonus(["targetman"])).toBeGreaterThan(0);
    expect(playStyleConcededMultiplier(["catlike"])).toBeLessThan(1);
    expect(playStyleCleanSheetMultiplier(["catlike"])).toBeGreaterThan(1);
  });
});
