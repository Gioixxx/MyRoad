import type { ArchetypeId, ArchivedCareer } from "@/types/career";
import type { Coach } from "@/types/coach";
import { clamp } from "@/lib/career/progression";
import { applyTraitsDelta, NEUTRAL_TRAITS } from "@/lib/career/traits";
import { COACH_STARTING_REPUTATION } from "./engine";

/** Soglia decisa dall'utente in fase di design: solo un calciatore che ha raggiunto un OVR di
 * picco molto alto sblocca l'opzione "Inizia carriera da allenatore" nell'archivio. */
export const COACH_CONTINUITY_MIN_PEAK_OVR = 80;

export function isEligibleForCoachContinuity(entry: Pick<ArchivedCareer, "peakOvr">): boolean {
  return entry.peakOvr >= COACH_CONTINUITY_MIN_PEAK_OVR;
}

/** Nudge fisso per archetipo dominante — un ex "Bandiera" parte con lealtà più alta della norma,
 * ecc. Approssimato di proposito: `ArchivedCareer` salva solo l'archetipo derivato, non i 5
 * vettori grezzi, e portarli avanti richiederebbe un campo nuovo + bump di `ARCHIVE_VERSION` per
 * una feature non ancora costruita — inutile churn su un formato di save già in produzione. */
const ARCHETYPE_TRAIT_NUDGE: Partial<Record<ArchetypeId, Partial<Coach["traits"]>>> = {
  flagbearer: { loyalty: 15 },
  mercenary: { ambition: 15, loyalty: -10 },
  showman: { showmanship: 15 },
  pro: { discipline: 15 },
  leader: { leadership: 15 },
  problem: { discipline: -10, showmanship: 10 },
};

function nudgeTraitsFromArchetype(archetypeId?: ArchetypeId): Coach["traits"] {
  const nudge = archetypeId ? ARCHETYPE_TRAIT_NUDGE[archetypeId] : undefined;
  return nudge ? applyTraitsDelta(NEUTRAL_TRAITS, nudge) : NEUTRAL_TRAITS;
}

const PEAK_OVR_REPUTATION_BONUS_DIVISOR = 4;
const PEAK_OVR_REPUTATION_BONUS_BASELINE = 70;
const PEAK_OVR_REPUTATION_BONUS_CAP = 10;
const TROPHY_REPUTATION_BONUS = 3;

/**
 * Seed parziale per una carriera da allenatore continuata da un calciatore ritirato: patrimonio e
 * popolarità ereditati 1:1, età di partenza = età di ritiro del calciatore (non
 * `COACH_STARTING_AGE`), reputazione leggermente più alta per chi ha avuto una grande carriera da
 * giocatore (mai automaticamente élite in panchina). Identità (cognome/nazionalità/sistema
 * tattico preferito) resta raccolta nel normale step di creazione allenatore, solo precompilata
 * dal seed — non fa parte di questo oggetto.
 */
export function seedCoachFromArchivedCareer(entry: ArchivedCareer): Partial<Coach> {
  const peakOvrBonus = clamp(
    (entry.peakOvr - PEAK_OVR_REPUTATION_BONUS_BASELINE) / PEAK_OVR_REPUTATION_BONUS_DIVISOR,
    0,
    PEAK_OVR_REPUTATION_BONUS_CAP,
  );
  const trophyBonus = entry.trophyCount > 0 ? TROPHY_REPUTATION_BONUS : 0;

  return {
    age: entry.retiredAge,
    popularity: entry.finalPopularity,
    wallet: { salaryEurPerCycle: 0, savingsEur: entry.finalSavingsEur },
    reputation: Math.round(clamp(COACH_STARTING_REPUTATION + peakOvrBonus + trophyBonus, 1, 99)),
    traits: nudgeTraitsFromArchetype(entry.archetypeId),
  };
}
