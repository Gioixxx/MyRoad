import { describe, expect, it } from "vitest";
import type { Club, RelationAffinity } from "@/types/career";
import type { Coach, CoachIdentity, CoachRelationId } from "@/types/coach";
import { createCoach, signWithClub } from "./engine";
import {
  CAPTAIN_SEASON_MULTIPLIER_STEP,
  coachRelationAffinity,
  relationsSeasonMultiplier,
  SACK_WARNING_THRESHOLD_BASE,
  sackWarningThreshold,
} from "./coach-relations";

const IDENTITY: CoachIdentity = {
  lastName: "Conti",
  nationality: "Italy",
  preferredSystem: "possesso",
};

const TEST_CLUB: Club = {
  id: "c",
  name: "Club",
  country: "Italy",
  tier: 1,
  prestige: 1,
  competitions: { league: "Serie A" },
  crestUrl: "https://example.com/c.png",
};

function withRelationAffinity(coach: Coach, id: CoachRelationId, affinity: RelationAffinity): Coach {
  return {
    ...coach,
    relations: coach.relations.map((rel) => (rel.id === id ? { ...rel, affinity } : rel)),
  };
}

describe("relationsSeasonMultiplier", () => {
  it("è 1 a capitano neutrale", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    expect(relationsSeasonMultiplier(coach)).toBe(1);
  });

  it("vale ±3% a affinità capitano ±2", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    expect(relationsSeasonMultiplier(withRelationAffinity(coach, "captain", 2))).toBeCloseTo(
      1 + 2 * CAPTAIN_SEASON_MULTIPLIER_STEP,
    );
    expect(relationsSeasonMultiplier(withRelationAffinity(coach, "captain", -2))).toBeCloseTo(
      1 - 2 * CAPTAIN_SEASON_MULTIPLIER_STEP,
    );
  });
});

describe("sackWarningThreshold", () => {
  it("resta a 30 con società neutrale", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    expect(sackWarningThreshold(coach)).toBe(SACK_WARNING_THRESHOLD_BASE);
  });

  it("alza la pazienza con società amica e la taglia con società ostile", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    expect(sackWarningThreshold(withRelationAffinity(coach, "board", 2))).toBe(22);
    expect(sackWarningThreshold(withRelationAffinity(coach, "board", -2))).toBe(38);
  });
});

describe("coachRelationAffinity", () => {
  it("è 0 se la relazione non esiste", () => {
    expect(coachRelationAffinity(createCoach(IDENTITY), "board")).toBe(0);
  });
});
