import type {
  AttributeKey,
  Attributes,
  GoalkeeperAttributeKey,
  GoalkeeperAttributes,
  OutfieldAttributeKey,
  OutfieldAttributes,
  Position,
} from "@/types/career";
import { clamp, type Rng } from "./progression";

export const ATTRIBUTE_MIN = 1;
export const ATTRIBUTE_MAX = 99;

export const OUTFIELD_ATTRIBUTE_KEYS: OutfieldAttributeKey[] = [
  "pace",
  "shooting",
  "passing",
  "defending",
  "physical",
];

export const GOALKEEPER_ATTRIBUTE_KEYS: GoalkeeperAttributeKey[] = [
  "reflexes",
  "handling",
  "kicking",
  "positioning",
];

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  pace: "Velocità",
  shooting: "Tiro",
  passing: "Passaggio",
  defending: "Difesa",
  physical: "Fisico",
  reflexes: "Riflessi",
  handling: "Presa",
  kicking: "Rinvio",
  positioning: "Piazzamento",
};

export function isGoalkeeperAttributes(attributes: Attributes): attributes is GoalkeeperAttributes {
  return attributes.kind === "goalkeeper";
}

export function attributeKeysForPosition(position: Position): AttributeKey[] {
  return position === "GK" ? GOALKEEPER_ATTRIBUTE_KEYS : OUTFIELD_ATTRIBUTE_KEYS;
}

/** Pesi per ruolo (sommano a 1) usati sia per derivare l'OVR sia per pesare la crescita
 * "bilanciata" degli attributi — stesso stile di ROLE_WEIGHTS in progression.ts. */
export const OUTFIELD_ROLE_ATTRIBUTE_WEIGHTS: Record<
  Exclude<Position, "GK">,
  Record<OutfieldAttributeKey, number>
> = {
  CB: { pace: 0.08, shooting: 0.02, passing: 0.15, defending: 0.45, physical: 0.3 },
  LB: { pace: 0.25, shooting: 0.05, passing: 0.25, defending: 0.3, physical: 0.15 },
  RB: { pace: 0.25, shooting: 0.05, passing: 0.25, defending: 0.3, physical: 0.15 },
  CDM: { pace: 0.1, shooting: 0.05, passing: 0.3, defending: 0.35, physical: 0.2 },
  CM: { pace: 0.15, shooting: 0.15, passing: 0.35, defending: 0.2, physical: 0.15 },
  CAM: { pace: 0.2, shooting: 0.3, passing: 0.35, defending: 0.05, physical: 0.1 },
  LM: { pace: 0.3, shooting: 0.2, passing: 0.3, defending: 0.08, physical: 0.12 },
  RM: { pace: 0.3, shooting: 0.2, passing: 0.3, defending: 0.08, physical: 0.12 },
  LW: { pace: 0.35, shooting: 0.3, passing: 0.2, defending: 0.05, physical: 0.1 },
  RW: { pace: 0.35, shooting: 0.3, passing: 0.2, defending: 0.05, physical: 0.1 },
  ST: { pace: 0.2, shooting: 0.45, passing: 0.08, defending: 0.02, physical: 0.25 },
};

export const GOALKEEPER_ATTRIBUTE_WEIGHTS: Record<GoalkeeperAttributeKey, number> = {
  reflexes: 0.4,
  handling: 0.3,
  positioning: 0.2,
  kicking: 0.1,
};

function roleWeightsFor(position: Position): Partial<Record<AttributeKey, number>> {
  if (position === "GK") return GOALKEEPER_ATTRIBUTE_WEIGHTS;
  return OUTFIELD_ROLE_ATTRIBUTE_WEIGHTS[position];
}

/** Crea attributi attorno a un valore centrale, con variance ±6 per attributo. */
function buildAttributes(position: Position, baseline: number, rng: Rng): Attributes {
  const variance = () => Math.round((rng() - 0.5) * 12); // -6..+6
  const clampAttr = (v: number) => clamp(v, ATTRIBUTE_MIN, ATTRIBUTE_MAX);
  if (position === "GK") {
    const gk: GoalkeeperAttributes = {
      kind: "goalkeeper",
      reflexes: clampAttr(baseline + variance()),
      handling: clampAttr(baseline + variance()),
      kicking: clampAttr(baseline + variance()),
      positioning: clampAttr(baseline + variance()),
    };
    return gk;
  }
  const outfield: OutfieldAttributes = {
    kind: "outfield",
    pace: clampAttr(baseline + variance()),
    shooting: clampAttr(baseline + variance()),
    passing: clampAttr(baseline + variance()),
    defending: clampAttr(baseline + variance()),
    physical: clampAttr(baseline + variance()),
  };
  return outfield;
}

