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
 * comparabile a parità di prestigio/rating relativo.
 *
 * **Abbassato da 0.55 nella taratura Fase 4 del piano "Due classifiche"**: con 0.55, un club di
 * prestigio 3 e un giocatore/allenatore già forte (rating ~85) aveva un `expectedPosition` così
 * vicino al vertice (~2 su una lega da 20) che il titolo restava sopra il 40% a stagione per
 * QUALUNQUE `POSITION_NOISE_SPREAD` testato (0.2-2.0, vedi debug ad-hoc rimosso a fine sessione)
 * — non un problema di rumore ma di `expectedPosition` troppo ridotto a "distanza 1" dal vertice,
 * dove l'arrotondamento+clamp assorbe strutturalmente circa metà della massa di probabilità sulla
 * posizione 1 a prescindere dallo spread. A 0.4 lo stesso club/rating atterra su
 * `expectedPosition` ~4 (non ~2), portando il titolo/stagione al 15-25% indicato dal piano per un
 * club di prestigio 3 mantenendo `POSITION_NOISE_SPREAD` invariato (0.5). Prestigio 0 non tocca
 * questo termine (il peso moltiplica solo il prestigio) quindi il rischio di retrocessione a
 * prestigio basso resta quello di prima. Vedi `.claude/memory/decisions.md` per il dettaglio. */
const EXPECTED_FINISH_PRESTIGE_WEIGHT = 0.4;
const EXPECTED_FINISH_RATING_DIVISOR = 40;

/** Rank atteso continuo (0-4, non ancora discretizzato in una zona) per un club di un dato
 * prestigio, in base al "rating" di chi lo guida in campo/panchina. Input di `rollLeaguePosition`
 * insieme a `LeagueRules`. */
export function expectedLeagueFinishRank(prestige: number, rating: number): number {
  return prestige * EXPECTED_FINISH_PRESTIGE_WEIGHT + rating / EXPECTED_FINISH_RATING_DIVISOR;
}

/** Spread del rumore di posizione, come frazione di `rules.size` — confermato a 0.5 (valore
 * iniziale) nella taratura Fase 4: il problema del titolo troppo frequente per i club di
 * prestigio 3 (vedi `EXPECTED_FINISH_PRESTIGE_WEIGHT` sopra) non dipendeva da questo spread, che
 * quindi non è stato toccato. Resta un sigma globale, non calibrato per `size` di lega come
 * suggerito dal piano (un campionato da 24 con 2 posti promozione ha una zona molto più stretta
 * di uno da 20 con 7 posti Europa) — con questo spread la promozione da leghe a 24 squadre (es.
 * Championship) resta raggiungibile solo per prestigio/rating già alti per lo standard di quella
 * categoria, non un vero difetto ma un residuo di calibrazione più fine lasciato per una sessione
 * futura se emergesse un problema concreto in game (vedi `.claude/memory/tech-debt.md`). */
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
