import type { ArchivedCareer } from "@/types/career";
import { describe, expect, it } from "vitest";
import type { CycleObjective, PlayerIdentity } from "@/types/career";
import { createPlayer, signWithClub } from "./engine";
import { getClub } from "@/data/clubs";
import {
  buildHighlightReel,
  computeHallOfFame,
  detectOvrMilestones,
  emptyPersonalRecords,
  evaluateObjective,
  evaluateSeasonTitle,
  hallOfFameWinsFor,
  pickBestCareerTitle,
  pushSeasonTitle,
  rollCycleObjective,
  SEASON_TITLES_CAP,
  updatePersonalRecords,
} from "./satisfaction";

const IDENTITY: PlayerIdentity = {
  lastName: "Rossi",
  number: 10,
  foot: "right",
  nationality: "Italy",
  position: "ST",
};

const JUVENTUS = getClub("juventus")!;

function baseCtx(overrides: Partial<Parameters<typeof evaluateSeasonTitle>[0]> = {}) {
  return {
    age: 24,
    goals: 5,
    assists: 3,
    apps: 30,
    trophies: [],
    award: null,
    newInjury: null,
    injuryHealed: false,
    ovrDelta: 1,
    nationalCallup: false,
    nationalGoals: 0,
    cupUpsetWin: false,
    ...overrides,
  };
}

describe("detectOvrMilestones", () => {
  it("dovrebbe rilevare le soglie crociate in ascesa", () => {
    expect(detectOvrMilestones(58, 72, [], 20)).toEqual([
      { ovr: 60, age: 20 },
      { ovr: 70, age: 20 },
    ]);
  });

  it("non dovrebbe ricelebrare soglie già raggiunte", () => {
    expect(detectOvrMilestones(68, 72, [{ ovr: 70, age: 18 }], 22)).toEqual([]);
  });

  it("non dovrebbe celebrare in caso di calo OVR", () => {
    expect(detectOvrMilestones(75, 65, [], 30)).toEqual([]);
  });
});

describe("evaluateSeasonTitle", () => {
  it("dovrebbe dare priorità a champion sui trofei", () => {
    const title = evaluateSeasonTitle(
      baseCtx({
        trophies: [{ competition: "Serie A", age: 24 }],
        award: { type: "ballon-dor", age: 24 },
        goals: 30,
      }),
    );
    expect(title.id).toBe("champion");
    expect(title.label).toBe("Campione");
  });

  it("dovrebbe scegliere ballondorSeason con gol alti senza trofei", () => {
    expect(evaluateSeasonTitle(baseCtx({ goals: 25 })).id).toBe("ballondorSeason");
  });

  it("dovrebbe scegliere toughYear con nuovo infortunio", () => {
    expect(
      evaluateSeasonTitle(
        baseCtx({
          newInjury: { label: "Stiramento", turnsRemaining: 1, ovrPenalty: 3 },
        }),
      ).id,
    ).toBe("toughYear");
  });

  it("dovrebbe scegliere steady come default", () => {
    expect(evaluateSeasonTitle(baseCtx()).id).toBe("steady");
  });

  it("dovrebbe scegliere ironWall per un portiere con molti clean sheet", () => {
    const title = evaluateSeasonTitle(baseCtx({ goals: 0, cleanSheets: 18 }));
    expect(title.id).toBe("ironWall");
    expect(title.label).toBe("Muro invalicabile");
  });

  it("ironWall non dovrebbe prevalere su champion", () => {
    expect(
      evaluateSeasonTitle(
        baseCtx({ cleanSheets: 18, trophies: [{ competition: "Serie A", age: 24 }] }),
      ).id,
    ).toBe("champion");
  });

  it("dovrebbe scegliere giantKiller per una sorpresa di coppa vinta", () => {
    const title = evaluateSeasonTitle(baseCtx({ cupUpsetWin: true }));
    expect(title.id).toBe("giantKiller");
    expect(title.label).toBe("Ammazzagigante");
  });

  it("dovrebbe scegliere workhorse con 32 presenze in un ciclo Intense (1 stagione)", () => {
    expect(evaluateSeasonTitle(baseCtx({ apps: 32, seasons: 1 })).id).toBe("workhorse");
  });

  it("non dovrebbe scegliere workhorse con 32 presenze in un ciclo Express (3 stagioni)", () => {
    expect(evaluateSeasonTitle(baseCtx({ apps: 32, seasons: 3 })).id).toBe("steady");
  });

  it("dovrebbe scegliere workhorse con 96 presenze in un ciclo Express", () => {
    expect(evaluateSeasonTitle(baseCtx({ apps: 96, seasons: 3 })).id).toBe("workhorse");
  });

  it("giantKiller dovrebbe prevalere su champion anche con altri trofei nello stesso ciclo", () => {
    const title = evaluateSeasonTitle(
      baseCtx({ cupUpsetWin: true, trophies: [{ competition: "Coppa Italia", age: 24 }] }),
    );
    expect(title.id).toBe("giantKiller");
  });
});

