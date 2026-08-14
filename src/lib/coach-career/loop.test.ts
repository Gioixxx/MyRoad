import { describe, expect, it } from "vitest";
import type { Club } from "@/types/career";
import type { CoachIdentity } from "@/types/coach";
import { createCoach, signWithClub } from "./engine";
import { generateBoardCrisisDecision, generateCoachEndOfCycle, generateTacticalIdentityDecision } from "./decisions";
import {
  availableCategories,
  INITIAL_COACH_LOOP_CONTEXT,
  pickNextCoachDecision,
  resolveCoachCycle,
} from "./loop";

const TEST_CLUB: Club = {
  id: "c",
  name: "Club",
  country: "Italy",
  tier: 1,
  prestige: 1,
  competitions: { league: "Serie A" },
  crestUrl: "https://example.com/c.png",
};

const IDENTITY: CoachIdentity = {
  lastName: "Conti",
  nationality: "Italy",
  preferredSystem: "possesso",
};

describe("availableCategories", () => {
  it("solo job-search senza club", () => {
    const coach = createCoach(IDENTITY);
    expect(availableCategories(coach)).toEqual(["job-search"]);
  });

  it("il pool ordinario completo con un club", () => {
    const coach = signWithClub(createCoach(IDENTITY), {
      id: "c",
      name: "Club",
      country: "Italy",
      tier: 1,
      prestige: 1,
      competitions: { league: "Serie A" },
      crestUrl: "https://example.com/c.png",
    });
    expect(availableCategories(coach)).toEqual([
      "board-brief",
      "tactical-identity",
      "press-conference",
      "captain-relations",
      "transfer-window-budget",
      "end-of-cycle",
    ]);
  });
});

describe("pickNextCoachDecision", () => {
  it("forza job-search per un allenatore svincolato", () => {
    const coach = createCoach(IDENTITY);
    const next = pickNextCoachDecision(coach, INITIAL_COACH_LOOP_CONTEXT, [], () => 0.5);
    expect(next.category).toBe("job-search");
    expect(next.decision.options.length).toBeGreaterThan(0);
  });

  it("forza board-crisis sotto la soglia di fiducia societaria", () => {
    const coach = { ...signWithClub(createCoach(IDENTITY), TEST_CLUB), boardConfidence: 10 };
    const next = pickNextCoachDecision(coach, INITIAL_COACH_LOOP_CONTEXT, [], () => 0.9);
    expect(next.category).toBe("board-crisis");
  });

  it("non ripete board-crisis se già capitata nel ciclo precedente", () => {
    const coach = { ...signWithClub(createCoach(IDENTITY), TEST_CLUB), boardConfidence: 10 };
    const next = pickNextCoachDecision(coach, INITIAL_COACH_LOOP_CONTEXT, ["board-crisis"], () => 0.9);
    expect(next.category).not.toBe("board-crisis");
  });

  it("forza cup-run per un club con coppa nazionale", () => {
    const clubWithCup: Club = { ...TEST_CLUB, competitions: { league: "Serie A", cup: "Coppa Italia" } };
    const coach = signWithClub(createCoach(IDENTITY), clubWithCup);
    const next = pickNextCoachDecision(coach, INITIAL_COACH_LOOP_CONTEXT, [], () => 0);
    expect(next.category).toBe("cup-run");
  });

  it("forza continental-campaign per un club con coppa continentale e reputazione sufficiente", () => {
    const clubWithContinental: Club = {
      ...TEST_CLUB,
      competitions: { league: "Serie A", continental: "Champions League" },
    };
    const coach = { ...signWithClub(createCoach(IDENTITY), clubWithContinental), reputation: 70 };
    const next = pickNextCoachDecision(coach, INITIAL_COACH_LOOP_CONTEXT, [], () => 0);
    expect(next.category).toBe("continental-campaign");
  });

  it("forza scandal sopra la soglia di shadow", () => {
    const coach = { ...signWithClub(createCoach(IDENTITY), TEST_CLUB), shadow: 40 };
    const next = pickNextCoachDecision(coach, INITIAL_COACH_LOOP_CONTEXT, [], () => 0.9);
    expect(next.category).toBe("scandal");
  });
});

