import type { Injury, Position, StatLine } from "@/types/career";
import { clamp, type Rng } from "./progression";

/** Quota di apps/gol/assist (e extras portiere) che resta in un ciclo infortunato. */
export const INJURY_STATS_MULTIPLIER = 0.45;

const HIGH_RISK_POSITIONS = new Set<Position>(["CDM", "CB", "ST"]);

const INJURY_LABELS = [
  "Distorsione alla caviglia",
  "Lesione muscolare",
  "Problema al ginocchio",
  "Affaticamento fisico",
];

const INJURY_AGE_RISK_START = 30;
const INJURY_AGE_DIVISOR = 25;
const INJURY_AGE_FACTOR_CAP = 0.22;
const INJURY_AGE_FACTOR_BASELINE = 0.03;
const INJURY_HIGH_RISK_ROLE_FACTOR = 0.05;
const INJURY_LOW_RISK_ROLE_FACTOR = 0.02;
const INJURY_LOAD_FACTOR_PER_SEASON = 0.03;
const INJURY_LOAD_FACTOR_CAP = 0.09;
const INJURY_CHANCE_CAP = 0.35;

/** Probabilità di infortunio in un ciclo, in base a età, ruolo e carico (stagioni del ciclo). */
export function injuryChance(age: number, position: Position, seasons: number): number {
  const ageFactor =
    age >= INJURY_AGE_RISK_START
      ? clamp((age - INJURY_AGE_RISK_START) / INJURY_AGE_DIVISOR, 0, INJURY_AGE_FACTOR_CAP)
      : INJURY_AGE_FACTOR_BASELINE;
  const roleFactor = HIGH_RISK_POSITIONS.has(position)
    ? INJURY_HIGH_RISK_ROLE_FACTOR
    : INJURY_LOW_RISK_ROLE_FACTOR;
  const loadFactor = clamp((seasons - 1) * INJURY_LOAD_FACTOR_PER_SEASON, 0, INJURY_LOAD_FACTOR_CAP);
  return clamp(ageFactor + roleFactor + loadFactor, 0, INJURY_CHANCE_CAP);
}

const INJURY_SEVERITY_SHORT_THRESHOLD = 0.6;
const INJURY_SEVERITY_MEDIUM_THRESHOLD = 0.9;
const INJURY_OVR_PENALTY_BASE = 2;
const INJURY_OVR_PENALTY_SCALAR = 6;

/** Estrae un infortunio per il ciclo, o null se il giocatore resta integro. `injuryMultiplier`
 * (default 1, <1 riduce il rischio) è pensato per il playstyle "Scatto fulmineo". */
export function rollInjury(
  age: number,
  position: Position,
  seasons: number,
  rng: Rng = Math.random,
  injuryMultiplier = 1,
): Injury | null {
  if (rng() >= injuryChance(age, position, seasons) * injuryMultiplier) return null;

  const severity = rng();
  const turnsRemaining =
    severity < INJURY_SEVERITY_SHORT_THRESHOLD ? 1 : severity < INJURY_SEVERITY_MEDIUM_THRESHOLD ? 2 : 3;
  const ovrPenalty = Math.round(INJURY_OVR_PENALTY_BASE + severity * INJURY_OVR_PENALTY_SCALAR);
  const label = INJURY_LABELS[Math.floor(rng() * INJURY_LABELS.length)];
  return { label, turnsRemaining, ovrPenalty };
}

/** Fa avanzare l'infortunio di un ciclo; torna null (guarito) quando il countdown si esaurisce. */
export function tickInjury(injury: Injury): Injury | null {
  if (injury.turnsRemaining <= 1) return null;
  return { ...injury, turnsRemaining: injury.turnsRemaining - 1 };
}

/** Riduce le stats di uno stint per un ciclo passato infortunato. */
export function scaleStatLine(stats: StatLine, multiplier: number): StatLine {
  const scale = (n: number) => Math.max(0, Math.round(n * multiplier));
  const next: StatLine = {
    apps: scale(stats.apps),
    goals: scale(stats.goals),
    assists: scale(stats.assists),
  };
  if (stats.goalsAgainst !== undefined) next.goalsAgainst = scale(stats.goalsAgainst);
  if (stats.cleanSheets !== undefined) next.cleanSheets = scale(stats.cleanSheets);
  return next;
}