describe("pushSeasonTitle / pickBestCareerTitle", () => {
  it("dovrebbe rispettare il cap e scegliere il titolo migliore", () => {
    const titles = Array.from({ length: SEASON_TITLES_CAP + 2 }, (_, i) =>
      evaluateSeasonTitle(baseCtx({ age: 16 + i })),
    );
    const capped = titles.reduce((acc, t) => pushSeasonTitle(acc, t), [] as ReturnType<typeof evaluateSeasonTitle>[]);
    expect(capped).toHaveLength(SEASON_TITLES_CAP);
    expect(pickBestCareerTitle([])).toBe("Carriera solida");
    expect(
      pickBestCareerTitle([
        { age: 20, id: "steady", label: "Stagione solida" },
        { age: 22, id: "champion", label: "Campione" },
      ]),
    ).toBe("Campione");
  });

  it("giantKiller dovrebbe prevalere su champion come miglior titolo di carriera", () => {
    expect(
      pickBestCareerTitle([
        { age: 20, id: "champion", label: "Campione" },
        { age: 23, id: "giantKiller", label: "Ammazzagigante" },
      ]),
    ).toBe("Ammazzagigante");
  });
});

describe("evaluateObjective", () => {
  const satCtx = {
    age: 24,
    ovrBefore: 70,
    ovrAfter: 73,
    goals: 14,
    assists: 4,
    apps: 32,
    trophies: [{ competition: "Serie A", age: 24 }],
    award: null,
    newInjury: null,
    injuryHealed: false,
    nationalCallup: false,
    nationalGoals: 0,
    marketValueEur: 10_000_000,
    wasAlreadyCalled: false,
  };

  it("dovrebbe premiare un obiettivo gol raggiunto", () => {
    const objective: CycleObjective = {
      id: "goals-12",
      kind: "goals",
      target: 12,
      label: "Segna almeno 12 gol",
    };
    const result = evaluateObjective(objective, satCtx);
    expect(result.met).toBe(true);
    expect(result.reward.popularityDelta).toBe(2);
  });

  it("dovrebbe fallire un obiettivo non raggiunto senza reward", () => {
    const objective: CycleObjective = {
      id: "goals-20",
      kind: "goals",
      target: 20,
      label: "Segna almeno 20 gol",
    };
    expect(evaluateObjective(objective, satCtx)).toEqual({ met: false, reward: {} });
  });
});

describe("rollCycleObjective", () => {
  it("dovrebbe generare un obiettivo valido per un attaccante", () => {
    const player = signWithClub(createPlayer(IDENTITY), JUVENTUS);
    const objective = rollCycleObjective(player, () => 0);
    expect(objective.label.length).toBeGreaterThan(0);
    expect(objective.target).toBeGreaterThan(0);
  });

  it("dovrebbe scalare i target gol/presenze per le stagioni del ciclo", () => {
    const player = { ...signWithClub(createPlayer(IDENTITY), JUVENTUS), age: 24, ovr: 80 };
    const intense = rollCycleObjective(player, () => 0, 1);
    const express = rollCycleObjective(player, () => 0, 3);
    expect(express.target).toBe(intense.target * 3);
  });

  it("dovrebbe preferire un trofeo per una stella in un top club rispetto a un giovane in B", () => {
    const star = { ...signWithClub(createPlayer(IDENTITY), JUVENTUS), age: 24, ovr: 80 };
    const youth = { ...signWithClub(createPlayer(IDENTITY), getClub("sampdoria")!), age: 18, ovr: 55 };
    const n = 200;
    const countTrophy = (player: typeof star) => {
      let hits = 0;
      for (let i = 0; i < n; i++) {
        if (rollCycleObjective(player, () => (i + 0.5) / n, 1).kind === "trophy") hits += 1;
      }
      return hits;
    };
    expect(countTrophy(star)).toBeGreaterThan(countTrophy(youth));
    expect(countTrophy(youth)).toBe(0);
  });

  it("non dovrebbe ripetere il kind appena chiuso se esiste un'alternativa", () => {
    const player = { ...signWithClub(createPlayer(IDENTITY), JUVENTUS), age: 24, ovr: 80 };
    for (let i = 0; i < 40; i++) {
      expect(rollCycleObjective(player, () => (i + 0.5) / 40, 1, "trophy").kind).not.toBe("trophy");
    }
  });

  it("dovrebbe usare il tono del brief del mister", () => {
    const player = signWithClub(createPlayer(IDENTITY), JUVENTUS);
    const objective = rollCycleObjective(player, () => 0);
    expect(objective.label.startsWith("Il mister chiede:")).toBe(true);
  });
});

