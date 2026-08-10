import type { Award, AwardType, Club, Player, StatLine, Trophy } from "@/types/career";
import type { Confederation } from "@/data/countries";
import { clamp, type Rng } from "./progression";
import { shadowMultiplier } from "./shadow";

const CONFEDERATION_TOURNAMENT: Record<Confederation, string> = {
  UEFA: "Europei",
  CONMEBOL: "Copa América",
  CONCACAF: "CONCACAF Gold Cup",
  CAF: "Africa Cup of Nations",
  AFC: "AFC Asian Cup",
};

/**
 * Probabilità di vincere una competizione di club in un ciclo, in base al prestigio del club
 * e all'OVR del giocatore (una squadra con un fenomeno vince di più). Deliberatamente più
 * generosa dell'originale — nel gioco originale i trofei restavano rari anche con club di
 * prestigio massimo, il che li rendeva poco "sentiti" (vedi piano, esplorazione aggiuntiva 3).
 */
const CLUB_TROPHY_PRESTIGE_WEIGHT = 0.03;
const CLUB_TROPHY_OVR_BASELINE = 60;
const CLUB_TROPHY_OVR_DIVISOR = 350;
const CLUB_TROPHY_OVR_BONUS_CAP = 0.08;
const CLUB_TROPHY_CHANCE_CAP = 0.3;

export function clubTrophyChance(prestige: number, ovr: number): number {
  const base = prestige * CLUB_TROPHY_PRESTIGE_WEIGHT;
  const ovrBonus = clamp((ovr - CLUB_TROPHY_OVR_BASELINE) / CLUB_TROPHY_OVR_DIVISOR, 0, CLUB_TROPHY_OVR_BONUS_CAP);
  return clamp(base + ovrBonus, 0, CLUB_TROPHY_CHANCE_CAP);
}

/** Probabilità della coppa nazionale relativa a quella del campionato — meno prestigiosa, quindi più rara. */
const CUP_TROPHY_RELATIVE_CHANCE = 0.7;

/** Estrae i trofei di campionato/coppa nazionale vinti in un ciclo al club corrente.
 * `trophyChanceBonus` (default 0, punti percentuali additivi) è pensato per il playstyle
 * "Muro difensivo". */
export function rollClubTrophies(
  club: Club,
  ovr: number,
  age: number,
  rng: Rng = Math.random,
  trophyChanceBonus = 0,
): Trophy[] {
  const trophies: Trophy[] = [];
  const chance = clamp(clubTrophyChance(club.prestige, ovr) + trophyChanceBonus, 0, 1);

  if (rng() < chance) {
    trophies.push({ competition: club.competitions.league, club, age });
  }
  if (club.competitions.cup && rng() < chance * CUP_TROPHY_RELATIVE_CHANCE) {
    trophies.push({ competition: club.competitions.cup, club, age });
  }
  return trophies;
}

const NATIONAL_TOURNAMENT_OVR_BASELINE = 80;
const NATIONAL_TOURNAMENT_OVR_DIVISOR = 70;
const NATIONAL_TOURNAMENT_CHANCE_CAP = 0.2;

/** Probabilità di vincere il torneo internazionale con la nazionale in un ciclo da convocato. */
export function nationalTournamentWinChance(ovr: number): number {
  return clamp(
    (ovr - NATIONAL_TOURNAMENT_OVR_BASELINE) / NATIONAL_TOURNAMENT_OVR_DIVISOR,
    0,
    NATIONAL_TOURNAMENT_CHANCE_CAP,
  );
}

/**
 * Estrae i trofei di nazionale vinti in un ciclo da convocato — Mondiale e coppa di
 * confederazione sono indipendenti tra loro (nell'originale non sono mai stati osservati come
 * alternativi: un giocatore può vincere entrambi nella stessa carriera, anche nello stesso
 * ciclo, vedi piano esplorazione aggiuntiva 4).
 */
export function rollNationalTrophies(
  called: boolean,
  ovr: number,
  age: number,
  confederation: Confederation = "UEFA",
  rng: Rng = Math.random,
): Trophy[] {
  if (!called) return [];
  const chance = nationalTournamentWinChance(ovr);
  const trophies: Trophy[] = [];
  if (rng() < chance) {
    trophies.push({ competition: "Mondiale", club: undefined, age });
  }
  if (rng() < chance) {
    trophies.push({ competition: CONFEDERATION_TOURNAMENT[confederation], club: undefined, age });
  }
  return trophies;
}

const TOP_SCORER_GOALS_THRESHOLD = 15;
const BALLON_DOR_OVR_THRESHOLD = 90;

/**
 * Probabilità di un award individuale nel ciclo — deliberatamente più generosa dell'originale,
 * dove restano irraggiungibili anche a OVR 88 con carriera leggendaria e titoli internazionali
 * (osservato su ~14 playthrough, vedi piano, esplorazione aggiuntiva 3).
 */
const AWARD_OVR_BASELINE = 84;
const AWARD_OVR_DIVISOR = 20;
const AWARD_CHANCE_CAP = 0.6;

export function awardChance(ovr: number): number {
  if (ovr < AWARD_OVR_BASELINE) return 0;
  return clamp((ovr - AWARD_OVR_BASELINE) / AWARD_OVR_DIVISOR, 0, AWARD_CHANCE_CAP);
}

const TOP_SCORER_ROLL_CHANCE = 0.5;
const BALLON_DOR_ROLL_CHANCE = 0.3;

export function rollAward(
  player: Pick<Player, "ovr" | "club" | "shadow">,
  seasonStats: StatLine,
  age: number,
  rng: Rng = Math.random,
): Award | null {
  if (rng() >= awardChance(player.ovr) * shadowMultiplier(player.shadow)) return null;

  const club = player.club ?? undefined;
  let type: AwardType = "player-of-the-season";
  if (seasonStats.goals >= TOP_SCORER_GOALS_THRESHOLD && rng() < TOP_SCORER_ROLL_CHANCE) {
    type = "top-scorer";
  } else if (player.ovr >= BALLON_DOR_OVR_THRESHOLD && rng() < BALLON_DOR_ROLL_CHANCE) {
    type = "ballon-dor";
  }

  return { type, age, club };
}
