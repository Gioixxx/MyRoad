import type { Club, RelationAffinity } from "@/types/career";
import type { Coach, CoachRelation, CoachRelationId } from "@/types/coach";
import { clampAffinity, pickName } from "@/lib/career/relations";
import { cyclesAtClub } from "@/lib/shared/club-tenure";

export const COACH_RELATION_LABELS: Record<CoachRelationId, string> = {
  board: "Società",
  press: "Stampa",
  captain: "Capitano",
  rival: "Rivale",
};

/** Hint visibile in UI: perché l'affinità di questo NPC conta, non un numero opaco. */
export const COACH_RELATION_HINTS: Record<CoachRelationId, string> = {
  board: "influenza la pazienza della società",
  press: "influenza le conferenze e il rischio mediatico",
  captain: "influenza i risultati di stagione",
  rival: "può scatenare uno scontro diretto",
};

/** Fiducia sotto la quale scatta la crisi, a società neutrale (affinità 0). */
export const SACK_WARNING_THRESHOLD_BASE = 30;
/** ±3% a affinità capitano ±2 — magnitudine contenuta, stesso ordine del fit tattico. */
export const CAPTAIN_SEASON_MULTIPLIER_STEP = 0.015;
/** 4 punti di soglia esonero per ogni scatto di affinità società. */
const BOARD_SACK_THRESHOLD_STEP = 4;

export function getCoachRelation(
  coach: Pick<Coach, "relations">,
  id: CoachRelationId,
): CoachRelation | undefined {
  return coach.relations.find((rel) => rel.id === id);
}

export function coachRelationAffinity(
  coach: Pick<Coach, "relations">,
  id: CoachRelationId,
): RelationAffinity {
  return getCoachRelation(coach, id)?.affinity ?? 0;
}

/** Moltiplicatore di stagione dallo spogliatoio (solo capitano): 0.97…1.03. */
export function relationsSeasonMultiplier(coach: Pick<Coach, "relations">): number {
  return 1 + coachRelationAffinity(coach, "captain") * CAPTAIN_SEASON_MULTIPLIER_STEP;
}

/** Soglia di fiducia sotto cui scatta la crisi: società amica alza la pazienza, ostile la taglia. */
export function sackWarningThreshold(coach: Pick<Coach, "relations">): number {
  return SACK_WARNING_THRESHOLD_BASE - coachRelationAffinity(coach, "board") * BOARD_SACK_THRESHOLD_STEP;
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
  const tenureCycles = cyclesAtClub(coach.clubHistory, club.id);
  if (coach.reputation < RIVAL_MIN_REPUTATION && tenureCycles < RIVAL_MIN_CYCLES_AT_CLUB) return coach;
  return {
    ...coach,
    relations: upsertCoachRelation(coach.relations, {
      id: "rival",
      name: pickName(`rival:${coach.lastName}:${club.id}`),
      affinity: 0,
    }),
  };
}
