import { describe, expect, it } from "vitest";
import { getClub, leagueForTier } from "@/data/clubs";
import { rulesForLeague } from "@/data/league-rules";
import { applySeasonToClub, rollLeaguePosition, zoneForPosition } from "./league-season";

const SERIE_A = leagueForTier("Italy", 1)!;
const SERIE_B = leagueForTier("Italy", 2)!;
const SERIE_C = leagueForTier("Italy", 3)!;
const CHAMPIONSHIP = leagueForTier("England", 2)!;
const MLS = leagueForTier("United States", 1)!;

const TORINO = getClub("torino")!; // Serie A (tier 1), prestige 1
const SAMPDORIA = getClub("sampdoria")!; // Serie B (tier 2), prestige 1
const WEST_HAM = getClub("west-ham")!; // Championship, unico tier modellato per l'Inghilterra sotto la Premier
const LA_GALAXY = getClub("la-galaxy")!; // MLS, niente retrocessione per regola reale

describe("rulesForLeague", () => {
  it("Serie A: 20 posti, 7 europei, nessuna promozione, retrocessione (Serie C esiste per B, non per A ma la B c'è)", () => {
    const rules = rulesForLeague(SERIE_A);
    expect(rules).toEqual({ size: 20, titleSpots: 1, continentalSpots: 7, promotionSpots: 0, relegationSpots: 3 });
  });

  it("Serie B: 20 posti, 2 promozioni, nessun posto europeo, retrocessione perché la Serie C esiste", () => {
    const rules = rulesForLeague(SERIE_B);
    expect(rules).toEqual({ size: 20, titleSpots: 1, continentalSpots: 0, promotionSpots: 2, relegationSpots: 3 });
  });

  it("Serie C: nessuna retrocessione perché non esiste un quarto tier modellato", () => {
    const rules = rulesForLeague(SERIE_C);
    expect(rules.relegationSpots).toBe(0);
    expect(rules.promotionSpots).toBe(2);
  });

  it("Championship: 24 posti, 2 promozioni, zero posti europei — non è un tier 1", () => {
    const rules = rulesForLeague(CHAMPIONSHIP);
    expect(rules).toEqual({ size: 24, titleSpots: 1, continentalSpots: 0, promotionSpots: 2, relegationSpots: 0 });
  });

  it("MLS: nessuna retrocessione per regola reale, non solo per assenza di dati", () => {
    const rules = rulesForLeague(MLS);
    expect(rules.relegationSpots).toBe(0);
    expect(rules.continentalSpots).toBeGreaterThan(0);
  });
});

describe("zoneForPosition", () => {
  const serieARules = rulesForLeague(SERIE_A);

  it("il primo posto è sempre title", () => {
    expect(zoneForPosition(1, serieARules)).toBe("title");
  });

  it("i posti 2-7 sono zona continental in Serie A (continentalSpots 7 include il 1° posto)", () => {
    expect(zoneForPosition(2, serieARules)).toBe("continental");
    expect(zoneForPosition(7, serieARules)).toBe("continental");
    expect(zoneForPosition(8, serieARules)).toBe("mid-table");
  });

  it("gli ultimi 3 posti sono zona retrocessione, divisa tra battle e relegated", () => {
    expect(zoneForPosition(18, serieARules)).toBe("relegation-battle");
    expect(zoneForPosition(19, serieARules)).toBe("relegated");
    expect(zoneForPosition(20, serieARules)).toBe("relegated");
  });

  it("il 2° posto in Serie B è promotion, non title, ma il 1° resta title", () => {
    const rules = rulesForLeague(SERIE_B);
    expect(zoneForPosition(1, rules)).toBe("title");
    expect(zoneForPosition(2, rules)).toBe("promotion");
    expect(zoneForPosition(3, rules)).toBe("mid-table");
  });

  it("in MLS (relegationSpots 0) anche l'ultimo posto è mid-table, mai relegated", () => {
    const rules = rulesForLeague(MLS);
    expect(zoneForPosition(rules.size, rules)).toBe("mid-table");
  });
});

describe("rollLeaguePosition", () => {
  const rules = rulesForLeague(SERIE_A); // size 20

  it("resta sempre dentro 1..size", () => {
    expect(rollLeaguePosition(4, rules, () => 0)).toBeGreaterThanOrEqual(1);
    expect(rollLeaguePosition(0, rules, () => 1)).toBeLessThanOrEqual(rules.size);
  });

  it("un rank atteso alto (4, ai vertici) con rumore neutro produce una posizione vicina al vertice", () => {
    const position = rollLeaguePosition(4, rules, () => 0.5);
    expect(position).toBeLessThanOrEqual(3);
  });

  it("un rank atteso basso (0, ultimi) con rumore neutro produce una posizione vicina al fondo", () => {
    const position = rollLeaguePosition(0, rules, () => 0.5);
    expect(position).toBeGreaterThanOrEqual(rules.size - 2);
  });

  it("è deterministico a parità di rng iniettato", () => {
    const rng = () => 0.3;
    expect(rollLeaguePosition(2, rules, rng)).toBe(rollLeaguePosition(2, rules, rng));
  });
});

describe("applySeasonToClub", () => {
  it("promuove sulla zona title", () => {
    const result = applySeasonToClub(SAMPDORIA, "title");
    expect(result.change).toBe("promoted");
    expect(result.club.tier).toBe(1);
    expect(result.club.competitions.league).toBe("Serie A");
  });

  it("promuove anche sulla zona promotion (2° posto, niente trofeo)", () => {
    const result = applySeasonToClub(SAMPDORIA, "promotion");
    expect(result.change).toBe("promoted");
    expect(result.club.tier).toBe(1);
  });

  it("non promuove un club già al tier 1", () => {
    const result = applySeasonToClub(TORINO, "title");
    expect(result.change).toBeNull();
    expect(result.club.tier).toBe(1);
  });

  it("retrocede sulla zona relegated", () => {
    const result = applySeasonToClub(TORINO, "relegated");
    expect(result.change).toBe("relegated");
    expect(result.club.tier).toBe(2);
    expect(result.club.competitions.league).toBe("Serie B");
  });

  it("è un no-op per un club in un campionato senza tier sotto modellato", () => {
    const result = applySeasonToClub(WEST_HAM, "relegated");
    expect(result.change).toBeNull();
    expect(result.club).toEqual(WEST_HAM);
  });

  it("è un no-op di categoria per la MLS (niente retrocessione per regola reale)", () => {
    const result = applySeasonToClub(LA_GALAXY, "relegated");
    expect(result.change).toBeNull();
  });

  it("il club ricostruito mantiene id/nome/prestigio/stemma invariati", () => {
    const result = applySeasonToClub(SAMPDORIA, "title");
    expect(result.club.id).toBe(SAMPDORIA.id);
    expect(result.club.name).toBe(SAMPDORIA.name);
    expect(result.club.prestige).toBe(SAMPDORIA.prestige);
    expect(result.club.crestUrl).toBe(SAMPDORIA.crestUrl);
  });

  it("non tocca l'accesso alla coppa continentale (resta derivato dal prestigio, non dalla zona della singola stagione)", () => {
    const midTable = applySeasonToClub(TORINO, "mid-table");
    expect(midTable.club.competitions.continental).toEqual(TORINO.competitions.continental);
    const relegationBattle = applySeasonToClub(TORINO, "relegation-battle");
    expect(relegationBattle.club.competitions.continental).toEqual(TORINO.competitions.continental);
  });
});
