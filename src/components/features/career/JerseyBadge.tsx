import type { Country } from "@/data/countries";
import { cn, withBasePath } from "@/lib/utils";
import { CountryFlag } from "./CountryFlag";

interface JerseyBadgeProps {
  number: number | string;
  lastName?: string;
  country?: Country;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE = {
  sm: {
    box: "h-16 w-16",
    number: "text-xl",
    name: "text-[7px] tracking-[0.12em]",
    flagTop: "top-2",
    flagSize: 12,
    numberTop: "top-[48%]",
  },
  md: {
    box: "h-28 w-28",
    number: "text-4xl",
    name: "text-[9px] tracking-[0.16em]",
    flagTop: "top-3.5",
    flagSize: 16,
    numberTop: "top-[46%]",
  },
  lg: {
    box: "h-40 w-40",
    number: "text-5xl",
    name: "text-[11px] tracking-[0.18em]",
    flagTop: "top-5",
    flagSize: 22,
    numberTop: "top-[45%]",
  },
} as const;

/** Maglia realistica con overlay tipografico (cognome + numero) e bandiera. */
export function JerseyBadge({
  number,
  lastName,
  country,
  size = "lg",
  className,
}: JerseyBadgeProps) {
  const s = SIZE[size];
  const name = lastName?.trim() ? lastName.trim().toUpperCase() : null;

  return (
    <div
      className={cn("relative flex shrink-0 items-center justify-center", s.box, className)}
      aria-hidden={false}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- asset statico locale */}
      <img
        src={withBasePath("/jersey/base.webp")}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-contain drop-shadow-md"
        draggable={false}
      />

      {country ? (
        <span className={cn("absolute z-10", s.flagTop)}>
          <CountryFlag
            code={country.code}
            name={country.name}
            fallbackEmoji={country.flag}
            size={s.flagSize}
            className="shadow-sm"
          />
        </span>
      ) : null}

      {name ? (
        <span
          className={cn(
            "font-display absolute top-[32%] z-10 max-w-[70%] truncate text-center text-[#f0d78a]",
            "[text-shadow:0_1px_2px_rgba(0,0,0,0.75)]",
            s.name,
          )}
        >
          {name}
        </span>
      ) : null}

      <span
        className={cn(
          "font-display absolute z-10 leading-none text-[#f0d78a]",
          "[text-shadow:0_2px_4px_rgba(0,0,0,0.8)]",
          s.numberTop,
          s.number,
        )}
      >
        {number}
      </span>
    </div>
  );
}
