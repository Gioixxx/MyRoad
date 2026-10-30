/** Fantasia della maglia: come il colore secondario si dispone sul colore di base. */
export type KitPattern = "tinta" | "strisce" | "meta" | "fascia" | "banda" | "righe";

/** Colori e fantasia di una maglia, pronti per il disegno vettoriale (`Jersey.tsx`). */
export interface Kit {
  /** Colore di base del tessuto. */
  primary: string;
  /** Colore della fantasia (strisce, metà, fascia...). */
  secondary: string;
  /** Colletto e bordi delle maniche. */
  trim: string;
  /** Cognome e numero. */
  ink: string;
  /** Contorno di cognome e numero, per restare leggibili sopra la fantasia. */
  stroke: string;
  pattern: KitPattern;
}
