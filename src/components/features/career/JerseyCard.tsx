import type { Country } from "@/data/countries";
import { countryLabel } from "@/data/country-labels";
import { nationalKit } from "@/lib/career/kits";
import { POSITION_LABELS } from "@/lib/career/position-labels";
import { cn } from "@/lib/utils";
import type { Position, PreferredFoot } from "@/types/career";
import { Jersey } from "./Jersey";

interface JerseyCardProps {
  lastName: string;
  number: number | null;
  country?: Country;
  position?: Position | null;
  foot?: PreferredFoot;
  className?: string;
}

const FOOT_LABELS: Record<PreferredFoot, string> = { left: "sinistro", right: "destro" };

/** Anteprima della maglia della nazionale scelta, aggiornata mentre si compila l'identità. */
export function JerseyCard({ lastName, number, country, position, foot, className }: JerseyCardProps) {
  const kit = nationalKit(country?.code);
  const displayName = lastName.trim() ? lastName.trim().toUpperCase() : "Cognome";
  const displayNumber = number && number > 0 ? number : "—";
  const details = [
    position ? POSITION_LABELS[position] : null,
    country ? countryLabel(country.name) : null,
    foot ? FOOT_LABELS[foot] : null,
  ].filter(Boolean);

  return (
    <section
      aria-label="Anteprima maglia"
      className={cn(
        "md-panel flex flex-row items-center gap-3 p-3 lg:flex-col lg:gap-3.5 lg:px-5 lg:py-6",
        className,
      )}
      style={{ borderTopColor: kit.primary }}
    >
      <span className="md-label hidden self-start text-sm text-(--color-text-muted) lg:block">
        Maglia della nazionale
      </span>
      <Jersey kit={kit} number={displayNumber} lastName={lastName} size="md" className="lg:hidden" />
      <Jersey
        kit={kit}
        number={displayNumber}
        lastName={lastName}
        size="xl"
        className="hidden lg:flex"
      />
      <div className="flex min-w-0 flex-col gap-0.5 lg:items-center lg:text-center">
        <p className="md-heading max-w-full truncate text-3xl leading-none text-(--color-text) lg:text-4xl">
          {displayName}
        </p>
        {details.length > 0 ? (
          <p className="text-sm text-(--color-text-muted)">{details.join(" · ")}</p>
        ) : null}
      </div>
    </section>
  );
}
