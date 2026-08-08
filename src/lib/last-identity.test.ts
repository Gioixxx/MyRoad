import { beforeEach, describe, expect, it } from "vitest";
import { loadLastIdentity, saveLastIdentity } from "./last-identity";
import type { PlayerIdentity } from "@/types/career";

const VALID_IDENTITY: PlayerIdentity = {
  lastName: "Rossi",
  number: 7,
  foot: "left",
  nationality: "Italy",
  position: "CAM",
};

describe("last-identity", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("restituisce null quando non c'è nulla salvato", () => {
    expect(loadLastIdentity()).toBeNull();
  });

  it("salva e ricarica l'identità completa", () => {
    saveLastIdentity(VALID_IDENTITY);
    expect(loadLastIdentity()).toEqual(VALID_IDENTITY);
  });

  it("ignora un salvataggio corrotto", () => {
    window.localStorage.setItem("carriera:last-identity", "{not json");
    expect(loadLastIdentity()).toBeNull();
  });

  it("ignora un'identità con nazionalità inventata", () => {
    window.localStorage.setItem(
      "carriera:last-identity",
      JSON.stringify({ ...VALID_IDENTITY, nationality: "Narnia" })
    );
    expect(loadLastIdentity()).toBeNull();
  });

  it("ignora un'identità con ruolo fuori enum", () => {
    window.localStorage.setItem(
      "carriera:last-identity",
      JSON.stringify({ ...VALID_IDENTITY, position: "COACH" })
    );
    expect(loadLastIdentity()).toBeNull();
  });

  it("ignora un'identità con numero fuori range", () => {
    window.localStorage.setItem(
      "carriera:last-identity",
      JSON.stringify({ ...VALID_IDENTITY, number: 150 })
    );
    expect(loadLastIdentity()).toBeNull();
  });

  it("ignora un'identità con cognome vuoto", () => {
    window.localStorage.setItem(
      "carriera:last-identity",
      JSON.stringify({ ...VALID_IDENTITY, lastName: "   " })
    );
    expect(loadLastIdentity()).toBeNull();
  });
});
