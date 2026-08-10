import { describe, expect, it } from "vitest";
import type { OutfieldAttributes } from "@/types/career";
import {
  applyAttributesDelta,
  attributeKeysForPosition,
  createAttributesForPosition,
  deriveOvrFromAttributes,
  distributeAttributeGrowth,
  isGoalkeeperAttributes,
  OUTFIELD_ROLE_ATTRIBUTE_WEIGHTS,
} from "./attributes";

const NO_NOISE_RNG = () => 0.5; // noise = 0

describe("attributeKeysForPosition / isGoalkeeperAttributes", () => {
  it("dovrebbe restituire il set portiere per GK e outfield per gli altri ruoli", () => {
    expect(attributeKeysForPosition("GK")).toEqual(["reflexes", "handling", "kicking", "positioning"]);
    expect(attributeKeysForPosition("ST")).toEqual(["pace", "shooting", "passing", "defending", "physical"]);
  });

  it("dovrebbe riconoscere correttamente il kind degli attributi", () => {
    const outfield = createAttributesForPosition("ST", NO_NOISE_RNG);
    const gk = createAttributesForPosition("GK", NO_NOISE_RNG);
    expect(isGoalkeeperAttributes(outfield)).toBe(false);
    expect(isGoalkeeperAttributes(gk)).toBe(true);
  });
});

describe("deriveOvrFromAttributes", () => {
  it("dovrebbe restituire la media pesata per ruolo, arrotondata", () => {
    const attrs: OutfieldAttributes = {
      kind: "outfield",
      pace: 50,
      shooting: 50,
      passing: 50,
      defending: 50,
      physical: 50,
    };
    expect(deriveOvrFromAttributes(attrs, "ST")).toBe(50);
  });

  it("dovrebbe pesare di più shooting/physical per un attaccante", () => {
    const highShooting: OutfieldAttributes = {
      kind: "outfield",
      pace: 50,
      shooting: 90,
      passing: 50,
      defending: 50,
      physical: 50,
    };
    const highDefending: OutfieldAttributes = { ...highShooting, shooting: 50, defending: 90 };
    expect(deriveOvrFromAttributes(highShooting, "ST")).toBeGreaterThan(
      deriveOvrFromAttributes(highDefending, "ST"),
    );
  });
});

describe("distributeAttributeGrowth", () => {
  it("senza focus e senza rumore, la crescita dell'OVR derivato deve coincidere col budget (invariante anti-regressione)", () => {
    for (const position of Object.keys(OUTFIELD_ROLE_ATTRIBUTE_WEIGHTS) as (keyof typeof OUTFIELD_ROLE_ATTRIBUTE_WEIGHTS)[]) {
      const attrs = createAttributesForPosition(position, NO_NOISE_RNG);
      const before = deriveOvrFromAttributes(attrs, position);
      const budget = 10;
      const grown = distributeAttributeGrowth({
        attributes: attrs,
        position,
        totalGrowthBudget: budget,
        focusAttribute: null,
        rng: NO_NOISE_RNG,
      });
      const after = deriveOvrFromAttributes(grown, position);
      expect(after - before).toBeCloseTo(budget, 0);
    }
  });

  it("con un focus impostato, la crescita dell'OVR derivato deve comunque coincidere col budget", () => {
    const attrs = createAttributesForPosition("CM", NO_NOISE_RNG);
    const before = deriveOvrFromAttributes(attrs, "CM");
    const budget = 8;
    const grown = distributeAttributeGrowth({
      attributes: attrs,
      position: "CM",
      totalGrowthBudget: budget,
      focusAttribute: "passing",
      rng: NO_NOISE_RNG,
    });
    const after = deriveOvrFromAttributes(grown, "CM");
    expect(after - before).toBeCloseTo(budget, 0);
  });

  it("l'attributo in focus dovrebbe crescere più degli altri", () => {
    const attrs = createAttributesForPosition("CM", NO_NOISE_RNG) as OutfieldAttributes;
    const grown = distributeAttributeGrowth({
      attributes: attrs,
      position: "CM",
      totalGrowthBudget: 10,
      focusAttribute: "passing",
      rng: NO_NOISE_RNG,
    }) as OutfieldAttributes;
    const passingGrowth = grown.passing - attrs.passing;
    const paceGrowth = grown.pace - attrs.pace;
    expect(passingGrowth).toBeGreaterThan(paceGrowth);
  });

  it("un budget negativo (declino da veterano) deve far scendere l'OVR derivato coerentemente", () => {
    const attrs = createAttributesForPosition("ST", NO_NOISE_RNG);
    const before = deriveOvrFromAttributes(attrs, "ST");
    const grown = distributeAttributeGrowth({
      attributes: attrs,
      position: "ST",
      totalGrowthBudget: -6,
      focusAttribute: null,
      rng: NO_NOISE_RNG,
    });
    const after = deriveOvrFromAttributes(grown, "ST");
    expect(after).toBeLessThan(before);
  });
});

describe("applyAttributesDelta", () => {
  it("dovrebbe clampare 1-99 e ignorare chiavi non pertinenti al kind corrente", () => {
    const attrs: OutfieldAttributes = {
      kind: "outfield",
      pace: 97,
      shooting: 3,
      passing: 50,
      defending: 50,
      physical: 50,
    };
    const result = applyAttributesDelta(attrs, {
      pace: 10,
      shooting: -10,
      reflexes: 50, // chiave GK, deve essere ignorata su un outfield
    }) as OutfieldAttributes;
    expect(result.pace).toBe(99);
    expect(result.shooting).toBe(1);
    expect("reflexes" in result).toBe(false);
  });
});
