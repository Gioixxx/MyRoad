"use client";

import { Star } from "lucide-react";
import type { Decision, DecisionOption, Player } from "@/types/career";
import { countryLabel } from "@/data/country-labels";
import { cn } from "@/lib/utils";
import { favorableOutcomeWeight } from "@/lib/career/decisions";
import { tacticalFit, TACTICAL_FIT_LABELS } from "@/lib/career/tactics";
import { ClubCrest } from "./ClubCrest";
import { clubStyle } from "./club-style";
import { DecisionHeading } from "./DecisionPanel";

interface OfferPanelProps {
  decision: Decision;
  player: Pick<Player, "attributes" | "position">;
  onChoose: (optionId: string) => void;
}

const TACTICAL_FIT_STYLES: Record<string, string> = {
  ottimo: "text-(--color-success)",
  neutro: "text-(--color-text-muted)",
  scarso: "text-(--color-error)",
};

function TacticalFitChip({ player, club }: { player: OfferPanelProps["player"]; club: NonNullable<DecisionOption["club"]> }) {
  const fit = tacticalFit(player, club);
  return (
    <span className={cn("text-xs", TACTICAL_FIT_STYLES[fit])}>
      Fit tattico: <span className="font-semibold">{TACTICAL_FIT_LABELS[fit]}</span>
    </span>
  );
}

function PrestigeStars({ prestige }: { prestige: number }) {
  if (prestige <= 0) {
    return <span className="text-xs text-(--color-text-muted)">Club emergente</span>;
  }
  return (
    <span className="flex items-center gap-0.5" aria-label={`Prestigio ${prestige} su 3`}>
      {Array.from({ length: 3 }, (_, i) => (
        <Star
          key={i}
          size={13}
          aria-hidden="true"
          className={i < prestige ? "fill-(--color-accent) text-(--color-accent)" : "text-(--color-border)"}
        />
      ))}
    </span>
  );
}

function stakeLabel(option: DecisionOption, decision: Decision): string {
  if (option.retire) return "Ritiro";
  if (!option.club) return "Scelta";
  // "Resta" / stay options typically keep the current club label without transfer wording
  const looksLikeStay =
    /resta|rimani|rinnova|stay/i.test(option.label) ||
    (decision.category === "end-of-cycle" && /resta/i.test(option.label));
  if (looksLikeStay) return "Resta";
  if (decision.category === "loan") return "Prestito";
  if (decision.category === "loan-return") return "Rientro";
  return "Trasferimento";
}

export function OfferPanel({ decision, player, onChoose }: OfferPanelProps) {
  return (
    <div className="animate-step-in flex flex-col gap-5">
      <DecisionHeading decision={decision} />

      <div className="grid gap-3 sm:grid-cols-2">
        {decision.options.map((option) => {
          const chance = favorableOutcomeWeight(option);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChoose(option.id)}
              style={clubStyle(option.club?.id)}
              className={cn(
                "flex flex-col items-start gap-1.5 border-t-4 border-(--club-primary) bg-(--color-text)/5 p-4 text-left",
                "transition-all duration-150 hover:-translate-y-1 hover:bg-(--color-text)/10 hover:shadow-lg",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
              )}
            >
              <span className="md-slant md-fill md-label py-0.5 pr-5 pl-2 text-[11px]">
                {stakeLabel(option, decision)}
              </span>
              <span className="flex items-center gap-2 text-(--color-text)">
                {option.club ? (
                  <ClubCrest crestUrl={option.club.crestUrl} clubName={option.club.name} size={28} className="shrink-0" />
                ) : null}
                <span className="md-heading text-lg leading-tight">{option.label}</span>
              </span>
              {option.club ? (
                <>
                  <span className="text-xs text-(--color-text-muted)">
                    {countryLabel(option.club.country)} · {option.club.competitions.league}
                  </span>
                  <PrestigeStars prestige={option.club.prestige} />
                  <TacticalFitChip player={player} club={option.club} />
                </>
              ) : null}
              {option.retire ? (
                <span className="text-xs text-(--color-text-muted)">
                  Termina la tua carriera da professionista.
                </span>
              ) : null}
              {option.hint ? (
                <span className="text-xs text-(--color-text-muted)">{option.hint}</span>
              ) : null}
              {chance !== null ? (
                <span className="text-xs text-(--color-text-muted)">
                  Possibilità di andare bene:{" "}
                  <span className="font-semibold text-(--color-text)">{chance}%</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
