import type { KitPattern } from "@/types/kit";

/** Prima maglia di una nazionale: colore di base, colore secondario, fantasia. */
export interface NationalKitDefinition {
  colors: readonly [base: string, accent: string];
  pattern?: KitPattern;
}

/**
 * Colori della prima maglia delle nazionali, per codice di `countries.ts`. Valori scritti a mano
 * (non presi da una fonte dati): approssimano la maglia di casa più riconoscibile, non quella di
 * una stagione precisa. La Croazia è in tinta perché gli scacchi non sono disegnabili.
 */
export const NATIONAL_KITS: Record<string, NationalKitDefinition> = {
  IT: { colors: ["#1F5FBF", "#FFFFFF"] },
  ES: { colors: ["#C60B1E", "#FFC400"] },
  FR: { colors: ["#1E2A5A", "#FFFFFF"] },
  DE: { colors: ["#FFFFFF", "#111111"] },
  PT: { colors: ["#B5121B", "#006241"] },
  NL: { colors: ["#F36C21", "#FFFFFF"] },
  BE: { colors: ["#C8102E", "#111111"] },
  "GB-ENG": { colors: ["#FFFFFF", "#1E2A5A"] },
  "GB-SCT": { colors: ["#1C2A4F", "#FFFFFF"] },
  "GB-WLS": { colors: ["#C8102E", "#FFFFFF"] },
  IE: { colors: ["#169B62", "#FFFFFF"] },
  CH: { colors: ["#D52B1E", "#FFFFFF"] },
  AT: { colors: ["#ED2939", "#FFFFFF"] },
  PL: { colors: ["#FFFFFF", "#DC143C"] },
  SE: { colors: ["#FECC02", "#005BAC"] },
  NO: { colors: ["#BA0C2F", "#00205B"] },
  DK: { colors: ["#C8102E", "#FFFFFF"] },
  HR: { colors: ["#FFFFFF", "#E1251B"] },
  RS: { colors: ["#C6363C", "#FFFFFF"] },
  UA: { colors: ["#FFD500", "#005BBB"] },
  TR: { colors: ["#E30A17", "#FFFFFF"] },
  BR: { colors: ["#FEDD00", "#009C3B"] },
  AR: { colors: ["#75AADB", "#FFFFFF"], pattern: "strisce" },
  UY: { colors: ["#5CBFEB", "#111111"] },
  CO: { colors: ["#FCD116", "#003893"] },
  CL: { colors: ["#D52B1E", "#0039A6"] },
  PY: { colors: ["#D52B1E", "#FFFFFF"], pattern: "strisce" },
  PE: { colors: ["#FFFFFF", "#D91023"], pattern: "fascia" },
  EC: { colors: ["#FFD100", "#034EA2"] },
  MX: { colors: ["#006847", "#FFFFFF"] },
  US: { colors: ["#FFFFFF", "#0A3161"] },
  CA: { colors: ["#D80621", "#FFFFFF"] },
  MA: { colors: ["#C1272D", "#006233"] },
  SN: { colors: ["#FFFFFF", "#00853F"] },
  NG: { colors: ["#008751", "#FFFFFF"] },
  GH: { colors: ["#FFFFFF", "#111111"] },
  EG: { colors: ["#CE1126", "#FFFFFF"] },
  CI: { colors: ["#F77F00", "#009E60"] },
  JP: { colors: ["#1A2A6C", "#FFFFFF"] },
  KR: { colors: ["#CD2E3A", "#111111"] },
  AU: { colors: ["#FFCD00", "#00843D"] },
  SA: { colors: ["#FFFFFF", "#006C35"] },
  QA: { colors: ["#8A1538", "#FFFFFF"] },
};
