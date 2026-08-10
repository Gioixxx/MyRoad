import { describe, expect, it } from "vitest";
import {
  clamp,
  ovrDeltaForAge,
  projectOvr,
  projectSeasonStats,
  projectStats,
  type Rng,
} from "./progression";

const NO_NOISE_RNG: Rng = () => 0.5;
const YOUNG_AGE = 18;
const PLATEAU_AGE = 29;
const OLD_AGE = 39;

function sequentialRng(values: number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("clamp", () => {
  it("dovrebbe limitare il valore al minimo se sotto il range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("dovrebbe limitare il valore al massimo se sopra il range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("ovrDeltaForAge", () => {
  it("dovrebbe restituire una crescita alta se il giocatore è giovane", () => {
    expect(ovrDeltaForAge(YOUNG_AGE)).toBe(3.5);
  });

  it("dovrebbe restituire un plateau vicino allo zero nel picco di carriera", () => {
    expect(ovrDeltaForAge(PLATEAU_AGE)).toBe(0.8);
  });

  it("dovrebbe restituire un declino marcato se il giocatore supera i 37 anni", () => {
    expect(ovrDeltaForAge(OLD_AGE)).toBe(-3);
  });
});

describe("projectOvr", () => {
  it("dovrebbe crescere se il giocatore è giovane e non c'è rumore casuale", () => {
    const result = projectOvr(50, YOUNG_AGE, 1, 99, NO_NOISE_RNG);
    expect(result).toBe(54); // 50 + 3.5 arrotondato per eccesso
  });

  it("non dovrebbe mai superare il tetto massimo di 99", () => {
    const maxNoiseRng: Rng = () => 1; // noise = +1
    const result = projectOvr(98, YOUNG_AGE, 1, 99, maxNoiseRng);
    expect(result).toBe(99);
  });

  it("non dovrebbe mai scendere sotto il minimo di 35", () => {
    const minNoiseRng: Rng = () => 0; // noise = -1
    const result = projectOvr(36, OLD_AGE, 1, 99, minNoiseRng);
    expect(result).toBe(35);
  });

  it("dovrebbe rispettare un tetto individuale più basso di 99 (potenziale)", () => {
    const maxNoiseRng: Rng = () => 1; // noise = +1
    const result = projectOvr(78, YOUNG_AGE, 1, 80, maxNoiseRng);
    expect(result).toBe(80);
  });
});

describe("projectSeasonStats", () => {
  it("dovrebbe generare più gol per un attaccante che per un difensore a parità di OVR", () => {
    const striker = projectSeasonStats(80, "ST", 1, NO_NOISE_RNG);
    const defender = projectSeasonStats(80, "CB", 1, NO_NOISE_RNG);
    expect(striker.goals).toBeGreaterThan(defender.goals);
  });

  it("dovrebbe generare più prodotto offensivo se l'OVR è più alto", () => {
    const highOvr = projectSeasonStats(90, "ST", 1, NO_NOISE_RNG);
    const lowOvr = projectSeasonStats(55, "ST", 1, NO_NOISE_RNG);
    expect(highOvr.goals).toBeGreaterThan(lowOvr.goals);
  });

  it("dovrebbe generare zero gol per un portiere", () => {
    const goalkeeper = projectSeasonStats(80, "GK", 1, NO_NOISE_RNG);
    expect(goalkeeper.goals).toBe(0);
  });

  it("dovrebbe generare goalsAgainst/cleanSheets solo per un portiere", () => {
    const goalkeeper = projectSeasonStats(80, "GK", 1, NO_NOISE_RNG);
    const striker = projectSeasonStats(80, "ST", 1, NO_NOISE_RNG);
    expect(goalkeeper.goalsAgainst).toBeGreaterThanOrEqual(0);
    expect(goalkeeper.cleanSheets).toBeGreaterThanOrEqual(0);
    expect(striker.goalsAgainst).toBeUndefined();
    expect(striker.cleanSheets).toBeUndefined();
  });

  it("un portiere con OVR più alto dovrebbe subire meno gol e fare più clean sheet", () => {
    const highOvr = projectSeasonStats(90, "GK", 1, NO_NOISE_RNG);
    const lowOvr = projectSeasonStats(55, "GK", 1, NO_NOISE_RNG);
    expect(highOvr.goalsAgainst!).toBeLessThan(lowOvr.goalsAgainst!);
    expect(highOvr.cleanSheets!).toBeGreaterThan(lowOvr.cleanSheets!);
  });
});

describe("projectStats", () => {
  it("dovrebbe sommare le statistiche di più stagioni consecutive nello stesso club", () => {
    const values = [0.5, 0.5, 0.5, 0.6, 0.4, 0.5, 0.3, 0.7, 0.5];
    const total = projectStats(75, "ST", 1, 3, sequentialRng(values));

    const season1 = projectSeasonStats(75, "ST", 1, sequentialRng(values.slice(0, 3)));
    const season2 = projectSeasonStats(75, "ST", 1, sequentialRng(values.slice(3, 6)));
    const season3 = projectSeasonStats(75, "ST", 1, sequentialRng(values.slice(6, 9)));

    expect(total).toEqual({
      apps: season1.apps + season2.apps + season3.apps,
      goals: season1.goals + season2.goals + season3.goals,
      assists: season1.assists + season2.assists + season3.assists,
    });
  });

  it("dovrebbe sommare goalsAgainst/cleanSheets su più stagioni per un portiere", () => {
    // RNG costante: il numero di chiamate rng() per stagione differisce tra outfield e GK
    // (il GK consuma chiamate extra per goalsAgainst/cleanSheets), quindi uno slicing
    // sequenziale come sopra sarebbe fragile — con un valore costante il risultato per
    // stagione è deterministico a prescindere da quante volte rng() viene invocato.
    const total = projectStats(75, "GK", 1, 2, NO_NOISE_RNG);
    const season = projectSeasonStats(75, "GK", 1, NO_NOISE_RNG);

    expect(total.goalsAgainst).toBe((season.goalsAgainst ?? 0) * 2);
    expect(total.cleanSheets).toBe((season.cleanSheets ?? 0) * 2);
  });
});
