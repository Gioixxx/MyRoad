"use client";

import { useState } from "react";
import { countryLabel } from "@/data/country-labels";
import { cn } from "@/lib/utils";

interface CountryFlagProps {
  code: string;
  name: string;
  fallbackEmoji: string;
  size?: number;
  className?: string;
}

/**
 * Bandiera reale in hotlink (flagcdn.com, SVG per codice ISO 3166-1 alpha-2 — supporta anche le
 * nazionali britanniche via i codici regione gb-eng/gb-sct/gb-wls). Ripiega sull'emoji bandiera se
 * l'host esterno non risponde: Windows non renderizza in modo affidabile le emoji bandiera (tofu o
 * codice lettere al posto del vessillo, specie per le sequenze tag britanniche), da cui l'hotlink.
 */
export function CountryFlag({ code, name, fallbackEmoji, size = 20, className }: CountryFlagProps) {
  const [failed, setFailed] = useState(false);
  const title = countryLabel(name);

  if (failed) {
    return (
      <span aria-hidden="true" className={cn("shrink-0", className)} title={title}>
        {fallbackEmoji}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- hotlink esterno (flagcdn.com), non un asset locale: next/image richiederebbe unoptimized/remotePatterns senza benefici sotto export statico.
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt=""
      aria-hidden="true"
      width={size}
      height={Math.round(size * 0.75)}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-[2px] object-cover", className)}
      title={title}
    />
  );
}
