import type { KitPattern } from "@/types/kit";

/** Fantasia della prima maglia di un club e quali dei suoi `CLUB_COLORS` usare. */
export interface ClubKitDefinition {
  pattern: KitPattern;
  /** Indice in `CLUB_COLORS[clubId]` del colore di base (default 0). */
  base?: number;
  /** Indice del colore della fantasia (default: il primo ben distinto dalla base). */
  accent?: number;
}

/**
 * Fantasia della prima maglia, scritta a mano: TheSportsDB dà i colori ma non la fantasia.
 * Solo club con colori in `CLUB_COLORS` e una fantasia riconoscibile tra quelle disegnabili
 * (strisce verticali, metà, fascia diagonale, banda orizzontale); gli altri sono in tinta unita.
 * Restano in tinta anche fantasie non disegnabili (cerchi orizzontali, scacchi, banda verticale
 * centrale dell'Ajax, diagonale del Monaco).
 */
export const CLUB_KIT_PATTERNS: Record<string, ClubKitDefinition> = {
  "ac-milan": { pattern: "strisce" },
  atalanta: { pattern: "strisce" },
  "athletic-bilbao": { pattern: "strisce" },
  "atletico-madrid": { pattern: "strisce", accent: 2 },
  "atletico-mineiro": { pattern: "strisce" },
  avai: { pattern: "strisce" },
  barcelona: { pattern: "strisce" },
  bologna: { pattern: "strisce" },
  botafogo: { pattern: "strisce" },
  bournemouth: { pattern: "strisce" },
  brentford: { pattern: "strisce" },
  brighton: { pattern: "strisce" },
  cagliari: { pattern: "meta" },
  cremonese: { pattern: "strisce" },
  "crystal-palace": { pattern: "strisce" },
  espanyol: { pattern: "strisce" },
  feyenoord: { pattern: "meta" },
  fluminense: { pattern: "strisce" },
  genoa: { pattern: "meta" },
  girona: { pattern: "strisce" },
  gremio: { pattern: "strisce" },
  inter: { pattern: "strisce" },
  juventus: { pattern: "strisce" },
  lecce: { pattern: "strisce" },
  monterrey: { pattern: "strisce" },
  newcastle: { pattern: "strisce" },
  psv: { pattern: "strisce" },
  "racing-club": { pattern: "strisce" },
  "rayo-vallecano": { pattern: "fascia", base: 1, accent: 0 },
  "real-betis": { pattern: "strisce" },
  "rio-ave": { pattern: "strisce" },
  "river-plate": { pattern: "fascia", base: 1, accent: 0 },
  sampdoria: { pattern: "banda" },
  "san-lorenzo": { pattern: "strisce" },
  "sao-paulo": { pattern: "banda" },
  sassuolo: { pattern: "strisce" },
  southampton: { pattern: "strisce" },
  sunderland: { pattern: "strisce" },
  udinese: { pattern: "strisce" },
  "west-brom": { pattern: "strisce" },
};
