import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Prefissa un percorso assoluto verso public/ con il basePath di build (vuoto per exe/APK,
 * "/MyRoad" su GitHub Pages) — necessario perché Next.js riscrive da solo solo i propri asset
 * (_next/*, favicon), non le stringhe hardcoded nel codice applicativo. Vedi next.config.ts. */
export function withBasePath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
