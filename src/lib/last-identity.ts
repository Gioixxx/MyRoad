import { countries } from "@/data/countries";
import type { PlayerIdentity, Position } from "@/types/career";

const STORAGE_KEY = "carriera:last-identity";

const VALID_POSITIONS = new Set<Position>([
  "GK",
  "CB",
  "LB",
  "RB",
  "CDM",
  "CM",
  "CAM",
  "LM",
  "RM",
  "LW",
  "RW",
  "ST",
]);

const VALID_FEET = new Set(["left", "right"]);

function isValidIdentity(value: unknown): value is PlayerIdentity {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PlayerIdentity>;

  return (
    typeof candidate.lastName === "string" &&
    candidate.lastName.trim().length > 0 &&
    typeof candidate.number === "number" &&
    Number.isInteger(candidate.number) &&
    candidate.number >= 1 &&
    candidate.number <= 99 &&
    typeof candidate.foot === "string" &&
    VALID_FEET.has(candidate.foot) &&
    typeof candidate.nationality === "string" &&
    countries.some((c) => c.name === candidate.nationality) &&
    typeof candidate.position === "string" &&
    VALID_POSITIONS.has(candidate.position as Position)
  );
}

export function loadLastIdentity(): PlayerIdentity | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return isValidIdentity(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLastIdentity(identity: PlayerIdentity): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}
