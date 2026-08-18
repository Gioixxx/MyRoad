import { Award as AwardIcon, Trophy as TrophyIcon } from "lucide-react";
import type { ArchivedCoachCareer, Coach } from "@/types/coach";
import { deriveShadowTitle } from "@/lib/career/shadow";
import { ARCHETYPE_LABELS, deriveArchetype } from "@/lib/career/traits";
import { buildCoachArchiveEntry } from "@/lib/coach-career/storage";
import {
  COACH_AWARD_LABELS,
  coachHallOfFameWinsFor,
  pickBestCoachCareerTitle,
} from "@/lib/coach-career/coach-satisfaction";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CompetitionBadge } from "@/components/features/career/CompetitionBadge";
import { OvrBadge } from "@/components/features/career/OvrBadge";
import { PopularityMeter } from "@/components/features/career/PopularityMeter";
import { CoachHistoryTable } from "./CoachHistoryTable";

const SAVINGS_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const HOF_WIN_LABELS: Record<"highestReputation" | "mostTrophies" | "richest" | "mostPopular", string> = {
  highestReputation: "Reputazione record",
  mostTrophies: "Più trofei",
  richest: "Più ricco",
  mostPopular: "Più popolare",
};

function EmptyShowcase({ children }: { children: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-(--color-border) px-2 py-2 text-center lg:gap-1.5 lg:py-4">
      <TrophyIcon size={18} aria-hidden="true" className="text-(--color-text-muted)/60" />
      <p className="text-[11px] leading-snug text-(--color-text-muted) lg:text-xs">{children}</p>
    </div>
  );
}

interface CoachSummaryProps {
  coach: Coach;
  onRestart: () => void;
  onShowArchive?: () => void;
  archive?: ArchivedCoachCareer[];
}

