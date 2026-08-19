import { describe, expect, it } from "vitest";
import type { Player, PlayerIdentity } from "@/types/career";
import { getClub } from "@/data/clubs";
import { createPlayer, signWithClub } from "./engine";
import {
  availableCategories,
  INITIAL_LOOP_CONTEXT,
  nextLoopContext,
  pickNextDecision,
  pickStaticDecision,
  pushRecentCategory,
  resolveCycle,
  shouldTriggerClauseActivation,
  shouldTriggerContinentalFinal,
  shouldTriggerCupUpset,
  shouldTriggerDecisiveMatch,
  type LoopContext,
} from "./loop";
import { getRelation } from "./relations";

const IDENTITY: PlayerIdentity = {
  lastName: "Rossi",
  number: 10,
  foot: "right",
  nationality: "Italy",
  position: "ST",
};

const JUVENTUS = getClub("juventus")!;
const SEVILLA = getClub("sevilla")!;
const SAMPDORIA = getClub("sampdoria")!; // Serie B, prestige 1
const FIXED_RNG = () => 0.5;

function playerAt(club = JUVENTUS): Player {
  // Potenziale fissato a 99: molti test qui impostano un OVR alto ad hoc, e un potenziale
  // rollato a caso (createPlayer usa Math.random di default) potrebbe capitare sotto quel
  // valore, facendolo scendere silenziosamente in advanceSeasons/applyDelta.
  return { ...signWithClub(createPlayer(IDENTITY), club), potential: 99 };
}

describe("availableCategories", () => {
  it("dovrebbe restituire solo loan-return se il giocatore è in prestito", () => {
    const context: LoopContext = { loanParentClub: JUVENTUS };
    expect(availableCategories(playerAt(SEVILLA), context)).toEqual(["loan-return"]);
  });

  it("dovrebbe restituire end-of-cycle come unica categoria se il giocatore non ha un club", () => {
    expect(availableCategories(createPlayer(IDENTITY), INITIAL_LOOP_CONTEXT)).toEqual(["end-of-cycle"]);
  });

  it("dovrebbe includere le categorie standard per un giocatore con club permanente", () => {
    const categories = availableCategories(playerAt(), INITIAL_LOOP_CONTEXT);
    expect(categories).toEqual(
      expect.arrayContaining(["transfer", "loan", "lifestyle", "position-change", "club-crisis", "end-of-cycle"]),
    );
    expect(categories).not.toContain("training-focus");
    expect(categories).not.toContain("narrative");
  });

  it("dovrebbe includere sponsor solo sopra la soglia di popolarità", () => {
    const belowThreshold = { ...playerAt(), popularity: 10 };
    const aboveThreshold = { ...playerAt(), popularity: 40 };
    expect(availableCategories(belowThreshold, INITIAL_LOOP_CONTEXT)).not.toContain("sponsor");
    expect(availableCategories(aboveThreshold, INITIAL_LOOP_CONTEXT)).toContain("sponsor");
  });

  it("dovrebbe includere agent per un giocatore con club (clausola già impostata alla firma)", () => {
    expect(availableCategories(playerAt(), INITIAL_LOOP_CONTEXT)).toContain("agent");
  });

  it("dovrebbe includere narrative per un straniero adulto (grane fiscali)", () => {
    const abroad: Player = { ...playerAt(), nationality: "Brazil", age: 24 };
    expect(availableCategories(abroad, INITIAL_LOOP_CONTEXT)).toContain("narrative");
  });

  it("dovrebbe includere narrative per un giovane in un club a basso prestigio (unexpected-prospect)", () => {
    const youngLowPrestige = playerAt(getClub("reggiana")!);
    expect(availableCategories(youngLowPrestige, INITIAL_LOOP_CONTEXT)).toContain("narrative");
  });

  it("dovrebbe includere narrative per un veterano lontano dal primo club (triumphant-return)", () => {
    const firstClub = getClub("reggiana")!;
    const veteran: Player = {
      ...playerAt(),
      age: 34,
      clubHistory: [
        { club: firstClub, ageFrom: 16, ageTo: 18, type: "permanent", stats: { apps: 0, goals: 0, assists: 0 }, ovr: 55 },
      ],
    };
    expect(availableCategories(veteran, INITIAL_LOOP_CONTEXT)).toContain("narrative");
  });

  it("dovrebbe includere narrative per un giocatore eleggibile alla redenzione", () => {
    const redeemable: Player = {
      ...playerAt(),
      shadow: 10,
      shadowFlags: { scandalOccurred: true },
    };
    expect(availableCategories(redeemable, INITIAL_LOOP_CONTEXT)).toContain("narrative");
  });

  it("dovrebbe includere narrative se l'agente propone un deal grigio", () => {
    const base = playerAt();
    const cold = {
      ...base,
      relations: base.relations.map((rel) =>
        rel.id === "agent" ? { ...rel, affinity: -1 as const } : rel,
      ),
    };
    expect(availableCategories(cold, INITIAL_LOOP_CONTEXT)).toContain("narrative");
  });
});

