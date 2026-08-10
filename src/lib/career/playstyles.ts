import type { AttributeKey, Attributes, Player, PlayStyleId, Position } from "@/types/career";

export interface PlayStyleDef {
  id: PlayStyleId;
  label: string;
  attribute: AttributeKey;
  threshold: number;
  /** Se assente, disponibile per qualunque ruolo (coerente col kind dell'attributo). */
  eligiblePositions?: Position[];
}

const DEFENSIVE_POSITIONS: Position[] = ["CB", "CDM", "LB", "RB"];

/**
 * Soglie per stile (1-99), tarate con `npm run simulate` per un giocatore che si allena
 * deliberatamente in quella direzione (focus di allenamento) — non più una soglia piatta unica:
 * la quota di crescita di ogni attributo in `distributeAttributeGrowth` dipende dal peso di
 * ruolo, quindi un attributo con peso basso nella maggior parte dei ruoli (es. velocità, alta
 * solo su ali/terzini) cresce molto più lentamente anche col focus — soglie più basse compensano
 * senza toccare la formula di crescita.
 */
const CURLER_THRESHOLD = 82;
const PLAYMAKER_THRESHOLD = 86;
const SPRINTER_THRESHOLD = 68;
const BRICKWALL_THRESHOLD = 82;
const TARGETMAN_THRESHOLD = 74;
const CATLIKE_THRESHOLD = 82;

export const PLAY_STYLE_DEFS: PlayStyleDef[] = [
  { id: "curler", label: "Tiro a giro", attribute: "shooting", threshold: CURLER_THRESHOLD },
  { id: "playmaker", label: "Regista", attribute: "passing", threshold: PLAYMAKER_THRESHOLD },
  { id: "sprinter", label: "Scatto fulmineo", attribute: "pace", threshold: SPRINTER_THRESHOLD },
  {
    id: "brickwall",
    label: "Muro difensivo",
    attribute: "defending",
    threshold: BRICKWALL_THRESHOLD,
    eligiblePositions: DEFENSIVE_POSITIONS,
  },
  { id: "targetman", label: "Colosso d'area", attribute: "physical", threshold: TARGETMAN_THRESHOLD },
  {
    id: "catlike",
    label: "Riflessi felini",
    attribute: "reflexes",
    threshold: CATLIKE_THRESHOLD,
    eligiblePositions: ["GK"],
  },
];

export const PLAY_STYLE_LABELS: Record<PlayStyleId, string> = Object.fromEntries(
  PLAY_STYLE_DEFS.map((def) => [def.id, def.label]),
) as Record<PlayStyleId, string>;

function attributeValue(attributes: Attributes, key: AttributeKey): number {
  return (attributes as unknown as Record<AttributeKey, number>)[key] ?? 0;
}

/** Rileva i nuovi playstyle sbloccati in questo ciclo — non ri-propone quelli già presenti. */
export function detectNewPlayStyles(
  player: Pick<Player, "attributes" | "position" | "playStyles">,
): PlayStyleId[] {
  return PLAY_STYLE_DEFS.filter((def) => {
    if (player.playStyles.includes(def.id)) return false;
    if (def.eligiblePositions && !def.eligiblePositions.includes(player.position)) return false;
    return attributeValue(player.attributes, def.attribute) >= def.threshold;
  }).map((def) => def.id);
}

const CURLER_GOALS_BONUS = 0.15;
const PLAYMAKER_ASSISTS_BONUS = 0.15;
const SPRINTER_INJURY_REDUCTION = 0.15;
const BRICKWALL_TROPHY_BONUS = 0.05;
const TARGETMAN_CALLUP_BONUS = 0.08;
const CATLIKE_CONCEDED_REDUCTION = 0.15;
const CATLIKE_CLEAN_SHEET_BONUS = 0.2;

export function playStyleGoalsMultiplier(styles: PlayStyleId[]): number {
  return styles.includes("curler") ? 1 + CURLER_GOALS_BONUS : 1;
}

export function playStyleAssistsMultiplier(styles: PlayStyleId[]): number {
  return styles.includes("playmaker") ? 1 + PLAYMAKER_ASSISTS_BONUS : 1;
}

/** Moltiplicatore sulla probabilità di infortunio — <1 riduce il rischio. */
export function playStyleInjuryMultiplier(styles: PlayStyleId[]): number {
  return styles.includes("sprinter") ? 1 - SPRINTER_INJURY_REDUCTION : 1;
}

/** Bonus additivo (in punti percentuali) alla probabilità di trofeo di club nel ciclo. */
export function playStyleTrophyBonus(styles: PlayStyleId[]): number {
  return styles.includes("brickwall") ? BRICKWALL_TROPHY_BONUS : 0;
}

/** Bonus additivo (in punti percentuali) alla probabilità di convocazione in nazionale. */
export function playStyleCallupBonus(styles: PlayStyleId[]): number {
  return styles.includes("targetman") ? TARGETMAN_CALLUP_BONUS : 0;
}

export function playStyleConcededMultiplier(styles: PlayStyleId[]): number {
  return styles.includes("catlike") ? 1 - CATLIKE_CONCEDED_REDUCTION : 1;
}

export function playStyleCleanSheetMultiplier(styles: PlayStyleId[]): number {
  return styles.includes("catlike") ? 1 + CATLIKE_CLEAN_SHEET_BONUS : 1;
}
