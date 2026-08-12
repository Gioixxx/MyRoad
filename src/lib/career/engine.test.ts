import { describe, expect, it } from "vitest";
import type { Club, DecisionOutcome, PlayerIdentity } from "@/types/career";
import {
  advanceSeasons,
  applyDelta,
  checkRetirement,
  createPlayer,
  resolveOutcome,
  retire,
  signWithClub,
  switchNationality,
  STARTING_AGE,
  STARTING_OVR,
} from "./engine";
import type { Rng } from "./progression";

const IDENTITY: PlayerIdentity = {
  lastName: "Rossi",
  number: 10,
  foot: "right",
  nationality: "Italy",
  position: "ST",
};

const TEST_CLUB: Club = {
  id: "test-club",
  name: "Test FC",
  country: "Italy",
  tier: 1,
  prestige: 2,
  competitions: { league: "Serie A", cup: "Coppa Italia" },
  crestUrl: "https://r2.thesportsdb.com/images/media/team/badge/test.png",
};

const NO_NOISE_RNG: Rng = () => 0.5;

describe("createPlayer", () => {
  it("dovrebbe creare un giocatore free agent a 16 anni con OVR 50 e statistiche azzerate", () => {
    const player = createPlayer(IDENTITY);

    expect(player.age).toBe(STARTING_AGE);
    expect(player.ovr).toBe(STARTING_OVR);
    expect(player.club).toBeNull();
    expect(player.career).toEqual({ apps: 0, goals: 0, assists: 0 });
    expect(player.trophies).toEqual([]);
    expect(player.awards).toEqual([]);
    expect(player.retired).toBe(false);
    expect(player.injury).toBeNull();
    expect(player.wallet).toEqual({ salaryEurPerCycle: 0, savingsEur: 0 });
    expect(player.popularity).toBeGreaterThan(0);
    expect(player.relations.some((rel) => rel.id === "agent")).toBe(true);
    expect(player.relations.some((rel) => rel.id === "coach")).toBe(false);
  });
});

describe("signWithClub", () => {
  it("dovrebbe assegnare il club al giocatore senza modificare età/OVR", () => {
    const player = createPlayer(IDENTITY);
    const signed = signWithClub(player, TEST_CLUB);

    expect(signed.club).toEqual(TEST_CLUB);
    expect(signed.age).toBe(player.age);
    expect(signed.ovr).toBe(player.ovr);
  });

  it("dovrebbe ricalcolare lo stipendio in base a OVR e prestigio del club", () => {
    const player = createPlayer(IDENTITY);
    const signed = signWithClub(player, TEST_CLUB);

    expect(signed.wallet.salaryEurPerCycle).toBeGreaterThan(0);
  });

  it("dovrebbe calcolare una clausola rescissoria positiva", () => {
    const player = createPlayer(IDENTITY);
    const signed = signWithClub(player, TEST_CLUB);

    expect(signed.releaseClauseEur).toBeGreaterThan(0);
  });

  it("dovrebbe applicare un bonus alla firma su un nuovo club", () => {
    const player = createPlayer(IDENTITY);
    const signed = signWithClub(player, TEST_CLUB);

    expect(signed.wallet.savingsEur).toBeGreaterThan(0);
  });

  it("non dovrebbe applicare di nuovo il bonus alla firma restando allo stesso club", () => {
    const player = signWithClub(createPlayer(IDENTITY), TEST_CLUB);
    const renewed = signWithClub(player, TEST_CLUB);

    expect(renewed.wallet.savingsEur).toBe(player.wallet.savingsEur);
  });

  it("dovrebbe generare il mister alla prima firma e resetarlo al transfer", () => {
    const signed = signWithClub(createPlayer(IDENTITY), TEST_CLUB);
    const coach = signed.relations.find((rel) => rel.id === "coach");
    const agent = signed.relations.find((rel) => rel.id === "agent");
    expect(coach).toBeDefined();
    expect(agent).toBeDefined();

    const trusted = {
      ...signed,
      relations: signed.relations.map((rel) =>
        rel.id === "coach" ? { ...rel, affinity: 2 as const } : rel,
      ),
    };
    const otherClub: Club = { ...TEST_CLUB, id: "other-club", name: "Other FC" };
    const moved = signWithClub(trusted, otherClub);
    expect(moved.relations.find((rel) => rel.id === "coach")?.affinity).toBe(0);
    expect(moved.relations.find((rel) => rel.id === "agent")?.name).toBe(agent!.name);
  });
});

