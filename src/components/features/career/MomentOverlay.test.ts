import { describe, expect, it } from "vitest";
import { buildCareerMoments } from "./MomentOverlay";
import type { Award, Trophy } from "@/types/career";

const trophy: Trophy = { competition: "Serie A", age: 25 };
const award: Award = { type: "top-scorer", age: 26 };

describe("buildCareerMoments", () => {
  it("non include il moment obiettivo quando objectiveResult è null", () => {
    const moments = buildCareerMoments({
      newTrophies: [],
      newAward: null,
      nationalCallup: false,
      objectiveResult: null,
    });

    expect(moments).toHaveLength(0);
  });

  it("non include il moment obiettivo quando non è stato raggiunto", () => {
    const moments = buildCareerMoments({
      newTrophies: [],
      newAward: null,
      nationalCallup: false,
      objectiveResult: { label: "Segna almeno 10 gol", met: false },
    });

    expect(moments).toHaveLength(0);
  });

  it("include il moment obiettivo con il label esatto quando è stato raggiunto", () => {
    const moments = buildCareerMoments({
      newTrophies: [],
      newAward: null,
      nationalCallup: false,
      objectiveResult: { label: "Segna almeno 10 gol", met: true },
    });

    expect(moments).toEqual([{ kind: "objective", label: "Segna almeno 10 gol" }]);
  });

  it("ordina i moment: trofeo, premio, convocazione, traguardo, playstyle, obiettivo", () => {
    const moments = buildCareerMoments({
      newTrophies: [trophy],
      newAward: award,
      nationalCallup: true,
      newMilestones: [80],
      newPlayStyles: ["playmaker"],
      objectiveResult: { label: "Segna almeno 10 gol", met: true },
    });

    expect(moments.map((m) => m.kind)).toEqual([
      "trophy",
      "award",
      "callup",
      "milestone",
      "playstyle",
      "objective",
    ]);
  });
});
