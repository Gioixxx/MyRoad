import { describe, expect, it } from "vitest";
import { clubs } from "./clubs";
import { countries } from "./countries";
import { COUNTRY_LABELS, countryLabel } from "./country-labels";

describe("COUNTRY_LABELS", () => {
  it("dovrebbe avere un nome italiano per ogni nazionalità selezionabile", () => {
    const missing = countries.filter((c) => !(c.name in COUNTRY_LABELS)).map((c) => c.name);
    expect(missing).toEqual([]);
  });

  it("dovrebbe avere un nome italiano per ogni paese dei club", () => {
    const missing = [...new Set(clubs.map((c) => c.country))].filter((name) => !(name in COUNTRY_LABELS));
    expect(missing).toEqual([]);
  });
});

describe("countryLabel", () => {
  it("dovrebbe tradurre un paese noto", () => {
    expect(countryLabel("Ivory Coast")).toBe("Costa d'Avorio");
  });

  it("dovrebbe ripiegare sul nome originale se il paese non è mappato", () => {
    expect(countryLabel("Atlantide")).toBe("Atlantide");
  });
});