describe("shouldTriggerContinentalFinal", () => {
  it("dovrebbe essere falso se il giocatore è in prestito", () => {
    const context: LoopContext = { loanParentClub: JUVENTUS };
    expect(shouldTriggerContinentalFinal({ ...playerAt(), ovr: 90 }, context, () => 0)).toBe(false);
  });

  it("dovrebbe essere falso se il club non ha coppa continentale", () => {
    const noContinentalClub = { ...JUVENTUS, competitions: { league: "Serie A" } };
    const player = signWithClub({ ...playerAt(), ovr: 90 }, noContinentalClub);
    expect(shouldTriggerContinentalFinal(player, INITIAL_LOOP_CONTEXT, () => 0)).toBe(false);
  });

  it("dovrebbe essere falso se l'OVR è sotto soglia", () => {
    const player = { ...playerAt(), ovr: 70 };
    expect(shouldTriggerContinentalFinal(player, INITIAL_LOOP_CONTEXT, () => 0)).toBe(false);
  });

  it("dovrebbe essere vero se club/OVR sono eleggibili e il roll è favorevole", () => {
    const player = { ...playerAt(), ovr: 85 };
    expect(shouldTriggerContinentalFinal(player, INITIAL_LOOP_CONTEXT, () => 0)).toBe(true);
  });
});

describe("shouldTriggerCupUpset", () => {
  it("dovrebbe essere falso se il giocatore è in prestito", () => {
    const context: LoopContext = { loanParentClub: JUVENTUS };
    expect(shouldTriggerCupUpset(playerAt(SAMPDORIA), context, () => 0)).toBe(false);
  });

  it("dovrebbe essere falso se il club è sopra la soglia di prestigio sottodotato", () => {
    expect(shouldTriggerCupUpset(playerAt(JUVENTUS), INITIAL_LOOP_CONTEXT, () => 0)).toBe(false);
  });

  it("dovrebbe essere falso se il club non ha una coppa nazionale (es. Messico, Copa MX sospesa)", () => {
    const necaxa = getClub("necaxa")!; // prestige 0, Liga MX, nessuna coppa nazionale attiva
    expect(shouldTriggerCupUpset(playerAt(necaxa), INITIAL_LOOP_CONTEXT, () => 0)).toBe(false);
  });

  it("dovrebbe essere vero se il club è sottodotato e il roll è favorevole", () => {
    expect(shouldTriggerCupUpset(playerAt(SAMPDORIA), INITIAL_LOOP_CONTEXT, () => 0)).toBe(true);
  });

  it("dovrebbe rispettare la soglia di probabilità", () => {
    expect(shouldTriggerCupUpset(playerAt(SAMPDORIA), INITIAL_LOOP_CONTEXT, () => 0.99)).toBe(false);
  });
});

describe("shouldTriggerDecisiveMatch", () => {
  it("dovrebbe essere falso se il giocatore è in prestito", () => {
    const context: LoopContext = { loanParentClub: JUVENTUS };
    expect(shouldTriggerDecisiveMatch({ ...playerAt(), ovr: 80 }, context, () => 0)).toBe(false);
  });

  it("dovrebbe essere falso se il prestige del club è sotto soglia", () => {
    expect(shouldTriggerDecisiveMatch({ ...playerAt(SAMPDORIA), ovr: 80 }, INITIAL_LOOP_CONTEXT, () => 0)).toBe(false);
  });

  it("dovrebbe essere falso se l'OVR è sotto soglia", () => {
    expect(shouldTriggerDecisiveMatch({ ...playerAt(), ovr: 70 }, INITIAL_LOOP_CONTEXT, () => 0)).toBe(false);
  });

  it("dovrebbe essere vero se club/OVR sono eleggibili e il roll è favorevole", () => {
    expect(shouldTriggerDecisiveMatch({ ...playerAt(), ovr: 80 }, INITIAL_LOOP_CONTEXT, () => 0)).toBe(true);
  });
});

describe("shouldTriggerClauseActivation", () => {
  it("dovrebbe essere falso se il giocatore è in prestito", () => {
    const context: LoopContext = { loanParentClub: JUVENTUS };
    const player = { ...playerAt(SAMPDORIA), ovr: 75 };
    expect(shouldTriggerClauseActivation(player, context, () => 0)).toBe(false);
  });

  it("dovrebbe essere falso senza club", () => {
    expect(shouldTriggerClauseActivation(createPlayer(IDENTITY), INITIAL_LOOP_CONTEXT, () => 0)).toBe(false);
  });

  it("dovrebbe essere falso se non esiste un pretendente di prestigio superiore (club già al top)", () => {
    const player = { ...playerAt(JUVENTUS), ovr: 95 };
    expect(shouldTriggerClauseActivation(player, INITIAL_LOOP_CONTEXT, () => 0)).toBe(false);
  });

  it("dovrebbe essere vero se esiste un pretendente e il roll è favorevole", () => {
    const player = { ...playerAt(SAMPDORIA), ovr: 75 };
    expect(shouldTriggerClauseActivation(player, INITIAL_LOOP_CONTEXT, () => 0)).toBe(true);
  });

  it("dovrebbe rispettare la soglia di probabilità", () => {
    const player = { ...playerAt(SAMPDORIA), ovr: 75 };
    expect(shouldTriggerClauseActivation(player, INITIAL_LOOP_CONTEXT, () => 0.99)).toBe(false);
  });
});

