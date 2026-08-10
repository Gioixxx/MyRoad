import { describe, expect, it } from "vitest";
import {
  applyPotentialDelta,
  evaluatePotentialGrowth,
  rollInitialPotential,
} from "./potential";
import type { Rng } from "./progression";

describe("rollInitialPotential", () => {
  it("dovrebbe restituire un valore nel range 76-99", () => {
    const rng: Rng = () => 0.5;
    const result = rollInitialPotential(rng);
    expect(result).toBeGreaterThanOrEqual(76);
    expect(result).toBeLessThanOrEqual(99);
  });

  it("con rng che pesca sempre l'ultima fascia dovrebbe restituire un valore alto (97-99)", () => {
    const rng: Rng = () => 0.999;
    const result = rollInitialPotential(rng);
    expect(result).toBeGreaterThanOrEqual(97);
    expect(result).toBeLessThanOrEqual(99);
  });

  it("con rng che pesca sempre la prima fascia dovrebbe restituire un valore basso (76-85)", () => {
    const rng: Rng = () => 0;
    const result = rollInitialPotential(rng);
    expect(result).toBeGreaterThanOrEqual(76);
    expect(result).toBeLessThanOrEqual(85);
  });
});

describe("applyPotentialDelta", () => {
  it("dovrebbe sommare il delta clampando 30-99", () => {
    expect(applyPotentialDelta(80, 5)).toBe(85);
    expect(applyPotentialDelta(97, 5)).toBe(99);
    expect(applyPotentialDelta(32, -5)).toBe(30);
  });
});

describe("evaluatePotentialGrowth", () => {
  const rng: Rng = () => 0.5; // noise = 0

  it("non dovrebbe crescere con un solo segnale su tre", () => {
    const growth = evaluatePotentialGrowth(
      { age: 20, objectiveMet: true, seasonTitleId: "steady", brokeRecord: false },
      rng,
    );
    expect(growth).toBe(0);
  });

  it("dovrebbe crescere con almeno 2 segnali su tre sotto la soglia d'età", () => {
    const growth = evaluatePotentialGrowth(
      { age: 20, objectiveMet: true, seasonTitleId: "revelation", brokeRecord: false },
      rng,
    );
    expect(growth).toBe(2);
  });

  it("dovrebbe crescere con tutti e 3 i segnali veri", () => {
    const growth = evaluatePotentialGrowth(
      { age: 22, objectiveMet: true, seasonTitleId: "champion", brokeRecord: true },
      rng,
    );
    expect(growth).toBe(2);
  });

  it("non dovrebbe mai crescere oltre l'età di plateau (26), anche con tutti i segnali", () => {
    const growth = evaluatePotentialGrowth(
      { age: 27, objectiveMet: true, seasonTitleId: "champion", brokeRecord: true },
      rng,
    );
    expect(growth).toBe(0);
  });
});
