import { describe, expect, it } from "vitest";
import type { DecisionCategory, DecisionOption, Player, PlayerIdentity } from "@/types/career";
import { getClub } from "@/data/clubs";
import { createPlayer, signWithClub } from "./engine";
import {
  cupUpsetWinChance,
  favorableOutcomeWeight,
  generateAcademyOffer,
  generateClubCrisis,
  generateClubPriority,
  generateCompetitionForSpot,
  generateContinentalFinalDecision,
  generateControversialPost,
  generateControversialStatement,
  generateCupUpsetDecision,
  generateEndOfCycle,
  generateLoanOffer,
  generateLoanReturn,
  generateNationalitySwitch,
  generateRedemptionDecision,
  generateReturnHome,
  generateScandalDecision,
  generateSponsorDeal,
  generateTaxTrouble,
  generateTransferWindow,
  generateTriumphantReturn,
  generateUnexpectedProspect,
  isClubPriorityEligible,
  isNationalitySwitchEligible,
  isReturnHomeEligible,
  isSponsorEligible,
  isTaxTroubleEligible,
  isTriumphantReturnEligible,
  isUnexpectedProspectEligible,
  LIFESTYLE_DECISIONS,
  nationalCallupChance,
  penaltyScoreChance,
  pickCupUpsetOpponent,
  pickDecisionCategory,
  rollNationalCallup,
} from "./decisions";

const IDENTITY: PlayerIdentity = {
  lastName: "Rossi",
  number: 10,
  foot: "right",
  nationality: "Italy",
  position: "ST",
};

const FIXED_RNG = () => 0.5;

function playerAt(club = getClub("juventus")!): Player {
  return signWithClub(createPlayer(IDENTITY), club);
}