describe("pickNextDecision — scandalo forzato", () => {
  it("dovrebbe generare uno scandalo forzato quando shadow supera la soglia", () => {
    const player = { ...playerAt(JUVENTUS), ovr: 70, shadow: 60 };
    const { decision, category } = pickNextDecision(player, INITIAL_LOOP_CONTEXT, [], () => 0);
    expect(category).toBe("scandal");
    expect(decision.category).toBe("scandal");
  });

  it("non dovrebbe ripetere lo scandalo se è già capitato di recente", () => {
    const player = { ...playerAt(JUVENTUS), ovr: 70, shadow: 60 };
    const { category } = pickNextDecision(player, INITIAL_LOOP_CONTEXT, ["scandal"], () => 0);
    expect(category).not.toBe("scandal");
  });

  it("non dovrebbe scattare sotto la soglia di shadow", () => {
    const player = { ...playerAt(JUVENTUS), ovr: 70, shadow: 20 };
    const { category } = pickNextDecision(player, INITIAL_LOOP_CONTEXT, [], () => 0);
    expect(category).not.toBe("scandal");
  });
});

describe("pickNextDecision — attivazione forzata della clausola", () => {
  it("dovrebbe generare l'attivazione della clausola quando esiste un pretendente e il roll è favorevole", () => {
    // Necaxa (Messico, prestige 0): niente coppa nazionale (Copa MX sospesa) e OVR sotto soglia
    // per la finale continentale — isola il trigger dell'attivazione clausola dagli altri eventi
    // forzati che hanno priorità più alta in pickNextDecision.
    const necaxa = getClub("necaxa")!;
    const player = { ...playerAt(necaxa), ovr: 75 };
    const { decision, category } = pickNextDecision(player, INITIAL_LOOP_CONTEXT, [], () => 0);
    expect(category).toBe("clause-activation");
    expect(decision.category).toBe("clause-activation");
  });

  it("non dovrebbe scattare senza un pretendente eleggibile (club già al top)", () => {
    const player = { ...playerAt(JUVENTUS), ovr: 95, shadow: 0 };
    const { category } = pickNextDecision(player, INITIAL_LOOP_CONTEXT, [], () => 0);
    expect(category).not.toBe("clause-activation");
  });
});

