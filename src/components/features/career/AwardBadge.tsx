"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import type { AwardType } from "@/types/career";
import { AWARD_IMAGES } from "@/data/award-images";
import { cn } from "@/lib/utils";

// Icona trofeo stilizzata generica (Twemoji, CC BY 4.0) — fallback se l'immagine reale del
// premio (AWARD_IMAGES) non carica.
const TWEMOJI_TROPHY_URL =
  "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f3c6.svg";

interface AwardBadgeProps {
  type: AwardType;
  size?: number;
  className?: string;
}

export function AwardBadge({ type, size = 20, className }: AwardBadgeProps) {
  const [failed, setFailed] = useState(false);
  const url = AWARD_IMAGES[type];

  if (failed) {
    return (
      <Award
        size={size * 0.7}
        aria-hidden="true"
        className={cn("shrink-0 text-(--color-ovr-gold)", className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- hotlink esterno (Wikimedia Commons), non un asset locale: next/image richiederebbe unoptimized/remotePatterns senza benefici sotto export statico.
    <img
      src={url ?? TWEMOJI_TROPHY_URL}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
