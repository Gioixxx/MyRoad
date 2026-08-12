import { describe, expect, it } from "vitest";
import {
  accrueSalary,
  applyPopularityDelta,
  computeReleaseClauseEur,
  computeSalaryEur,
  computeSigningBonusEur,
  popularityDeltaForCycle,
  resignSalary,
} from "./wallet";

describe("computeSalaryEur", () => {
  it("dovrebbe crescere con l'OVR", () => {
    expect(computeSalaryEur(85, 2)).toBeGreaterThan(computeSalaryEur(60, 2));
  });

  it("dovrebbe crescere con il prestigio del club", () => {
    expect(computeSalaryEur(70, 3)).toBeGreaterThan(computeSalaryEur(70, 0));
  });

  it("dovrebbe restituire un valore esatto a OVR/prestigio fissi (regressione su esponente/scalare)", () => {
    expect(computeSalaryEur(70, 2)).toBe(265_000);
  });

  it("dovrebbe crescere in modo monotono su uno spettro di valori OVR", () => {
    const values = [50, 60, 70, 80, 90, 99].map((ovr) => computeSalaryEur(ovr, 2));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe("accrueSalary", () => {
  it("dovrebbe sommare lo stipendio per il numero di stagioni", () => {
    const wallet = { salaryEurPerCycle: 10_000, savingsEur: 5_000 };
    const accrued = accrueSalary(wallet, 2);
    expect(accrued.savingsEur).toBe(25_000);
  });
});

describe("resignSalary", () => {
  it("dovrebbe ricalcolare lo stipendio senza toccare i risparmi", () => {
    const wallet = { salaryEurPerCycle: 10_000, savingsEur: 5_000 };
    const resigned = resignSalary(wallet, 90, 3);
    expect(resigned.salaryEurPerCycle).toBeGreaterThan(0);
    expect(resigned.savingsEur).toBe(5_000);
  });
});

describe("computeReleaseClauseEur", () => {
  it("dovrebbe crescere col prestigio del club a parità di market value/età", () => {
    expect(computeReleaseClauseEur(10_000_000, 25, 3)).toBeGreaterThan(
      computeReleaseClauseEur(10_000_000, 25, 0),
    );
  });

  it("dovrebbe essere più alta per un giocatore giovane rispetto a un veterano a parità di market value", () => {
    expect(computeReleaseClauseEur(10_000_000, 20, 1)).toBeGreaterThan(
      computeReleaseClauseEur(10_000_000, 30, 1),
    );
  });

  it("dovrebbe restare un multiplo positivo del market value", () => {
    expect(computeReleaseClauseEur(5_000_000, 28, 0)).toBeGreaterThan(5_000_000);
  });
});

describe("computeSigningBonusEur", () => {
  it("dovrebbe crescere con lo stipendio", () => {
    expect(computeSigningBonusEur(200_000)).toBeGreaterThan(computeSigningBonusEur(50_000));
  });

  it("dovrebbe essere zero con stipendio zero", () => {
    expect(computeSigningBonusEur(0)).toBe(0);
  });
});

describe("popularityDeltaForCycle", () => {
  it("dovrebbe essere maggiore con trofei e award vinti rispetto a un ciclo senza nulla", () => {
    const withGlory = popularityDeltaForCycle({ goals: 5, trophiesWon: 1, awardsWon: 1 });
    const withoutGlory = popularityDeltaForCycle({ goals: 5, trophiesWon: 0, awardsWon: 0 });
    expect(withGlory).toBeGreaterThan(withoutGlory);
  });

  it("dovrebbe essere leggermente negativo in un ciclo senza gol né successi", () => {
    expect(popularityDeltaForCycle({ goals: 0, trophiesWon: 0, awardsWon: 0 })).toBeLessThan(0);
  });

  it("dovrebbe contare i clean sheet di un portiere come prestazione, non solo i gol", () => {
    const goalkeeperCycle = popularityDeltaForCycle({
      goals: 0,
      cleanSheets: 10,
      trophiesWon: 0,
      awardsWon: 0,
    });
    const noPerformance = popularityDeltaForCycle({ goals: 0, trophiesWon: 0, awardsWon: 0 });
    expect(goalkeeperCycle).toBeGreaterThan(noPerformance);
  });
});

describe("applyPopularityDelta", () => {
  it("dovrebbe fare clamp a 0-100", () => {
    expect(applyPopularityDelta(95, 50)).toBe(100);
    expect(applyPopularityDelta(5, -50)).toBe(0);
  });

  it("dovrebbe restare esattamente a 100 se già al massimo e il delta è positivo", () => {
    expect(applyPopularityDelta(100, 1)).toBe(100);
  });

  it("dovrebbe restare esattamente a 0 se già al minimo e il delta è negativo", () => {
    expect(applyPopularityDelta(0, -1)).toBe(0);
  });
});