describe("updatePersonalRecords", () => {
  it("dovrebbe segnalare i record battuti", () => {
    const { records, broken } = updatePersonalRecords(emptyPersonalRecords(1_000_000), {
      age: 20,
      ovrBefore: 60,
      ovrAfter: 65,
      goals: 15,
      assists: 8,
      apps: 34,
      trophies: [],
      award: null,
      newInjury: null,
      injuryHealed: false,
      nationalCallup: true,
      nationalGoals: 1,
      marketValueEur: 5_000_000,
      wasAlreadyCalled: false,
    });
    expect(records.bestSeasonGoals).toBe(15);
    expect(records.firstCallupAge).toBe(20);
    expect(broken).toContain("bestSeasonGoals");
    expect(broken).toContain("firstCallupAge");
  });

  it("dovrebbe segnalare il record di clean sheet per un portiere", () => {
    const { records, broken } = updatePersonalRecords(emptyPersonalRecords(1_000_000), {
      age: 20,
      ovrBefore: 60,
      ovrAfter: 65,
      goals: 0,
      assists: 0,
      apps: 34,
      cleanSheets: 12,
      trophies: [],
      award: null,
      newInjury: null,
      injuryHealed: false,
      nationalCallup: false,
      nationalGoals: 0,
      marketValueEur: 5_000_000,
      wasAlreadyCalled: false,
    });
    expect(records.bestSeasonCleanSheets).toBe(12);
    expect(broken).toContain("bestSeasonCleanSheets");
  });

  it("dovrebbe registrare i record come medie per stagione", () => {
    const { records } = updatePersonalRecords(emptyPersonalRecords(1_000_000), {
      age: 20,
      ovrBefore: 60,
      ovrAfter: 65,
      goals: 30,
      assists: 8,
      apps: 68,
      trophies: [],
      award: null,
      newInjury: null,
      injuryHealed: false,
      nationalCallup: false,
      nationalGoals: 0,
      marketValueEur: 5_000_000,
      wasAlreadyCalled: false,
      seasons: 2,
    });
    expect(records.bestSeasonGoals).toBe(15);
    expect(records.bestSeasonApps).toBe(34);
  });
});

describe("buildHighlightReel", () => {
  it("dovrebbe produrre 1-3 highlight su una stagione ricca", () => {
    const highlights = buildHighlightReel(
      {
        age: 25,
        ovrBefore: 80,
        ovrAfter: 84,
        goals: 22,
        assists: 10,
        apps: 38,
        trophies: [{ competition: "Champions League", age: 25 }],
        award: { type: "ballon-dor", age: 25 },
        newInjury: null,
        injuryHealed: false,
        nationalCallup: true,
        nationalGoals: 2,
        marketValueEur: 80_000_000,
        wasAlreadyCalled: true,
      },
      () => 0.1,
    );
    expect(highlights.length).toBeGreaterThanOrEqual(1);
    expect(highlights.length).toBeLessThanOrEqual(3);
  });
});

describe("computeHallOfFame", () => {
  const entry = (overrides: Partial<ArchivedCareer>): ArchivedCareer => ({
    id: "a",
    lastName: "A",
    nationality: "Italy",
    position: "ST",
    peakOvr: 80,
    trophyCount: 2,
    awardCount: 0,
    retiredAge: 35,
    retiredAtIso: "2026-01-01",
    careerApps: 100,
    careerGoals: 50,
    careerAssists: 20,
    finalSavingsEur: 1_000_000,
    finalPopularity: 50,
    careerTitle: "Campione",
    ...overrides,
  });

  it("dovrebbe restituire null su archivio vuoto", () => {
    expect(computeHallOfFame([])).toEqual({
      highestOvr: null,
      mostTrophies: null,
      richest: null,
      mostPopular: null,
    });
  });

  it("dovrebbe individuare i record con più carriere", () => {
    const a = entry({ id: "a", peakOvr: 90, trophyCount: 1, finalSavingsEur: 100, finalPopularity: 40 });
    const b = entry({ id: "b", lastName: "B", peakOvr: 70, trophyCount: 9, finalSavingsEur: 9_000_000, finalPopularity: 99 });
    const hof = computeHallOfFame([a, b]);
    expect(hof.highestOvr?.id).toBe("a");
    expect(hof.mostTrophies?.id).toBe("b");
    expect(hof.richest?.id).toBe("b");
    expect(hof.mostPopular?.id).toBe("b");
  });

  it("hallOfFameWinsFor dovrebbe riconoscere i record di una nuova carriera", () => {
    const archive = [entry({ id: "old", peakOvr: 80, trophyCount: 2, finalSavingsEur: 100, finalPopularity: 40 })];
    const newbie = entry({ id: "new", peakOvr: 95, trophyCount: 1, finalSavingsEur: 50, finalPopularity: 30 });
    expect(hallOfFameWinsFor(newbie, archive)).toContain("highestOvr");
    expect(hallOfFameWinsFor(newbie, archive)).not.toContain("mostTrophies");
  });
});

describe("emptyPersonalRecords", () => {
  it("dovrebbe inizializzare i record a zero", () => {
    expect(emptyPersonalRecords(500).peakMarketValueEur).toBe(500);
  });
});
