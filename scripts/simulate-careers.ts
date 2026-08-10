import { it } from "vitest";
import type {
  ArchetypeId,
  AttributeKey,
  AwardType,
  DecisionCategory,
  PlayerIdentity,
  PlayStyleId,
  Position,
  Traits,
} from "@/types/career";
import {
  makeTraitDirectedPicker,
  makeTrainingFocusPicker,
  pickExtremeOption,
  pickRiskSeekingOption,
  simulateCareer,
} from "@/lib/career/simulation";
import { PLAY_STYLE_DEFS } from "@/lib/career/playstyles";

/**
 * Strumento di taratura manuale (non un test): gira N carriere con Math.random reale e stampa
 * le frequenze empiriche delle meccaniche probabilistiche del motore, da confrontare con
 * l'obiettivo "generoso ma non assurdo" rispetto all'originale (vedi piano di implementazione).
 * Eseguire con `npm run simulate`.
 */
const CAREER_COUNT = 2000;
const POSITIONS: Position[] = ["GK", "CB", "CDM", "CM", "CAM", "ST"];
const NATIONALITIES = ["Italy", "Brazil", "Portugal", "France", "Argentina", "Netherlands"];

function buildIdentity(index: number): PlayerIdentity {
  return {
    lastName: `Player${index}`,
    number: (index % 99) + 1,
    foot: index % 2 === 0 ? "right" : "left",
    nationality: NATIONALITIES[index % NATIONALITIES.length],
    position: POSITIONS[index % POSITIONS.length],
  };
}

function buildIdentityWithPosition(index: number, position: Position): PlayerIdentity {
  return { ...buildIdentity(index), position };
}

function pct(count: number, total: number): string {
  return `${((count / total) * 100).toFixed(1)}%`;
}

