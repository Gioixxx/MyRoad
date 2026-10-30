import { useId } from "react";
import type { Country } from "@/data/countries";
import { cn } from "@/lib/utils";
import type { Kit, KitPattern } from "@/types/kit";
import { CountryFlag } from "./CountryFlag";

interface JerseyProps {
  kit: Kit;
  number: number | string;
  lastName?: string;
  side?: "retro" | "fronte";
  /** Sigla sullo stemma della vista frontale (es. "JUV"). */
  crestLabel?: string;
  /** Bandiera cucita in basso a destra, per ricordare la nazionalità. */
  country?: Country;
  size?: keyof typeof SIZE;
  className?: string;
}

const SIZE = {
  sm: { box: "h-16 w-16", flag: 12 },
  md: { box: "h-28 w-28", flag: 16 },
  lg: { box: "h-40 w-40", flag: 22 },
  xl: { box: "h-72 w-72", flag: 28 },
} as const;

const BODY_PATH =
  "M62 18 Q100 30 138 18 L176 38 L196 92 L166 104 L156 84 L156 208 Q100 216 44 208 L44 84 L34 104 L4 92 L24 38 Z";
const CUFFS_PATH = "M4 92 L34 104 L40 90 L10 78 Z M196 92 L166 104 L160 90 L190 78 Z";
const SIDE_SEAMS_PATH = "M44 84 L44 208 M156 84 L156 208";
const BACK_COLLAR_PATH = "M62 18 Q100 30 138 18 L132 10 Q100 22 68 10 Z";
const FRONT_COLLAR_PATH = "M66 14 L100 50 L134 14 L124 12 L100 38 L76 12 Z";
const CREST_PATH = "M122 56 H144 V68 Q144 78 133 82 Q122 78 122 68 Z";
/** Oltre questa lunghezza il cognome viene compresso per stare tra le spalle. */
const NAME_FIT_LENGTH = 8;
const NAME_FIT_WIDTH = 104;
const TEXT_FONT = { fontFamily: "var(--font-condensed), sans-serif", fontWeight: 800 } as const;

const STRIPE_XS = [10, 46, 82, 118, 154, 190];
const PINSTRIPE_XS = [14, 34, 54, 74, 94, 114, 134, 154, 174];

function PatternLayer({ pattern, color }: { pattern: KitPattern; color: string }) {
  switch (pattern) {
    case "strisce":
      return (
        <g fill={color}>
          {STRIPE_XS.map((x) => (
            <rect key={x} x={x} y={0} width={18} height={220} />
          ))}
        </g>
      );
    case "righe":
      return (
        <g fill={color}>
          {PINSTRIPE_XS.map((x) => (
            <rect key={x} x={x} y={0} width={3} height={220} />
          ))}
        </g>
      );
    case "meta":
      return <rect x={100} y={0} width={100} height={220} fill={color} />;
    case "fascia":
      return <path d="M18 18 L62 18 L184 220 L140 220 Z" fill={color} />;
    case "banda":
      return <rect x={0} y={78} width={200} height={36} fill={color} />;
    case "tinta":
      return null;
  }
}

/** Maglia vettoriale nei colori di un club o di una nazionale, vista da dietro o davanti. */
export function Jersey({
  kit,
  number,
  lastName,
  side = "retro",
  crestLabel,
  country,
  size = "lg",
  className,
}: JerseyProps) {
  // Gli id di clipPath/gradienti devono essere unici per istanza: più maglie nella stessa pagina.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `jersey-body-${uid}`;
  const shadeId = `jersey-shade-${uid}`;
  const foldId = `jersey-fold-${uid}`;
  const s = SIZE[size];
  const name = lastName?.trim() ? lastName.trim().toUpperCase() : "";
  const label = [`Maglia numero ${number}`, name].filter(Boolean).join(", ");

  return (
    <div className={cn("relative flex shrink-0 items-center justify-center", s.box, className)}>
      <svg
        viewBox="0 0 200 220"
        role="img"
        aria-label={label}
        className="h-full w-auto drop-shadow-md"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={BODY_PATH} />
          </clipPath>
          <linearGradient id={shadeId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.32" />
            <stop offset="0.3" stopColor="#fff" stopOpacity="0.14" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.34" />
          </linearGradient>
          <linearGradient id={foldId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#000" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        <path d={BODY_PATH} fill={kit.primary} />
        <g clipPath={`url(#${clipId})`}>
          <PatternLayer pattern={kit.pattern} color={kit.secondary} />
          <rect x={0} y={0} width={200} height={220} fill={`url(#${foldId})`} />
          <rect x={0} y={0} width={200} height={220} fill={`url(#${shadeId})`} />
          <path d={CUFFS_PATH} fill={kit.trim} />
          <path d={SIDE_SEAMS_PATH} stroke="#000" strokeOpacity={0.18} strokeWidth={1.5} />
        </g>
        {/* Contorno a metà tono: stacca una maglia bianca dal tema chiaro e una nera dal scuro. */}
        <path
          d={BODY_PATH}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          style={{ stroke: "var(--color-text-muted)", strokeOpacity: 0.55 }}
        />

        {side === "retro" ? (
          <g>
            <path d={BACK_COLLAR_PATH} fill={kit.trim} />
            {name ? (
              <text
                x={100}
                y={66}
                textAnchor="middle"
                fontSize={20}
                letterSpacing={2}
                textLength={name.length > NAME_FIT_LENGTH ? NAME_FIT_WIDTH : undefined}
                lengthAdjust="spacingAndGlyphs"
                fill={kit.ink}
                stroke={kit.stroke}
                strokeWidth={3}
                strokeLinejoin="round"
                paintOrder="stroke"
                style={TEXT_FONT}
              >
                {name}
              </text>
            ) : null}
            <text
              x={100}
              y={158}
              textAnchor="middle"
              fontSize={92}
              fill={kit.ink}
              stroke={kit.stroke}
              strokeWidth={5}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={TEXT_FONT}
            >
              {number}
            </text>
          </g>
        ) : (
          <g>
            <path d={FRONT_COLLAR_PATH} fill={kit.trim} />
            <path d={CREST_PATH} fill={kit.trim} stroke={kit.ink} strokeWidth={1.5} />
            {crestLabel ? (
              <text
                x={133}
                y={73}
                textAnchor="middle"
                fontSize={9}
                fill={kit.ink}
                style={TEXT_FONT}
              >
                {crestLabel}
              </text>
            ) : null}
            <text
              x={70}
              y={74}
              textAnchor="middle"
              fontSize={20}
              fill={kit.ink}
              stroke={kit.stroke}
              strokeWidth={2}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={TEXT_FONT}
            >
              {number}
            </text>
          </g>
        )}
      </svg>

      {country ? (
        <span className="absolute right-0 bottom-0">
          <CountryFlag
            code={country.code}
            name={country.name}
            fallbackEmoji={country.flag}
            size={s.flag}
            className="shadow-sm"
          />
        </span>
      ) : null}
    </div>
  );
}