describe("pickNextDecision", () => {
  it("dovrebbe generare la finale di coppa continentale quando le condizioni sono soddisfatte", () => {
    const player = { ...playerAt(), ovr: 90 };
    const { decision, category } = pickNextDecision(player, INITIAL_LOOP_CONTEXT, [], () => 0);
    expect(category).toBe("continental-final");
    expect(decision.category).toBe("continental-final");
  });

  it("dovrebbe generare una sorpresa di coppa quando il club è sottodotato e le condizioni sono soddisfatte", () => {
    const player = playerAt(SAMPDORIA);
    const { decision, category } = pickNextDecision(player, INITIAL_LOOP_CONTEXT, [], () => 0);
    expect(category).toBe("cup-upset");
    expect(decision.category).toBe("cup-upset");
  });

  it("dovrebbe generare una partita decisiva quando continentale e coppa non scattano", () => {
    // OVR sotto la soglia della finale continentale (78), prestige troppo alto per la sorpresa di coppa.
    const player = { ...playerAt(), ovr: 76 };
    const { decision, category } = pickNextDecision(player, INITIAL_LOOP_CONTEXT, [], () => 0);
    expect(category).toBe("decisive-match");
    expect(decision.category).toBe("decisive-match");
    expect(decision.title).toBe("Partita decisiva");
  });

  it("dovrebbe generare una loan-return se il giocatore è in prestito", () => {
    const context: LoopContext = { loanParentClub: JUVENTUS };
    const player = signWithClub(playerAt(SEVILLA), SEVILLA);
    const { decision, category } = pickNextDecision(player, context, [], FIXED_RNG);
    expect(category).toBe("loan-return");
    expect(decision.category).toBe("loan-return");
  });

  it("dovrebbe lanciare un errore se scelta la categoria narrative senza eventi eleggibili", () => {
    // Nessun mismatch nazionalità/club e nessun evento tax-trouble applicabile qui: la categoria
    // narrative non dovrebbe mai essere restituita da availableCategories in questo scenario,
    // quindi pickNextDecision non dovrebbe lanciare per un giocatore italiano alla Juventus.
    const player = playerAt();
    expect(() => pickNextDecision(player, INITIAL_LOOP_CONTEXT, [], () => 0.999)).not.toThrow();
  });

  it("aggiorna context.recentDecisionIds con il kind dell'evento scelto (club-crisis)", () => {
    const player = playerAt();
    const next = pickNextDecision(player, INITIAL_LOOP_CONTEXT, [], () => 0.5);
    if (next.category === "club-crisis" || next.category === "lifestyle" || next.category === "narrative") {
      expect(next.context.recentDecisionIds?.length).toBeGreaterThan(0);
    }
  });

  it("penalizza un generatore club-crisis scelto di recente rispetto a uno non scelto di recente", () => {
    // PRNG deterministico (mulberry32): stessa sequenza ad ogni run, statistico su molte prove.
    function mulberry32(seed: number) {
      let a = seed;
      return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const rng = mulberry32(123);
    const player = playerAt();
    // "club-crisis" (il kind, non la categoria) è penalizzato; "controversial-post" è un altro
    // generatore sempre disponibile della stessa categoria, mai penalizzato in questo scenario.
    const biasedContext: LoopContext = { loanParentClub: null, recentDecisionIds: ["club-crisis"] };

    let biasedKindCount = 0;
    let freshKindCount = 0;
    for (let i = 0; i < 4000; i++) {
      const next = pickNextDecision(player, biasedContext, [], rng);
      if (next.category !== "club-crisis") continue;
      if (next.decision.id === `club-crisis-${player.age}`) biasedKindCount += 1;
      if (next.decision.id === `controversial-post-${player.age}`) freshKindCount += 1;
    }

    expect(biasedKindCount).toBeGreaterThan(0);
    expect(freshKindCount).toBeGreaterThan(biasedKindCount * 2);
  });
});

describe("nextLoopContext", () => {
  it("dovrebbe impostare il club di appartenenza quando si va in prestito", () => {
    const player = playerAt(JUVENTUS);
    const option = { id: "loan-sevilla", label: "Vai in prestito", club: SEVILLA, outcomes: [] };
    const context = nextLoopContext("loan", option, player, INITIAL_LOOP_CONTEXT);
    expect(context.loanParentClub).toEqual(JUVENTUS);
  });

  it("non dovrebbe impostare il prestito se si resta a lottare per il posto", () => {
    const player = playerAt(JUVENTUS);
    const option = { id: "stay", label: "Resta", club: JUVENTUS, outcomes: [] };
    const context = nextLoopContext("loan", option, player, INITIAL_LOOP_CONTEXT);
    expect(context.loanParentClub).toBeNull();
  });

  it("dovrebbe azzerare il club di appartenenza firmando a titolo definitivo dal prestito", () => {
    const player = signWithClub(playerAt(SEVILLA), SEVILLA);
    const option = { id: "sign-permanent", label: "Firma a titolo definitivo", club: SEVILLA, outcomes: [] };
    const context = nextLoopContext("loan-return", option, player, { loanParentClub: JUVENTUS });
    expect(context.loanParentClub).toBeNull();
  });

  it("dovrebbe mantenere il club di appartenenza se si sceglie un nuovo prestito", () => {
    const player = signWithClub(playerAt(SEVILLA), SEVILLA);
    const option = { id: "loan-other", label: "Altro prestito", club: getClub("las-palmas")!, outcomes: [] };
    const context = nextLoopContext("loan-return", option, player, { loanParentClub: JUVENTUS });
    expect(context.loanParentClub).toEqual(JUVENTUS);
    expect(context.loanReturnBounces).toBe(1);
  });

  it("dovrebbe risolvere forzatamente il prestito oltre il tetto di rimbalzi, anche scegliendo un altro prestito", () => {
    const player = signWithClub(playerAt(SEVILLA), SEVILLA);
    const option = { id: "loan-other", label: "Altro prestito", club: getClub("las-palmas")!, outcomes: [] };
    const context = nextLoopContext("loan-return", option, player, {
      loanParentClub: JUVENTUS,
      loanReturnBounces: 1,
    });
    expect(context.loanParentClub).toBeNull();
  });

  it("dovrebbe azzerare il club di appartenenza firmando a titolo definitivo a qualunque numero di rimbalzi", () => {
    const player = signWithClub(playerAt(SEVILLA), SEVILLA);
    const option = { id: "sign-permanent", label: "Firma a titolo definitivo", club: SEVILLA, outcomes: [] };
    const context = nextLoopContext("loan-return", option, player, {
      loanParentClub: JUVENTUS,
      loanReturnBounces: 0,
    });
    expect(context.loanParentClub).toBeNull();
  });

  it("dovrebbe azzerare il club di appartenenza per un trasferimento permanente ordinario", () => {
    const player = playerAt();
    const option = { id: "sign-x", label: "Firma", club: SEVILLA, outcomes: [] };
    const context = nextLoopContext("transfer", option, player, INITIAL_LOOP_CONTEXT);
    expect(context.loanParentClub).toBeNull();
  });
});

describe("resolveCycle", () => {
  it("dovrebbe ritirare il giocatore se l'opzione ha retire: true, senza avanzare stagioni", () => {
    const player = playerAt();
    const option = { id: "retire", label: "Ritirati", retire: true, outcomes: [{ weight: 100, effect: {}, resultText: "Fine carriera." }] };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "end-of-cycle", option, "normal", () => 0.5);

    expect(result.retired).toBe(true);
    expect(result.player.retired).toBe(true);
    expect(result.player.age).toBe(player.age);
  });

  it("dovrebbe firmare il nuovo club e avanzare le stagioni in base alla velocità", () => {
    const player = playerAt();
    const option = { id: "sign", label: "Firma per Sevilla", club: SEVILLA, outcomes: [{ weight: 100, effect: {}, resultText: "Firmato." }] };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "transfer", option, "normal", () => 0.99);

    expect(result.player.club).toEqual(SEVILLA);
    expect(result.player.age).toBe(player.age + 2); // normal = 2 stagioni per ciclo
  });

  it("dovrebbe restare in prestito quando si sceglie un'opzione di prestito", () => {
    const player = playerAt();
    const option = { id: "loan", label: "Vai in prestito", club: SEVILLA, outcomes: [{ weight: 100, effect: {}, resultText: "In prestito." }] };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "loan", option, "normal", () => 0.99);

    expect(result.context.loanParentClub).toEqual(JUVENTUS);
  });

  it("dovrebbe alzare leadership quando scatta la convocazione in nazionale", () => {
    const player = { ...playerAt(), ovr: 95 };
    const option = { id: "sign", label: "Firma", club: JUVENTUS, outcomes: [{ weight: 100, effect: {}, resultText: "Firmato." }] };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "transfer", option, "normal", () => 0);

    expect(result.nationalCallup).toBe(true);
    expect(result.player.traits.leadership).toBeGreaterThan(player.traits.leadership);
  });

  it("dovrebbe assegnare il trofeo continentale se la finale è vinta", () => {
    const player = { ...playerAt(), ovr: 90 };
    const option = {
      id: "left",
      label: "Sinistra",
      outcomes: [
        {
          weight: 100,
          effect: {},
          resultText: `Gol! Vinci la finale di ${JUVENTUS.competitions.continental}.`,
          continentalWin: true,
        },
      ],
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "continental-final", option, "normal", () => 0);

    expect(result.newTrophies.some((t) => t.competition === JUVENTUS.competitions.continental)).toBe(true);
  });

  it("non dovrebbe assegnare il trofeo continentale se la finale è persa", () => {
    const player = { ...playerAt(), ovr: 90 };
    const option = {
      id: "left",
      label: "Sinistra",
      outcomes: [{ weight: 100, effect: { ovrDelta: -1 }, resultText: `Il portiere para il rigore. Perdi la finale di ${JUVENTUS.competitions.continental}.` }],
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "continental-final", option, "normal", () => 0);

    expect(result.newTrophies.some((t) => t.competition === JUVENTUS.competitions.continental)).toBe(false);
  });

  it("dovrebbe assegnare il trofeo di coppa se la sorpresa è vinta", () => {
    const player = playerAt(SAMPDORIA);
    const option = {
      id: "left",
      label: "Sinistra",
      outcomes: [
        {
          weight: 100,
          effect: {},
          resultText: `Gol! Il tuo club sovverte il pronostico in ${SAMPDORIA.competitions.cup}.`,
          cupUpsetWin: true,
        },
      ],
    };
    // rng alto per evitare che rollClubTrophies assegni incidentalmente anche il trofeo di lega.
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "cup-upset", option, "normal", () => 0.99);

    expect(result.newTrophies.some((t) => t.competition === SAMPDORIA.competitions.cup)).toBe(true);
  });

  it("non dovrebbe assegnare il trofeo di coppa se la sorpresa è persa", () => {
    const player = playerAt(SAMPDORIA);
    const option = {
      id: "left",
      label: "Sinistra",
      outcomes: [{ weight: 100, effect: { popularityDelta: 3 }, resultText: "Niente impresa." }],
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "cup-upset", option, "normal", () => 0.99);

    expect(result.newTrophies.some((t) => t.competition === SAMPDORIA.competitions.cup)).toBe(false);
  });

  it("dovrebbe assegnare il trofeo di campionato se la partita decisiva è vinta", () => {
    const player = { ...playerAt(), ovr: 80 };
    const option = {
      id: "tactic-possesso",
      label: "Possesso palla",
      outcomes: [
        {
          weight: 100,
          effect: {},
          resultText: `Il piano funziona: sollevi il trofeo di ${JUVENTUS.competitions.league}.`,
          leagueWin: true,
        },
      ],
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "decisive-match", option, "normal", () => 0.99);

    expect(result.newTrophies.filter((t) => t.competition === JUVENTUS.competitions.league)).toHaveLength(1);
  });

  it("non dovrebbe assegnare il campionato offscreen se la partita decisiva è persa", () => {
    const player = { ...playerAt(), ovr: 90 };
    const option = {
      id: "tactic-possesso",
      label: "Possesso palla",
      outcomes: [{ weight: 100, effect: {}, resultText: "Il piano non basta: il titolo sfuma all'ultimo." }],
    };
    // Intense (1 stagione): quell'unica stagione è anche l'ultima, quindi il roll automatico di
    // campionato per posizione viene escluso del tutto su `decisive-match` (vedi
    // `newTrophiesForCycle`/`skipLeagueOnLastStint`) — con "normal" (2 stagioni) la prima
    // stagione, non toccata dall'evento forzato, potrebbe vincere il campionato per conto suo con
    // un rng che favorisce sempre il piazzamento migliore, confondendo l'assert.
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "decisive-match", option, "intense", () => 0);

    expect(result.newTrophies.some((t) => t.competition === JUVENTUS.competitions.league)).toBe(false);
  });

  it("dovrebbe far nascere un rivale da OVR 78", () => {
    const player = { ...playerAt(), ovr: 78 };
    const option = { id: "stay", label: "Resta", outcomes: [{ weight: 100, effect: {}, resultText: "Resti." }] };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "lifestyle", option, "normal", () => 0.99);
    expect(result.player.relations.some((rel) => rel.id === "rival")).toBe(true);
  });

  it("dovrebbe promuovere il club se il piazzamento di campionato è tra i primi (rng al minimo = rumore più favorevole)", () => {
    const player = { ...playerAt(SAMPDORIA), ovr: 95 };
    const option = { id: "stay", label: "Resta", outcomes: [{ weight: 100, effect: {}, resultText: "Resti." }] };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "lifestyle", option, "normal", () => 0);

    expect(result.clubTierChange).toBe("promoted");
    expect(result.player.club?.tier).toBe(1);
    expect(result.player.club?.competitions.league).toBe("Serie A");
  });

  it("dovrebbe retrocedere il club se il piazzamento di campionato è tra gli ultimi (rng al massimo = rumore più sfavorevole)", () => {
    // Intense (1 stagione): con "normal" (2 stagioni) e un rng costante al peggio per entrambe,
    // la Juventus a prestigio 0 retrocede due volte nello stesso ciclo (Serie A → B → C),
    // corretto ma non quello che questo test vuole isolare (una singola transizione).
    const player = playerAt({ ...JUVENTUS, prestige: 0 });
    const option = { id: "stay", label: "Resta", outcomes: [{ weight: 100, effect: {}, resultText: "Resti." }] };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "lifestyle", option, "intense", () => 0.999);

    expect(result.clubTierChange).toBe("relegated");
    expect(result.player.club?.tier).toBe(2);
    expect(result.player.club?.competitions.league).toBe("Serie B");
  });

  it("dovrebbe riportare la lega di partenza del club appena firmato, non quella del club lasciato, se cambio club e retrocessione avvengono nello stesso ciclo", () => {
    // Il giocatore lascia la Sampdoria (Serie B) e firma per una Juventus a prestige 0 (Serie A):
    // la stessa mossa che, nello stesso ciclo, retrocede la neo-firmata "Juventus" in Serie B —
    // stesso nome lega di arrivo della Sampdoria appena lasciata. Prima del fix, il testo
    // "Retrocessione: X → Y" derivava X dal club PRIMA DELL'INTERO CICLO (Sampdoria, Serie B),
    // producendo "Serie B → Serie B" invece della vera transizione "Serie A → Serie B" del club
    // appena firmato.
    const player = playerAt(SAMPDORIA);
    const option = {
      id: "transfer-juve",
      label: "Firma per la Juventus",
      club: { ...JUVENTUS, prestige: 0 as const },
      outcomes: [{ weight: 100, effect: {}, resultText: "Firmi un nuovo contratto." }],
    };
    // Intense (1 stagione): stesso motivo del test di retrocessione sopra — con "normal" (2
    // stagioni) e rng costante al peggio, la seconda stagione può retrocedere una seconda volta
    // (Serie B → Serie C), e la soglia è abbastanza sottile da poter oscillare in base agli
    // attributi di partenza (rollati con `Math.random` non seedato in `createPlayer`/`playerAt`),
    // rendendo il test intermittente — una sola stagione isola la singola transizione voluta.
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "transfer", option, "intense", () => 0.999);

    expect(result.clubTierChange).toBe("relegated");
    expect(result.player.club?.competitions.league).toBe("Serie B");
    expect(result.clubTierMovementFromLeague).toBe("Serie A");
  });

  it("dovrebbe cambiare la nazionalità del giocatore se l'opzione ha newNationality", () => {
    const player = playerAt();
    const option = {
      id: "switch",
      label: "Scegli la nazionalità Brazil",
      newNationality: "Brazil",
      outcomes: [{ weight: 100, effect: {}, resultText: "Cambi nazionalità sportiva." }],
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "narrative", option, "normal", () => 0.5);

    expect(result.player.nationality).toBe("Brazil");
    expect(result.player.hasSwitchedNationality).toBe(true);
  });
});

