import { describe, expect, it } from "vitest";
import { version as packageVersion } from "../../package.json";
import { APP_VERSION, formatReleaseDate } from "./app-info";

describe("app-info", () => {
  it("dovrebbe esporre la stessa versione di package.json", () => {
    expect(APP_VERSION).toBe(packageVersion);
  });

  it("dovrebbe formattare la data di rilascio in italiano senza slittamenti di fuso", () => {
    expect(formatReleaseDate("2026-08-12")).toBe("12 ago 2026");
  });
});