it("simula molte carriere e stampa le frequenze osservate", () => {
  const results = Array.from({ length: CAREER_COUNT }, (_, index) =>
    simulateCareer(buildIdentity(index), "normal", Math.random),
  );

  const withClubTrophy = results.filter((r) => r.player.trophies.some((t) => t.club)).length;
  const withNationalTrophy = results.filter((r) => r.player.trophies.some((t) => !t.club)).length;
  const withCallup = results.filter((r) => r.player.nationalTeam.called).length;
  const withInjury = results.filter((r) => r.injuryCount > 0).length;

  const awardCounts: Record<AwardType, number> = {
    "player-of-the-season": 0,
    "ballon-dor": 0,
    "top-scorer": 0,
  };
  let totalTrophies = 0;
  let totalAwards = 0;
  const retirementAges: Record<number, number> = {};
  const categoryTotals: Partial<Record<DecisionCategory, number>> = {};
  let totalCyclesPlayed = 0;
  let totalPeakOvr = 0;
  let totalCupUpsetWins = 0;
  let totalPromotions = 0;
  let totalRelegations = 0;
  const peakOvrBuckets: Record<string, number> = {
    "<70": 0,
    "70-79": 0,
    "80-84": 0,
    "85-89": 0,
    "90+": 0,
  };
  const archetypeCounts: Record<ArchetypeId | "nessuno", number> = {
    flagbearer: 0,
    mercenary: 0,
    showman: 0,
    pro: 0,
    leader: 0,
    problem: 0,
    nessuno: 0,
  };
  const shadowBuckets: Record<string, number> = {
    "0-24": 0,
    "25-49": 0,
    "50-74": 0,
    "75-89": 0,
    "90+": 0,
  };
  let scandalCount = 0;
  let redeemedCount = 0;
  const playStyleCounts: Record<PlayStyleId, number> = Object.fromEntries(
    PLAY_STYLE_DEFS.map((def) => [def.id, 0]),
  ) as Record<PlayStyleId, number>;
  let noPlayStyleCount = 0;
  let totalPotential = 0;
  let totalPotentialGap = 0;
  let nearPotentialCount = 0;
  const potentialBuckets: Record<string, number> = {
    "<70": 0,
    "70-79": 0,
    "80-84": 0,
    "85-89": 0,
    "90+": 0,
  };

  for (const {
    player,
    categoryPicks,
    cyclesPlayed,
    peakOvr,
    cupUpsetWinCount,
    promotionCount,
    relegationCount,
    finalArchetype,
    finalShadow,
    hadScandal,
    redeemed,
  } of results) {
    totalTrophies += player.trophies.length;
    totalAwards += player.awards.length;
    for (const award of player.awards) awardCounts[award.type] += 1;
    retirementAges[player.age] = (retirementAges[player.age] ?? 0) + 1;
    totalCyclesPlayed += cyclesPlayed;
    totalPeakOvr += peakOvr;
    totalCupUpsetWins += cupUpsetWinCount;
    totalPromotions += promotionCount;
    totalRelegations += relegationCount;
    if (peakOvr < 70) peakOvrBuckets["<70"] += 1;
    else if (peakOvr < 80) peakOvrBuckets["70-79"] += 1;
    else if (peakOvr < 85) peakOvrBuckets["80-84"] += 1;
    else if (peakOvr < 90) peakOvrBuckets["85-89"] += 1;
    else peakOvrBuckets["90+"] += 1;
    for (const [cat, count] of Object.entries(categoryPicks)) {
      const key = cat as DecisionCategory;
      categoryTotals[key] = (categoryTotals[key] ?? 0) + (count ?? 0);
    }
    archetypeCounts[finalArchetype ?? "nessuno"] += 1;
    if (finalShadow < 25) shadowBuckets["0-24"] += 1;
    else if (finalShadow < 50) shadowBuckets["25-49"] += 1;
    else if (finalShadow < 75) shadowBuckets["50-74"] += 1;
    else if (finalShadow < 90) shadowBuckets["75-89"] += 1;
    else shadowBuckets["90+"] += 1;
    if (hadScandal) scandalCount += 1;
    if (redeemed) redeemedCount += 1;
    if (player.playStyles.length === 0) noPlayStyleCount += 1;
    for (const id of player.playStyles) playStyleCounts[id] += 1;
    totalPotential += player.potential;
    const gap = player.potential - peakOvr;
    totalPotentialGap += gap;
    if (gap <= 3) nearPotentialCount += 1;
    if (player.potential < 70) potentialBuckets["<70"] += 1;
    else if (player.potential < 80) potentialBuckets["70-79"] += 1;
    else if (player.potential < 85) potentialBuckets["80-84"] += 1;
    else if (player.potential < 90) potentialBuckets["85-89"] += 1;
    else potentialBuckets["90+"] += 1;
  }

  console.log(`\n=== Simulazione di ${CAREER_COUNT} carriere ===\n`);
  console.log(`Almeno 1 trofeo di club:       ${pct(withClubTrophy, CAREER_COUNT)}`);
  console.log(`Almeno 1 trofeo di nazionale:  ${pct(withNationalTrophy, CAREER_COUNT)}`);
  console.log(`Almeno 1 convocazione:         ${pct(withCallup, CAREER_COUNT)}`);
  console.log(`Almeno 1 infortunio:           ${pct(withInjury, CAREER_COUNT)}`);
  console.log(`Trofei medi per carriera:      ${(totalTrophies / CAREER_COUNT).toFixed(2)}`);
  console.log(`Promozioni medie per carriera:  ${(totalPromotions / CAREER_COUNT).toFixed(2)}`);
  console.log(`Retrocessioni medie per carriera: ${(totalRelegations / CAREER_COUNT).toFixed(2)}`);
  console.log(`Award medi per carriera:       ${(totalAwards / CAREER_COUNT).toFixed(2)}`);
  console.log(`OVR di picco medio:            ${(totalPeakOvr / CAREER_COUNT).toFixed(1)}`);
  console.log(`\n--- Distribuzione OVR di picco ---`);
  for (const [bucket, count] of Object.entries(peakOvrBuckets)) {
    console.log(`  ${bucket}: ${pct(count, CAREER_COUNT)}`);
  }
  console.log(`\n--- Award per tipo (carriere con almeno 1) ---`);
  for (const [type, count] of Object.entries(awardCounts)) {
    console.log(`  ${type}: ${pct(count, CAREER_COUNT)}`);
  }

  console.log(`\n--- Età di ritiro ---`);
  for (const age of Object.keys(retirementAges).map(Number).sort((a, b) => a - b)) {
    console.log(`  ${age} anni: ${pct(retirementAges[age], CAREER_COUNT)}`);
  }

  console.log(`\n--- Frequenza scelta categoria (su ${totalCyclesPlayed} cicli totali) ---`);
  for (const [cat, count] of Object.entries(categoryTotals).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))) {
    console.log(`  ${cat}: ${pct(count ?? 0, totalCyclesPlayed)}`);
  }

  const cupUpsetCycles = categoryTotals["cup-upset"] ?? 0;
  if (cupUpsetCycles > 0) {
    console.log(`\n--- Sorpresa di coppa ("Giant Killer") ---`);
    console.log(`  Cicli innescati: ${cupUpsetCycles} (${pct(cupUpsetCycles, totalCyclesPlayed)} dei cicli totali)`);
    console.log(`  Vinti: ${totalCupUpsetWins} (${pct(totalCupUpsetWins, cupUpsetCycles)} dei cicli innescati)`);
  }

  console.log(`\n--- Archetipo finale ---`);
  for (const [id, count] of Object.entries(archetypeCounts)) {
    console.log(`  ${id}: ${pct(count, CAREER_COUNT)}`);
  }

  console.log(`\n--- Potenziale (tetto individuale, Fase 1) ---`);
  console.log(`  Potenziale finale medio:       ${(totalPotential / CAREER_COUNT).toFixed(1)}`);
  console.log(`  Gap medio potenziale-picco:    ${(totalPotentialGap / CAREER_COUNT).toFixed(1)}`);
  console.log(`  Carriere vicine al potenziale (gap<=3): ${pct(nearPotentialCount, CAREER_COUNT)}`);
  for (const [bucket, count] of Object.entries(potentialBuckets)) {
    console.log(`  ${bucket}: ${pct(count, CAREER_COUNT)}`);
  }

  console.log(`\n--- PlayStyles sbloccati (Fase 3) ---`);
  console.log(`  Nessuno sbloccato: ${pct(noPlayStyleCount, CAREER_COUNT)}`);
  for (const [id, count] of Object.entries(playStyleCounts)) {
    console.log(`  ${id}: ${pct(count, CAREER_COUNT)}`);
  }

  console.log(`\n--- Debito morale (shadow) finale ---`);
  for (const [bucket, count] of Object.entries(shadowBuckets)) {
    console.log(`  ${bucket}: ${pct(count, CAREER_COUNT)}`);
  }
  const scandalCycles = categoryTotals["scandal"] ?? 0;
  console.log(`  Carriere con almeno 1 scandalo: ${pct(scandalCount, CAREER_COUNT)} (${pct(scandalCycles, totalCyclesPlayed)} dei cicli totali)`);
  console.log(`  Carriere redente: ${pct(redeemedCount, CAREER_COUNT)}`);
  console.log("");
});

