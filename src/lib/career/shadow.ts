import type { DecisionCategory, Player, ShadowFlags } from "@/types/career";
import { clamp } from "./progression";

export const SHADOW_RUMOR_THRESHOLD = 25;
export const SHADOW_SCANDAL_THRESHOLD = 28;
export const SHADOW_BAN_THRESHOLD = 75;
/** Formula del moltiplicatore award/callup: `1 - shadow / SHADOW_CALLUP_DIVISOR`. */
export const SHADOW_CALLUP_DIVISOR = 200;
export const SHADOW_REDEMPTION_THRESHOLD = 18;

export function applyShadowDelta(current: number, delta: number): number {
  return clamp(current + delta, 0, 100);
}

/** Moltiplicatore su probabilità già esistenti (award/callup) — scende linearmente con lo shadow. */
export function shadowMultiplier(shadow: number): number {
  return clamp(1 - shadow / SHADOW_CALLUP_DIVISOR, 0, 1);
}

export function isNationalTeamBanned(shadow: number): boolean {
  return shadow >= SHADOW_BAN_THRESHOLD;
}

/** Scatta uno scandalo forzato se lo shadow è alto e non ne è già capitato uno di recente. */
export function shouldTriggerScandal(
  player: Pick<Player, "shadow">,
  recentCategories: DecisionCategory[],
): boolean {
  return player.shadow >= SHADOW_SCANDAL_THRESHOLD && !recentCategories.includes("scandal");
}

/** Eleggibile alla redenzione solo dopo uno scandalo già affrontato e sceso sotto la soglia. */
export function isRedemptionEligible(player: Pick<Player, "shadow" | "shadowFlags">): boolean {
  const flags: ShadowFlags = player.shadowFlags ?? {};
  return Boolean(flags.scandalOccurred) && player.shadow < SHADOW_REDEMPTION_THRESHOLD && !flags.redeemed;
}

export function deriveShadowTitle(finalShadow: number, redeemed: boolean): string | null {
  if (redeemed) return "Dal buio alla luce";
  if (finalShadow >= SHADOW_SCANDAL_THRESHOLD) return "Carriera controversa";
  return null;
}
