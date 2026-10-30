import { CLUB_COLORS } from "@/data/club-colors";

/** Colori del club per la grafica "Matchday": riempimenti, barre e testo leggibile sopra. */
export interface ClubPalette {
  primary: string;
  secondary: string;
  /** Testo su `primary`: nero o bianco, quello con contrasto maggiore. */
  onPrimary: string;
}

/** Oro e verde campo del tema: per lo svincolato e per i club senza colori noti. */
export const FALLBACK_CLUB_PALETTE: ClubPalette = {
  primary: "#d4b268",
  secondary: "#14352b",
  onPrimary: "#1b2320",
};

/**
 * Club solo bianconeri (Juventus, Botafogo…): un riempimento nero sparirebbe sul tema scuro e
 * uno bianco su quello chiaro, quindi si usano il testo e lo sfondo del tema, che si invertono
 * da soli col tema.
 */
export const NEUTRAL_CLUB_PALETTE: ClubPalette = {
  primary: "var(--color-text)",
  secondary: FALLBACK_CLUB_PALETTE.secondary,
  onPrimary: "var(--color-background)",
};

const DARK_ON_COLOR = "#0b1210";
const LIGHT_ON_COLOR = "#ffffff";
/** Sotto questa saturazione un colore è "neutro" (bianco, nero, grigio): non fa da accento. */
const MIN_ACCENT_SATURATION = 0.3;
const MIN_ACCENT_LIGHTNESS = 0.15;
const MAX_ACCENT_LIGHTNESS = 0.85;
/** Distanza RGB minima perché il secondario si distingua dal primario. */
const MIN_SECONDARY_DISTANCE = 60;

type Rgb = [number, number, number];

function parseHex(value: string): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function saturationAndLightness([r, g, b]: Rgb): { s: number; l: number } {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  if (max === min) return { s: 0, l };
  const d = max - min;
  return { s: l > 0.5 ? d / (2 - max - min) : d / (max + min), l };
}

function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function distance(a: Rgb, b: Rgb): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function isAccent(rgb: Rgb): boolean {
  const { s, l } = saturationAndLightness(rgb);
  return s >= MIN_ACCENT_SATURATION && l >= MIN_ACCENT_LIGHTNESS && l <= MAX_ACCENT_LIGHTNESS;
}

/** Nero o bianco, scelto per il contrasto maggiore sullo sfondo dato. */
export function readableOn(background: string): string {
  const rgb = parseHex(background);
  if (!rgb) return DARK_ON_COLOR;
  const lum = relativeLuminance(rgb);
  const darkLum = relativeLuminance(parseHex(DARK_ON_COLOR)!);
  return contrastRatio(lum, darkLum) >= contrastRatio(lum, 1) ? DARK_ON_COLOR : LIGHT_ON_COLOR;
}

/** Rapporto di contrasto WCAG tra due colori esadecimali (1 se uno dei due non è valido). */
export function contrastBetween(a: string, b: string): number {
  const ra = parseHex(a);
  const rb = parseHex(b);
  if (!ra || !rb) return 1;
  return contrastRatio(relativeLuminance(ra), relativeLuminance(rb));
}

/** Distanza RGB tra due colori esadecimali (0 se uno dei due non è valido). */
export function hexDistance(a: string, b: string): number {
  const ra = parseHex(a);
  const rb = parseHex(b);
  return ra && rb ? distance(ra, rb) : 0;
}

/**
 * Sceglie primario e secondario dai colori sociali (in ordine di importanza, come li dà
 * TheSportsDB): il primario è il primo colore "vivo", così un club bianco-rosso usa il rosso
 * e non un bianco che sparirebbe sul tema chiaro.
 */
export function pickClubPalette(colors: readonly string[]): ClubPalette {
  const parsed = colors.map(parseHex).filter((c): c is Rgb => c !== null);
  if (parsed.length === 0) return FALLBACK_CLUB_PALETTE;

  const primary = parsed.find(isAccent);
  if (!primary) return NEUTRAL_CLUB_PALETTE;
  const secondary = parsed.find((c) => distance(c, primary) >= MIN_SECONDARY_DISTANCE);
  const primaryHex = toHex(primary);
  return {
    primary: primaryHex,
    secondary: secondary ? toHex(secondary) : FALLBACK_CLUB_PALETTE.secondary,
    onPrimary: readableOn(primaryHex),
  };
}

export function clubPalette(clubId: string | null | undefined): ClubPalette {
  if (!clubId) return FALLBACK_CLUB_PALETTE;
  const colors = CLUB_COLORS[clubId];
  return colors ? pickClubPalette(colors) : FALLBACK_CLUB_PALETTE;
}