/**
 * Misura la raggiungibilità REALE dello scandalo per un giocatore che persegue deliberatamente
 * le scelte più rischiose (pickRiskSeekingOption), non solo il pavimento pessimistico della
 * scelta uniforme casuale del blocco sopra — vedi Fase 3 del piano di bilanciamento.
 */
const RISK_SEEKING_CAREER_COUNT = 800;

it("simula carriere 'rischiose' (shadow massimizzato) e stampa la raggiungibilità dello scandalo", () => {
  const results = Array.from({ length: RISK_SEEKING_CAREER_COUNT }, (_, index) =>
    simulateCareer(buildIdentity(index), "normal", Math.random, pickRiskSeekingOption),
  );

  const scandalCount = results.filter((r) => r.hadScandal).length;
  const redeemedCount = results.filter((r) => r.redeemed).length;
  const shadowBuckets: Record<string, number> = { "0-24": 0, "25-49": 0, "50-74": 0, "75-89": 0, "90+": 0 };
  let totalShadow = 0;
  for (const { finalShadow } of results) {
    totalShadow += finalShadow;
    if (finalShadow < 25) shadowBuckets["0-24"] += 1;
    else if (finalShadow < 50) shadowBuckets["25-49"] += 1;
    else if (finalShadow < 75) shadowBuckets["50-74"] += 1;
    else if (finalShadow < 90) shadowBuckets["75-89"] += 1;
    else shadowBuckets["90+"] += 1;
  }

  console.log(`\n=== Carriere "rischiose" (shadow massimizzato), ${RISK_SEEKING_CAREER_COUNT} carriere ===\n`);
  console.log(`Shadow medio finale:            ${(totalShadow / RISK_SEEKING_CAREER_COUNT).toFixed(1)}`);
  console.log(`Carriere con almeno 1 scandalo: ${pct(scandalCount, RISK_SEEKING_CAREER_COUNT)}`);
  console.log(`Carriere redente:                ${pct(redeemedCount, RISK_SEEKING_CAREER_COUNT)}`);
  console.log(`--- Distribuzione shadow finale ---`);
  for (const [bucket, count] of Object.entries(shadowBuckets)) {
    console.log(`  ${bucket}: ${pct(count, RISK_SEEKING_CAREER_COUNT)}`);
  }
  console.log("");
});

