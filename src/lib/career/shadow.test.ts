import { describe, expect, it } from "vitest";
import {
  applyShadowDelta,
  deriveShadowTitle,
  isNationalTeamBanned,
  isRedemptionEligible,
  shadowMultiplier,
  shouldTriggerScandal,
} from "./shadow";

describe("applyShadowDelta", () => {
  it("dovrebbe sommare il delta e clampare a 0-100", () => {
    expect(applyShadowDelta(50, 10)).toBe(60);
    expect(applyShadowDelta(95, 10)).toBe(100);
    expect(applyShadowDelta(5, -10)).toBe(0);
  });
});

describe("shadowMultiplier", () => {
  it("dovrebbe seguire la formula 1 - shadow/200", () => {
    expect(shadowMultiplier(0)).toBe(1);
    expect(shadowMultiplier(50)).toBeCloseTo(0.75);
    expect(shadowMultiplier(100)).toBeCloseTo(0.5);
  });

  it("non dovrebbe mai scendere sotto 0", () => {
    expect(shadowMultiplier(1000)).toBe(0);
  });
});

describe("isNationalTeamBanned", () => {
  it("dovrebbe bloccare solo da 75 in su", () => {
    expect(isNationalTeamBanned(74)).toBe(false);
    expect(isNationalTeamBanned(75)).toBe(true);
  });
});

describe("shouldTriggerScandal", () => {
  it("dovrebbe scattare solo sopra soglia e se non già capitato di recente", () => {
    expect(shouldTriggerScandal({ shadow: 27 }, [])).toBe(false);
    expect(shouldTriggerScandal({ shadow: 28 }, [])).toBe(true);
    expect(shouldTriggerScandal({ shadow: 80 }, ["scandal"])).toBe(false);
  });
});

describe("isRedemptionEligible", () => {
  it("richiede uno scandalo già affrontato, shadow basso e nessuna redenzione già ottenuta", () => {
    expect(isRedemptionEligible({ shadow: 10, shadowFlags: {} })).toBe(false);
    expect(isRedemptionEligible({ shadow: 50, shadowFlags: { scandalOccurred: true } })).toBe(false);
    expect(isRedemptionEligible({ shadow: 10, shadowFlags: { scandalOccurred: true } })).toBe(true);
    expect(
      isRedemptionEligible({ shadow: 10, shadowFlags: { scandalOccurred: true, redeemed: true } }),
    ).toBe(false);
  });
});

describe("deriveShadowTitle", () => {
  it("dovrebbe restituire 'Dal buio alla luce' se redento", () => {
    expect(deriveShadowTitle(80, true)).toBe("Dal buio alla luce");
  });

  it("dovrebbe restituire 'Carriera controversa' se shadow alto e non redento", () => {
    expect(deriveShadowTitle(60, false)).toBe("Carriera controversa");
  });

  it("dovrebbe restituire null se shadow basso e non redento", () => {
    expect(deriveShadowTitle(10, false)).toBeNull();
  });
});
