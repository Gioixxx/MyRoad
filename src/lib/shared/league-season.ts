import type { Club } from "@/types/career";
import { continentalCompetition, leagueForTier, type League } from "@/data/clubs";
import { rulesForLeague, type LeagueRules } from "@/data/league-rules";

export type { LeagueRules } from "@/data/league-rules";
export { rulesForLeague };

export type Rng = () => number;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export type LeagueZone =
  | "title"
  | "continental"
  | "promotion"
  | "mid-table"
  | "relegation-battle"
  | "relegated";

/** Punti di "rank atteso" per stella di prestigio del club — condiviso tra i due motori
 * (calciatore/allenatore), ognuno passa la propria nozione di "rating" (OVR per il calciatore,
 * reputazione per l'allenatore) sullo stesso divisore, così le due carriere si comportano in modo
 * comparabile a parità di prestigio/rating relativo. */
const EXPECTED_FINISH_PRESTIGE_WEIGHT = 0.55;
const EXPECTED_FINISH_RATING_DIVISOR = 40;

/** Rank atteso continuo (0-4, non ancora discretizzato in una zona) per un club di un dato
 * prestigio, in base al "rating" di chi lo guida in campo/panchina. Input di `rollLeaguePosition`
 * insieme a `LeagueRules`. */
export function expectedLeagueFinishRank(prestige: number, rating: number): number {
  return prestige * EXPECTED_FINISH_PRESTIGE_WEIGHT + rating / EXPECTED_FINISH_RATING_DIVISOR;
}

/** Spread del rumore di posizione, come frazione di `rules.size` — valore iniziale, da ritarare
 * con `npm run simulate`/`npm run coach-simulate` per fascia di prestigio e per `size` (un
 * campionato da 24 squadre non si comporta come uno da 18 a parità di sigma, vedi piano "Due
 * classifiche"). */
const POSITION_NOISE_SPREAD = 0.5;

/**
 * Tira il piazzamento finale (1 = primo posto, `rules.size` = ultimo) a partire da un rank atteso
 * continuo 0-4 (stessa scala di `expectedLeagueFinishRank`/`baseExpectedRank` già usate per
 * l'allenatore in `season-outcome.ts`/`engine.ts` — 4 = ai vertici, 0 = ultimi): qui la scala
 * viene invertita e riscalata su una posizione, con rumore espresso in **posti**, non in fasce
 * 0-4 come il vecchio rank continuo.
 */
export function rollLeaguePosition(expectedRank04: number, rules: LeagueRules, rng: Rng = Math.random): number {
  const expectedFraction = 1 - clamp(expectedRank04, 0, 4) / 4; // 0 = vertici, 1 = fondo classifica
  const expectedPosition = 1 + expectedFraction * (rules.size - 1);
  const noiseSpread = rules.size * POSITION_NOISE_SPREAD;
  const noise = (rng() - 0.5) * noiseSpread;
  return Math.round(clamp(expectedPosition + noise, 1, rules.size));
}

/** Zona di una posizione nel campionato — `continental` e `promotion` sono mutuamente esclusive
 * per costruzione (solo una delle due ha larghezza > 0 in ogni `LeagueRules`, vedi
 * `data/league-rules.ts`). Il piazzamento 1 è sempre `title`, anche in tier > 1 (vince comunque
 * il campionato di categoria) — chi consuma questa zona per decidere la promozione deve trattare
 * `title` e `promotion` insieme quando `club.tier > 1` (vedi `applySeasonToClub`). */
export function zoneForPosition(position: number, rules: LeagueRules): LeagueZone {
  if (position <= rules.titleSpots) return "title";
  // `continentalSpots`/`promotionSpots` sono conteggi totali che includono già il 1° posto (es.
  // "Europa 1-7", "promozione primi 2" nel piano) — il confine non si somma a `titleSpots`.
  if (rules.continentalSpots > 0 && position <= rules.continentalSpots) {
    return "continental";
  }
  if (rules.promotionSpots > 0 && position <= rules.promotionSpots) {
    return "promotion";
  }
  if (rules.relegationSpots > 0) {
    const relegationZoneStart = rules.size - rules.relegationSpots + 1;
    if (position >= relegationZoneStart) {
      const relegatedCount = Math.ceil(rules.relegationSpots / 2);
      const relegatedStart = rules.size - relegatedCount + 1;
      return position >= relegatedStart ? "relegated" : "relegation-battle";
    }
  }
  return "mid-table";
}

function rebuildClubForLeague(club: Club, league: League): Club {
  return {
    ...club,
    tier: league.tier,
    competitions: {
      league: league.name,
      cup: league.cup,
      continental: continentalCompetition(league, club.prestige),
    },
  };
}

export interface SeasonClubMovement {
  club: Club;
  change: "promoted" | "relegated" | null;
}

/**
 * Applica l'esito di una stagione (zona) al club del giocatore/allenatore — sempre deterministico
 * dalla zona, **niente secondo roll indipendente** come nel vecchio `applyClubTierMovement`
 * calciatore (`lib/career/club-progression.ts`, superato da questa funzione nella fase di wiring).
 *
 * Promozione: zona `title` o `promotion` con `club.tier > 1` (in tier 1 non c'è nulla sopra).
 * Retrocessione: zona `relegated`. In entrambi i casi no-op silenzioso se il tier di destinazione
 * non è modellato in `data/clubs.ts` (stesso comportamento di `leagueForTier` oggi).
 *
 * **Deliberatamente non tocca l'accesso alla coppa continentale**: resta derivato dal prestigio
 * come oggi (`continentalCompetition` nel catalogo statico), sempre attivo per un club di tier 1,
 * non legato al piazzamento della singola stagione. Renderlo "guadagnato" stagione per stagione
 * (idea iniziale, poi scartata in fase di implementazione) avrebbe reso quasi sempre `false` il
 * gate `player.club?.competitions.continental` che decide se l'evento forzato "finale
 * continentale" può scattare — un effetto a catena ben più grande dello scopo di questa funzione
 * (solo promozione/retrocessione), non richiesto esplicitamente dal piano "Due classifiche".
 */
export function applySeasonToClub(club: Club, zone: LeagueZone): SeasonClubMovement {
  if ((zone === "title" || zone === "promotion") && club.tier > 1) {
    const upperTier = leagueForTier(club.country, club.tier - 1);
    if (upperTier) {
      return { club: rebuildClubForLeague(club, upperTier), change: "promoted" };
    }
  }
  if (zone === "relegated") {
    const lowerTier = leagueForTier(club.country, club.tier + 1);
    if (lowerTier) {
      return { club: rebuildClubForLeague(club, lowerTier), change: "relegated" };
    }
  }
  return { club, change: null };
}
