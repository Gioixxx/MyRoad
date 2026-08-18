import { version as packageVersion } from "../../package.json";

/** Public app version — always matches `package.json`. */
export const APP_VERSION: string = packageVersion;

/**
 * ISO date of the current tagged release. Update together with the version bump
 * when cutting a GitHub Release.
 */
export const APP_RELEASE_DATE_ISO = "2026-08-18";

export function formatReleaseDate(isoDate: string = APP_RELEASE_DATE_ISO): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
