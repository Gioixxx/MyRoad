import type { Club } from "@/types/career";
import type { Coach, CoachRelation, CoachRelationId } from "@/types/coach";
import { clampAffinity, pickName } from "@/lib/career/relations";

export const COACH_RELATION_LABELS: Record<CoachRelationId, string> = {
  board: "Società",
  press: "Stampa",
  captain: "Capitano",
  rival: "Rivale",
};

export function getCoachRelation(
  coach: Pick<Coach, "relations">,
  id: CoachRelationId,
): CoachRelation | undefined {
  return coach.relations.find((rel) => rel.id === id);
}

export function upsertCoachRelation(relations: CoachRelation[], next: CoachRelation): CoachRelation[] {
  return [...relations.filter((rel) => rel.id !== next.id), next];
}

export function applyCoachRelationsDelta(
  relations: CoachRelation[],
  delta: Partial<Record<CoachRelationId, number>>,
): CoachRelation[] {
  return relations.map((rel) => {
    const shift = delta[rel.id];
    if (shift === undefined || shift === 0) return rel;
    return { ...rel, affinity: clampAffinity(rel.affinity + shift) };
  });
}

/**
 * Relazioni all'assunzione in un nuovo incarico: società/stampa/capitano sempre nuovi (questa
 * funzione va chiamata solo su un vero cambio di club — il rinnovo con lo stesso club non passa
 * da qui, vedi `signWithClub` in `lib/coach-career/engine.ts`), rivale preservato se già
 * esistente (segue la carriera, non il club che si lascia).
 */
export function relationsOnNewJob(coach: Pick<Coach, "relations">, club: Pick<Club, "id">): CoachRelation[] {
  const existingRival = getCoachRelation(coach, "rival");
  const relations: CoachRelation[] = [
    { id: "board", name: pickName(`board:${club.id}`), affinity: 0 },
    { id: "press", name: pickName(`press:${club.id}`), affinity: 0 },
    { id: "captain", name: pickName(`captain:${club.id}`), affinity: 0 },
  ];
  return existingRival ? [...relations, existingRival] : relations;
}

const RIVAL_MIN_REPUTATION = 65;
const RIVAL_MIN_CYCLES_AT_CLUB = 3;

/** Spawna un rivale se la reputazione è alta o si è rimasti abbastanza a lungo allo stesso club —
 * mirror di `maybeSpawnRival` calciatore, scalato sulla reputazione (parte da 35, non 50 come
 * l'OVR di partenza del calciatore). */
export function maybeSpawnCoachRival(coach: Coach): Coach {
  if (getCoachRelation(coach, "rival")) return coach;
  if (!coach.club) return coach;
  const club = coach.club;
  const cyclesAtClub = coach.clubHistory.filter((stint) => stint.club.id === club.id).length;
  if (coach.reputation < RIVAL_MIN_REPUTATION && cyclesAtClub < RIVAL_MIN_CYCLES_AT_CLUB) return coach;
  return {
    ...coach,
    relations: upsertCoachRelation(coach.relations, {
      id: "rival",
      name: pickName(`rival:${coach.lastName}:${club.id}`),
      affinity: 0,
    }),
  };
}