/** Attributi per un nuovo giocatore (creazione carriera) — baseline neutro (50, come STARTING_OVR). */
export function createAttributesForPosition(position: Position, rng: Rng = Math.random): Attributes {
  return buildAttributes(position, 50, rng);
}

/** Attributi retroattivi per un save esistente senza `attributes` (migrazione storage) — baseline
 * intorno all'OVR già raggiunto, non al neutro di partenza. */
export function createAttributesFromOvr(position: Position, ovr: number, rng: Rng = Math.random): Attributes {
  return buildAttributes(position, ovr, rng);
}

/** Media pesata per ruolo — è la "OVR derivato dagli attributi" usato come termine di pull. */
export function deriveOvrFromAttributes(attributes: Attributes, position: Position): number {
  const weights = roleWeightsFor(position);
  const keys = attributeKeysForPosition(position);
  const sum = keys.reduce((acc, key) => {
    const value = (attributes as unknown as Record<AttributeKey, number>)[key] ?? 0;
    return acc + value * (weights[key] ?? 0);
  }, 0);
  return clamp(Math.round(sum), ATTRIBUTE_MIN, ATTRIBUTE_MAX);
}

export function applyAttributesDelta(
  current: Attributes,
  delta: Partial<Record<AttributeKey, number>>,
): Attributes {
  const applicableKeys = isGoalkeeperAttributes(current) ? GOALKEEPER_ATTRIBUTE_KEYS : OUTFIELD_ATTRIBUTE_KEYS;
  const next = { ...current } as unknown as Record<AttributeKey, number> & { kind: string };
  for (const key of applicableKeys) {
    const d = delta[key];
    if (d === undefined) continue;
    next[key] = clamp(Math.round(next[key] + d), ATTRIBUTE_MIN, ATTRIBUTE_MAX);
  }
  return next as unknown as Attributes;
}

export interface AttributeGrowthInput {
  attributes: Attributes;
  position: Position;
  /** Budget di crescita del ciclo (può essere negativo per il declino da veterano) — stessa
   * unità di `ovrDeltaForAge` sommato sulle stagioni, vedi `sumOvrDeltaForAge`. */
  totalGrowthBudget: number;
  focusAttribute: AttributeKey | null;
  rng: Rng;
}

/** Quota bonus sull'attributo scelto come focus di allenamento, prima di rinormalizzare i pesi. */
const TRAINING_FOCUS_MULTIPLIER = 1.5;

/** Distribuisce il budget di crescita del ciclo su tutti gli attributi pesati per rilevanza di
 * ruolo, con una quota bonus sull'attributo in focus e un piccolo rumore per attributo. */
export function distributeAttributeGrowth(input: AttributeGrowthInput): Attributes {
  const { attributes, position, totalGrowthBudget, focusAttribute, rng } = input;
  const keys = attributeKeysForPosition(position);
  const weights = roleWeightsFor(position);

  // La quota di ciascun attributo è proporzionale al peso "boosted" (più alto sull'attributo in
  // focus), ma normalizzata in modo che la RIAGGREGAZIONE pesata (deriveOvrFromAttributes, che
  // usa gli stessi `weights`) restituisca esattamente `totalGrowthBudget` — non semplicemente
  // che le quote sommino a 1. Con quote proporzionali al solo peso semplice, la somma pesata
  // delle quote è sum(weight_i^2) < 1 (i pesi sono frazioni), quindi l'OVR derivato cresceva
  // molto più lento dell'OVR age-based e il termine di "pull" in advanceSeasons diventava
  // negativo ad ogni ciclo, facendo crollare l'OVR medio (bug trovato con npm run simulate:
  // 82→64). La normalizzazione corretta è `share_i = boosted_i / sum_j(weight_j * boosted_j)`,
  // che garantisce sum(weight_i * share_i) = 1 per costruzione, qualunque sia il focus.
  const boostedWeights = keys.map((key) => ({
    key,
    weight: weights[key] ?? 0,
    boosted: key === focusAttribute ? (weights[key] ?? 0) * TRAINING_FOCUS_MULTIPLIER : (weights[key] ?? 0),
  }));
  const denom = boostedWeights.reduce((sum, w) => sum + w.weight * w.boosted, 0) || 1;

  const delta: Partial<Record<AttributeKey, number>> = {};
  for (const { key, boosted } of boostedWeights) {
    const share = boosted / denom;
    const noise = (rng() - 0.5) * 2; // -1..+1
    delta[key] = totalGrowthBudget * share + noise;
  }

  return applyAttributesDelta(attributes, delta);
}
