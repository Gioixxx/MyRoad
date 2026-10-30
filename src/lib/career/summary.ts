import type { Club, ClubStint, Player, StatLine, Trophy } from "@/types/career";
import { cyclesAtClub } from "@/lib/shared/club-tenure";

export interface ClubSummary {
  club: Club;
  ageFrom: number;
  ageTo: number;
  stats: StatLine;
  /** Quanti cicli (non stagioni) separati sono stati passati a questo club — dal wiring "Due
   * classifiche" `clubHistory` ha una riga per stagione, quindi un solo ciclo Express (3
   * stagioni consecutive nello stesso club) non deve contare come "×3" spell separati. */
  stintCount: number;
}

function sumStats(a: StatLine, b: StatLine): StatLine {
  const result: StatLine = {
    apps: a.apps + b.apps,
    goals: a.goals + b.goals,
    assists: a.assists + b.assists,
  };
  if (a.goalsAgainst !== undefined || b.goalsAgainst !== undefined) {
    result.goalsAgainst = (a.goalsAgainst ?? 0) + (b.goalsAgainst ?? 0);
  }
  if (a.cleanSheets !== undefined || b.cleanSheets !== undefined) {
    result.cleanSheets = (a.cleanSheets ?? 0) + (b.cleanSheets ?? 0);
  }
  return result;
}

/**
 * Accorpa `clubHistory` per club (una riga per club, non per ciclo), sommando le statistiche
 * di eventuali cicli separati passati nello stesso club. Preserva l'ordine di prima apparizione.
 */
export function summarizeClubHistory(clubHistory: ClubStint[]): ClubSummary[] {
  const byClub = new Map<string, ClubSummary>();
  const order: string[] = [];

  for (const stint of clubHistory) {
    const existing = byClub.get(stint.club.id);
    if (existing) {
      existing.stats = sumStats(existing.stats, stint.stats);
      existing.ageTo = Math.max(existing.ageTo, stint.ageTo);
    } else {
      byClub.set(stint.club.id, {
        club: stint.club,
        ageFrom: stint.ageFrom,
        ageTo: stint.ageTo,
        stats: { ...stint.stats },
        stintCount: 0, // ricalcolato sotto per ciclo, non per riga
      });
      order.push(stint.club.id);
    }
  }

  for (const id of order) {
    byClub.get(id)!.stintCount = cyclesAtClub(clubHistory, id);
  }

  return order.map((id) => byClub.get(id)!);
}

/** OVR più alto raggiunto in carriera (storico dei cicli + valore attuale). */
export function peakOvr(player: Pick<Player, "ovr" | "clubHistory">): number {
  return Math.max(player.ovr, ...player.clubHistory.map((s) => s.ovr));
}

/** Una casella del nastro "anno per anno": la stagione iniziata a `age`. */
export interface RibbonSeason {
  age: number;
  club: Club;
  trophies: number;
}

/** Stagioni consecutive nello stesso club, per l'etichetta sotto il nastro. */
export interface RibbonSegment {
  club: Club;
  seasons: number;
}

export interface CareerRibbon {
  seasons: RibbonSeason[];
  segments: RibbonSegment[];
}

/**
 * Nastro della carriera, una casella per stagione nel club in cui è stata giocata. Una stint
 * copre le stagioni da `ageFrom` a `ageTo - 1` (una sola dal piano "Due classifiche", fino a tre
 * nei salvataggi precedenti); i trofei sono registrati all'età di fine stagione, quindi una
 * stagione iniziata a `age` conta quelli con `age + 1`.
 */
export function buildCareerRibbon(
  clubHistory: ClubStint[],
  trophies: Pick<Trophy, "age">[],
): CareerRibbon {
  const seasons: RibbonSeason[] = [];
  for (const stint of clubHistory) {
    const lastAge = Math.max(stint.ageFrom, stint.ageTo - 1);
    for (let age = stint.ageFrom; age <= lastAge; age++) {
      seasons.push({
        age,
        club: stint.club,
        trophies: trophies.filter((t) => t.age === age + 1).length,
      });
    }
  }

  const segments: RibbonSegment[] = [];
  for (const season of seasons) {
    const last = segments.at(-1);
    if (last && last.club.id === season.club.id) {
      last.seasons += 1;
    } else {
      segments.push({ club: season.club, seasons: 1 });
    }
  }

  return { seasons, segments };
}