/**
 * Misura la raggiungibilità REALE di ogni PlayStyle per un giocatore che si allena sempre
 * sull'attributo corrispondente (makeTrainingFocusPicker), abbinato a un ruolo plausibile per
 * quello stile — non solo il pavimento sotto scelta uniforme del blocco principale sopra —
 * vedi Fase 5 del piano di bilanciamento.
 */
const DIRECTED_TRAINING_CAREER_COUNT = 400;

const PLAY_STYLE_DIRECTED_SETUPS: { id: PlayStyleId; attribute: AttributeKey; position: Position }[] = [
  { id: "curler", attribute: "shooting", position: "ST" },
  { id: "playmaker", attribute: "passing", position: "CAM" },
  { id: "sprinter", attribute: "pace", position: "LW" },
  { id: "brickwall", attribute: "defending", position: "CB" },
  { id: "targetman", attribute: "physical", position: "ST" },
  { id: "catlike", attribute: "reflexes", position: "GK" },
];

it("simula carriere con focus di allenamento diretto e stampa la raggiungibilità di ogni PlayStyle", () => {
  console.log(`\n=== PlayStyle con focus di allenamento diretto, ${DIRECTED_TRAINING_CAREER_COUNT} carriere per stile ===\n`);
  for (const { id, attribute, position } of PLAY_STYLE_DIRECTED_SETUPS) {
    const picker = makeTrainingFocusPicker(attribute);
    const results = Array.from({ length: DIRECTED_TRAINING_CAREER_COUNT }, (_, index) =>
      simulateCareer(buildIdentityWithPosition(index, position), "normal", Math.random, picker),
    );
    const unlocked = results.filter((r) => r.player.playStyles.includes(id)).length;
    console.log(`  ${id} (${attribute}, ${position}): ${pct(unlocked, DIRECTED_TRAINING_CAREER_COUNT)}`);
  }
  console.log("");
});

/**
 * Misura la raggiungibilità REALE di ogni archetipo per un giocatore che persegue sempre lo
 * stesso vettore di personalità (makeTraitDirectedPicker), non solo il pavimento sotto scelta
 * uniforme del blocco principale sopra — vedi Fase 6 del piano di bilanciamento.
 */
const TRAIT_DIRECTED_CAREER_COUNT = 400;

const ARCHETYPE_DIRECTED_SETUPS: { archetype: ArchetypeId; vector: keyof Traits; direction: "max" | "min" }[] = [
  { archetype: "flagbearer", vector: "loyalty", direction: "max" },
  { archetype: "showman", vector: "showmanship", direction: "max" },
  { archetype: "pro", vector: "discipline", direction: "max" },
  { archetype: "leader", vector: "leadership", direction: "max" },
];

it("simula carriere con tratti diretti e stampa la raggiungibilità di ogni archetipo", () => {
  console.log(`\n=== Archetipo con scelte dirette per tratto, ${TRAIT_DIRECTED_CAREER_COUNT} carriere ===\n`);
  for (const { archetype, vector, direction } of ARCHETYPE_DIRECTED_SETUPS) {
    const picker = makeTraitDirectedPicker(vector, direction);
    const results = Array.from({ length: TRAIT_DIRECTED_CAREER_COUNT }, (_, index) =>
      simulateCareer(buildIdentity(index), "normal", Math.random, picker),
    );
    const matched = results.filter((r) => r.finalArchetype === archetype).length;
    console.log(`  ${archetype} (${vector} sempre massimizzato): ${pct(matched, TRAIT_DIRECTED_CAREER_COUNT)}`);
  }

  const mercenaryPicker = (decision: Parameters<typeof pickExtremeOption>[0]) =>
    pickExtremeOption(decision, (effect) => (effect.traitsDelta?.ambition ?? 0) - (effect.traitsDelta?.loyalty ?? 0), "max");
  const mercenaryResults = Array.from({ length: TRAIT_DIRECTED_CAREER_COUNT }, (_, index) =>
    simulateCareer(buildIdentity(index), "normal", Math.random, mercenaryPicker),
  );
  const mercenaryMatched = mercenaryResults.filter((r) => r.finalArchetype === "mercenary").length;
  console.log(`  mercenary (ambition massimizzato, loyalty minimizzato): ${pct(mercenaryMatched, TRAIT_DIRECTED_CAREER_COUNT)}`);
  console.log("");
});
