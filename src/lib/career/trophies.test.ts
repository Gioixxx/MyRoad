import { describe, expect, it } from "vitest";
import { getClub } from "@/data/clubs";
import { awardChance, clubTrophyChance, nationalTournamentWinChance, rollAward, rollClubTrophies, rollNationalTrophies } from "./trophies";

const JUVENTUS = getClub("juventus")!; // prestige 3, competitions: Serie A / Coppa Italia / Champions League

describe("clubTrophyChance", () => {
  it("dovrebbe crescere con il prestigio del club", () => {
    expect(clubTrophyChance(3, 70)).toBeGreaterThan(clubTrophyChance(0, 70));
  });

  it("dovrebbe crescere con l'OVR a parità di prestigio", () => {
    expect(clubTrophyChance(2, 90)).toBeGreaterThan(clubTrophyChance(2, 60));
  });

  it("non dovrebbe mai superare 0.5", () => {
    expect(clubTrophyChance(3, 99)).toBeLessThanOrEqual(0.5);
  });
});

describe("rollClubTrophies", () => {
  it("dovrebbe assegnare campionato e coppa se il roll è favorevole", () => {
    const trophies = rollClubTrophies(JUVENTUS, 90, 25, () => 0);
    expect(trophies).toHaveLength(2);
    expect(trophies[0].competition).toBe("Serie A");
    expect(trophies[1].competition).toBe("Coppa Italia");
  });

  it("non dovrebbe assegnare nulla se il roll è sfavorevole", () => {
    const trophies = rollClubTrophies(JUVENTUS, 90, 25, () => 0.999);
    expect(trophies).toHaveLength(0);
  });

  it("non dovrebbe assegnare il campionato se skipLeague è true", () => {
    const trophies = rollClubTrophies(JUVENTUS, 90, 25, () => 0, 0, true);
    expect(trophies.some((t) => t.competition === "Serie A")).toBe(false);
    expect(trophies.some((t) => t.competition === "Coppa Italia")).toBe(true);
  });
});

describe("nationalTournamentWinChance", () => {
  it("dovrebbe essere zero sotto la soglia minima", () => {
    expect(nationalTournamentWinChance(70)).toBe(0);
  });

  it("non dovrebbe mai superare 0.2", () => {
    expect(nationalTournamentWinChance(150)).toBeLessThanOrEqual(0.2);
  });
});

describe("rollNationalTrophies", () => {
  function seqRng(values: number[]) {
    let i = 0;
    return () => values[Math.min(i++, values.length - 1)];
  }

  it("dovrebbe restituire un array vuoto se il giocatore non è convocato", () => {
    expect(rollNationalTrophies(false, 95, 28, "UEFA", () => 0)).toEqual([]);
  });

  it("dovrebbe restituire un array vuoto se entrambi i roll sono sfavorevoli", () => {
    expect(rollNationalTrophies(true, 95, 28, "UEFA", () => 0.999)).toEqual([]);
  });

  it("dovrebbe poter vincere Mondiale e coppa di confederazione nello stesso ciclo Express (16→19)", () => {
    const trophies = rollNationalTrophies(true, 95, 19, "UEFA", () => 0, 16);
    expect(trophies).toHaveLength(2);
    expect(trophies[0]).toEqual({ competition: "Mondiale", club: undefined, age: 19 });
    expect(trophies[1]).toEqual({ competition: "Europei", club: undefined, age: 19 });
  });

  it("non dovrebbe assegnare il Mondiale fuori dagli anni 18/22/26/30/34/38", () => {
    const trophies = rollNationalTrophies(true, 95, 22, "UEFA", () => 0, 21);
    expect(trophies.some((t) => t.competition === "Mondiale")).toBe(false);
    expect(trophies.some((t) => t.competition === "Europei")).toBe(true);
  });

  it("dovrebbe vincere solo il Mondiale se il secondo roll è sfavorevole", () => {
    const trophies = rollNationalTrophies(true, 95, 19, "UEFA", seqRng([0, 0.999]), 16);
    expect(trophies).toEqual([{ competition: "Mondiale", club: undefined, age: 19 }]);
  });

  it("dovrebbe vincere solo la coppa di confederazione se il primo roll è sfavorevole", () => {
    const trophies = rollNationalTrophies(true, 95, 19, "UEFA", seqRng([0.999, 0]), 16);
    expect(trophies).toEqual([{ competition: "Europei", club: undefined, age: 19 }]);
  });

  it("dovrebbe usare Copa América per confederazione CONMEBOL", () => {
    expect(rollNationalTrophies(true, 95, 19, "CONMEBOL", seqRng([0.999, 0]), 16)[0]?.competition).toBe(
      "Copa América",
    );
  });

  it("dovrebbe usare AFC Asian Cup per confederazione AFC", () => {
    expect(rollNationalTrophies(true, 95, 19, "AFC", seqRng([0.999, 0]), 16)[0]?.competition).toBe(
      "AFC Asian Cup",
    );
  });

  it("dovrebbe usare Africa Cup of Nations per confederazione CAF", () => {
    expect(rollNationalTrophies(true, 95, 19, "CAF", seqRng([0.999, 0]), 16)[0]?.competition).toBe(
      "Africa Cup of Nations",
    );
  });

  it("dovrebbe usare CONCACAF Gold Cup per confederazione CONCACAF", () => {
    expect(rollNationalTrophies(true, 95, 19, "CONCACAF", seqRng([0.999, 0]), 16)[0]?.competition).toBe(
      "CONCACAF Gold Cup",
    );
  });
});

describe("awardChance", () => {
  it("dovrebbe essere zero sotto la soglia OVR 84", () => {
    expect(awardChance(83)).toBe(0);
  });

  it("dovrebbe crescere con l'OVR sopra la soglia", () => {
    expect(awardChance(95)).toBeGreaterThan(awardChance(87));
  });
});

describe("rollAward", () => {
  it("dovrebbe restituire null se l'OVR è sotto soglia", () => {
    const player = { ovr: 80, club: JUVENTUS, shadow: 0 };
    expect(rollAward(player, { apps: 30, goals: 20, assists: 10 }, 27, () => 0)).toBeNull();
  });

  it("dovrebbe restituire un award con club associato se il roll è favorevole", () => {
    const player = { ovr: 92, club: JUVENTUS, shadow: 0 };
    const award = rollAward(player, { apps: 30, goals: 20, assists: 10 }, 27, () => 0);
    expect(award).not.toBeNull();
    expect(award?.club).toEqual(JUVENTUS);
  });

  it("dovrebbe restituire null se il giocatore è svincolato ma comunque gestire club undefined", () => {
    const player = { ovr: 92, club: null, shadow: 0 };
    const award = rollAward(player, { apps: 30, goals: 20, assists: 10 }, 27, () => 0);
    expect(award?.club).toBeUndefined();
  });
});
