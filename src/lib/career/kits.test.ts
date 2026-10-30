import { describe, expect, it } from "vitest";
import { CLUB_COLORS } from "@/data/club-colors";
import { CLUB_KIT_PATTERNS } from "@/data/club-kits";
import { countries } from "@/data/countries";
import { NATIONAL_KITS } from "@/data/national-kits";
import { buildKit, clubKit, FALLBACK_KIT, nationalKit } from "./kits";

const YELLOW = "#FFDD00";
const NAVY = "#004393";
const SKY = "#87D8F7";
const WHITE = "#FFFFFF";
const DARK_INK = "#0b1210";

describe("buildKit", () => {
  it("dovrebbe usare il secondario per il numero in tinta unita se contrasta con la base", () => {
    expect(buildKit(YELLOW, NAVY, "tinta").ink).toBe(NAVY);
  });

  it("dovrebbe usare nero o bianco in tinta unita se il secondario non contrasta", () => {
    expect(buildKit(SKY, WHITE, "tinta").ink).toBe(DARK_INK);
  });

  it("dovrebbe usare nero o bianco sulla fantasia anche se il secondario contrasta", () => {
    expect(buildKit(YELLOW, NAVY, "strisce").ink).toBe(DARK_INK);
  });

  it("dovrebbe contornare numero e cognome col colore di base", () => {
    expect(buildKit(YELLOW, NAVY, "strisce").stroke).toBe(YELLOW);
  });
});

describe("clubKit", () => {
  it("dovrebbe ripiegare sulla maglia verde e oro per lo svincolato", () => {
    expect(clubKit(null)).toEqual(FALLBACK_KIT);
  });

  it("dovrebbe ripiegare sulla maglia verde e oro per un club senza colori", () => {
    expect(clubKit("club-inesistente")).toEqual(FALLBACK_KIT);
  });

  it("dovrebbe usare la fantasia scritta a mano per un club a strisce", () => {
    expect(clubKit("juventus").pattern).toBe("strisce");
  });

  it("dovrebbe vestire in tinta unita un club senza fantasia nota", () => {
    expect(clubKit("frosinone").pattern).toBe("tinta");
  });

  it("dovrebbe rispettare gli indici di base e fantasia della definizione", () => {
    const kit = clubKit("river-plate");
    expect([kit.primary, kit.secondary]).toEqual(["#FFFFFF", "#E3201C"]);
  });

  it("dovrebbe avere una definizione di fantasia solo per club con colori e indici validi", () => {
    const invalid = Object.entries(CLUB_KIT_PATTERNS).filter(([id, def]) => {
      const colors = CLUB_COLORS[id];
      if (!colors) return true;
      return [def.base, def.accent].some((i) => i !== undefined && colors[i] === undefined);
    });
    expect(invalid.map(([id]) => id)).toEqual([]);
  });
});

describe("nationalKit", () => {
  it("dovrebbe ripiegare sulla maglia verde e oro per un codice sconosciuto", () => {
    expect(nationalKit("XX")).toEqual(FALLBACK_KIT);
  });

  it("dovrebbe usare la fantasia della nazionale se indicata", () => {
    expect(nationalKit("AR").pattern).toBe("strisce");
  });

  it("dovrebbe avere una maglia per ogni nazionalità selezionabile", () => {
    const missing = countries.filter((c) => !NATIONAL_KITS[c.code]).map((c) => c.code);
    expect(missing).toEqual([]);
  });
});
