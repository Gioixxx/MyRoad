import type { Country } from "@/data/countries";
import { cn } from "@/lib/utils";
import { nationalKit } from "@/lib/career/kits";
import { Jersey } from "./Jersey";

interface JerseyCardProps {
  lastName: string;
  number: number | null;
  country?: Country;
  className?: string;
  /** Always compact. If false, compact on small screens and larger from lg up. */
  compact?: boolean;
}

export function JerseyCard({
  lastName,
  number,
  country,
  className,
  compact = false,
}: JerseyCardProps) {
  const displayName = lastName.trim() ? lastName.trim().toUpperCase() : "COGNOME";
  const displayNumber = number && number > 0 ? number : "—";
  const kit = nationalKit(country?.code);
  const serial = String(number && number > 0 ? number : 0).padStart(6, "0");

  return (
    <div
      className={cn(
        "dossier-perforated chalk-panel flex flex-col items-center rounded-2xl gold-metal-border",
        compact
          ? "gap-2 px-4 py-3"
          : "gap-2 px-4 py-3 lg:gap-4 lg:px-6 lg:pt-5 lg:pb-6",
        className,
      )}
    >
      <span
        className={cn(
          "font-display tracking-[0.25em] gold-metal-text",
          compact ? "text-[10px]" : "text-[10px] lg:text-xs",
        )}
      >
        Cartellino
      </span>

      {compact ? (
        <Jersey
          kit={kit}
          number={displayNumber}
          lastName={lastName}
          country={country}
          size="md"
        />
      ) : (
        <>
          <Jersey
            kit={kit}
            number={displayNumber}
            lastName={lastName}
            country={country}
            size="md"
            className="lg:hidden"
          />
          <Jersey
            kit={kit}
            number={displayNumber}
            lastName={lastName}
            country={country}
            size="lg"
            className="hidden lg:flex"
          />
        </>
      )}

      <div className="flex flex-col items-center gap-0.5 text-center">
        <p
          className={cn(
            "font-display max-w-[10rem] truncate text-(--color-text)",
            compact ? "text-lg" : "text-lg lg:text-xl",
          )}
        >
          {displayName}
        </p>
        <p className="text-[10px] font-medium tracking-[0.25em] text-(--color-text-muted) uppercase">
          Nº {serial}
        </p>
      </div>
    </div>
  );
}