describe("resolveCycle — gestione infortuni", () => {
  const lifestyleOption = {
    id: "x",
    label: "Opzione",
    outcomes: [{ weight: 100, effect: {}, resultText: "Nessun cambiamento." }],
  };

  it("dovrebbe poter infortunare il giocatore in un ciclo (rng minimo -> chance sempre superata)", () => {
    const player = playerAt();
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "lifestyle", lifestyleOption, "normal", () => 0);

    expect(result.newInjury).not.toBeNull();
    expect(result.player.injury).toEqual(result.newInjury);
    expect(result.injuryHealed).toBe(false);
  });

  it("dovrebbe far guarire un infortunio già attivo invece di infortunare di nuovo", () => {
    const player = {
      ...playerAt(),
      injury: { label: "Distorsione alla caviglia", turnsRemaining: 1, ovrPenalty: 4 },
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "lifestyle", lifestyleOption, "normal", () => 0);

    expect(result.injuryHealed).toBe(true);
    expect(result.player.injury).toBeNull();
    expect(result.newInjury).toBeNull();
  });

  it("dovrebbe far avanzare un infortunio con più cicli residui senza guarirlo subito", () => {
    const player = {
      ...playerAt(),
      injury: { label: "Distorsione alla caviglia", turnsRemaining: 2, ovrPenalty: 4 },
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "lifestyle", lifestyleOption, "normal", () => 0);

    expect(result.injuryHealed).toBe(false);
    expect(result.player.injury).toEqual({
      label: "Distorsione alla caviglia",
      turnsRemaining: 1,
      ovrPenalty: 4,
    });
  });

  it("non dovrebbe tickare un infortunio appena applicato da un evento, e deve applicare il malus OVR", () => {
    const player = playerAt();
    const option = {
      id: "train-hard",
      label: "Allenati duramente",
      outcomes: [
        {
          weight: 100,
          effect: { injury: { label: "Distorsione alla caviglia", turnsRemaining: 2, ovrPenalty: 4 } },
          resultText: "Infortunio.",
        },
      ],
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "lifestyle", option, "normal", () => 0.99);

    expect(result.newInjury).toEqual({ label: "Distorsione alla caviglia", turnsRemaining: 2, ovrPenalty: 4 });
    expect(result.player.injury?.turnsRemaining).toBe(2);
    // Lo Storico deve riflettere l'OVR finale (già penalizzato dall'infortunio), non un valore
    // intermedio pre-infortunio — vedi BUG-01.
    const stintOvr = result.player.clubHistory[result.player.clubHistory.length - 1]!.ovr;
    expect(stintOvr).toBe(result.player.ovr);
    expect(result.injuryHealed).toBe(false);
  });

  it("non dovrebbe disallineare lo Storico dall'OVR reale quando crescita OVR e infortunio coincidono nello stesso ciclo (BUG-01)", () => {
    const player = { ...playerAt(), ovr: 50 };
    const option = {
      id: "breakout",
      label: "Stagione da protagonista",
      outcomes: [
        {
          weight: 100,
          effect: { injury: { label: "Distorsione alla caviglia", turnsRemaining: 1, ovrPenalty: 7 } },
          resultText: "Crescita esplosiva, poi lo stop.",
        },
      ],
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "lifestyle", option, "normal", () => 0.99);

    const stintOvr = result.player.clubHistory[result.player.clubHistory.length - 1]!.ovr;
    expect(stintOvr).toBe(result.player.ovr);
  });

  it("dovrebbe ripristinare esattamente il malus OVR alla guarigione, senza extra", () => {
    const player = {
      ...playerAt(),
      ovr: 70,
      injury: { label: "Distorsione alla caviglia", turnsRemaining: 1, ovrPenalty: 4 },
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "lifestyle", lifestyleOption, "normal", () => 0.99);

    expect(result.injuryHealed).toBe(true);
    expect(result.player.injury).toBeNull();
    expect(result.player.ovr).toBeGreaterThanOrEqual(70);
  });
});

