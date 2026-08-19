import { describe, expect, it } from "vitest";
import type { Club } from "@/types/career";
import type { CoachIdentity, CoachSeasonOutcome } from "@/types/coach";
import type { Rng } from "@/lib/career/progression";
import {
  advanceSeasons,
  applyCoachDelta,
  BOARD_CONFIDENCE_BASELINE,
  boardConfidenceDeltaForSeason,
  checkCoachRetirement,
  COACH_RETIREMENT_AUTOMATIC_AGE,
  COACH_RETIREMENT_RISK_START_AGE,
  COACH_STARTING_AGE,
  COACH_STARTING_REPUTATION,
  createCoach,
  reputationDeltaForSeason,
  retireCoach,
  rollInitialReputationCeiling,
  sackCoach,
  signWithClub,
} from "./engine";

const IDENTITY: CoachIdentity = {
  lastName: "Conti",
  nationality: "Italy",
  preferredSystem: "possesso",
};

const TEST_CLUB: Club = {
  id: "test-club",
  name: "Test FC",
  country: "Italy",
  tier: 1,
  prestige: 1,
  competitions: { league: "Serie A", cup: "Coppa Italia" },
  crestUrl: "https://r2.thesportsdb.com/images/media/team/badge/test.png",
};

const NO_NOISE_RNG: Rng = () => 0.5;

describe("createCoach", () => {
  it("crea un allenatore svincolato a 35 anni con reputazione/board/relazioni di partenza", () => {
    const coach = createCoach(IDENTITY);

    expect(coach.age).toBe(COACH_STARTING_AGE);
    expect(coach.reputation).toBe(COACH_STARTING_REPUTATION);
    expect(coach.club).toBeNull();
    expect(coach.clubHistory).toEqual([]);
    expect(coach.boardConfidence).toBe(0);
    expect(coach.relations).toEqual([]);
    expect(coach.retired).toBe(false);
    expect(coach.reputationCeiling).toBeGreaterThanOrEqual(coach.reputation);
  });
});

describe("rollInitialReputationCeiling", () => {
  it("resta sempre dentro le fasce dichiarate (55-99)", () => {
    for (let i = 0; i < 50; i++) {
      const ceiling = rollInitialReputationCeiling(() => i / 50);
      expect(ceiling).toBeGreaterThanOrEqual(55);
      expect(ceiling).toBeLessThanOrEqual(99);
    }
  });
});

describe("signWithClub", () => {
  it("assegna il club, resetta boardConfidence al baseline e genera società/stampa/capitano", () => {
    const coach = { ...createCoach(IDENTITY), boardConfidence: 5 };
    const signed = signWithClub(coach, TEST_CLUB);

    expect(signed.club).toEqual(TEST_CLUB);
    expect(signed.boardConfidence).toBe(BOARD_CONFIDENCE_BASELINE);
    expect(signed.relations.some((r) => r.id === "board")).toBe(true);
    expect(signed.relations.some((r) => r.id === "press")).toBe(true);
    expect(signed.relations.some((r) => r.id === "captain")).toBe(true);
    expect(signed.wallet.salaryEurPerCycle).toBeGreaterThan(0);
  });

  it("preserva un rivale già esistente su un nuovo incarico", () => {
    const coach = {
      ...createCoach(IDENTITY),
      relations: [{ id: "rival" as const, name: "Marco Bianchi", affinity: 1 as const }],
    };
    const signed = signWithClub(coach, TEST_CLUB);
    expect(signed.relations.some((r) => r.id === "rival" && r.name === "Marco Bianchi")).toBe(true);
  });
});

describe("reputationDeltaForSeason / boardConfidenceDeltaForSeason", () => {
  const titleOutcome: CoachSeasonOutcome = { leagueFinish: "title", zone: "title", position: 1, leagueSize: 20, cupRun: "none" };
  const relegatedOutcome: CoachSeasonOutcome = {
    leagueFinish: "relegated",
    zone: "relegated",
    position: 20,
    leagueSize: 20,
    cupRun: "none",
  };

  it("premia una stagione che sovraperforma il prestigio del club", () => {
    const delta = reputationDeltaForSeason(titleOutcome, 0, NO_NOISE_RNG);
    expect(delta).toBeGreaterThan(0);
  });

  it("penalizza una stagione che delude un club di alto prestigio", () => {
    const delta = reputationDeltaForSeason(relegatedOutcome, 3, NO_NOISE_RNG);
    expect(delta).toBeLessThan(0);
  });

  it("boardConfidence cresce su un trofeo di campionato", () => {
    const delta = boardConfidenceDeltaForSeason(titleOutcome, 1);
    expect(delta).toBeGreaterThan(0);
  });
});

