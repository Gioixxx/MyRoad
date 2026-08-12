import { APP_RELEASE_DATE_ISO, APP_VERSION, formatReleaseDate } from "@/constants/app-info";

export function VersionBadge() {
  const releaseLabel = formatReleaseDate(APP_RELEASE_DATE_ISO);

  return (
    <p
      className="pointer-events-none fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-20 select-none text-right leading-tight"
      aria-label={`Versione ${APP_VERSION}, rilasciata il ${releaseLabel}`}
    >
      <span className="block font-display text-[11px] tracking-[0.18em] text-(--color-text-muted) sm:text-xs">
        v{APP_VERSION}
      </span>
      <span className="block text-[10px] text-(--color-text-muted)/80">{releaseLabel}</span>
    </p>
  );
}
