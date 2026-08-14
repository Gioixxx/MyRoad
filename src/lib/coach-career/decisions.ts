import type { Club } from "@/types/career";
import type {
  Coach,
  CoachDecision,
  CoachDecisionOption,
  CoachDecisionOutcome,
  CoachDelta,
  LeagueFinish,
} from "@/types/coach";
import { clamp, type Rng } from "@/lib/career/progression";
import { clubs } from "@/data/clubs";
import { TACTICAL_SYSTEM_LABELS, type TacticalSystem } from "@/lib/career/tactics";
import { expectedLeagueFinishRank, LEAGUE_FINISH_ORDER } from "./season-outcome";
import { rollCoachCycleObjective } from "./coach-satisfaction";

function outcome(weight: number, resultText: string, extra?: Partial<CoachDelta>): CoachDecisionOutcome {
  return { weight, effect: { ...extra }, resultText };
}

function signOption(id: string, label: string, club: Club, resultText: string): CoachDecisionOption {
  return { id, label, club, outcomes: [outcome(100, resultText)] };
}

function withHint(option: CoachDecisionOption, hint: string): CoachDecisionOption {
  return { ...option, hint };
}

/** Fascia di prestigio club a cui l'allenatore può ambire in base alla reputazione — stesso
 * ruolo di `targetPrestige(ovr)` per il calciatore, soglie proprie perché la reputazione parte
 * da 35 (non 50) e cresce più lentamente. */
