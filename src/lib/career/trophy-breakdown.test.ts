import { describe, expect, it } from "vitest";
import type { Trophy } from "@/types/career";
import type { Club } from "@/types/career";
import { summarizeAwards, summarizeTrophies } from "./trophy-breakdown";

const CLUB: Club = {
  id: "juventus",
  name: "Juventus",
  country: "Italia",
  tier: 1,
  prestige: 3,
  crestUrl: "",
  competitions: { league: "Serie A", cup: "Coppa Italia", continental: "Champions League" },
};

describe("summarizeTrophies", () => {
  it("ritorna array vuoto per nessun trofeo", () => {
    expect(summarizeTrophies([])).toEqual([]);
  });

  it("conta le ripetizioni della stessa competizione", () => {
    const trophies: Trophy[] = [
      { competition: "Serie A", club: CLUB, age: 20 },
      { competition: "Serie A", club: CLUB, age: 22 },
      { competition: "Coppa Italia", club: CLUB, age: 21 },
    ];

    expect(summarizeTrophies(trophies)).toEqual([
      { competition: "Serie A", count: 2, isNational: false },
      { competition: "Coppa Italia", count: 1, isNational: false },
    ]);
  });

  it("distingue i trofei vinti con la nazionale (club undefined)", () => {
    const trophies: Trophy[] = [
      { competition: "Serie A", club: CLUB, age: 20 },
      { competition: "Mondiale", age: 24 },
    ];

    const result = summarizeTrophies(trophies);
    const national = result.find((r) => r.competition === "Mondiale");
    const club = result.find((r) => r.competition === "Serie A");

    expect(national?.isNational).toBe(true);
    expect(club?.isNational).toBe(false);
  });

  it("ordina per count decrescente, poi alfabeticamente", () => {
    const trophies: Trophy[] = [
      { competition: "Coppa Italia", club: CLUB, age: 20 },
      { competition: "Serie A", club: CLUB, age: 21 },
      { competition: "Serie A", club: CLUB, age: 22 },
      { competition: "Champions League", club: CLUB, age: 23 },
    ];

    expect(summarizeTrophies(trophies).map((r) => r.competition)).toEqual([
      "Serie A",
      "Champions League",
      "Coppa Italia",
    ]);
  });
});

describe("summarizeAwards", () => {
  it("ritorna array vuoto per nessun premio", () => {
    expect(summarizeAwards([])).toEqual([]);
  });

  it("conta le ripetizioni dello stesso tipo (AwardType calciatore)", () => {
    const awards = [
      { type: "top-scorer" as const, age: 22 },
      { type: "top-scorer" as const, age: 25 },
      { type: "ballon-dor" as const, age: 26 },
    ];

    expect(summarizeAwards(awards)).toEqual([
      { type: "top-scorer", count: 2 },
      { type: "ballon-dor", count: 1 },
    ]);
  });

  it("funziona invariata con CoachAwardType (allenatore)", () => {
    const awards = [
      { type: "manager-of-the-season" as const, age: 40 },
      { type: "manager-of-the-year" as const, age: 45 },
      { type: "manager-of-the-year" as const, age: 48 },
    ];

    expect(summarizeAwards(awards)).toEqual([
      { type: "manager-of-the-year", count: 2 },
      { type: "manager-of-the-season", count: 1 },
    ]);
  });
});
