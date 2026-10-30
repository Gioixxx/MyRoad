/**
 * Palette "Lavagna tattica" — verde bosco, oro metallico, gesso, glow cyan.
 * Dark è il look primario (mockup); light è la stessa lingua in chiave sage/pergamena.
 */
const primitives = {
  chalkboard: "#0f1a15",
  surfaceDark: "#15241c",
  surfaceRaisedDark: "#1c2e24",
  chalk: "#e8e4d4",
  ink: "#1b2320",
  gold: "#c9a24b",
  goldBright: "#d4b268",
  goldDeep: "#a8842e",
  goldInk: "#7a5c17",
  focusGlow: "#3de0e8",
  pitchGreen: "#14352b",
  pitchGreenLight: "#3f8f5f",
  sage: "#dfe6d8",
  sageSurface: "#e8efe3",
  parchment: "#f0ead8",
  crimson: "#b23a3a",
  crimsonLight: "#d9645f",
  silver: "#8b95a0",
  bronze: "#9c6b3e",
} as const;

export const tokens = {
  light: {
    colorPrimary: primitives.goldDeep,
    colorPrimaryHover: primitives.gold,
    colorBackground: primitives.sage,
    colorSurface: primitives.sageSurface,
    colorSurfaceRaised: primitives.parchment,
    colorBorder: "#c5cdb8",
    colorText: primitives.ink,
    colorTextMuted: "#4a564f",
    colorAccent: primitives.goldInk,
    colorPitch: primitives.pitchGreen,
    colorSuccess: primitives.pitchGreenLight,
    colorWarning: primitives.gold,
    colorError: primitives.crimson,
    colorOvrBronze: primitives.bronze,
    colorOvrSilver: "#5b6a75",
    colorOvrGold: primitives.gold,
    colorFocusGlow: primitives.focusGlow,
  },
  dark: {
    colorPrimary: primitives.goldBright,
    colorPrimaryHover: primitives.gold,
    colorBackground: primitives.chalkboard,
    colorSurface: primitives.surfaceDark,
    colorSurfaceRaised: primitives.surfaceRaisedDark,
    colorBorder: "#2a3d32",
    colorText: primitives.chalk,
    colorTextMuted: "#9aada0",
    colorAccent: primitives.goldBright,
    colorPitch: primitives.pitchGreen,
    colorSuccess: primitives.pitchGreenLight,
    colorWarning: primitives.goldBright,
    colorError: primitives.crimsonLight,
    colorOvrBronze: "#b48653",
    colorOvrSilver: primitives.silver,
    colorOvrGold: primitives.goldBright,
    colorFocusGlow: primitives.focusGlow,
  },
} as const;

export type ThemeTokens = typeof tokens.light;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const typography = {
  fontSizeXs: 12,
  fontSizeSm: 14,
  fontSizeMd: 16,
  fontSizeLg: 18,
  fontSizeXl: 20,
  fontSize2xl: 24,
  fontSize3xl: 30,
  fontSize4xl: 36,
  fontSize5xl: 48,
  fontWeightRegular: "400",
  fontWeightMedium: "500",
  fontWeightSemibold: "600",
  fontWeightBold: "700",
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
