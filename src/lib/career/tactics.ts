import type { Attributes, Club, OutfieldAttributeKey, Player, Position } from "@/types/career";

/**
 * Sistema tattico di un club, 4 valori. Derivato in modo deterministico dall'id del club invece
 * di essere un campo dati hand-authored — evita di dover ricercare/curare l'identità tattica
 * "reale" di 220 club (nessuna fonte affidabile per la maggior parte dei campionati minori),
 * stesso principio già seguito per le soglie PlayStyle (nessun nuovo dato per club).
 */
export type TacticalSystem = "possesso" | "pressing" | "contropiede" | "diretto";

export const TACTICAL_SYSTEM_LABELS: Record<TacticalSystem, string> = {
  possesso: "Possesso palla",
  pressing: "Pressing alto",
  contropiede: "Contropiede",
  diretto: "Gioco diretto",
};

const TACTICAL_SYSTEMS: TacticalSystem[] = ["possesso", "pressing", "contropiede", "diretto"];

/**
 * Hash deterministico e stabile sull'id del club — sempre lo stesso sistema per lo stesso club.
 * FNV-1a (buon avalanche anche su stringhe corte), non una somma/prodotto semplice di codici
 * carattere: una somma pura clusterizza vistosamente su id strutturalmente simili (es. molti slug
 * "paese-nome" della stessa lunghezza/composizione — osservato dal vivo nel browser, 4 offerte del
 * settore giovanile spagnolo risultavano tutte "Ottimo" con la somma; anche un hash moltiplicativo
 * semplice tipo `String.hashCode` di Java clusterizzava ancora 3 club su 4 sullo stesso sistema).
 */
export function clubTacticalSystem(club: Pick<Club, "id">): TacticalSystem {
  const FNV_OFFSET_BASIS = 0x811c9dc5;
  const FNV_PRIME = 0x01000193;
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < club.id.length; i++) {
    hash ^= club.id.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return TACTICAL_SYSTEMS[(hash >>> 0) % TACTICAL_SYSTEMS.length];
}

/** Attributo di movimento → sistema tattico che lo valorizza. `shooting` non è mappato. */
const ATTRIBUTE_SYSTEM: Partial<Record<OutfieldAttributeKey, TacticalSystem>> = {
  passing: "possesso",
  defending: "pressing",
  pace: "contropiede",
  physical: "diretto",
};

const MAPPED_ATTRIBUTES = Object.keys(ATTRIBUTE_SYSTEM) as OutfieldAttributeKey[];

/** Sistema preferito dal giocatore in base all'attributo dominante — `null` per i portieri, i
 * cui attributi non mappano a un sistema offensivo (il fit resta sempre "neutro"). */
export function playerPreferredSystem(attributes: Attributes, position: Position): TacticalSystem | null {
  if (position === "GK" || attributes.kind !== "outfield") return null;
  const dominant = MAPPED_ATTRIBUTES.reduce((best, key) =>
    attributes[key] > attributes[best] ? key : best,
  );
  return ATTRIBUTE_SYSTEM[dominant]!;
}

/** Sistema in cui il giocatore rende peggio — l'attributo di movimento più debole. */
function playerWeakestSystem(attributes: Attributes): TacticalSystem | null {
  if (attributes.kind !== "outfield") return null;
  const weakest = MAPPED_ATTRIBUTES.reduce((worst, key) =>
    attributes[key] < attributes[worst] ? key : worst,
  );
  return ATTRIBUTE_SYSTEM[weakest]!;
}

export type TacticalFit = "ottimo" | "neutro" | "scarso";

export const TACTICAL_FIT_LABELS: Record<TacticalFit, string> = {
  ottimo: "Ottimo",
  neutro: "Neutro",
  scarso: "Scarso",
};

/** Compatibilità tra lo stile del giocatore e il sistema di gioco del club corrente/offerto. */
export function tacticalFit(
  player: Pick<Player, "attributes" | "position">,
  club: Pick<Club, "id">,
): TacticalFit {
  const preferred = playerPreferredSystem(player.attributes, player.position);
  if (preferred === null) return "neutro";
  const system = clubTacticalSystem(club);
  if (preferred === system) return "ottimo";
  if (playerWeakestSystem(player.attributes) === system) return "scarso";
  return "neutro";
}

const TACTICAL_FIT_BONUS = 0.08;
const TACTICAL_FIT_PENALTY = 0.08;

/** Moltiplicatore sulle proiezioni statistiche offensive (gol/assist attesi) — magnitudine
 * contenuta per limitare l'effetto sul bilanciamento esistente (stesso principio già seguito nei
 * primi giri di taratura delle soglie PlayStyle). */
export function tacticalFitMultiplier(fit: TacticalFit): number {
  if (fit === "ottimo") return 1 + TACTICAL_FIT_BONUS;
  if (fit === "scarso") return 1 - TACTICAL_FIT_PENALTY;
  return 1;
}