describe("LIFESTYLE_DECISIONS", () => {
  it("dovrebbe avere id univoci tra tutte le decisioni del pool", () => {
    const ids = LIFESTYLE_DECISIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ogni opzione dovrebbe avere outcome i cui pesi sommano a 100", () => {
    for (const decision of LIFESTYLE_DECISIONS) {
      for (const option of decision.options) {
        const totalWeight = option.outcomes.reduce((sum, o) => sum + o.weight, 0);
        expect(totalWeight).toBe(100);
      }
    }
  });

  it("ogni decisione dovrebbe avere almeno due opzioni", () => {
    for (const decision of LIFESTYLE_DECISIONS) {
      expect(decision.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("gli outcome negativi di 'Doppie sedute' e 'Ritiro speciale' dovrebbero infortunare il giocatore", () => {
    const doubleSessions = LIFESTYLE_DECISIONS.find((d) => d.id === "double-sessions")!;
    const injuryOutcome = doubleSessions.options[0].outcomes.find((o) => o.effect.injury);
    expect(injuryOutcome?.effect.injury).toMatchObject({
      turnsRemaining: expect.any(Number),
      ovrPenalty: expect.any(Number),
    });

    const extraCamp = LIFESTYLE_DECISIONS.find((d) => d.id === "extra-camp")!;
    const campInjuryOutcome = extraCamp.options[0].outcomes.find((o) => o.effect.injury);
    expect(campInjuryOutcome?.effect.injury).toMatchObject({
      turnsRemaining: expect.any(Number),
      ovrPenalty: expect.any(Number),
    });
  });
});

describe("generateAcademyOffer", () => {
  it("dovrebbe restituire quattro opzioni, tutte con un club a basso prestigio", () => {
    const decision = generateAcademyOffer({ nationality: "Italy" }, FIXED_RNG);
    expect(decision.options).toHaveLength(4);
    for (const option of decision.options) {
      expect(option.club).toBeDefined();
      expect(option.club!.prestige).toBeLessThanOrEqual(1);
    }
  });

  it("dovrebbe preferire club del paese del giocatore quando disponibili", () => {
    const decision = generateAcademyOffer({ nationality: "Italy" }, FIXED_RNG);
    expect(decision.options.every((o) => o.club!.country === "Italy")).toBe(true);
  });

  it("dovrebbe proporre club portoghesi a un giocatore portoghese (copertura club estesa)", () => {
    const decision = generateAcademyOffer({ nationality: "Portugal" }, FIXED_RNG);
    expect(decision.options.every((o) => o.club!.country === "Portugal")).toBe(true);
  });
});

describe("generateTransferWindow", () => {
  it("dovrebbe lanciare un errore se il giocatore non ha un club", () => {
    expect(() => generateTransferWindow(createPlayer(IDENTITY), FIXED_RNG)).toThrow();
  });

  it("dovrebbe includere l'opzione 'resta' con il club corrente", () => {
    const player = playerAt();
    const decision = generateTransferWindow(player, FIXED_RNG);
    const stayOption = decision.options.find((o) => o.id === "stay");
    expect(stayOption?.club?.id).toBe(player.club!.id);
  });

  it("le offerte diverse da 'resta' non dovrebbero mai coincidere con il club corrente", () => {
    const player = playerAt();
    const decision = generateTransferWindow(player, FIXED_RNG);
    const offers = decision.options.filter((o) => o.id !== "stay");
    expect(offers.every((o) => o.club!.id !== player.club!.id)).toBe(true);
  });

  it("firmare dovrebbe alzare ambition/abbassare loyalty, restare dovrebbe alzare loyalty", () => {
    const player = playerAt();
    const decision = generateTransferWindow(player, FIXED_RNG);
    const stay = decision.options.find((o) => o.id === "stay")!;
    const sign = decision.options.find((o) => o.id !== "stay")!;

    expect(stay.outcomes[0].effect.traitsDelta).toEqual({ loyalty: 4 });
    expect(sign.outcomes[0].effect.traitsDelta).toEqual({ ambition: 4, loyalty: -2 });
  });
});

describe("generateLoanOffer", () => {
  it("dovrebbe lanciare un errore se il giocatore non ha un club", () => {
    expect(() => generateLoanOffer(createPlayer(IDENTITY), FIXED_RNG)).toThrow();
  });

  it("non dovrebbe mai includere un'opzione per restare al club corrente", () => {
    const player = playerAt();
    const decision = generateLoanOffer(player, FIXED_RNG);
    expect(decision.options.some((o) => o.id === "stay")).toBe(false);
  });
});

describe("generateLoanReturn", () => {
  it("dovrebbe includere la firma a titolo definitivo per il club dove si è in prestito", () => {
    const loanClub = getClub("las-palmas")!;
    const player = playerAt(loanClub);
    const parentClub = getClub("sevilla")!;
    const decision = generateLoanReturn(player, parentClub, FIXED_RNG);
    const permanentOption = decision.options.find((o) => o.id === "sign-permanent");
    expect(permanentOption?.club?.id).toBe(loanClub.id);
  });
});

describe("generateClubCrisis", () => {
  it("dovrebbe proporre resta (con malus OVR) o vai in un altro club", () => {
    const player = playerAt();
    const decision = generateClubCrisis(player, FIXED_RNG);
    const stay = decision.options.find((o) => o.id === "stay-and-fight");
    const leave = decision.options.find((o) => o.id === "leave");

    expect(stay?.club?.id).toBe(player.club!.id);
    expect(stay?.outcomes[0].effect.ovrDelta).toBeLessThan(0);
    expect(leave?.club?.id).not.toBe(player.club!.id);
  });

  it("resta dovrebbe alzare leadership/loyalty, lasciare dovrebbe alzare ambition/shadow e abbassare loyalty", () => {
    const player = playerAt();
    const decision = generateClubCrisis(player, FIXED_RNG);
    const stay = decision.options.find((o) => o.id === "stay-and-fight")!;
    const leave = decision.options.find((o) => o.id === "leave")!;

    expect(stay.outcomes[0].effect.traitsDelta).toEqual({ leadership: 9, loyalty: 4 });
    expect(leave.outcomes[0].effect.traitsDelta).toEqual({ ambition: 3, loyalty: -3 });
    expect(leave.outcomes[0].effect.shadowDelta).toBe(19);
    expect(leave.outcomes[0].effect.shadowFlags).toEqual({ fanBetrayed: true });
  });
});

describe("generateCompetitionForSpot e generateControversialStatement", () => {
  it("generateCompetitionForSpot dovrebbe offrire fatti valere (probabilistico) o firma altrove", () => {
    const player = playerAt();
    const decision = generateCompetitionForSpot(player, FIXED_RNG);
    const compete = decision.options.find((o) => o.id === "compete");
    expect(compete?.outcomes.length).toBeGreaterThanOrEqual(2);
  });

  it("generateControversialStatement dovrebbe offrire scuse (minutaggio ridotto) o firma per un club più debole", () => {
    const player = playerAt(); // Juventus, prestige 3
    const decision = generateControversialStatement(player, FIXED_RNG);
    const leave = decision.options.find((o) => o.id === "leave");
    expect(leave?.club?.prestige).toBeLessThan(player.club!.prestige);
  });

  it("generateControversialStatement dovrebbe alzare showmanship/shadow su entrambe le opzioni", () => {
    const player = playerAt();
    const decision = generateControversialStatement(player, FIXED_RNG);
    const apologize = decision.options.find((o) => o.id === "apologize")!;
    const leave = decision.options.find((o) => o.id === "leave")!;

    expect(apologize.outcomes[0].effect.traitsDelta).toEqual({ showmanship: 5 });
    expect(apologize.outcomes[0].effect.shadowDelta).toBe(6);
    expect(leave.outcomes[0].effect.traitsDelta).toEqual({ showmanship: 5, ambition: 2, loyalty: -2 });
    expect(leave.outcomes[0].effect.shadowDelta).toBe(6);
  });
});

describe("generateControversialPost", () => {
  it("dovrebbe offrire cancella il post (minutaggio ridotto) o firma per un club più debole", () => {
    const player = playerAt(); // Juventus, prestige 3
    const decision = generateControversialPost(player, FIXED_RNG);
    const deletePost = decision.options.find((o) => o.id === "delete-post");
    const leave = decision.options.find((o) => o.id === "leave");
    expect(deletePost?.outcomes[0].effect.ovrDelta).toBeLessThan(0);
    expect(leave?.club?.prestige).toBeLessThan(player.club!.prestige);
  });

  it("dovrebbe alzare showmanship/shadow su entrambe le opzioni", () => {
    const player = playerAt();
    const decision = generateControversialPost(player, FIXED_RNG);
    const deletePost = decision.options.find((o) => o.id === "delete-post")!;
    const leave = decision.options.find((o) => o.id === "leave")!;

    expect(deletePost.outcomes[0].effect.traitsDelta).toEqual({ showmanship: 5 });
    expect(deletePost.outcomes[0].effect.shadowDelta).toBe(6);
    expect(leave.outcomes[0].effect.shadowDelta).toBe(6);
  });
});

describe("isClubPriorityEligible e generateClubPriority", () => {
  it("dovrebbe essere vero per un club con coppa nazionale o continentale", () => {
    expect(isClubPriorityEligible(playerAt())).toBe(true); // Juventus: cup + continental
  });

  it("dovrebbe essere falso per un club senza coppa né competizione continentale", () => {
    const clubWithoutCup = { ...getClub("reggiana")!, competitions: { league: "Serie B" } };
    expect(isClubPriorityEligible(playerAt(clubWithoutCup))).toBe(false);
  });

  it("dovrebbe proporre campionato vs coppa (nome reale) come opzioni", () => {
    const player = playerAt();
    const decision = generateClubPriority(player);
    expect(decision.options.map((o) => o.id)).toEqual(["prioritize-league", "prioritize-cup"]);
    expect(decision.options.every((o) => o.outcomes.length === 1)).toBe(true);
  });
});

describe("isUnexpectedProspectEligible e generateUnexpectedProspect", () => {
  it("dovrebbe essere vero per un giovane giocatore in un club a basso prestigio", () => {
    expect(isUnexpectedProspectEligible(playerAt(getClub("reggiana")!))).toBe(true);
  });

  it("dovrebbe essere falso per un club di alto prestigio", () => {
    expect(isUnexpectedProspectEligible(playerAt())).toBe(false); // Juventus, prestige 3
  });

  it("dovrebbe essere falso oltre i 20 anni", () => {
    const player = { ...playerAt(getClub("reggiana")!), age: 25 };
    expect(isUnexpectedProspectEligible(player)).toBe(false);
  });

  it("dovrebbe proporre mentore (deterministico) o via d'uscita verso un club migliore", () => {
    const player = playerAt(getClub("reggiana")!);
    const decision = generateUnexpectedProspect(player, FIXED_RNG);
    const mentor = decision.options.find((o) => o.id === "accept-mentor");
    const wayOut = decision.options.find((o) => o.id === "look-for-way-out");
    expect(mentor?.outcomes).toHaveLength(1);
    expect(mentor?.outcomes[0].effect.ovrDelta).toBeGreaterThan(0);
    expect(wayOut?.club?.id).not.toBe(player.club!.id);
  });
});

describe("isTriumphantReturnEligible e generateTriumphantReturn", () => {
  function veteranAwayFromFirstClub(): Player {
    const firstClub = getClub("reggiana")!;
    const currentClub = getClub("juventus")!;
    return {
      ...playerAt(currentClub),
      age: 34,
      clubHistory: [
        { club: firstClub, ageFrom: 16, ageTo: 18, type: "permanent", stats: { apps: 0, goals: 0, assists: 0 }, ovr: 55 },
      ],
    };
  }

  it("dovrebbe essere vero per un veterano lontano dal primo club", () => {
    expect(isTriumphantReturnEligible(veteranAwayFromFirstClub())).toBe(true);
  });

  it("dovrebbe essere falso se il club attuale è già il primo club", () => {
    const player = veteranAwayFromFirstClub();
    expect(isTriumphantReturnEligible({ ...player, club: player.clubHistory[0].club })).toBe(false);
  });

  it("dovrebbe essere falso sotto i 32 anni", () => {
    expect(isTriumphantReturnEligible({ ...veteranAwayFromFirstClub(), age: 28 })).toBe(false);
  });

  it("dovrebbe proporre resta o torna al primo club", () => {
    const player = veteranAwayFromFirstClub();
    const decision = generateTriumphantReturn(player);
    const returnOption = decision.options.find((o) => o.id === "return");
    expect(returnOption?.club?.id).toBe(player.clubHistory[0].club.id);
  });
});

describe("isNationalitySwitchEligible e generateNationalitySwitch", () => {
  function eligiblePlayer(): Player {
    return { ...playerAt(), age: 20 };
  }

  it("dovrebbe essere vero per un giocatore 18-26 mai convocato e mai switchato", () => {
    expect(isNationalitySwitchEligible(eligiblePlayer())).toBe(true);
  });

  it("dovrebbe essere falso se il giocatore è già stato convocato", () => {
    const player = { ...eligiblePlayer(), nationalTeam: { ...eligiblePlayer().nationalTeam, called: true } };
    expect(isNationalitySwitchEligible(player)).toBe(false);
  });

  it("dovrebbe essere falso se il giocatore ha già cambiato nazionalità", () => {
    expect(isNationalitySwitchEligible({ ...eligiblePlayer(), hasSwitchedNationality: true })).toBe(false);
  });

  it("dovrebbe essere falso fuori dalla finestra 18-26", () => {
    expect(isNationalitySwitchEligible({ ...eligiblePlayer(), age: 17 })).toBe(false);
    expect(isNationalitySwitchEligible({ ...eligiblePlayer(), age: 27 })).toBe(false);
  });

  it("dovrebbe proporre una nazionalità diversa da quella attuale", () => {
    const decision = generateNationalitySwitch(eligiblePlayer(), FIXED_RNG);
    const switchOption = decision.options.find((o) => o.id === "switch");
    expect(switchOption?.newNationality).toBeDefined();
    expect(switchOption?.newNationality).not.toBe(eligiblePlayer().nationality);
  });

  it("l'opzione 'resta' non deve avere newNationality", () => {
    const decision = generateNationalitySwitch(eligiblePlayer(), FIXED_RNG);
    const stayOption = decision.options.find((o) => o.id === "stay");
    expect(stayOption?.newNationality).toBeUndefined();
  });
});

describe("LIFESTYLE_DECISIONS — nuovi eventi", () => {
  it("finish-high-school e honesty-test dovrebbero essere nel pool lifestyle", () => {
    const ids = LIFESTYLE_DECISIONS.map((d) => d.id);
    expect(ids).toContain("finish-high-school");
    expect(ids).toContain("honesty-test");
  });

  it("l'esito negativo di 'Sostanza misteriosa' dovrebbe squalificare (infortunare) il giocatore", () => {
    const mysteriousSubstance = LIFESTYLE_DECISIONS.find((d) => d.id === "mysterious-substance")!;
    const takeIt = mysteriousSubstance.options.find((o) => o.id === "take-it")!;
    const injury = takeIt.outcomes.find((o) => o.effect.injury);
    expect(injury?.effect.injury).toMatchObject({
      turnsRemaining: expect.any(Number),
      ovrPenalty: expect.any(Number),
    });
    const rejectIt = mysteriousSubstance.options.find((o) => o.id === "reject-it")!;
    expect(rejectIt.outcomes.every((o) => !o.effect.injury && !o.effect.ovrDelta)).toBe(true);
  });

  it("'Sostanza misteriosa' dovrebbe alzare shadow su entrambi gli esiti di 'Prendilo', di più se squalificato", () => {
    const mysteriousSubstance = LIFESTYLE_DECISIONS.find((d) => d.id === "mysterious-substance")!;
    const takeIt = mysteriousSubstance.options.find((o) => o.id === "take-it")!;
    const success = takeIt.outcomes.find((o) => !o.effect.injury)!;
    const suspension = takeIt.outcomes.find((o) => o.effect.injury)!;

    expect(success.effect.shadowDelta).toBe(26);
    expect(success.effect.shadowFlags).toEqual({ doped: true });
    expect(suspension.effect.shadowDelta).toBe(40);
    expect(suspension.effect.shadowFlags).toEqual({ doped: true });

    const rejectIt = mysteriousSubstance.options.find((o) => o.id === "reject-it")!;
    expect(rejectIt.outcomes[0].effect.shadowDelta).toBe(-5);
  });

  it("'Test di onestà': usare le informazioni dovrebbe alzare shadow, segnalarle dovrebbe abbassarlo", () => {
    const honestyTest = LIFESTYLE_DECISIONS.find((d) => d.id === "honesty-test")!;
    const useIt = honestyTest.options.find((o) => o.id === "use-it")!;
    const reportIt = honestyTest.options.find((o) => o.id === "report-it")!;

    expect(useIt.outcomes.every((o) => o.effect.shadowDelta === 14)).toBe(true);
    expect(useIt.outcomes.every((o) => o.effect.shadowFlags?.leakedTactics === true)).toBe(true);
    expect(reportIt.outcomes[0].effect.shadowDelta).toBe(-5);
    expect(reportIt.outcomes[0].effect.traitsDelta).toEqual({ discipline: 5, leadership: 7 });
  });
});

describe("generateEndOfCycle", () => {
  it("dovrebbe includere sempre l'opzione di ritiro esplicito", () => {
    const player = playerAt();
    const decision = generateEndOfCycle(player, FIXED_RNG);
    const retireOption = decision.options.find((o) => o.id === "retire");
    expect(retireOption?.retire).toBe(true);
    expect(retireOption?.club).toBeUndefined();
  });
});

describe("eventi condizionati dal contesto", () => {
  it("isTaxTroubleEligible dovrebbe essere vero quando il giocatore ha un club", () => {
    expect(isTaxTroubleEligible(playerAt())).toBe(true);
    expect(isTaxTroubleEligible(createPlayer(IDENTITY))).toBe(false);
  });

  it("generateTaxTrouble dovrebbe proporre un club estero come alternativa", () => {
    const player = playerAt();
    const decision = generateTaxTrouble(player, FIXED_RNG);
    const leave = decision.options.find((o) => o.id === "leave");
    expect(leave?.club?.country).not.toBe(player.club!.country);
  });

  it("generateTaxTrouble: restare (gestione sporca) dovrebbe alzare shadow", () => {
    const player = playerAt();
    const decision = generateTaxTrouble(player, FIXED_RNG);
    const stay = decision.options.find((o) => o.id === "stay")!;
    expect(stay.outcomes[0].effect.shadowDelta).toBe(21);
    expect(stay.outcomes[0].effect.shadowFlags).toEqual({ taxEvaded: true });
  });

  it("isReturnHomeEligible dovrebbe essere falso se il club è già nel paese di nazionalità", () => {
    const player = playerAt(getClub("juventus")!); // Italy, nazionalità Italy
    expect(isReturnHomeEligible(player)).toBe(false);
  });

  it("isReturnHomeEligible dovrebbe essere vero se c'è mismatch e club disponibili in patria", () => {
    const brazilianAbroad: Player = {
      ...playerAt(getClub("juventus")!),
      nationality: "Brazil",
    };
    expect(isReturnHomeEligible(brazilianAbroad)).toBe(true);
  });

  it("isReturnHomeEligible dovrebbe essere vero per un portoghese all'estero (copertura club estesa)", () => {
    const portugueseAbroad: Player = {
      ...playerAt(getClub("juventus")!),
      nationality: "Portugal",
    };
    expect(isReturnHomeEligible(portugueseAbroad)).toBe(true);
  });

  it("generateReturnHome dovrebbe proporre un club del paese di nazionalità", () => {
    const brazilianAbroad: Player = {
      ...playerAt(getClub("juventus")!),
      nationality: "Brazil",
    };
    const decision = generateReturnHome(brazilianAbroad, FIXED_RNG);
    const returnOption = decision.options.find((o) => o.id === "return");
    expect(returnOption?.club?.country).toBe("Brazil");
  });
});

describe("nationalCallupChance e rollNationalCallup", () => {
  it("dovrebbe essere zero sotto la soglia minima", () => {
    expect(nationalCallupChance(70)).toBe(0);
  });

  it("dovrebbe crescere con l'OVR e restare limitata a 0.45", () => {
    expect(nationalCallupChance(115)).toBe(0.45);
    expect(nationalCallupChance(95)).toBeGreaterThan(nationalCallupChance(85));
  });

  it("rollNationalCallup dovrebbe restituire false se il giocatore è già stato convocato", () => {
    const player = { ...playerAt(), ovr: 90, nationalTeam: { called: true, apps: 5, goals: 1, assists: 1 } };
    expect(rollNationalCallup(player, () => 0)).toBe(false);
  });

  it("rollNationalCallup dovrebbe rispettare la probabilità calcolata", () => {
    const player = { ...playerAt(), ovr: 90 }; // chance ≈ 0.314
    expect(rollNationalCallup(player, () => 0.1)).toBe(true);
    expect(rollNationalCallup(player, () => 0.9)).toBe(false);
  });

  it("rollNationalCallup dovrebbe essere bloccato sopra la soglia di ban (shadow >= 75)", () => {
    const player = { ...playerAt(), ovr: 90, shadow: 75 };
    expect(rollNationalCallup(player, () => 0)).toBe(false);
  });

  it("rollNationalCallup dovrebbe essere moltiplicato dallo shadowMultiplier sotto la soglia di ban", () => {
    const player = { ...playerAt(), ovr: 90, shadow: 50 }; // chance ≈ 0.314 * 0.75 ≈ 0.235
    expect(rollNationalCallup(player, () => 0.2)).toBe(true);
    expect(rollNationalCallup(player, () => 0.3)).toBe(false);
  });
});

describe("penaltyScoreChance", () => {
  it("dovrebbe restare entro i limiti [0.4, 0.85]", () => {
    expect(penaltyScoreChance(30)).toBe(0.4);
    expect(penaltyScoreChance(200)).toBe(0.85);
  });

  it("dovrebbe crescere con l'OVR", () => {
    expect(penaltyScoreChance(90)).toBeGreaterThan(penaltyScoreChance(70));
  });
});

describe("generateContinentalFinalDecision", () => {
  it("dovrebbe avere due opzioni (sinistra/destra) con outcome che sommano a 100", () => {
    const player = playerAt();
    const decision = generateContinentalFinalDecision(player, "Champions League");
    expect(decision.options).toHaveLength(2);
    for (const option of decision.options) {
      const totalWeight = option.outcomes.reduce((sum, o) => sum + o.weight, 0);
      expect(totalWeight).toBe(100);
    }
  });

  it("il testo dell'esito dovrebbe citare la competizione passata", () => {
    const player = playerAt();
    const decision = generateContinentalFinalDecision(player, "Copa Libertadores");
    expect(decision.description).toContain("Copa Libertadores");
  });

  it("solo l'outcome vincente dovrebbe avere continentalWin: true", () => {
    const player = playerAt();
    const decision = generateContinentalFinalDecision(player, "Champions League");
    for (const option of decision.options) {
      const [winOutcome, loseOutcome] = option.outcomes;
      expect(winOutcome.continentalWin).toBe(true);
      expect(loseOutcome.continentalWin).toBeUndefined();
    }
  });

  it("gli id delle opzioni restano sempre left/right qualunque sia il template scelto (vincolo UI)", () => {
    const player = playerAt();
    for (const rngValue of [0, 0.4, 0.9]) {
      const decision = generateContinentalFinalDecision(player, "Champions League", () => rngValue);
      expect(decision.options.map((o) => o.id)).toEqual(["left", "right"]);
    }
  });

  it("dovrebbe variare titolo/descrizione in base al template scelto", () => {
    const player = playerAt();
    const titles = new Set(
      [0, 0.4, 0.9].map((rngValue) => generateContinentalFinalDecision(player, "Champions League", () => rngValue).title),
    );
    expect(titles.size).toBeGreaterThan(1);
  });
});

describe("cupUpsetWinChance", () => {
  it("dovrebbe restare entro i limiti [0.15, 0.45]", () => {
    expect(cupUpsetWinChance(30, 0, 3)).toBeGreaterThanOrEqual(0.15);
    expect(cupUpsetWinChance(99, 0, 2)).toBeLessThanOrEqual(0.45);
  });

  it("dovrebbe restare sempre sotto il 50% — è per definizione una sorpresa", () => {
    for (const ovr of [40, 60, 80, 99]) {
      for (const gap of [2, 3]) {
        expect(cupUpsetWinChance(ovr, 0, gap)).toBeLessThan(0.5);
      }
    }
  });

  it("dovrebbe crescere con l'OVR del giocatore", () => {
    expect(cupUpsetWinChance(85, 0, 3)).toBeGreaterThan(cupUpsetWinChance(60, 0, 3));
  });

  it("dovrebbe calare all'aumentare dello scarto di prestigio con l'avversario", () => {
    expect(cupUpsetWinChance(70, 0, 2)).toBeGreaterThan(cupUpsetWinChance(70, 0, 3));
  });
});

describe("pickCupUpsetOpponent", () => {
  it("dovrebbe restituire sempre un club di prestigio maggiore", () => {
    const carrarese = getClub("carrarese")!; // prestige 0
    for (const rngValue of [0, 0.3, 0.7, 0.99]) {
      const opponent = pickCupUpsetOpponent(carrarese, () => rngValue);
      expect(opponent.prestige).toBeGreaterThan(carrarese.prestige);
      expect(opponent.id).not.toBe(carrarese.id);
    }
  });

  it("dovrebbe preferire un avversario dello stesso paese quando disponibile", () => {
    const carrarese = getClub("carrarese")!; // Italia, prestige 0
    const opponent = pickCupUpsetOpponent(carrarese, () => 0);
    expect(opponent.country).toBe(carrarese.country);
  });
});

describe("generateCupUpsetDecision", () => {
  const underdog = getClub("carrarese")!;
  const giant = getClub("juventus")!;

  it("dovrebbe avere due opzioni (sinistra/destra) con outcome che sommano a 100", () => {
    const player = playerAt(underdog);
    const decision = generateCupUpsetDecision(player, giant, "Coppa Italia");
    expect(decision.options).toHaveLength(2);
    for (const option of decision.options) {
      const totalWeight = option.outcomes.reduce((sum, o) => sum + o.weight, 0);
      expect(totalWeight).toBe(100);
    }
  });

  it("il testo dell'esito dovrebbe citare l'avversario e la coppa passati", () => {
    const player = playerAt(underdog);
    const decision = generateCupUpsetDecision(player, giant, "Coppa Italia");
    expect(decision.description).toContain(giant.name);
    expect(decision.description).toContain("Coppa Italia");
  });

  it("solo l'outcome vincente dovrebbe avere cupUpsetWin: true, la sconfitta non deve penalizzare l'OVR", () => {
    const player = playerAt(underdog);
    const decision = generateCupUpsetDecision(player, giant, "Coppa Italia");
    for (const option of decision.options) {
      const [winOutcome, loseOutcome] = option.outcomes;
      expect(winOutcome.cupUpsetWin).toBe(true);
      expect(loseOutcome.cupUpsetWin).toBeUndefined();
      expect(loseOutcome.effect.ovrDelta).toBeUndefined();
      expect(loseOutcome.effect.popularityDelta).toBeGreaterThan(0);
    }
  });

  it("gli id delle opzioni restano sempre left/right qualunque sia il template scelto (vincolo UI)", () => {
    const player = playerAt(underdog);
    for (const rngValue of [0, 0.9]) {
      const decision = generateCupUpsetDecision(player, giant, "Coppa Italia", () => rngValue);
      expect(decision.options.map((o) => o.id)).toEqual(["left", "right"]);
    }
  });
});

describe("isSponsorEligible", () => {
  it("dovrebbe essere falso sotto la soglia di popolarità", () => {
    expect(isSponsorEligible({ popularity: 10 })).toBe(false);
  });

  it("dovrebbe essere vero alla soglia di popolarità o sopra", () => {
    expect(isSponsorEligible({ popularity: 25 })).toBe(true);
    expect(isSponsorEligible({ popularity: 80 })).toBe(true);
  });
});

describe("generateSponsorDeal", () => {
  it("ogni opzione dovrebbe avere outcome i cui pesi sommano a 100", () => {
    const player = { ...playerAt(), popularity: 40 };
    const decision = generateSponsorDeal(player, FIXED_RNG);
    for (const option of decision.options) {
      const totalWeight = option.outcomes.reduce((sum, o) => sum + o.weight, 0);
      expect(totalWeight).toBe(100);
    }
  });

  it("dovrebbe avere categoria sponsor e opzioni accetta/rifiuta", () => {
    const player = { ...playerAt(), popularity: 40 };
    const decision = generateSponsorDeal(player, FIXED_RNG);
    expect(decision.category).toBe("sponsor");
    expect(decision.options.map((o) => o.id)).toEqual(["accept", "decline"]);
  });

  it("accettare dovrebbe alzare showmanship su entrambi gli esiti pesati", () => {
    const player = { ...playerAt(), popularity: 40 };
    const decision = generateSponsorDeal(player, FIXED_RNG);
    const accept = decision.options.find((o) => o.id === "accept")!;
    expect(accept.outcomes.every((o) => o.effect.traitsDelta?.showmanship === 4)).toBe(true);
  });
});

describe("generateScandalDecision e generateRedemptionDecision", () => {
  it("generateScandalDecision dovrebbe avere categoria scandal e due opzioni deterministiche", () => {
    const player = playerAt();
    const decision = generateScandalDecision(player);
    expect(decision.category).toBe("scandal");
    expect(decision.options.map((o) => o.id)).toEqual(["come-clean", "deny-everything"]);
    for (const option of decision.options) {
      expect(option.outcomes).toHaveLength(1);
      expect(option.outcomes[0].effect.shadowFlags).toEqual({ scandalOccurred: true });
    }
  });

  it("gestire con trasparenza dovrebbe abbassare shadow, negare dovrebbe alzarlo", () => {
    const decision = generateScandalDecision(playerAt());
    const comeClean = decision.options.find((o) => o.id === "come-clean")!;
    const deny = decision.options.find((o) => o.id === "deny-everything")!;
    expect(comeClean.outcomes[0].effect.shadowDelta).toBeLessThan(0);
    expect(deny.outcomes[0].effect.shadowDelta).toBeGreaterThan(0);
  });

  it("generateRedemptionDecision dovrebbe avere categoria narrative e impostare shadowFlags.redeemed", () => {
    const decision = generateRedemptionDecision(playerAt());
    expect(decision.category).toBe("narrative");
    expect(decision.options).toHaveLength(1);
    expect(decision.options[0].outcomes[0].effect.shadowFlags).toEqual({ redeemed: true });
  });
});

describe("pickDecisionCategory", () => {
  it("dovrebbe lanciare un errore se non ci sono categorie disponibili", () => {
    expect(() => pickDecisionCategory([], [], FIXED_RNG)).toThrow();
  });

  it("dovrebbe rispettare i confini cumulativi dei pesi tra categorie", () => {
    const categories: DecisionCategory[] = ["transfer", "lifestyle"]; // pesi base 25 e 20 -> totale 45
    expect(pickDecisionCategory(categories, [], () => 0)).toBe("transfer");
    expect(pickDecisionCategory(categories, [], () => 0.99)).toBe("lifestyle");
  });

  it("dovrebbe penalizzare una categoria comparsa di recente", () => {
    const categories: DecisionCategory[] = ["transfer", "lifestyle"];
    // Senza ripetizione: soglia transfer/lifestyle a 25/45 = 0.5555
    // Con "transfer" penalizzato (25*0.15=3.75) su totale 23.75: soglia a 3.75/23.75 = 0.158
    const roll = 0.3; // sopra la soglia penalizzata, sotto quella non penalizzata
    expect(pickDecisionCategory(categories, [], () => roll)).toBe("transfer");
    expect(pickDecisionCategory(categories, ["transfer"], () => roll)).toBe("lifestyle");
  });
});

describe("favorableOutcomeWeight", () => {
  function option(outcomes: DecisionOption["outcomes"]): DecisionOption {
    return { id: "opt", label: "Opzione", outcomes };
  }

  it("dovrebbe restituire null per un'opzione deterministica (un solo outcome)", () => {
    const opt = option([{ weight: 100, effect: {}, resultText: "..." }]);
    expect(favorableOutcomeWeight(opt)).toBeNull();
  });

  it("dovrebbe scegliere l'outcome con ovrDelta più alto", () => {
    const opt = option([
      { weight: 30, effect: { ovrDelta: 3 }, resultText: "buono" },
      { weight: 70, effect: { ovrDelta: -2 }, resultText: "cattivo" },
    ]);
    expect(favorableOutcomeWeight(opt)).toBe(30);
  });

  it("a parità di ovrDelta dovrebbe preferire l'outcome senza infortunio", () => {
    const opt = option([
      {
        weight: 40,
        effect: { ovrDelta: 0, injury: { label: "Infortunio muscolare", turnsRemaining: 1, ovrPenalty: 2 } },
        resultText: "rischio",
      },
      { weight: 60, effect: { ovrDelta: 0 }, resultText: "sicuro" },
    ]);
    expect(favorableOutcomeWeight(opt)).toBe(60);
  });

  it("a parità di ovrDelta e infortunio dovrebbe preferire savings/popularity più alti", () => {
    const opt = option([
      { weight: 45, effect: { ovrDelta: 1, savingsDelta: 100 }, resultText: "ricco" },
      { weight: 55, effect: { ovrDelta: 1, savingsDelta: 10 }, resultText: "povero" },
    ]);
    expect(favorableOutcomeWeight(opt)).toBe(45);
  });
});
