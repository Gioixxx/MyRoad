import type { SeasonTitleId } from "@/types/career";
import { clamp, type Rng } from "./progression";

export const POTENTIAL_MIN = 30;
export const POTENTIAL_MAX = 99;
/** Oltre questa età il potenziale è considerato assestato — niente più "breakout". */
const POTENTIAL_GROWTH_AGE_CAP = 26;
const POTENTIAL_GROWTH_BASE = 2;

/** Titoli di stagione che contano come segnale di rendimento alto per la crescita del potenziale. */
const HIGH_PERFORMANCE_TITLES: SeasonTitleId[] = [
  "revelation",
  "champion",
  "ballondorSeason",
  "nationalHero",
  "giantKiller",
];

/** Fasce pesate per il tetto individuale iniziale — la maggior parte dei giocatori resta un
 * onesto professionista, solo pochi sono predestinati (stesso stile di `targetPrestige` in
 * decisions.ts). Tarato con `npm run simulate`: il primo tentativo (55% a 62-74) abbassava il
 * tetto SOTTO l'OVR di picco medio già raggiunto dalla curva di crescita esistente (~82),
 * facendo crollare convocazione/trofei/award — le fasce partono quindi da un minimo (76) vicino
 * al vecchio picco medio, così il "giocatore tipico" non regredisce rispetto a prima e solo la
 * coda alta sblocca davvero il 90+ altrimenti irraggiungibile. */
const POTENTIAL_TIERS: { weight: number; min: number; max: number }[] = [
  { weight: 50, min: 76, max: 85 },
  { weight: 30, min: 86, max: 91 },
  { weight: 15, min: 92, max: 96 },
  { weight: 5, min: 97, max: 99 },
];

export function rollInitialPotential(rng: Rng = Math.random): number {
  const totalWeight = POTENTIAL_TIERS.reduce((sum, t) => sum + t.weight, 0);
  let roll = rng() * totalWeight;
  for (const tier of POTENTIAL_TIERS) {
    roll -= tier.weight;
    if (roll < 0) {
      return tier.min + Math.round(rng() * (tier.max - tier.min));
    }
  }
  const last = POTENTIAL_TIERS[POTENTIAL_TIERS.length - 1];
  return last.min + Math.round(rng() * (last.max - last.min));
}

export function applyPotentialDelta(current: number, delta: number): number {
  return clamp(current + delta, POTENTIAL_MIN, POTENTIAL_MAX);
}

export interface PotentialGrowthInput {
  age: number;
  objectiveMet: boolean;
  seasonTitleId: SeasonTitleId;
  brokeRecord: boolean;
}

/** Un ciclo è "breakout" se almeno 2 dei 3 segnali di rendimento alto sono veri, e il
 * giocatore è ancora abbastanza giovane da poter crescere in prospettiva. */
export function evaluatePotentialGrowth(input: PotentialGrowthInput, rng: Rng = Math.random): number {
  if (input.age > POTENTIAL_GROWTH_AGE_CAP) return 0;

  const signals = [
    input.objectiveMet,
    HIGH_PERFORMANCE_TITLES.includes(input.seasonTitleId),
    input.brokeRecord,
  ];
  const signalCount = signals.filter(Boolean).length;
  if (signalCount < 2) return 0;

  const noise = Math.round((rng() - 0.5) * 2); // -1..+1
  return POTENTIAL_GROWTH_BASE + noise;
}
