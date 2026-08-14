import { describe, expect, it } from "vitest";
import type { Club } from "@/types/career";
import type { CoachIdentity } from "@/types/coach";
import { createCoach, signWithClub } from "./engine";
import { generateCoachEndOfCycle } from "./decisions";
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

  it("board-brief/tactical-identity/end-of-cycle con un club", () => {
    const coach = signWithClub(createCoach(IDENTITY), {
      id: "c",
      name: "Club",
      country: "Italy",
      tier: 1,
      prestige: 1,
      competitions: { league: "Serie A" },
      crestUrl: "https://example.com/c.png",
    });
    expect(availableCategories(coach)).toEqual(["board-brief", "tactical-identity", "end-of-cycle"]);
  });
});

describe("pickNextCoachDecision", () => {
  it("forza job-search per un allenatore svincolato", () => {
    const coach = createCoach(IDENTITY);
    const next = pickNextCoachDecision(coach, INITIAL_COACH_LOOP_CONTEXT, [], () => 0.5);
    expect(next.category).toBe("job-search");
    expect(next.decision.options.length).toBeGreaterThan(0);
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
});
