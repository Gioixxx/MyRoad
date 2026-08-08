"use client";

import { useState } from "react";
import { getCompetitionTrophy } from "@/data/competition-trophies";
import { cn } from "@/lib/utils";

interface TrophyImageProps {
  competition: string;
  size?: number;
  className?: string;
}

/**
 * Immagine reale del trofeo fisico (TheSportsDB, distinta dal badge/stemma di CompetitionBadge).
 * A differenza di CompetitionBadge, se manca o l'host non risponde non mostra alcun fallback
 * generico: il badge già mostrato accanto copre da solo il caso "nessuna immagine disponibile".
 */
export function TrophyImage({ competition, size = 72, className }: TrophyImageProps) {
  const [failed, setFailed] = useState(false);
  const url = getCompetitionTrophy(competition);

  if (!url || failed) return null;

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
