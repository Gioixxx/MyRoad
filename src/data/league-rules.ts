import { leagues, leagueForTier, type League } from "@/data/clubs";

/**
 * Regole astratte di un campionato per il motore posizione/zone (`lib/shared/league-season.ts`):
 * **non** derivate da `clubs.length` (il catalogo non è una rosa completa — es. la Championship
 * ha solo 7 club in dati contro le 24 "posizioni" reali) — la tua posizione `1..size` non richiede
 * di avere un club reale per ogni piazzamento, solo per chi promuove/retrocede davvero (vedi
 * `leagueForTier`, già usato dal vecchio `club-progression.ts`).
 */
export interface LeagueRules {
  size: number;
  /** Sempre 1. */
  titleSpots: number;
  /** Solo tier 1 (0 altrimenti). */
  continentalSpots: number;
  /** Solo tier > 1 (0 in tier 1: non c'è nulla sopra la massima divisione). */
  promotionSpots: number;
  /** 0 se non esiste un campionato modellato nel tier sotto, o per leghe che in realtà non
   * retrocedono mai (MLS/Liga MX/Canadian Premier League) anche se in futuro comparisse un
   * tier 2 in dati per quei paesi. */
  relegationSpots: number;
}

/** Leghe a tavolino unico, senza retrocessione per regola reale (non solo per assenza di dati). */
const NO_RELEGATION_LEAGUE_IDS = new Set(["mex-liga-mx", "usa-mls", "can-premier-league"]);

interface LeagueRuleOverride {
  size: number;
  continentalSpots?: number;
  promotionSpots?: number;
}

/**
 * Override espliciti per le leghe nominate nel piano "Due classifiche" ("Regole di default").
 * Tutte le altre leghe cadono nel default per tier (vedi `rulesFor`) — valori di partenza, da
 * ritarare con `npm run simulate`/`npm run coach-simulate` come ogni altra costante di
 * bilanciamento del progetto, non a tavolino.
 */
const LEAGUE_RULE_OVERRIDES: Record<string, LeagueRuleOverride> = {
  "ita-serie-a": { size: 20, continentalSpots: 7 },
  "eng-premier-league": { size: 20, continentalSpots: 7 },
  "esp-la-liga": { size: 20, continentalSpots: 7 },
  "fra-ligue-1": { size: 20, continentalSpots: 7 },
  "bra-serie-a": { size: 20, continentalSpots: 7 },
  "ger-bundesliga": { size: 18, continentalSpots: 6 },
  "ned-eredivisie": { size: 18, continentalSpots: 6 },
  "eng-championship": { size: 24, promotionSpots: 2 },
  "ita-serie-b": { size: 20, promotionSpots: 2 },
  "esp-laliga2": { size: 20, promotionSpots: 2 },
  "bra-serie-b": { size: 20, promotionSpots: 2 },
  "ita-serie-c": { size: 20, promotionSpots: 2 },
  "mex-liga-mx": { size: 20, continentalSpots: 4 },
  "usa-mls": { size: 20, continentalSpots: 4 },
  "can-premier-league": { size: 14, continentalSpots: 2 },
};

const DEFAULT_TIER1_SIZE = 20;
const DEFAULT_TIER1_CONTINENTAL_SPOTS = 5;
const DEFAULT_LOWER_TIER_SIZE = 20;
const DEFAULT_LOWER_TIER_PROMOTION_SPOTS = 2;
/** Larghezza di default della zona retrocessione, quando applicabile (vedi `relegationSpotsFor`). */
const DEFAULT_RELEGATION_SPOTS = 3;

function relegationSpotsFor(league: League): number {
  if (NO_RELEGATION_LEAGUE_IDS.has(league.id)) return 0;
  return leagueForTier(league.country, league.tier + 1) ? DEFAULT_RELEGATION_SPOTS : 0;
}

function rulesFor(league: League): LeagueRules {
  const override = LEAGUE_RULE_OVERRIDES[league.id];
  if (league.tier === 1) {
    return {
      size: override?.size ?? DEFAULT_TIER1_SIZE,
      titleSpots: 1,
      continentalSpots: override?.continentalSpots ?? DEFAULT_TIER1_CONTINENTAL_SPOTS,
      promotionSpots: 0,
      relegationSpots: relegationSpotsFor(league),
    };
  }
  return {
    size: override?.size ?? DEFAULT_LOWER_TIER_SIZE,
    titleSpots: 1,
    continentalSpots: 0,
    promotionSpots: override?.promotionSpots ?? DEFAULT_LOWER_TIER_PROMOTION_SPOTS,
    relegationSpots: relegationSpotsFor(league),
  };
}

const RULES_BY_LEAGUE_ID = new Map(leagues.map((league) => [league.id, rulesFor(league)]));

/** Regole del campionato per una `League` del catalogo (`data/clubs.ts`) — non un lookup per id
 * di stringa libera, così un refactor di `leagues` che rimuove/rinomina un id fa fallire subito
 * al primo utilizzo invece che silenziosamente a runtime. */
export function rulesForLeague(league: League): LeagueRules {
  const rules = RULES_BY_LEAGUE_ID.get(league.id);
  if (!rules) {
    throw new Error(`Regole di campionato mancanti per la lega: ${league.id}`);
  }
  return rules;
}
