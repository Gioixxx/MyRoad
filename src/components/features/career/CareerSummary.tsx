import { Flag, Trophy as TrophyIcon } from "lucide-react";
import type { ArchivedCareer, Player } from "@/types/career";
import { AWARD_LABELS } from "@/lib/career/award-labels";
import { hallOfFameWinsFor, pickBestCareerTitle } from "@/lib/career/satisfaction";
import { deriveShadowTitle } from "@/lib/career/shadow";
import { peakOvr, summarizeClubHistory } from "@/lib/career/summary";
import { ARCHETYPE_LABELS, deriveArchetype } from "@/lib/career/traits";
import { PLAY_STYLE_LABELS } from "@/lib/career/playstyles";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AwardBadge } from "./AwardBadge";
import { ClubCrest } from "./ClubCrest";
import { CompetitionBadge } from "./CompetitionBadge";
import { OvrBadge } from "./OvrBadge";
import { PopularityMeter } from "./PopularityMeter";

const SAVINGS_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const HOF_WIN_LABELS: Record<
  "highestOvr" | "mostTrophies" | "richest" | "mostPopular",
  string
> = {
  highestOvr: "OVR record",
  mostTrophies: "Più trofei",
  richest: "Più ricco",
  mostPopular: "Più popolare",
};

interface CareerSummaryProps {
  player: Player;
  onRestart: () => void;
  archive?: ArchivedCareer[];
}

function EmptyShowcase({ children }: { children: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-(--color-border) px-2 py-2 text-center lg:gap-1.5 lg:py-4">
      <TrophyIcon size={18} aria-hidden="true" className="text-(--color-text-muted)/60" />
      <p className="text-[11px] leading-snug text-(--color-text-muted) lg:text-xs">{children}</p>
    </div>
  );
}