function coachTargetPrestige(reputation: number): number {
  if (reputation >= 85) return 3;
  if (reputation >= 65) return 2;
  if (reputation >= 45) return 1;
  return 0;
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Pool di club coerenti con la reputazione corrente (±1 fascia di prestigio); se la fascia
 * attesa non ha club disponibili (es. `minPrestige` più alto della fascia stessa), allarga a
 * qualunque club per non lasciare mai un job-search/end-of-cycle senza offerte. */
function eligibleClubs(reputation: number, excludeId?: string, minPrestige = 0): Club[] {
  const target = Math.max(coachTargetPrestige(reputation), minPrestige);
  const pool = clubs.filter(
    (c) => c.id !== excludeId && c.prestige >= minPrestige && Math.abs(c.prestige - target) <= 1,
  );
  if (pool.length > 0) return pool;
  return clubs.filter((c) => c.id !== excludeId && c.prestige >= minPrestige);
}

function pickClubs(pool: Club[], count: number, rng: Rng): Club[] {
  return shuffle(pool, rng).slice(0, count);
}

const LEAGUE_FINISH_SHORT_LABELS: Record<LeagueFinish, string> = {
  relegated: "Rischio retrocessione",
  "relegation-battle": "Lotta salvezza",
  "mid-table": "Piazzamento tranquillo",
  "continental-qualification": "Corsa europea",
  title: "Corsa al titolo",
};

/** Anticipazione (solo UI) del livello di pressione atteso a un club, senza esporre la formula. */
function offerHint(club: Club, reputation: number): string {
  const rank = clamp(Math.round(expectedLeagueFinishRank(club.prestige, reputation)), 0, 4);
  return `Ci si aspetta: ${LEAGUE_FINISH_SHORT_LABELS[LEAGUE_FINISH_ORDER[rank]]}`;
}

const JOB_SEARCH_OFFERS = 3;

/**
 * Offerte di lavoro — forzata quando `coach.club === null` (mirror di `!player.club` calciatore).
 * A differenza del calciatore non esiste un'opzione "resta svincolato": la lista di club
 * eleggibili non è mai vuota (fallback su tutti i club se la fascia di prestigio attesa non ha
 * candidati), quindi si sceglie sempre un club concreto.
 */
export function generateJobOffers(coach: Coach, rng: Rng = Math.random): CoachDecision {
  const offers = pickClubs(eligibleClubs(coach.reputation), JOB_SEARCH_OFFERS, rng);
  return {
    id: `job-search-${coach.age}`,
    category: "job-search",
    title: "Offerte di lavoro",
    description: "Sei svincolato. Quale panchina accetti?",
    options: offers.map((c) =>
      withHint(signOption(`sign-${c.id}`, `Firma per ${c.name}`, c, `Firmi per il ${c.name}.`), offerHint(c, coach.reputation)),
    ),
  };
}

const END_OF_CYCLE_OFFERS = 2;

/** Fine ciclo: rinnova, cerca un club più grande, o ritirati — richiede un club corrente (mirror
 * esatto di `generateEndOfCycle` calciatore). */
export function generateCoachEndOfCycle(coach: Coach, rng: Rng = Math.random): CoachDecision {
  if (!coach.club) {
    throw new Error("generateCoachEndOfCycle richiede un club corrente");
  }
  const club = coach.club;
  const offers = pickClubs(eligibleClubs(coach.reputation, club.id, club.prestige), END_OF_CYCLE_OFFERS, rng);

  return {
    id: `end-of-cycle-${coach.age}`,
    category: "end-of-cycle",
    title: "Fine ciclo",
    description: "Il contratto è in scadenza. Scegli il prossimo passo della carriera.",
    options: [
      {
        id: "renew",
        label: `Rinnova con il ${club.name}`,
        hint: "Resti alla guida del club, nessun nuovo mandato societario",
        outcomes: [outcome(100, "La società ti conferma alla guida del club.", { popularityDelta: 1 })],
      },
      ...offers.map((c) =>
        withHint(
          signOption(`sign-${c.id}`, `Firma per ${c.name}`, c, `Lasci il ${club.name} e firmi per il ${c.name}.`),
          offerHint(c, coach.reputation),
        ),
      ),
      {
        id: "retire",
        label: "Ritirati",
        retire: true,
        outcomes: [outcome(100, "Chiudi la carriera da allenatore.")],
      },
    ],
  };
}

/**
 * Brief societario per il ciclo — un'unica opzione (mirror concettuale di come il calciatore
 * riceve `currentObjective` come roll automatico a fine ciclo, reso qui un evento a sé stante per
 * dare peso narrativo alla pressione societaria). L'obiettivo mostrato è deterministico
 * (`rollCoachCycleObjective` non usa RNG), quindi il testo generato qui e l'obiettivo
 * effettivamente impostato da `resolveCoachCycle` restano sempre coerenti.
 */
export function generateBoardBrief(coach: Coach): CoachDecision {
  if (!coach.club) {
    throw new Error("generateBoardBrief richiede un club corrente");
  }
  const objective = rollCoachCycleObjective(coach.club, coach.reputation);
  return {
    id: `board-brief-${coach.age}`,
    category: "board-brief",
    title: "Il brief della società",
    description: objective.label,
    options: [
      {
        id: "accept-brief",
        label: "Accetta il brief",
        outcomes: [outcome(100, "Prendi nota dell'obiettivo stagionale della società.")],
      },
    ],
  };
}

const TACTICAL_SYSTEMS: TacticalSystem[] = ["possesso", "pressing", "contropiede", "diretto"];

/** Identità tattica dell'allenatore — mirror di `generateTrainingFocusDecision` calciatore. */
export function generateTacticalIdentityDecision(coach: Coach): CoachDecision {
  const options: CoachDecisionOption[] = TACTICAL_SYSTEMS.map((system) => ({
    id: `system-${system}`,
    label: `Adotta: ${TACTICAL_SYSTEM_LABELS[system]}`,
    hint: system === coach.preferredSystem ? "Identità attuale" : "Cambia identità tattica",
    newSystem: system,
    outcomes: [outcome(100, `Adotti ${TACTICAL_SYSTEM_LABELS[system]} come identità di gioco.`)],
  }));
  return {
    id: `tactical-identity-${coach.age}`,
    category: "tactical-identity",
    title: "Identità tattica",
    description: "Che impronta tattica vuoi dare alla squadra nel prossimo ciclo?",
    options,
  };
}
