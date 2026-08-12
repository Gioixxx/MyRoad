import { describe, expect, it } from "vitest";
import type { Club } from "@/types/career";
import { createPlayer, signWithClub } from "./engine";
import {
  agentNameForPlayer,
  applyRelationsDelta,
  clampAffinity,
  coachNameForClub,
  formatAffinity,
  getRelation,
  maybeSpawnRival,
  relationsOnSign,
  ensureCoreRelations,
} from "./relations";
import type { PlayerIdentity } from "@/types/career";

const IDENTITY: PlayerIdentity = {
  lastName: "Rossi",
  number: 10,
  foot: "right",
  nationality: "Italy",
  position: "ST",
};

const CLUB_A: Club = {
  id: "test-a",
  name: "Test A",
  country: "Italy",
  tier: 1,
  prestige: 2,
  competitions: { league: "Serie A" },
  crestUrl: "https://example.com/a.png",
};

const CLUB_B: Club = {
  ...CLUB_A,
  id: "test-b",
  name: "Test B",
};

describe("clampAffinity / formatAffinity", () => {
  it("dovrebbe clampare tra -2 e +2", () => {
    expect(clampAffinity(-9)).toBe(-2);
    expect(clampAffinity(9)).toBe(2);
    expect(clampAffinity(0)).toBe(0);
  });

  it("dovrebbe formattare il segno positivo", () => {
    expect(formatAffinity(2)).toBe("+2");
    expect(formatAffinity(-1)).toBe("-1");
    expect(formatAffinity(0)).toBe("0");
  });
});

describe("nomi deterministici", () => {
  it("dovrebbe dare lo stesso mister allo stesso club", () => {
    expect(coachNameForClub("juventus")).toBe(coachNameForClub("juventus"));
    expect(coachNameForClub("juventus")).not.toBe(coachNameForClub("sevilla"));
  });

  it("dovrebbe dare lo stesso agente allo stesso giocatore", () => {
    expect(agentNameForPlayer("Rossi", "Italy")).toBe(agentNameForPlayer("Rossi", "Italy"));
  });
});

describe("relationsOnSign", () => {
  it("dovrebbe creare il mister al cambio club e azzerare l'affinità", () => {
    const player = signWithClub(createPlayer(IDENTITY), CLUB_A);
    const withTrust = {
      ...player,
      relations: player.relations.map((rel) =>
        rel.id === "coach" ? { ...rel, affinity: 2 as const } : rel,
      ),
    };
    const next = relationsOnSign(withTrust, CLUB_B, true);
    const coach = next.find((rel) => rel.id === "coach")!;
    expect(coach.affinity).toBe(0);
    expect(coach.name).toBe(coachNameForClub(CLUB_B.id));
    expect(next.find((rel) => rel.id === "agent")?.name).toBe(
      withTrust.relations.find((rel) => rel.id === "agent")?.name,
    );
  });

  it("non dovrebbe resettare il mister su rinnovo nello stesso club", () => {
    const player = signWithClub(createPlayer(IDENTITY), CLUB_A);
    const withTrust = {
      ...player,
      relations: player.relations.map((rel) =>
        rel.id === "coach" ? { ...rel, affinity: 2 as const } : rel,
      ),
    };
    const next = relationsOnSign(withTrust, CLUB_A, false);
    expect(next.find((rel) => rel.id === "coach")?.affinity).toBe(2);
  });
});

describe("applyRelationsDelta", () => {
  it("dovrebbe spostare solo la relazione indicata", () => {
    const player = signWithClub(createPlayer(IDENTITY), CLUB_A);
    const next = applyRelationsDelta(player.relations, { coach: 1, agent: -1 });
    expect(getRelation({ relations: next }, "coach")?.affinity).toBe(1);
    expect(getRelation({ relations: next }, "agent")?.affinity).toBe(-1);
  });
});

describe("ensureCoreRelations", () => {
  it("dovrebbe aggiungere agente e mister se mancano", () => {
    const signed = signWithClub(createPlayer(IDENTITY), CLUB_A);
    const stripped = { ...signed, relations: [] };
    const restored = ensureCoreRelations(stripped);
    expect(restored.relations.some((rel) => rel.id === "agent")).toBe(true);
    expect(restored.relations.some((rel) => rel.id === "coach")).toBe(true);
  });
});

describe("maybeSpawnRival", () => {
  it("non dovrebbe nascere sotto OVR 78 con pochi cicli nello stesso club", () => {
    const player = signWithClub(createPlayer(IDENTITY), CLUB_A);
    expect(maybeSpawnRival(player).relations.some((rel) => rel.id === "rival")).toBe(false);
  });

  it("dovrebbe nascere da OVR 78", () => {
    const player = { ...signWithClub(createPlayer(IDENTITY), CLUB_A), ovr: 78 };
    expect(maybeSpawnRival(player).relations.some((rel) => rel.id === "rival")).toBe(true);
  });

  it("dovrebbe nascere dopo 4 cicli nello stesso club", () => {
    const signed = signWithClub(createPlayer(IDENTITY), CLUB_A);
    const player = {
      ...signed,
      ovr: 60,
      clubHistory: Array.from({ length: 4 }, () => ({
        club: CLUB_A,
        ageFrom: 16,
        ageTo: 17,
        type: "permanent" as const,
        stats: { apps: 10, goals: 1, assists: 0 },
        ovr: 60,
      })),
    };
    expect(maybeSpawnRival(player).relations.some((rel) => rel.id === "rival")).toBe(true);
  });
});
