import { APP_RELEASE_DATE_ISO, APP_VERSION, formatReleaseDate } from "@/constants/app-info";
import { cn } from "@/lib/utils";

interface VersionBadgeProps {
  /**
   * "floating": fisso in basso a destra, solo da `lg:` in su — sotto quel breakpoint copriva il
   * contenuto che scorre (righe dello Storico). "inline": nel flusso, per le Impostazioni.
   */
  variant?: "floating" | "inline";
  className?: string;
}

export function VersionBadge({ variant = "floating", className }: VersionBadgeProps) {
  const releaseLabel = formatReleaseDate(APP_RELEASE_DATE_ISO);

  return (
    <p
      className={cn(
        "select-none leading-tight",
        variant === "floating"
          ? "pointer-events-none fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-20 hidden text-right lg:block"
          : "text-center",
        className,
      )}
      aria-label={`Versione ${APP_VERSION}, rilasciata il ${releaseLabel}`}
    >
      <span className="block font-display text-[11px] tracking-[0.18em] text-(--color-text-muted) sm:text-xs">
        v{APP_VERSION}
      </span>
      <span className="block text-[10px] text-(--color-text-muted)/80">{releaseLabel}</span>
    </p>
  );
}
