import { describe, expect, it } from "vitest";
import type { Club, RelationAffinity } from "@/types/career";
import type { Coach, CoachIdentity, CoachRelationId } from "@/types/coach";
import { createCoach, signWithClub } from "./engine";
import {
  generateBoardBrief,
  generateBoardCrisisDecision,
  generateCaptainRelationsDecision,
  generatePressConferenceDecision,
  generateRivalClashDecision,
  generateTransferBudgetDecision,
} from "./decisions";

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

describe("generateBoardBrief", () => {
  it("mostra obiettivo, non brief, nella copy visibile", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const decision = generateBoardBrief(coach);
    expect(decision.title).toBe("L'obiettivo della società");
    expect(decision.options[0].label).toBe("Accetta l'obiettivo");
    expect(decision.category).toBe("board-brief");
  });
});

describe("generateBoardCrisisDecision", () => {
  it("a società neutrale tiene i pesi 60/40 su chiedi tempo", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const ask = generateBoardCrisisDecision(coach).options.find((o) => o.id === "ask-for-time")!;
    expect(ask.outcomes[0].weight).toBe(60);
    expect(ask.outcomes[1].weight).toBe(40);
  });

  it("a società amica alza la chance di sopravvivenza, a ostile la abbassa", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const friendly = generateBoardCrisisDecision(withRelationAffinity(coach, "board", 2)).options.find(
      (o) => o.id === "ask-for-time",
    )!;
    const hostile = generateBoardCrisisDecision(withRelationAffinity(coach, "board", -2)).options.find(
      (o) => o.id === "ask-for-time",
    )!;
    expect(friendly.outcomes[0].weight).toBe(80);
    expect(hostile.outcomes[0].weight).toBe(40);
  });
});

describe("generatePressConferenceDecision", () => {
  it("scrive press +1 / -1 sulle due uscite di parla libero", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const speak = generatePressConferenceDecision(coach).options.find((o) => o.id === "speak-freely")!;
    expect(speak.outcomes[0].effect.relationsDelta?.press).toBe(1);
    expect(speak.outcomes[1].effect.relationsDelta?.press).toBe(-1);
    expect(speak.outcomes[0].weight).toBe(60);
  });

  it("alza i pesi della gaffe se la stampa è già ostile", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const speak = generatePressConferenceDecision(withRelationAffinity(coach, "press", -2)).options.find(
      (o) => o.id === "speak-freely",
    )!;
    expect(speak.outcomes[0].weight).toBe(40);
    expect(speak.outcomes[1].weight).toBe(60);
  });
});

describe("generateCaptainRelationsDecision", () => {
  it("usa la variante in rivolta se il capitano è ostile", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const decision = generateCaptainRelationsDecision(withRelationAffinity(coach, "captain", -1));
    expect(decision.title).toBe("Lo spogliatoio è in rivolta");
    expect(decision.options.map((o) => o.id)).toEqual(["placate", "raise-tones"]);
  });

  it("resta sul confronto normale a affinità neutrale", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const decision = generateCaptainRelationsDecision(coach);
    expect(decision.title).toBe("Il capitano chiede un confronto");
    expect(decision.options.map((o) => o.id)).toEqual(["listen", "assert-authority"]);
  });
});

describe("generateTransferBudgetDecision", () => {
  it("assegna outcomeBonus e delta società sulle tre fasce libere", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const decision = generateTransferBudgetDecision(coach);
    const byId = Object.fromEntries(decision.options.map((o) => [o.id, o]));
    expect(byId["invest-youth"].outcomeBonus).toBe(1.04);
    expect(byId["invest-youth"].outcomes[0].effect.relationsDelta?.board).toBe(1);
    expect(byId["marquee-signing"].outcomeBonus).toBe(1.12);
    expect(byId["marquee-signing"].outcomes[0].effect.relationsDelta?.board).toBe(-1);
    expect(byId["balance-books"].outcomeBonus).toBe(1);
    expect(byId["balance-books"].outcomes[0].effect.relationsDelta?.board).toBe(1);
  });

  it("sostituisce il menu con il conflitto se la società è ostile", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const decision = generateTransferBudgetDecision(withRelationAffinity(coach, "board", -1));
    expect(decision.options.map((o) => o.id)).toEqual(["accept-imposed", "refuse-imposed"]);
    expect(decision.options[0].outcomeBonus).toBe(1.12);
    expect(decision.options[1].outcomeBonus).toBe(0.97);
  });
});

describe("generateRivalClashDecision", () => {
  it("lancia senza rivale", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    expect(() => generateRivalClashDecision(coach)).toThrow(/rivale/);
  });

  it("offre affronta/ignora con bonus e delta rivale", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const withRival: Coach = {
      ...coach,
      relations: [...coach.relations, { id: "rival", name: "Marco Bianchi", affinity: 0 }],
    };
    const decision = generateRivalClashDecision(withRival);
    expect(decision.category).toBe("rival-clash");
    expect(decision.description).toContain("Marco Bianchi");
    const confront = decision.options.find((o) => o.id === "confront")!;
    const ignore = decision.options.find((o) => o.id === "ignore")!;
    expect(confront.outcomeBonus).toBe(1.08);
    expect(confront.outcomes[0].effect.relationsDelta?.rival).toBe(-1);
    expect(ignore.outcomes[0].effect.relationsDelta?.rival).toBe(1);
  });
});
