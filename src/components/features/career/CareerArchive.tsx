import { Trophy as TrophyIcon } from "lucide-react";
import type { ArchivedCareer } from "@/types/career";
import { countries } from "@/data/countries";
import { computeHallOfFame } from "@/lib/career/satisfaction";
import { ARCHETYPE_LABELS } from "@/lib/career/traits";
import { Button } from "@/components/ui/Button";
import { CountryFlag } from "./CountryFlag";
import { OvrBadge } from "./OvrBadge";

interface CareerArchiveProps {
  entries: ArchivedCareer[];
  onBack: () => void;
}

const SAVINGS_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function CareerArchive({ entries, onBack }: CareerArchiveProps) {
  const hof = computeHallOfFame(entries);

  return (
    <div className="flex min-w-0 flex-col items-center gap-5 text-center">
      <div>
        <p className="font-display text-sm tracking-[0.2em] gold-metal-text">Archivio</p>
        <h2 className="font-display text-2xl text-(--color-text)">Le mie carriere</h2>
      </div>

      {entries.length > 0 ? (
        <div className="w-full min-w-0 chalk-panel rounded-xl p-4 text-left">
          <p className="font-display mb-3 text-xs tracking-[0.18em] gold-metal-text uppercase">
            Hall of Fame
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            <HofRow label="OVR più alto" entry={hof.highestOvr} detail={hof.highestOvr ? `OVR ${hof.highestOvr.peakOvr}` : null} />
            <HofRow
              label="Più trofei"
              entry={hof.mostTrophies}
              detail={hof.mostTrophies ? `${hof.mostTrophies.trophyCount} trofei` : null}
            />
            <HofRow
              label="Più ricco"
              entry={hof.richest}
              detail={hof.richest ? SAVINGS_FORMATTER.format(hof.richest.finalSavingsEur) : null}
            />
            <HofRow
              label="Più popolare"
              entry={hof.mostPopular}
              detail={hof.mostPopular ? `Pop ${hof.mostPopular.finalPopularity}` : null}
            />
          </ul>
        </div>
      ) : null}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-(--color-border) px-6 py-8 text-center">
          <TrophyIcon size={20} aria-hidden="true" className="text-(--color-text-muted)/60" />
          <p className="text-sm text-(--color-text-muted)">Nessuna carriera conclusa finora.</p>
        </div>
      ) : (
        <div className="w-full min-w-0 chalk-panel rounded-xl text-left">
          <ul className="divide-y divide-(--color-border)">
            {entries.map((entry) => {
              const country = countries.find((c) => c.name === entry.nationality);
              const isHof =
                entry.id === hof.highestOvr?.id ||
                entry.id === hof.mostTrophies?.id ||
                entry.id === hof.richest?.id ||
                entry.id === hof.mostPopular?.id;
              return (
                <li
                  key={entry.id}
                  className="flex flex-col gap-2 px-3 py-2.5 odd:bg-(--color-surface-raised)/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {country ? (
                      <CountryFlag
                        code={country.code}
                        name={country.name}
                        fallbackEmoji={country.flag}
                        size={16}
                      />
                    ) : null}
                    <span className="min-w-0 truncate font-medium text-(--color-text)">
                      {entry.lastName.toUpperCase()}
                    </span>
                    <span className="shrink-0 rounded bg-(--color-surface-raised) px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-text-muted) uppercase">
                      {entry.position}
                    </span>
                    <OvrBadge ovr={entry.peakOvr} size="sm" />
                    {isHof ? (
                      <span className="shrink-0 rounded bg-(--color-accent)/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-accent) uppercase">
                        HoF
                      </span>
                    ) : null}
                    {entry.archetypeId ? (
                      <span className="shrink-0 rounded bg-(--color-surface-raised) px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-text-muted) uppercase">
                        {ARCHETYPE_LABELS[entry.archetypeId]}
                      </span>
                    ) : null}
                  </div>
                  <p className="pl-6 text-xs text-(--color-text-muted) sm:pl-0">
                    {entry.careerTitle ? `${entry.careerTitle} · ` : ""}
                    Ritirato a {entry.retiredAge} anni · {entry.trophyCount}{" "}
                    {entry.trophyCount === 1 ? "trofeo" : "trofei"} · {entry.awardCount}{" "}
                    {entry.awardCount === 1 ? "premio" : "premi"} · Pop {entry.finalPopularity} ·{" "}
                    {SAVINGS_FORMATTER.format(entry.finalSavingsEur)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Button variant="secondary" onClick={onBack}>
        Torna
      </Button>
    </div>
  );
}

function HofRow({
  label,
  entry,
  detail,
}: {
  label: string;
  entry: ArchivedCareer | null;
  detail: string | null;
}) {
  return (
    <li className="rounded-lg bg-(--color-surface-raised)/60 px-3 py-2">
      <p className="text-[10px] font-semibold tracking-wide text-(--color-text-muted) uppercase">
        {label}
      </p>
      {entry ? (
        <p className="text-sm text-(--color-text)">
          <span className="font-semibold">{entry.lastName.toUpperCase()}</span>
          {detail ? <span className="text-(--color-text-muted)"> · {detail}</span> : null}
        </p>
      ) : (
        <p className="text-sm text-(--color-text-muted)">—</p>
      )}
    </li>
  );
}
