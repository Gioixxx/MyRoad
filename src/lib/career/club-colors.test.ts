import { describe, expect, it } from "vitest";
import {
  clubPalette,
  FALLBACK_CLUB_PALETTE,
  NEUTRAL_CLUB_PALETTE,
  pickClubPalette,
  readableOn,
} from "./club-colors";

const FROSINONE = ["#FFDD00", "#004393", "#006AB3"];
const WHITE_RED = ["#FFFFFF", "#D50000"];

describe("pickClubPalette", () => {
  it("dovrebbe usare il primo colore vivo come primario se è il primo della lista", () => {
    expect(pickClubPalette(FROSINONE).primary).toBe("#ffdd00");
  });

  it("dovrebbe saltare un bianco iniziale e usare il colore vivo come primario", () => {
    expect(pickClubPalette(WHITE_RED).primary).toBe("#d50000");
  });

  it("dovrebbe usare come secondario il primo colore ben distinto dal primario", () => {
    expect(pickClubPalette(FROSINONE).secondary).toBe("#004393");
  });

  it("dovrebbe ignorare i valori non esadecimali", () => {
    expect(pickClubPalette(["", "rosso", "#004393"]).primary).toBe("#004393");
  });

  it("dovrebbe ripiegare sulla palette del tema se non c'è nessun colore valido", () => {
    expect(pickClubPalette([])).toEqual(FALLBACK_CLUB_PALETTE);
  });

  it("dovrebbe usare la palette neutra del tema se il club è solo bianconero", () => {
    expect(pickClubPalette(["#000000", "#FFFFFF"])).toEqual(NEUTRAL_CLUB_PALETTE);
  });

  it("dovrebbe ripiegare sul secondario del tema se c'è un solo colore", () => {
    expect(pickClubPalette(["#D50000"]).secondary).toBe(FALLBACK_CLUB_PALETTE.secondary);
  });
});

describe("readableOn", () => {
  it("dovrebbe scegliere il testo scuro su un giallo", () => {
    expect(readableOn("#ffdd00")).toBe("#0b1210");
  });

  it("dovrebbe scegliere il testo bianco su un blu scuro", () => {
    expect(readableOn("#004393")).toBe("#ffffff");
  });
});

describe("clubPalette", () => {
  it("dovrebbe ripiegare sulla palette del tema per lo svincolato", () => {
    expect(clubPalette(null)).toEqual(FALLBACK_CLUB_PALETTE);
  });

  it("dovrebbe ripiegare sulla palette del tema per un club sconosciuto", () => {
    expect(clubPalette("club-inesistente")).toEqual(FALLBACK_CLUB_PALETTE);
  });
});
