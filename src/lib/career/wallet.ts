import type { Wallet } from "@/types/career";
import { clamp } from "./progression";

const SALARY_BASE_EUR = 30_000;
const SALARY_OVR_BASELINE = 45;
const SALARY_OVR_EXPONENT = 2.4;
const SALARY_OVR_SCALAR = 40;
const SALARY_PRESTIGE_MULTIPLIER = 0.6;

/** Stipendio per ciclo in EUR, in base a OVR e prestigio del club — cresce super-lineare con l'OVR. */
export function computeSalaryEur(ovr: number, prestige: number): number {
  const base = SALARY_BASE_EUR + Math.pow(Math.max(ovr - SALARY_OVR_BASELINE, 1), SALARY_OVR_EXPONENT) * SALARY_OVR_SCALAR;
  return Math.round((base * (1 + prestige * SALARY_PRESTIGE_MULTIPLIER)) / 1000) * 1000;
}

/** Accumula lo stipendio maturato in N stagioni nei risparmi del portafoglio. */
export function accrueSalary(wallet: Wallet, seasons: number): Wallet {
  return { ...wallet, savingsEur: wallet.savingsEur + wallet.salaryEurPerCycle * seasons };
}

/** Ricalcola lo stipendio per ciclo alla firma di un nuovo contratto. */
export function resignSalary(wallet: Wallet, ovr: number, prestige: number): Wallet {
  return { ...wallet, salaryEurPerCycle: computeSalaryEur(ovr, prestige) };
}

const RELEASE_CLAUSE_BASE_MULTIPLIER = 1.5;
const RELEASE_CLAUSE_PRESTIGE_STEP = 0.3;
const RELEASE_CLAUSE_YOUNG_AGE = 23;
const RELEASE_CLAUSE_YOUNG_BONUS = 0.5;

/**
 * Clausola rescissoria alla firma, come multiplo del valore di mercato (`computeMarketValue`,
 * riusato invece di una nuova formula da zero) — più alta per club di prestigio maggiore (i top
 * club blindano i propri cartellini) e per giocatori giovani (pattern reale: le clausole più
 * alte proteggono i talenti in prospettiva, non i veterani a fine carriera).
 */
export function computeReleaseClauseEur(marketValueEur: number, age: number, prestige: number): number {
  const multiplier =
    RELEASE_CLAUSE_BASE_MULTIPLIER +
    prestige * RELEASE_CLAUSE_PRESTIGE_STEP +
    (age < RELEASE_CLAUSE_YOUNG_AGE ? RELEASE_CLAUSE_YOUNG_BONUS : 0);
  return Math.round((marketValueEur * multiplier) / 1000) * 1000;
}

const SIGNING_BONUS_SALARY_MULTIPLIER = 0.6;

/** Bonus alla firma una tantum (frazione di uno stipendio annuo) su un nuovo contratto. */
export function computeSigningBonusEur(salaryEurPerCycle: number): number {
  return Math.round((salaryEurPerCycle * SIGNING_BONUS_SALARY_MULTIPLIER) / 1000) * 1000;
}

/**
 * Variazione di popolarità per un ciclo, in base a prestazioni e successi ottenuti.
 * `cleanSheets` (valorizzato solo per i portieri) conta come prestazione allo stesso peso dei
 * gol — altrimenti un portiere (goals sempre ~0) non guadagnerebbe mai popolarità per merito.
 */
export function popularityDeltaForCycle(input: {
  goals: number;
  cleanSheets?: number;
  trophiesWon: number;
  awardsWon: number;
}): number {
  const performance = input.goals * 0.3 + (input.cleanSheets ?? 0) * 0.3;
  const glory = input.trophiesWon * 5 + input.awardsWon * 8;
  const decay = -0.5;
  return performance + glory + decay;
}

export function applyPopularityDelta(current: number, delta: number): number {
  return clamp(Math.round(current + delta), 0, 100);
}