describe("switchNationality", () => {
  it("dovrebbe aggiornare la nazionalità e impostare hasSwitchedNationality", () => {
    const player = createPlayer(IDENTITY);
    const switched = switchNationality(player, "Brazil");

    expect(switched.nationality).toBe("Brazil");
    expect(switched.hasSwitchedNationality).toBe(true);
  });

  it("non dovrebbe modificare altri campi del giocatore", () => {
    const player = createPlayer(IDENTITY);
    const switched = switchNationality(player, "Brazil");

    expect(switched.age).toBe(player.age);
    expect(switched.ovr).toBe(player.ovr);
    expect(switched.lastName).toBe(player.lastName);
  });
});

describe("advanceSeasons", () => {
  it("dovrebbe lanciare un errore se il giocatore non ha un club", () => {
    const player = createPlayer(IDENTITY);
    expect(() => advanceSeasons(player, 2, NO_NOISE_RNG)).toThrow();
  });

  it("dovrebbe aggiornare età e statistiche cumulative dopo N stagioni", () => {
    const player = signWithClub(createPlayer(IDENTITY), TEST_CLUB);
    const advanced = advanceSeasons(player, 2, NO_NOISE_RNG);

    expect(advanced.age).toBe(STARTING_AGE + 2);
    expect(advanced.career.apps).toBeGreaterThan(0);
  });

  it("dovrebbe aggiungere una riga a clubHistory per ogni ciclo, senza accorpare i cicli precedenti allo stesso club", () => {
    const player = signWithClub(createPlayer(IDENTITY), TEST_CLUB);
    const afterFirstCycle = advanceSeasons(player, 2, NO_NOISE_RNG);
    const afterSecondCycle = advanceSeasons(afterFirstCycle, 2, NO_NOISE_RNG);

    expect(afterSecondCycle.clubHistory).toHaveLength(2);
    expect(afterSecondCycle.clubHistory[0].ageFrom).toBe(STARTING_AGE);
    expect(afterSecondCycle.clubHistory[1].ageFrom).toBe(STARTING_AGE + 2);
  });
});

describe("applyDelta", () => {
  it("dovrebbe applicare il delta OVR e ricalcolare il valore di mercato", () => {
    const player = createPlayer(IDENTITY);
    const boosted = applyDelta(player, { ovrDelta: 3 });

    expect(boosted.ovr).toBe(player.ovr + 3);
    expect(boosted.marketValueEur).toBeGreaterThan(player.marketValueEur);
  });

  it("non dovrebbe far scendere l'OVR sotto il minimo di 30", () => {
    const player = createPlayer(IDENTITY);
    const crashed = applyDelta(player, { ovrDelta: -100 });

    expect(crashed.ovr).toBe(30);
  });

  it("dovrebbe applicare popularityDelta con clamp 0-100", () => {
    const player = createPlayer(IDENTITY);
    const boosted = applyDelta(player, { popularityDelta: 1000 });
    const crashed = applyDelta(player, { popularityDelta: -1000 });

    expect(boosted.popularity).toBe(100);
    expect(crashed.popularity).toBe(0);
  });

  it("dovrebbe applicare savingsDelta ai risparmi del portafoglio", () => {
    const player = createPlayer(IDENTITY);
    const richer = applyDelta(player, { savingsDelta: 5000 });

    expect(richer.wallet.savingsEur).toBe(5000);
    expect(richer.wallet.salaryEurPerCycle).toBe(player.wallet.salaryEurPerCycle);
  });

  it("dovrebbe impostare o azzerare l'infortunio in base a delta.injury", () => {
    const player = createPlayer(IDENTITY);
    const injured = applyDelta(player, {
      injury: { label: "Distorsione alla caviglia", turnsRemaining: 2, ovrPenalty: 4 },
    });
    const healed = applyDelta(injured, { injury: null });
    const untouched = applyDelta(injured, {});

    expect(injured.injury).toEqual({
      label: "Distorsione alla caviglia",
      turnsRemaining: 2,
      ovrPenalty: 4,
    });
    expect(healed.injury).toBeNull();
    expect(untouched.injury).toEqual(injured.injury);
  });

  it("dovrebbe fondere traitsDelta con i vettori esistenti, con clamp 0-100", () => {
    const player = createPlayer(IDENTITY);
    const next = applyDelta(player, { traitsDelta: { loyalty: 10, ambition: -1000 } });

    expect(next.traits.loyalty).toBe(60);
    expect(next.traits.ambition).toBe(0);
    expect(next.traits.showmanship).toBe(50);
  });

  it("dovrebbe applicare shadowDelta con clamp 0-100", () => {
    const player = createPlayer(IDENTITY);
    const higher = applyDelta(player, { shadowDelta: 15 });
    const untouched = applyDelta(player, {});

    expect(higher.shadow).toBe(15);
    expect(untouched.shadow).toBe(0);
  });

  it("dovrebbe fondere shadowFlags senza sovrascrivere i flag già presenti", () => {
    const player = createPlayer(IDENTITY);
    const first = applyDelta(player, { shadowFlags: { doped: true } });
    const second = applyDelta(first, { shadowFlags: { leakedTactics: true } });

    expect(second.shadowFlags).toEqual({ doped: true, leakedTactics: true });
  });

  it("dovrebbe applicare relationsDelta clampando l'affinità", () => {
    const player = signWithClub(createPlayer(IDENTITY), TEST_CLUB);
    const next = applyDelta(player, { relationsDelta: { coach: 3, agent: -1 } });
    expect(next.relations.find((rel) => rel.id === "coach")?.affinity).toBe(2);
    expect(next.relations.find((rel) => rel.id === "agent")?.affinity).toBe(-1);
  });
});