describe("advanceSeasons", () => {
  it("fa avanzare età e aggiunge una riga a clubHistory per stagione, tutte con lo stesso cycleId", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const advanced = advanceSeasons(coach, 2, NO_NOISE_RNG);

    expect(advanced.age).toBe(COACH_STARTING_AGE + 2);
    expect(advanced.clubHistory).toHaveLength(2);
    expect(advanced.clubHistory[0].ageFrom).toBe(COACH_STARTING_AGE);
    expect(advanced.clubHistory[0].ageTo).toBe(COACH_STARTING_AGE + 1);
    expect(advanced.clubHistory[1].ageFrom).toBe(COACH_STARTING_AGE + 1);
    expect(advanced.clubHistory[1].ageTo).toBe(COACH_STARTING_AGE + 2);
    expect(advanced.clubHistory[0].cycleId).toBe(1);
    expect(advanced.clubHistory[1].cycleId).toBe(1);
    expect(advanced.cyclesPlayed).toBe(1);
    expect(advanced.wallet.savingsEur).toBeGreaterThan(0);
  });

  it("incrementa cyclesPlayed (e quindi cycleId) ad ogni chiamata successiva", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const afterFirstCycle = advanceSeasons(coach, 1, NO_NOISE_RNG);
    const afterSecondCycle = advanceSeasons(afterFirstCycle, 1, NO_NOISE_RNG);

    expect(afterFirstCycle.clubHistory[0].cycleId).toBe(1);
    expect(afterSecondCycle.clubHistory[1].cycleId).toBe(2);
    expect(afterSecondCycle.cyclesPlayed).toBe(2);
  });

  it("lancia un errore senza club", () => {
    expect(() => advanceSeasons(createCoach(IDENTITY), 1, NO_NOISE_RNG)).toThrow();
  });

  it("non fa mai scendere la reputazione sotto 1 né superare il tetto", () => {
    const coach = { ...signWithClub(createCoach(IDENTITY), TEST_CLUB), reputation: 1, reputationCeiling: 60 };
    const worstRng: Rng = () => 0;
    const advanced = advanceSeasons(coach, 1, worstRng);
    expect(advanced.reputation).toBeGreaterThanOrEqual(1);
    expect(advanced.reputation).toBeLessThanOrEqual(60);
  });
});

describe("applyCoachDelta", () => {
  it("applica reputazione/board/popolarità/risparmi con clamping", () => {
    const coach = createCoach(IDENTITY);
    const next = applyCoachDelta(coach, {
      reputationDelta: 5,
      boardConfidenceDelta: 200,
      popularityDelta: 3,
      savingsDelta: 1000,
    });

    expect(next.reputation).toBe(coach.reputation + 5);
    expect(next.boardConfidence).toBe(100);
    expect(next.popularity).toBe(coach.popularity + 3);
    expect(next.wallet.savingsEur).toBe(1000);
  });
});

describe("checkCoachRetirement", () => {
  it("mai sotto la soglia di rischio", () => {
    const coach = { ...createCoach(IDENTITY), age: COACH_RETIREMENT_RISK_START_AGE - 1 };
    expect(checkCoachRetirement(coach, () => 0)).toBe(false);
  });

  it("sempre all'età automatica", () => {
    const coach = { ...createCoach(IDENTITY), age: COACH_RETIREMENT_AUTOMATIC_AGE };
    expect(checkCoachRetirement(coach, () => 0.999)).toBe(true);
  });
});

describe("retireCoach / sackCoach", () => {
  it("retireCoach imposta retired e svincola", () => {
    const coach = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const retired = retireCoach(coach);
    expect(retired.retired).toBe(true);
    expect(retired.club).toBeNull();
  });

  it("sackCoach svincola, azzera boardConfidence e riduce la popolarità", () => {
    const coach = { ...signWithClub(createCoach(IDENTITY), TEST_CLUB), popularity: 50 };
    const sacked = sackCoach(coach);
    expect(sacked.club).toBeNull();
    expect(sacked.boardConfidence).toBe(0);
    expect(sacked.popularity).toBeLessThan(50);
    expect(sacked.retired).toBe(false);
  });
});
