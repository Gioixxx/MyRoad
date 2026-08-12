import { describe, expect, it } from "vitest";
import type { Club, GoalkeeperAttributes, OutfieldAttributes } from "@/types/career";
import {
  clubTacticalSystem,
  playerPreferredSystem,
  tacticalFit,
  tacticalFitMultiplier,
} from "./tactics";

const BALANCED: OutfieldAttributes = {
  kind: "outfield",
  pace: 50,
  shooting: 50,
  passing: 50,
  defending: 50,
  physical: 50,
};

function club(id: string): Pick<Club, "id"> {
  return { id };
}

describe("clubTacticalSystem", () => {
  it("è deterministico per lo stesso id", () => {
    expect(clubTacticalSystem(club("juventus"))).toBe(clubTacticalSystem(club("juventus")));
  });

  it("copre tutti e 4 i sistemi su un campione di id diversi", () => {
    const ids = Array.from({ length: 40 }, (_, i) => `club-${i}`);
    const systems = new Set(ids.map((id) => clubTacticalSystem(club(id))));
    expect(systems.size).toBe(4);
  });
});

describe("playerPreferredSystem", () => {
  it("è null per i portieri", () => {
    const gk: GoalkeeperAttributes = { kind: "goalkeeper", reflexes: 90, handling: 50, kicking: 50, positioning: 50 };
    expect(playerPreferredSystem(gk, "GK")).toBeNull();
  });

  it("mappa passing dominante a 'possesso'", () => {
    const attrs: OutfieldAttributes = { ...BALANCED, passing: 90 };
    expect(playerPreferredSystem(attrs, "CM")).toBe("possesso");
  });

  it("mappa pace dominante a 'contropiede'", () => {
    const attrs: OutfieldAttributes = { ...BALANCED, pace: 90 };
    expect(playerPreferredSystem(attrs, "RW")).toBe("contropiede");
  });

  it("mappa defending dominante a 'pressing'", () => {
    const attrs: OutfieldAttributes = { ...BALANCED, defending: 90 };
    expect(playerPreferredSystem(attrs, "CB")).toBe("pressing");
  });

  it("mappa physical dominante a 'diretto'", () => {
    const attrs: OutfieldAttributes = { ...BALANCED, physical: 90 };
    expect(playerPreferredSystem(attrs, "ST")).toBe("diretto");
  });
});

describe("tacticalFit", () => {
  it("è sempre 'neutro' per i portieri", () => {
    const gk: GoalkeeperAttributes = { kind: "goalkeeper", reflexes: 90, handling: 50, kicking: 50, positioning: 50 };
    expect(tacticalFit({ attributes: gk, position: "GK" }, club("any-club"))).toBe("neutro");
  });

  it("è 'ottimo' quando il sistema preferito coincide col sistema del club", () => {
    const attrs: OutfieldAttributes = { ...BALANCED, passing: 95 };
    const player = { attributes: attrs, position: "CM" as const };
    const target = { id: "x" };
    // Trova un id il cui sistema derivato coincide col sistema preferito del giocatore.
    const matching = Array.from({ length: 20 }, (_, i) => `probe-${i}`)
      .map((id) => ({ id }))
      .find((c) => clubTacticalSystem(c) === playerPreferredSystem(attrs, "CM"));
    expect(matching).toBeDefined();
    expect(tacticalFit(player, matching!)).toBe("ottimo");
    void target;
  });

  it("è 'scarso' quando il sistema del club coincide con l'attributo più debole del giocatore", () => {
    const attrs: OutfieldAttributes = { ...BALANCED, passing: 95, physical: 10 };
    const player = { attributes: attrs, position: "CM" as const };
    const matching = Array.from({ length: 20 }, (_, i) => `probe-weak-${i}`)
      .map((id) => ({ id }))
      .find((c) => clubTacticalSystem(c) === "diretto");
    expect(matching).toBeDefined();
    expect(tacticalFit(player, matching!)).toBe("scarso");
  });
});

describe("tacticalFitMultiplier", () => {
  it("è 1 per neutro, >1 per ottimo, <1 per scarso", () => {
    expect(tacticalFitMultiplier("neutro")).toBe(1);
    expect(tacticalFitMultiplier("ottimo")).toBeGreaterThan(1);
    expect(tacticalFitMultiplier("scarso")).toBeLessThan(1);
  });
});
