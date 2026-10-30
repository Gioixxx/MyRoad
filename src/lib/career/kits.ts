import { CLUB_COLORS } from "@/data/club-colors";
import { CLUB_KIT_PATTERNS } from "@/data/club-kits";
import { NATIONAL_KITS } from "@/data/national-kits";
import type { Kit, KitPattern } from "@/types/kit";
import { contrastBetween, FALLBACK_CLUB_PALETTE, hexDistance, readableOn } from "./club-colors";

/**
 * Maglia verde campo con dettagli oro, come la vecchia foto: per lo svincolato, per i club senza
 * colori noti e per le nazionali senza voce in `NATIONAL_KITS`.
 */
export const FALLBACK_KIT: Kit = {
  primary: FALLBACK_CLUB_PALETTE.secondary,
  secondary: FALLBACK_CLUB_PALETTE.primary,
  trim: FALLBACK_CLUB_PALETTE.primary,
  ink: FALLBACK_CLUB_PALETTE.primary,
  stroke: FALLBACK_CLUB_PALETTE.secondary,
  pattern: "tinta",
};

/** Distanza RGB minima perché il colore della fantasia si distingua dalla base. */
const MIN_ACCENT_DISTANCE = 60;
/** Contrasto minimo perché in tinta unita il numero possa usare il colore secondario. */
const MIN_INK_CONTRAST = 3;

/**
 * Completa una maglia da base, colore della fantasia e fantasia. In tinta unita numero e cognome
 * prendono il secondario se si legge bene sulla base (blu su giallo, come il Frosinone),
 * altrimenti nero o bianco. Su una fantasia il numero attraversa entrambi i colori: è nero o
 * bianco col contorno nel colore di base, che lo stacca anche dalle strisce.
 */
export function buildKit(base: string, accent: string, pattern: KitPattern): Kit {
  const ink =
    pattern === "tinta" && contrastBetween(base, accent) >= MIN_INK_CONTRAST
      ? accent
      : readableOn(base);
  return { primary: base, secondary: accent, trim: accent, ink, stroke: base, pattern };
}

export function clubKit(clubId: string | null | undefined): Kit {
  const colors = clubId ? CLUB_COLORS[clubId] : undefined;
  if (!colors || colors.length === 0) return FALLBACK_KIT;

  const definition = clubId ? CLUB_KIT_PATTERNS[clubId] : undefined;
  const base = colors[definition?.base ?? 0] ?? colors[0];
  const accent =
    (definition?.accent !== undefined ? colors[definition.accent] : undefined) ??
    colors.find((c) => hexDistance(c, base) >= MIN_ACCENT_DISTANCE) ??
    FALLBACK_CLUB_PALETTE.primary;
  return buildKit(base, accent, definition?.pattern ?? "tinta");
}

export function nationalKit(countryCode: string | null | undefined): Kit {
  const definition = countryCode ? NATIONAL_KITS[countryCode] : undefined;
  if (!definition) return FALLBACK_KIT;
  const [base, accent] = definition.colors;
  return buildKit(base, accent, definition.pattern ?? "tinta");
}
