import type { Trophy } from "@/types/career";

export interface TrophyBreakdownEntry {
  competition: string;
  count: number;
  /** true se vinto con la nazionale (Trophy.club === undefined) */
  isNational: boolean;
}

export interface AwardBreakdownEntry<T extends string> {
  type: T;
  count: number;
}

/**
 * Raggruppa i trofei per competizione, contando le ripetizioni. Ordine deterministico
 * (count desc, poi alfabetico) — usato sia per lo storage (classifica globale) sia per il
 * rendering, evita di dover riordinare lato client/DB.
 */
export function summarizeTrophies(trophies: Trophy[]): TrophyBreakdownEntry[] {
  const byCompetition = new Map<string, TrophyBreakdownEntry>();

  for (const trophy of trophies) {
    const existing = byCompetition.get(trophy.competition);
    if (existing) {
      existing.count += 1;
    } else {
      byCompetition.set(trophy.competition, {
        competition: trophy.competition,
        count: 1,
        isNational: trophy.club === undefined,
      });
    }
  }

  return [...byCompetition.values()].sort(
    (a, b) => b.count - a.count || a.competition.localeCompare(b.competition),
  );
}

/**
 * Raggruppa i premi per tipo, contando le ripetizioni. Generica su `type` per riuso identico tra
 * `Award[]` (calciatore, `AwardType`) e `CoachAward[]` (allenatore, `CoachAwardType`).
 */
export function summarizeAwards<T extends string>(awards: { type: T }[]): AwardBreakdownEntry<T>[] {
  const byType = new Map<T, AwardBreakdownEntry<T>>();

  for (const award of awards) {
    const existing = byType.get(award.type);
    if (existing) {
      existing.count += 1;
    } else {
      byType.set(award.type, { type: award.type, count: 1 });
    }
  }

  return [...byType.values()].sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
}