describe("resolveCycle — stipendio e popolarità", () => {
  const lifestyleOption = {
    id: "x",
    label: "Opzione",
    outcomes: [{ weight: 100, effect: {}, resultText: "Nessun cambiamento." }],
  };

  it("dovrebbe accumulare lo stipendio nei risparmi dopo un ciclo", () => {
    const player = { ...playerAt(), wallet: { salaryEurPerCycle: 10_000, savingsEur: 0 } };
    // rng alto per evitare che l'infortunio azzeri il confronto (non influisce sui risparmi comunque)
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "lifestyle", lifestyleOption, "normal", () => 0.99);

    expect(result.player.wallet.savingsEur).toBeGreaterThan(0);
  });

  it("la popolarità dovrebbe crescere sensibilmente in un ciclo con un trofeo vinto", () => {
    const highOvrPlayer = { ...playerAt(), ovr: 95 };
    const result = resolveCycle(
      highOvrPlayer,
      INITIAL_LOOP_CONTEXT,
      "lifestyle",
      lifestyleOption,
      "normal",
      () => 0,
    );

    expect(result.newTrophies.length).toBeGreaterThan(0);
    expect(result.player.popularity).toBeGreaterThan(highOvrPlayer.popularity);
  });
});

describe("resolveCycle — objectiveResult.firstTime per tipo di obiettivo", () => {
  const option = { id: "stay", label: "Resta", outcomes: [{ weight: 100, effect: {}, resultText: "Resti." }] };

  it("dovrebbe essere true la prima volta che un tipo di obiettivo viene raggiunto", () => {
    const player = { ...playerAt(), currentObjective: { id: "g1", label: "Segna 1 gol", kind: "goals" as const, target: 0 } };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "end-of-cycle", option, "normal", () => 0.5);

    expect(result.objectiveResult).toEqual({ label: "Segna 1 gol", met: true, firstTime: true });
    expect(result.player.objectiveKindsCelebrated).toEqual(["goals"]);
  });

  it("dovrebbe essere false la seconda volta che lo stesso tipo di obiettivo viene raggiunto", () => {
    const player = {
      ...playerAt(),
      objectiveKindsCelebrated: ["goals" as const],
      currentObjective: { id: "g2", label: "Segna ancora", kind: "goals" as const, target: 0 },
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "end-of-cycle", option, "normal", () => 0.5);

    expect(result.objectiveResult).toEqual({ label: "Segna ancora", met: true, firstTime: false });
    expect(result.player.objectiveKindsCelebrated).toEqual(["goals"]);
  });

  it("dovrebbe essere true per un tipo diverso anche se un altro tipo è già stato celebrato", () => {
    const player = {
      ...playerAt(),
      objectiveKindsCelebrated: ["goals" as const],
      currentObjective: { id: "a1", label: "Raggiungi 10 presenze", kind: "apps" as const, target: 0 },
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "end-of-cycle", option, "normal", () => 0.5);

    expect(result.objectiveResult).toEqual({ label: "Raggiungi 10 presenze", met: true, firstTime: true });
    expect(result.player.objectiveKindsCelebrated).toEqual(["goals", "apps"]);
  });
});

