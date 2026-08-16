import { it } from "vitest";
import type { CoachDecisionCategory, CoachIdentity, LeagueFinish } from "@/types/coach";
import { simulateCoachCareer } from "@/lib/coach-career/simulation";

/**
 * Strumento di taratura manuale (non un test): gira N carriere allenatore con Math.random reale
 * e stampa le frequenze empiriche delle formule mai misurate finora (reputazione, esonero, età di
 * ritiro, piazzamenti) — mirror di `scripts/simulate-careers.ts` per il calciatore. Eseguire con
 * `npm run coach-simulate`.
 */
const CAREER_COUNT = 2000;
const NATIONALITIES = ["Italy", "Brazil", "Portugal", "France", "Argentina", "Netherlands"];

function buildIdentity(index: number): CoachIdentity {
  return {
    lastName: `Coach${index}`,
    nationality: NATIONALITIES[index % NATIONALITIES.length],
    preferredSystem: (["possesso", "pressing", "contropiede", "diretto"] as const)[index % 4],
  };
}

function pct(count: number, total: number): string {
  return `${((count / total) * 100).toFixed(1)}%`;
}

it("simula molte carriere allenatore e stampa le frequenze osservate", () => {
  const results = Array.from({ length: CAREER_COUNT }, (_, index) => simulateCoachCareer(buildIdentity(index), "normal", Math.random));

  let totalTrophies = 0;
  let totalAwards = 0;
  let totalCyclesPlayed = 0;
  let totalPeakReputation = 0;
  let totalSacks = 0;
  let totalPromotions = 0;
  let totalRelegations = 0;
  const retirementAges: Record<number, number> = {};
  const categoryTotals: Partial<Record<CoachDecisionCategory, number>> = {};
  const peakReputationBuckets: Record<string, number> = {
    "<55": 0,
    "55-69": 0,
    "70-84": 0,
    "85-94": 0,
    "95+": 0,
  };
  const leagueFinishCounts: Record<LeagueFinish, number> = {
    relegated: 0,
    "relegation-battle": 0,
    "mid-table": 0,
    "continental-qualification": 0,
    title: 0,
  };
  let totalStints = 0;
  let sackedCareers = 0;
  let neverSackedCareers = 0;
  let clubsManagedTotal = 0;

  for (const { coach, categoryPicks, cyclesPlayed, peakReputation, sackCount, promotionCount, relegationCount } of results) {
    totalTrophies += coach.trophies.length;
    totalAwards += coach.awards.length;
    retirementAges[coach.age] = (retirementAges[coach.age] ?? 0) + 1;
    totalCyclesPlayed += cyclesPlayed;
    totalPeakReputation += peakReputation;
    totalSacks += sackCount;
    totalPromotions += promotionCount;
    totalRelegations += relegationCount;
    if (sackCount > 0) sackedCareers += 1;
    else neverSackedCareers += 1;
    clubsManagedTotal += new Set(coach.clubHistory.map((s) => s.club.id)).size;
    for (const [cat, count] of Object.entries(categoryPicks)) {
      const key = cat as CoachDecisionCategory;
      categoryTotals[key] = (categoryTotals[key] ?? 0) + (count ?? 0);
    }
    if (peakReputation < 55) peakReputationBuckets["<55"] += 1;
    else if (peakReputation < 70) peakReputationBuckets["55-69"] += 1;
    else if (peakReputation < 85) peakReputationBuckets["70-84"] += 1;
    else if (peakReputation < 95) peakReputationBuckets["85-94"] += 1;
    else peakReputationBuckets["95+"] += 1;
    for (const stint of coach.clubHistory) {
      leagueFinishCounts[stint.outcome.leagueFinish] += 1;
      totalStints += 1;
    }
  }

  console.log(`\n=== Simulazione di ${CAREER_COUNT} carriere allenatore ===\n`);
  console.log(`Trofei medi per carriera:       ${(totalTrophies / CAREER_COUNT).toFixed(2)}`);
  console.log(`Award medi per carriera:        ${(totalAwards / CAREER_COUNT).toFixed(2)}`);
  console.log(`Reputazione di picco media:     ${(totalPeakReputation / CAREER_COUNT).toFixed(1)}`);
  console.log(`Esoneri medi per carriera:      ${(totalSacks / CAREER_COUNT).toFixed(2)}`);
  console.log(`Carriere mai esonerate:         ${pct(neverSackedCareers, CAREER_COUNT)}`);
  console.log(`Carriere con almeno 1 esonero:  ${pct(sackedCareers, CAREER_COUNT)}`);
  console.log(`Club allenati medi per carriera: ${(clubsManagedTotal / CAREER_COUNT).toFixed(2)}`);
  console.log(`Promozioni medie per carriera:  ${(totalPromotions / CAREER_COUNT).toFixed(2)}`);
  console.log(`Retrocessioni medie per carriera: ${(totalRelegations / CAREER_COUNT).toFixed(2)}`);
  console.log(`Cicli medi per carriera:        ${(totalCyclesPlayed / CAREER_COUNT).toFixed(1)}`);

  console.log(`\n--- Distribuzione reputazione di picco ---`);
  for (const [bucket, count] of Object.entries(peakReputationBuckets)) {
    console.log(`  ${bucket}: ${pct(count, CAREER_COUNT)}`);
  }

  console.log(`\n--- Età di ritiro ---`);
  for (const age of Object.keys(retirementAges).map(Number).sort((a, b) => a - b)) {
    console.log(`  ${age} anni: ${pct(retirementAges[age], CAREER_COUNT)}`);
  }

  console.log(`\n--- Piazzamento di campionato per stagione (su ${totalStints} cicli con un club) ---`);
  for (const [finish, count] of Object.entries(leagueFinishCounts)) {
    console.log(`  ${finish}: ${pct(count, totalStints)}`);
  }

  console.log(`\n--- Frequenza scelta categoria (su ${totalCyclesPlayed} cicli totali) ---`);
  for (const [cat, count] of Object.entries(categoryTotals).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))) {
    console.log(`  ${cat}: ${pct(count ?? 0, totalCyclesPlayed)}`);
  }
  console.log("");
});