describe("resolveOutcome", () => {
  it("dovrebbe restituire sempre lo stesso outcome se ha peso 100 e l'altro peso 0", () => {
    const outcomes: DecisionOutcome[] = [
      { weight: 100, effect: { ovrDelta: 1 }, resultText: "certo" },
      { weight: 0, effect: { ovrDelta: -1 }, resultText: "impossibile" },
    ];

    expect(resolveOutcome(outcomes, () => 0).resultText).toBe("certo");
    expect(resolveOutcome(outcomes, () => 0.999).resultText).toBe("certo");
  });

  it("dovrebbe rispettare i confini cumulativi dei pesi tra le opzioni", () => {
    const outcomes: DecisionOutcome[] = [
      { weight: 30, effect: {}, resultText: "basso" },
      { weight: 70, effect: {}, resultText: "alto" },
    ];

    expect(resolveOutcome(outcomes, () => 0.29).resultText).toBe("basso");
    expect(resolveOutcome(outcomes, () => 0.31).resultText).toBe("alto");
  });

  it("dovrebbe lanciare un errore se non ci sono outcome disponibili", () => {
    expect(() => resolveOutcome([], () => 0.5)).toThrow();
  });
});

describe("checkRetirement", () => {
  it("dovrebbe restituire false se il giocatore ha meno di 31 anni", () => {
    const player = { ...createPlayer(IDENTITY), age: 30 };
    expect(checkRetirement(player, () => 0)).toBe(false);
  });

  it("dovrebbe restituire true se il giocatore ha 40 anni o più", () => {
    const player = { ...createPlayer(IDENTITY), age: 40 };
    expect(checkRetirement(player, () => 0.999)).toBe(true);
  });

  it("dovrebbe essere probabilistico tra i 31 e i 40 anni", () => {
    const player = { ...createPlayer(IDENTITY), age: 37 }; // progress = 6/9, chance = (6/9)^3 ≈ 0.296
    expect(checkRetirement(player, () => 0)).toBe(true); // roll 0 < chance
    expect(checkRetirement(player, () => 0.9)).toBe(false); // roll 0.9 > chance
  });
});

describe("retire", () => {
  it("dovrebbe segnare il giocatore come ritirato e rimuovere il club corrente", () => {
    const player = signWithClub(createPlayer(IDENTITY), TEST_CLUB);
    const retiredPlayer = retire(player);

    expect(retiredPlayer.retired).toBe(true);
    expect(retiredPlayer.club).toBeNull();
  });
});