describe("resolveCycle — pressione del brief sul ciclo dopo", () => {
  const stay = { id: "stay", label: "Resta", outcomes: [{ weight: 100, effect: {}, resultText: "Resti." }] };

  it("dovrebbe alzare lo streak su due miss di gol e rendere crisis più pesante", () => {
    const player = {
      ...playerAt(),
      currentObjective: { id: "g", label: "Il mister chiede: almeno 999 gol", kind: "goals" as const, target: 999 },
    };
    const first = resolveCycle(player, INITIAL_LOOP_CONTEXT, "lifestyle", stay, "normal", () => 0.99);
    expect(first.objectiveResult?.met).toBe(false);
    expect(first.context.lastObjectiveMet).toBe(false);
    expect(first.context.objectiveMissStreak).toBe(1);

    const second = resolveCycle(
      { ...first.player, currentObjective: player.currentObjective },
      first.context,
      "lifestyle",
      stay,
      "normal",
      () => 0.99,
    );
    expect(second.context.objectiveMissStreak).toBe(2);
  });

  it("non dovrebbe alzare lo streak se si manca un brief no-injury", () => {
    const player = {
      ...playerAt(),
      currentObjective: {
        id: "ni",
        label: "Il mister chiede: resta sano per tutta la stagione",
        kind: "no-injury" as const,
        target: 1,
      },
    };
    const option = {
      id: "risk",
      label: "Rischia",
      outcomes: [
        {
          weight: 100,
          effect: { injury: { label: "Distorsione alla caviglia", turnsRemaining: 2, ovrPenalty: 4 } },
          resultText: "Infortunio.",
        },
      ],
    };
    const result = resolveCycle(player, INITIAL_LOOP_CONTEXT, "lifestyle", option, "normal", () => 0.99);
    expect(result.objectiveResult?.met).toBe(false);
    expect(result.context.lastObjectiveMet).toBe(false);
    expect(result.context.objectiveMissStreak ?? 0).toBe(0);
  });

  it("dovrebbe azzerare lo streak e alzare l'affinità del mister se il brief è raggiunto", () => {
    const player = {
      ...playerAt(),
      currentObjective: { id: "g", label: "Il mister chiede: almeno 0 gol", kind: "goals" as const, target: 0 },
    };
    const before = getRelation(player, "coach")?.affinity ?? 0;
    const context: LoopContext = { ...INITIAL_LOOP_CONTEXT, objectiveMissStreak: 2, lastObjectiveMet: false };
    const result = resolveCycle(player, context, "lifestyle", stay, "normal", () => 0.5);
    expect(result.objectiveResult?.met).toBe(true);
    expect(result.context.lastObjectiveMet).toBe(true);
    expect(result.context.objectiveMissStreak).toBe(0);
    expect(getRelation(result.player, "coach")?.affinity).toBe(before + 1);
  });

  it("dovrebbe azzerare lo streak su trasferimento anche dopo un miss", () => {
    const player = {
      ...playerAt(),
      currentObjective: { id: "g", label: "Il mister chiede: almeno 999 gol", kind: "goals" as const, target: 999 },
    };
    const context: LoopContext = { ...INITIAL_LOOP_CONTEXT, objectiveMissStreak: 2, lastObjectiveMet: false };
    const option = {
      id: "sign",
      label: "Firma per Sevilla",
      club: SEVILLA,
      outcomes: [{ weight: 100, effect: {}, resultText: "Firmato." }],
    };
    const result = resolveCycle(player, context, "transfer", option, "normal", () => 0.99);
    expect(result.objectiveResult?.met).toBe(false);
    expect(result.context.objectiveMissStreak).toBe(0);
    expect(result.player.club?.id).toBe(SEVILLA.id);
  });
});

