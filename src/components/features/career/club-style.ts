import type { CSSProperties } from "react";
import { clubPalette } from "@/lib/career/club-colors";

/**
 * Variabili CSS `--club-*` della grafica Matchday (vedi `.matchday-shell` in globals.css)
 * per il club dato: messe su un contenitore, ricolorano barre, etichette e riempimenti `md-*`
 * al suo interno.
 */
export function clubStyle(clubId: string | null | undefined): CSSProperties {
  const palette = clubPalette(clubId);
  return {
    "--club-primary": palette.primary,
    "--club-secondary": palette.secondary,
    "--club-on-primary": palette.onPrimary,
  } as CSSProperties;
}