export function CareerSummary({ player, onRestart, archive = [] }: CareerSummaryProps) {
  const isGoalkeeper = player.position === "GK";
  const clubs = summarizeClubHistory(player.clubHistory);
  const trophies = [...player.trophies].sort((a, b) => a.age - b.age);
  const awards = [...player.awards].sort((a, b) => a.age - b.age);
  const bestTitle = pickBestCareerTitle(player.seasonTitles);
  const recentTitles = [...player.seasonTitles].slice(-4).reverse();
  const archetype = deriveArchetype(player.traits, player.shadow);
  const shadowTitle = deriveShadowTitle(player.shadow, player.shadowFlags?.redeemed ?? false);

  const highlightTrophies = [...trophies].slice(-3).reverse();
  const highlightAwards = [...awards].slice(-2).reverse();
  const hasHighlights =
    highlightTrophies.length > 0 ||
    highlightAwards.length > 0 ||
    player.nationalTeam.called;

  const provisionalEntry: ArchivedCareer = {
    id: "__current__",
    lastName: player.lastName,
    nationality: player.nationality,
    position: player.position,
    peakOvr: peakOvr(player),
    trophyCount: player.trophies.length,
    awardCount: player.awards.length,
    retiredAge: player.age,
    retiredAtIso: new Date().toISOString(),
    careerApps: player.career.apps,
    careerGoals: player.career.goals,
    careerAssists: player.career.assists,
    finalSavingsEur: player.wallet.savingsEur,
    finalPopularity: player.popularity,
    careerTitle: bestTitle,
  };
  const hofWins = hallOfFameWinsFor(provisionalEntry, archive);

  return (
    <div className="animate-step-in flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto lg:overflow-hidden">
      {/* Hero — compact, no wasted space */}
      <Card className="flex shrink-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="font-display text-xs tracking-[0.25em] gold-metal-text">
            Carriera conclusa
          </p>
          <h2 className="font-display text-2xl leading-tight text-(--color-text) sm:text-3xl">
            {player.lastName.toUpperCase()}
          </h2>
          <p className="text-xs text-(--color-text-muted) sm:text-sm">
            Ritirato a {player.age} anni · {player.clubHistory.length}{" "}
            {player.clubHistory.length === 1 ? "ciclo" : "cicli"} · {bestTitle}
            {archetype.primary ? ` · Stile: ${ARCHETYPE_LABELS[archetype.primary]}` : ""}
            {shadowTitle ? ` · ${shadowTitle}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:w-[22rem] sm:shrink-0">
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-(--color-surface-raised) py-2">
            <OvrBadge ovr={peakOvr(player)} size="sm" />
            <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">Ovr</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-(--color-surface-raised) py-2">
            <p className="font-display text-lg leading-none text-(--color-text)">
              {player.career.apps}
            </p>
            <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">Pres.</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-(--color-surface-raised) py-2">
            <p className="font-display text-lg leading-none text-(--color-text)">
              {isGoalkeeper ? (player.career.goalsAgainst ?? 0) : player.career.goals}
            </p>
            <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">
              {isGoalkeeper ? "Gol subiti" : "Gol"}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-(--color-surface-raised) py-2">
            <p className="font-display text-lg leading-none text-(--color-text)">
              {isGoalkeeper ? (player.career.cleanSheets ?? 0) : player.career.assists}
            </p>
            <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">
              {isGoalkeeper ? "Clean sheet" : "Ast."}
            </p>
          </div>
        </div>

        <Button variant="secondary" onClick={onRestart} className="shrink-0 self-center sm:self-auto">
          Gioca ancora
        </Button>
      </Card>

      <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-(--color-text-muted)">
        <span>
          Patrimonio finale{" "}
          <span className="font-semibold text-(--color-text)">
            {SAVINGS_FORMATTER.format(player.wallet.savingsEur)}
          </span>
        </span>
        <span className="flex min-w-40 items-center gap-2">
          Popolarità finale
          <PopularityMeter value={player.popularity} className="min-w-24 flex-1" />
        </span>
      </div>

      {hofWins.length > 0 ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="font-display text-sm tracking-[0.15em] gold-metal-text uppercase">
            Hall of Fame
          </span>
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

      {player.playStyles.length > 0 ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="font-display text-sm tracking-[0.15em] text-(--color-ovr-gold) uppercase">
            Stili di gioco
          </span>
          {player.playStyles.map((id) => (
            <span
              key={id}
              className="rounded-full border border-(--color-ovr-gold)/35 bg-(--color-ovr-gold)/10 px-2.5 py-1 text-xs text-(--color-text)"
            >
              {PLAY_STYLE_LABELS[id]}
            </span>
          ))}
        </div>
      ) : null}

      {hasHighlights ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="font-display text-sm tracking-[0.15em] text-(--color-ovr-gold) uppercase">
            Momenti
          </span>
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
              <AwardBadge type={a.type} size={16} />
              <span className="truncate">
                {AWARD_LABELS[a.type]}
                <span className="text-(--color-text-muted)"> · {a.age}</span>
              </span>
            </span>
          ))}
          {player.nationalTeam.called ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-(--color-accent)/40 bg-(--color-accent)/10 px-2.5 py-1 text-xs text-(--color-accent)">
              <Flag size={14} aria-hidden="true" />
              Nazionale · {player.nationalTeam.apps} pres.
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Detail panels — fill remaining viewport, scroll inside */}
      <div className="grid min-h-0 min-w-0 gap-3 lg:flex-1 lg:grid-cols-2 lg:overflow-hidden">
        <Card className="flex min-h-0 min-w-0 flex-col p-3 sm:p-4 lg:overflow-hidden">
          <h3 className="font-display mb-2 shrink-0 text-sm tracking-[0.15em] text-(--color-text-muted) uppercase">
            Club
          </h3>
          {clubs.length > 0 ? (
            <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
              <ul className="divide-y divide-(--color-border) md:hidden">
                {clubs.map((c) => (
                  <li
                    key={c.club.id}
                    className="flex flex-col gap-0.5 py-2 odd:bg-(--color-surface-raised)/40"
                  >
                    <div className="flex min-w-0 items-center gap-2 px-1">
                      <ClubCrest
                        crestUrl={c.club.crestUrl}
                        clubName={c.club.name}
                        size={16}
                        className="shrink-0"
                      />
                      <span className="min-w-0 truncate text-sm font-medium text-(--color-text)">
                        {c.club.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-(--color-text-muted)">
                        {c.ageFrom}–{c.ageTo}
                      </span>
                    </div>
                    <p className="px-1 pl-6 text-[11px] text-(--color-text-muted)">
                      {isGoalkeeper
                        ? `${c.stats.apps}P · ${c.stats.goalsAgainst ?? 0}GS · ${c.stats.cleanSheets ?? 0}CS`
                        : `${c.stats.apps}P · ${c.stats.goals}G · ${c.stats.assists}A`}
                      {c.stintCount > 1 ? ` · ×${c.stintCount}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
              <table className="hidden w-full table-fixed text-sm md:table">
                <thead className="sticky top-0 bg-(--color-surface)">
                  <tr className="border-b border-(--color-border) text-left text-[10px] text-(--color-text-muted) uppercase">
                    <th className="px-1.5 py-1.5 font-medium">Club</th>
                    <th className="w-16 px-1.5 py-1.5 font-medium">Età</th>
                    <th className="w-10 px-1.5 py-1.5 text-right font-medium">P</th>
                    <th className="w-9 px-1.5 py-1.5 text-right font-medium">{isGoalkeeper ? "GS" : "G"}</th>
                    <th className="w-9 px-1.5 py-1.5 text-right font-medium">{isGoalkeeper ? "CS" : "A"}</th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map((c) => (
                    <tr
                      key={c.club.id}
                      className="border-b border-(--color-border) last:border-0 odd:bg-(--color-surface-raised)/40"
                    >
                      <td className="max-w-0 px-1.5 py-1.5 font-medium text-(--color-text)">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <ClubCrest
                            crestUrl={c.club.crestUrl}
                            clubName={c.club.name}
                            size={16}
                            className="shrink-0"
                          />
                          <span className="truncate text-sm">{c.club.name}</span>
                          {c.stintCount > 1 ? (
                            <span className="shrink-0 text-[10px] text-(--color-text-muted)">
                              ({c.stintCount})
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-1.5 py-1.5 text-xs text-(--color-text-muted)">
                        {c.ageFrom}–{c.ageTo}
                      </td>
                      <td className="px-1.5 py-1.5 text-right text-sm text-(--color-text)">
                        {c.stats.apps}
                      </td>
                      <td className="px-1.5 py-1.5 text-right text-sm text-(--color-text)">
                        {isGoalkeeper ? (c.stats.goalsAgainst ?? 0) : c.stats.goals}
                      </td>
                      <td className="px-1.5 py-1.5 text-right text-sm text-(--color-text)">
                        {isGoalkeeper ? (c.stats.cleanSheets ?? 0) : c.stats.assists}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-(--color-text-muted)">Nessun club nella carriera.</p>
          )}
        </Card>

        <div className="grid min-h-0 min-w-0 grid-cols-2 gap-3 lg:flex lg:flex-col lg:overflow-hidden">
          <Card className="flex aspect-square min-h-0 min-w-0 flex-col p-3 sm:p-4 lg:aspect-auto lg:shrink-0">
            <h3 className="font-display mb-2 shrink-0 text-sm tracking-[0.15em] text-(--color-text-muted) uppercase">
              Nazionale
            </h3>
            {player.nationalTeam.called ? (
              <div className="grid min-h-0 flex-1 grid-cols-3 content-center gap-1.5 text-center">
                <div className="rounded-lg bg-(--color-surface-raised) py-1.5">
                  <p className="font-display text-base text-(--color-text)">
                    {player.nationalTeam.apps}
                  </p>
                  <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">
                    Pres.
                  </p>
                </div>
                <div className="rounded-lg bg-(--color-surface-raised) py-1.5">
                  <p className="font-display text-base text-(--color-text)">
                    {isGoalkeeper ? (player.nationalTeam.goalsAgainst ?? 0) : player.nationalTeam.goals}
                  </p>
                  <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">
                    {isGoalkeeper ? "Gol subiti" : "Gol"}
                  </p>
                </div>
                <div className="rounded-lg bg-(--color-surface-raised) py-1.5">
                  <p className="font-display text-base text-(--color-text)">
                    {isGoalkeeper ? (player.nationalTeam.cleanSheets ?? 0) : player.nationalTeam.assists}
                  </p>
                  <p className="text-[11px] tracking-wide text-(--color-text-muted) uppercase">
                    {isGoalkeeper ? "Clean sheet" : "Assist"}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyShowcase>Mai convocato in nazionale.</EmptyShowcase>
            )}
          </Card>

          <Card className="flex aspect-square min-h-0 min-w-0 flex-col p-3 sm:p-4 lg:aspect-auto lg:flex-1">
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
                    <span className="min-w-0 truncate text-(--color-text)">
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
                    <AwardBadge type={a.type} size={16} />
                    <span className="min-w-0 truncate text-(--color-text)">
                      {AWARD_LABELS[a.type]}
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
    </div>
  );
}