describe("pickStaticDecision — brief no-injury", () => {
  const RISKY = new Set(["double-sessions", "extra-camp", "mysterious-substance"]);

  function withNoInjuryBrief(player: ReturnType<typeof playerAt>) {
    return {
      ...player,
      currentObjective: {
        id: "ni",
        label: "Il mister chiede: resta sano per tutta la stagione",
        kind: "no-injury" as const,
        target: 1,
      },
    };
  }

  it("dovrebbe downweightare le carte rischiose senza nasconderle", () => {
    const base = playerAt();
    const brief = withNoInjuryBrief(base);
    const countRisky = (player: typeof base) => {
      let hits = 0;
      for (let i = 0; i < 200; i++) {
        const picked = pickStaticDecision("lifestyle", player, [], () => (i + 0.5) / 200);
        if (RISKY.has(picked.kind)) hits += 1;
      }
      return hits;
    };
    const withBrief = countRisky(brief);
    const without = countRisky(base);
    expect(withBrief).toBeGreaterThan(0);
    expect(withBrief).toBeLessThan(without);
  });

  it("dovrebbe marcare l'opzione rischiosa come tradimento del brief", () => {
    const player = withNoInjuryBrief(playerAt());
    let found = false;
    for (let i = 0; i < 200; i++) {
      const picked = pickStaticDecision("lifestyle", player, [], () => (i + 0.5) / 200);
      if (!RISKY.has(picked.kind)) continue;
      expect(picked.decision.options.some((o) => o.hint === "Tradisce il brief · infortunio")).toBe(true);
      found = true;
      break;
    }
    expect(found).toBe(true);
  });
});

describe("pushRecentCategory", () => {
  it("dovrebbe mantenere solo le ultime 3 categorie", () => {
    const result = pushRecentCategory(
      pushRecentCategory(pushRecentCategory(pushRecentCategory([], "transfer"), "loan"), "lifestyle"),
      "club-crisis",
    );
    expect(result).toEqual(["loan", "lifestyle", "club-crisis"]);
  });
});
