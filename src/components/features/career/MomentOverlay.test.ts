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
      objectiveResult: { label: "Segna almeno 10 gol", met: false, firstTime: false },
    });

    expect(moments).toHaveLength(0);
  });

  it("non include il moment obiettivo quando è stato raggiunto ma non è la prima volta in carriera", () => {
    const moments = buildCareerMoments({
      newTrophies: [],
      newAward: null,
      nationalCallup: false,
      objectiveResult: { label: "Segna almeno 10 gol", met: true, firstTime: false },
    });

    expect(moments).toHaveLength(0);
  });

  it("include il moment obiettivo con il label esatto la prima volta che viene raggiunto", () => {
    const moments = buildCareerMoments({
      newTrophies: [],
      newAward: null,
      nationalCallup: false,
      objectiveResult: { label: "Segna almeno 10 gol", met: true, firstTime: true },
    });

    expect(moments).toEqual([{ kind: "objective", label: "Segna almeno 10 gol" }]);
  });

  it("ordina i moment: trofeo, premio, retrocessione, convocazione, traguardo, playstyle, obiettivo", () => {
    const moments = buildCareerMoments({
      newTrophies: [trophy],
      newAward: award,
      nationalCallup: true,
      newMilestones: [80],
      newPlayStyles: ["playmaker"],
      objectiveResult: { label: "Segna almeno 10 gol", met: true, firstTime: true },
      clubTierChange: "relegated",
      clubName: "Torino",
      fromLeague: "Serie A",
      toLeague: "Serie B",
      crestUrl: "https://r2.thesportsdb.com/images/media/team/badge/xxprty1448806802.png",
    });

    expect(moments.map((m) => m.kind)).toEqual([
      "trophy",
      "award",
      "relegation",
      "callup",
      "milestone",
      "playstyle",
      "objective",
    ]);
  });

  it("include il moment retrocessione solo se clubTierChange è relegated e i campi sono completi", () => {
    const base = {
      newTrophies: [] as Trophy[],
      newAward: null,
      nationalCallup: false,
      clubName: "Torino",
      fromLeague: "Serie A",
      toLeague: "Serie B",
      crestUrl: "https://r2.thesportsdb.com/images/media/team/badge/xxprty1448806802.png",
    };

    expect(buildCareerMoments({ ...base, clubTierChange: null })).toHaveLength(0);
    expect(buildCareerMoments({ ...base, clubTierChange: "promoted" })).toHaveLength(0);
    expect(buildCareerMoments({ ...base, clubTierChange: "relegated", clubName: null })).toHaveLength(0);

    expect(
      buildCareerMoments({ ...base, clubTierChange: "relegated" }),
    ).toEqual([
      {
        kind: "relegation",
        clubName: "Torino",
        fromLeague: "Serie A",
        toLeague: "Serie B",
        crestUrl: base.crestUrl,
      },
    ]);
  });
});