describe("resolveCoachCycle", () => {
  it("firmare un'offerta job-search assegna il club e avanza le stagioni", () => {
    const coach = createCoach(IDENTITY);
    const { decision } = pickNextCoachDecision(coach, INITIAL_COACH_LOOP_CONTEXT, [], () => 0.3);
    const option = decision.options[0];

    const result = resolveCoachCycle(coach, INITIAL_COACH_LOOP_CONTEXT, "job-search", option, "normal", () => 0.5);

    expect(result.coach.club).not.toBeNull();
    expect(result.coach.age).toBeGreaterThan(coach.age);
    expect(result.retired).toBe(false);
  });

  it("l'opzione 'ritirati' chiude la carriera senza avanzare stagioni", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const decision = generateCoachEndOfCycle(coach, () => 0.5);
    const retireOption = decision.options.find((o) => o.retire)!;

    const result = resolveCoachCycle(coach, INITIAL_COACH_LOOP_CONTEXT, "end-of-cycle", retireOption, "normal", () => 0.5);

    expect(result.retired).toBe(true);
    expect(result.coach.club).toBeNull();
    expect(result.coach.age).toBe(coach.age);
  });

  it("il rinnovo non chiama signWithClub: boardConfidence non si resetta al baseline", () => {
    const coach = { ...signWithClub(createCoach(IDENTITY), TEST_CLUB), boardConfidence: 90 };
    const decision = generateCoachEndOfCycle(coach, () => 0.5);
    const renewOption = decision.options.find((o) => o.id === "renew")!;

    const result = resolveCoachCycle(coach, INITIAL_COACH_LOOP_CONTEXT, "end-of-cycle", renewOption, "normal", () => 0.5);

    expect(result.coach.club?.id).toBe(TEST_CLUB.id);
    // boardConfidence continua a evolvere per il ciclo appena giocato, ma non è forzata al
    // baseline come accadrebbe con un vero cambio club.
    expect(result.coach.boardConfidence).not.toBe(55);
  });

  it("'offri le dimissioni' in board-crisis esonera senza avanzare le stagioni", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const decision = generateBoardCrisisDecision(coach);
    const resignOption = decision.options.find((o) => o.id === "resign")!;

    const result = resolveCoachCycle(coach, INITIAL_COACH_LOOP_CONTEXT, "board-crisis", resignOption, "normal", () => 0.5);

    expect(result.sacked).toBe(true);
    expect(result.coach.club).toBeNull();
    expect(result.coach.age).toBe(coach.age);
    expect(result.retired).toBe(false);
  });

  it("assegna un trofeo di campionato quando la stagione si chiude con leagueFinish 'title'", () => {
    const strongClub: Club = { ...TEST_CLUB, prestige: 3, tier: 5 };
    const coach = { ...signWithClub(createCoach(IDENTITY), strongClub), reputation: 99, reputationCeiling: 99 };
    const decision = generateTacticalIdentityDecision(coach);
    const option = decision.options.find((o) => o.newSystem === coach.preferredSystem)!;

    // rng costante a 0.5 azzera il rumore di rollCoachSeasonOutcome (noise = (0.5-0.5)*range = 0):
    // con prestigio 3 e reputazione 99 il rank atteso arrotonda sempre a "title".
    const result = resolveCoachCycle(coach, INITIAL_COACH_LOOP_CONTEXT, "tactical-identity", option, "normal", () => 0.5);

    expect(result.coach.clubHistory[0].outcome.leagueFinish).toBe("title");
    expect(result.newTrophies.some((t) => t.competition === strongClub.competitions.league)).toBe(true);
    expect(result.coach.trophies.length).toBeGreaterThan(0);
  });
});
