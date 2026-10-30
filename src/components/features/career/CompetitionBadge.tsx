"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { getCompetitionBadge } from "@/data/competition-badges";
import { cn } from "@/lib/utils";

interface CompetitionBadgeProps {
  competition: string;
  size?: number;
  className?: string;
}

/**
 * Badge reale della competizione in hotlink (TheSportsDB) quando disponibile; se manca (es.
 * Serie C, che non ha un badge unico) o l'host esterno non risponde, ripiega su un'icona trofeo
 * generica invece di lasciare un buco vuoto.
 */
export function CompetitionBadge({ competition, size = 20, className }: CompetitionBadgeProps) {
  const [failed, setFailed] = useState(false);
  const url = getCompetitionBadge(competition);

  if (!url || failed) {
    return (
      <Trophy
        size={size * 0.7}
        aria-hidden="true"
        className={cn("shrink-0 text-(--color-accent)", className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- hotlink esterno (TheSportsDB), non un asset locale: next/image richiederebbe unoptimized/remotePatterns senza benefici sotto export statico.
    <img
      src={url}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 object-contain", className)}
      title={competition}
    />
  );
}