export function CoachSummary({ coach, onRestart, onShowArchive, archive = [] }: CoachSummaryProps) {
  const trophies = [...coach.trophies].sort((a, b) => a.age - b.age);
  const awards = [...coach.awards].sort((a, b) => a.age - b.age);
  const bestTitle = pickBestCoachCareerTitle(coach.seasonTitles);
  const recentTitles = [...coach.seasonTitles].slice(-4).reverse();
  const archetype = deriveArchetype(coach.traits, coach.shadow);
  const shadowTitle = deriveShadowTitle(coach.shadow, coach.shadowFlags?.redeemed ?? false);
  const clubsManaged = new Set(coach.clubHistory.map((s) => s.club.id)).size;

  const highlightTrophies = [...trophies].slice(-3).reverse();
  const highlightAwards = [...awards].slice(-2).reverse();
  const hasHighlights = highlightTrophies.length > 0 || highlightAwards.length > 0;

  const provisionalEntry: ArchivedCoachCareer = buildCoachArchiveEntry(coach);
  const hofWins = coachHallOfFameWinsFor(provisionalEntry, archive);

  return (
    <div className="animate-step-in flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto lg:overflow-hidden">
      <Card className="flex shrink-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="font-display text-xs tracking-[0.25em] gold-metal-text">Carriera conclusa</p>
          <h2 className="font-display text-2xl leading-tight text-(--color-text) sm:text-3xl">
            {coach.lastName.toUpperCase()}
          </h2>
          <p className="text-xs text-(--color-text-muted) sm:text-sm">
            Ritirato a {coach.age} anni · {clubsManaged} {clubsManaged === 1 ? "club allenato" : "club allenati"} ·{" "}
            {bestTitle}
            {archetype.primary ? ` · Stile: ${ARCHETYPE_LABELS[archetype.primary]}` : ""}
            {shadowTitle ? ` · ${shadowTitle}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:w-[22rem] sm:shrink-0">
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-(--color-surface-raised) py-2">
            <OvrBadge ovr={coach.records.peakReputation} size="sm" />
            <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">Rep.</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-(--color-surface-raised) py-2">
            <p className="font-display text-lg leading-none text-(--color-text)">{clubsManaged}</p>
            <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">Club</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-(--color-surface-raised) py-2">
            <p className="font-display text-lg leading-none text-(--color-text)">{coach.trophies.length}</p>
            <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">Trofei</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-(--color-surface-raised) py-2">
            <p className="font-display text-lg leading-none text-(--color-text)">{coach.awards.length}</p>
            <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">Premi</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5 sm:self-auto">
          <Button variant="secondary" onClick={onRestart}>
            Nuova carriera
          </Button>
          {onShowArchive ? (
            <Button variant="ghost" onClick={onShowArchive} className="px-0 text-xs">
              Le mie carriere
            </Button>
          ) : null}
        </div>
      </Card>

      <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-(--color-text-muted)">
        <span>
          Patrimonio finale{" "}
          <span className="font-semibold text-(--color-text)">
            {SAVINGS_FORMATTER.format(coach.wallet.savingsEur)}
          </span>
        </span>
        <span className="flex min-w-40 items-center gap-2">
          Popolarità finale
          <PopularityMeter value={coach.popularity} className="min-w-24 flex-1" />
        </span>
      </div>

      {hofWins.length > 0 ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="font-display text-sm tracking-[0.15em] gold-metal-text uppercase">Hall of Fame</span>
          {hofWins.map((win) => (
            <span
              key={win}
              className="rounded-full border border-(--color-accent)/40 bg-(--color-accent)/10 px-2.5 py-1 text-xs text-(--color-accent)"
            >
              {HOF_WIN_LABELS[win]}
            </span>
          ))}
        </div>
      ) : null}

      {recentTitles.length > 0 ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="font-display text-sm tracking-[0.15em] text-(--color-ovr-gold) uppercase">
            Titoli di stagione
          </span>
          {recentTitles.map((t, i) => (
            <span
              key={`${t.id}-${t.age}-${i}`}
              className="rounded-full border border-(--color-ovr-gold)/35 bg-(--color-ovr-gold)/10 px-2.5 py-1 text-xs text-(--color-text)"
            >
              {t.label}
              <span className="text-(--color-text-muted)"> · {t.age}</span>
            </span>
          ))}
        </div>
      ) : null}

      {hasHighlights ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="font-display text-sm tracking-[0.15em] text-(--color-ovr-gold) uppercase">Momenti</span>
          {highlightTrophies.map((t, i) => (
            <span
              key={`hl-trophy-${i}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-(--color-ovr-gold)/35 bg-(--color-ovr-gold)/10 px-2.5 py-1 text-xs text-(--color-text)"
            >
              <CompetitionBadge competition={t.competition} size={16} />
              <span className="truncate">
                {t.competition}
                <span className="text-(--color-text-muted)"> · {t.age}</span>
              </span>
            </span>
          ))}
          {highlightAwards.map((a, i) => (
            <span
              key={`hl-award-${i}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-(--color-ovr-gold)/35 bg-(--color-ovr-gold)/10 px-2.5 py-1 text-xs text-(--color-text)"
            >
              <AwardIcon size={14} aria-hidden="true" />
              <span className="truncate">
                {COACH_AWARD_LABELS[a.type]}
                <span className="text-(--color-text-muted)"> · {a.age}</span>
              </span>
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid min-h-0 min-w-0 gap-3 lg:flex-1 lg:grid-cols-2 lg:overflow-hidden">
        <Card className="flex min-h-0 min-w-0 flex-col p-3 sm:p-4 lg:overflow-hidden">
          <h3 className="font-display mb-2 shrink-0 text-sm tracking-[0.15em] text-(--color-text-muted) uppercase">
            Storico
          </h3>
          {coach.clubHistory.length > 0 ? (
            <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
              <CoachHistoryTable coach={coach} />
            </div>
          ) : (
            <p className="text-sm text-(--color-text-muted)">Nessun club nella carriera.</p>
          )}
        </Card>

        <Card className="flex min-h-0 min-w-0 flex-col p-3 sm:p-4 lg:overflow-hidden">
          <h3 className="font-display mb-2 shrink-0 text-sm tracking-[0.15em] text-(--color-text-muted) uppercase">
            Trofei e premi
          </h3>
          {trophies.length === 0 && awards.length === 0 ? (
            <EmptyShowcase>Nessun trofeo o premio vinto in carriera.</EmptyShowcase>
          ) : (
            <ul className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-y-auto text-sm">
              {trophies.map((t, i) => (
                <li key={`trophy-${i}`} className="flex min-w-0 items-center gap-2">
                  <CompetitionBadge competition={t.competition} size={16} />
                  <span className="min-w-0 text-(--color-text)">
                    {t.competition}
                    <span className="text-(--color-text-muted)">
                      {" "}
                      — {t.club ? t.club.name : "Nazionale"}, {t.age}
                    </span>
                  </span>
                </li>
              ))}
              {awards.map((a, i) => (
                <li key={`award-${i}`} className="flex min-w-0 items-center gap-2">
                  <AwardIcon size={16} aria-hidden="true" className="shrink-0 text-(--color-ovr-gold)" />
                  <span className="min-w-0 text-(--color-text)">
                    {COACH_AWARD_LABELS[a.type]}
                    <span className="text-(--color-text-muted)">
                      {" "}
                      — {a.club ? a.club.name : "Nazionale"}, {a.age}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
