import { beforeEach, describe, expect, it } from "vitest";
import type { Club } from "@/types/career";
import type { CoachIdentity } from "@/types/coach";
import { advanceSeasons, createCoach, signWithClub } from "./engine";
import { INITIAL_COACH_LOOP_CONTEXT } from "./loop";
import {
  appendToCoachArchive,
  buildCoachArchiveEntry,
  clearCoachGame,
  loadCoachArchive,
  loadCoachGame,
  saveCoachGame,
} from "./storage";

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

beforeEach(() => {
  window.localStorage.clear();
});

describe("saveCoachGame / loadCoachGame", () => {
  it("effettua un round-trip fedele dello stato", () => {
    const coach = createCoach(IDENTITY);
    saveCoachGame({
      coach,
      speed: "normal",
      context: INITIAL_COACH_LOOP_CONTEXT,
      recentCategories: [],
      currentDecision: null,
      currentCategory: null,
    });

    const loaded = loadCoachGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.coach.lastName).toBe("Conti");
    expect(loaded!.speed).toBe("normal");
  });

  it("nessun save restituisce null", () => {
    expect(loadCoachGame()).toBeNull();
  });

  it("clearCoachGame rimuove il save", () => {
    saveCoachGame({
      coach: createCoach(IDENTITY),
      speed: "normal",
      context: INITIAL_COACH_LOOP_CONTEXT,
      recentCategories: [],
    });
    clearCoachGame();
    expect(loadCoachGame()).toBeNull();
  });
});

describe("archivio", () => {
  it("buildCoachArchiveEntry riassume correttamente l'allenatore", () => {
    const signed = signWithClub(createCoach(IDENTITY), TEST_CLUB);
    const played = advanceSeasons(signed, 2, () => 0.5);
    const coach = { ...played, age: 60, retired: true };
    const entry = buildCoachArchiveEntry(coach);

    expect(entry.lastName).toBe("Conti");
    expect(entry.retiredAge).toBe(60);
    expect(entry.clubsManaged).toBe(1);
  });

  it("appendToCoachArchive persiste e antepone le nuove voci", () => {
    const coach = createCoach(IDENTITY);
    appendToCoachArchive(buildCoachArchiveEntry({ ...coach, lastName: "Primo" }));
    appendToCoachArchive(buildCoachArchiveEntry({ ...coach, lastName: "Secondo" }));

    const archive = loadCoachArchive();
    expect(archive).toHaveLength(2);
    expect(archive[0].lastName).toBe("Secondo");
  });
});
