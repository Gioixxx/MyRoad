import type { Club, Player, Relation, RelationAffinity, RelationId } from "@/types/career";

export const RELATION_LABELS: Record<RelationId, string> = {
  coach: "Mister",
  agent: "Agente",
  rival: "Rivale",
};

const FIRST_NAMES = [
  "Marco",
  "Luca",
  "Paolo",
  "Andrea",
  "Stefano",
  "Davide",
  "Gianni",
  "Roberto",
  "Alessio",
  "Matteo",
  "Fabio",
  "Enrico",
];

const LAST_NAMES = [
  "Bianchi",
  "Ferrari",
  "Conti",
  "Ricci",
  "Marchetti",
  "Galli",
  "Fontana",
  "Moretti",
  "Barbieri",
  "Greco",
  "Costa",
  "Lombardi",
];

const RIVAL_MIN_OVR = 78;
const RIVAL_MIN_CYCLES_AT_CLUB = 4;

export function fnv1a(seed: string): number {
  const FNV_OFFSET_BASIS = 0x811c9dc5;
  const FNV_PRIME = 0x01000193;
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

export function pickName(seed: string): string {
  const hash = fnv1a(seed);
  const first = FIRST_NAMES[hash % FIRST_NAMES.length];
  const last = LAST_NAMES[(hash >>> 8) % LAST_NAMES.length];
  return `${first} ${last}`;
}

export function coachNameForClub(clubId: string): string {
  return pickName(`coach:${clubId}`);
}

export function agentNameForPlayer(lastName: string, nationality: string): string {
  return pickName(`agent:${lastName}:${nationality}`);
}

export function rivalNameFor(lastName: string, clubId: string): string {
  return pickName(`rival:${lastName}:${clubId}`);
}

export function clampAffinity(value: number): RelationAffinity {
  if (value <= -2) return -2;
  if (value >= 2) return 2;
  if (value <= -1) return -1;
  if (value >= 1) return 1;
  return 0;
}

export function getRelation(player: Pick<Player, "relations">, id: RelationId): Relation | undefined {
  return (player.relations ?? []).find((rel) => rel.id === id);
}

export function upsertRelation(relations: Relation[], next: Relation): Relation[] {
  const without = relations.filter((rel) => rel.id !== next.id);
  return [...without, next];
}

export function applyRelationsDelta(
  relations: Relation[],
  delta: Partial<Record<RelationId, number>>,
): Relation[] {
  return relations.map((rel) => {
    const shift = delta[rel.id];
    if (shift === undefined || shift === 0) return rel;
    return { ...rel, affinity: clampAffinity(rel.affinity + shift) };
  });
}

export function initialAgentRelation(lastName: string, nationality: string): Relation {
  return { id: "agent", name: agentNameForPlayer(lastName, nationality), affinity: 0 };
}

export function coachRelationForClub(club: Pick<Club, "id">): Relation {
  return { id: "coach", name: coachNameForClub(club.id), affinity: 0 };
}

/** Agente se manca (save pre-v14); mister se c'è un club e non è ancora in lista. */
export function ensureCoreRelations(player: Player): Player {
  let relations = [...(player.relations ?? [])];
  let changed = relations.length !== (player.relations?.length ?? 0);
  if (!relations.some((rel) => rel.id === "agent")) {
    relations = upsertRelation(relations, initialAgentRelation(player.lastName, player.nationality));
    changed = true;
  }
  if (player.club && !relations.some((rel) => rel.id === "coach")) {
    relations = upsertRelation(relations, coachRelationForClub(player.club));
    changed = true;
  }
  if (!changed) return player;
  return { ...player, relations };
}

/** Agente se manca (save pre-v14); mister nuovo a ogni cambio club. */
export function relationsOnSign(player: Player, club: Club, isNewClub: boolean): Relation[] {
  let relations = [...(player.relations ?? [])];
  if (!relations.some((rel) => rel.id === "agent")) {
    relations = upsertRelation(relations, initialAgentRelation(player.lastName, player.nationality));
  }
  if (isNewClub) {
    relations = upsertRelation(relations, coachRelationForClub(club));
  }
  return relations;
}

export function maybeSpawnRival(player: Player): Player {
  if (getRelation(player, "rival")) return player;
  if (!player.club) return player;
  const cyclesAtClub = player.clubHistory.filter((stint) => stint.club.id === player.club!.id).length;
  if (player.ovr < RIVAL_MIN_OVR && cyclesAtClub < RIVAL_MIN_CYCLES_AT_CLUB) return player;
  return {
    ...player,
    relations: upsertRelation(player.relations ?? [], {
      id: "rival",
      name: rivalNameFor(player.lastName, player.club.id),
      affinity: 0,
    }),
  };
}

export function formatAffinity(affinity: RelationAffinity): string {
  if (affinity > 0) return `+${affinity}`;
  return String(affinity);
}
