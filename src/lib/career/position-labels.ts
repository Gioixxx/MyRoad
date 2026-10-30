import type { Position } from "@/types/career";

export const POSITION_LABELS: Record<Position, string> = {
  GK: "POR",
  CB: "DC",
  LB: "TS",
  RB: "TD",
  CDM: "MED",
  CM: "CC",
  CAM: "TRQ",
  LM: "ES",
  RM: "ED",
  LW: "AS",
  RW: "AD",
  ST: "ATT",
};

/** Nome esteso del ruolo, per le didascalie (es. "ATT · Attaccante"). */
export const POSITION_NAMES: Record<Position, string> = {
  GK: "Portiere",
  CB: "Difensore centrale",
  LB: "Terzino sinistro",
  RB: "Terzino destro",
  CDM: "Mediano",
  CM: "Centrocampista centrale",
  CAM: "Trequartista",
  LM: "Esterno sinistro",
  RM: "Esterno destro",
  LW: "Ala sinistra",
  RW: "Ala destra",
  ST: "Attaccante",
};
