import type { CSSProperties, ReactNode } from "react";
import { Star, Trophy as TrophyIcon } from "lucide-react";
import type { ArchivedCareer, Player } from "@/types/career";
import { countryLabel } from "@/data/country-labels";
import { AWARD_LABELS } from "@/lib/career/award-labels";
import { clubPalette } from "@/lib/career/club-colors";
import { clubKit } from "@/lib/career/kits";
import { POSITION_LABELS } from "@/lib/career/position-labels";
import { hallOfFameWinsFor, pickBestCareerTitle } from "@/lib/career/satisfaction";
import { deriveShadowTitle } from "@/lib/career/shadow";
import { buildArchiveEntry } from "@/lib/career/storage";
import { buildCareerRibbon, peakOvr, summarizeClubHistory } from "@/lib/career/summary";
import { ARCHETYPE_LABELS, deriveArchetype } from "@/lib/career/traits";
import { summarizeAwards, summarizeTrophies } from "@/lib/career/trophy-breakdown";
import { PLAY_STYLE_LABELS } from "@/lib/career/playstyles";
import { isEligibleForCoachContinuity } from "@/lib/coach-career/bridge";
import { isLeaderboardConfigured } from "@/lib/leaderboard/client";
import type { PublishStatus } from "@/lib/leaderboard/types";
import { cn } from "@/lib/utils";
import { AwardBadge } from "./AwardBadge";
import { ClubCrest } from "./ClubCrest";
import { CompetitionBadge } from "./CompetitionBadge";
import { Jersey } from "./Jersey";
import { PopularityMeter } from "./PopularityMeter";

const AMOUNT_FORMATTER = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });

/** Patrimonio diviso in cifra e unità, per stampare l'unità più piccola nella casella. */
function splitSavings(eur: number): { amount: string; unit: string } {
  if (eur >= 1e9) return { amount: AMOUNT_FORMATTER.format(eur / 1e9), unit: "Mld €" };
  if (eur >= 1e6) return { amount: AMOUNT_FORMATTER.format(eur / 1e6), unit: "M€" };
  if (eur >= 1e3) return { amount: AMOUNT_FORMATTER.format(eur / 1e3), unit: "K€" };
  return { amount: AMOUNT_FORMATTER.format(eur), unit: "€" };
}

const HOF_WIN_LABELS: Record<
  "highestOvr" | "mostTrophies" | "richest" | "mostPopular",
  string
> = {
  highestOvr: "OVR più alto",
  mostTrophies: "più trofei",
  richest: "patrimonio più alto",
  mostPopular: "popolarità più alta",
};

interface CareerSummaryProps {
  player: Player;
  onRestart: () => void;
  archive?: ArchivedCareer[];
  /** Pubblicazione automatica in classifica alla fine della carriera — vedi CareerGame.tsx. */
  publishStatus: PublishStatus;
  /** Se presente e la carriera è eleggibile (peakOvr ≥ soglia), mostra l'invito a continuare come allenatore. */
  onContinueAsCoach?: (entry: ArchivedCareer) => void;
}

const PUBLISH_STATUS_TEXT: Partial<Record<PublishStatus, string>> = {
  loading: "Pubblico il tuo punteggio in classifica…",
  done: "Punteggio pubblicato in classifica ✓",
  error: "Impossibile pubblicare il punteggio in classifica.",
  "error-nickname-taken":
    "Questo nickname è già usato da un altro giocatore. Cambialo nelle Impostazioni per comparire in classifica.",
  "skipped-no-nickname": "Imposta un nickname nelle Impostazioni per comparire in classifica.",
};

const CHIP_CLASS = "md-label px-2.5 py-0.5 text-[15px] tracking-[0.08em]";

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="md-heading bg-(--color-text) px-3.5 py-2.5 text-[1.375rem] text-(--color-background)">
      {children}
    </h3>
  );
}

function EmptyShowcase({ children }: { children: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 border border-dashed border-(--color-border) px-3 py-5 text-center">
      <TrophyIcon size={18} aria-hidden="true" className="text-(--color-text-muted)/60" />
      <p className="text-xs text-(--color-text-muted)">{children}</p>
    </div>
  );
}

function StatCell({
  label,
  value,
  highlight,
  className,
}: {
  label: string;
  value: ReactNode;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("px-5 py-3.5", highlight ? "md-fill" : "bg-(--color-surface-raised)", className)}>
      <p className={cn("md-label text-sm", !highlight && "text-(--color-text-muted)")}>{label}</p>
      <p className="md-heading text-5xl leading-none sm:text-[4rem]">{value}</p>
    </div>
  );
}

export function CareerSummary({
  player,
  onRestart,
  archive = [],
  publishStatus,
  onContinueAsCoach,
}: CareerSummaryProps) {
  const isGoalkeeper = player.position === "GK";
  const clubs = summarizeClubHistory(player.clubHistory);
  const ribbon = buildCareerRibbon(player.clubHistory, player.trophies);
  const trophyGroups = summarizeTrophies(player.trophies);
  const awardGroups = summarizeAwards(player.awards);
  const bestTitle = pickBestCareerTitle(player.seasonTitles);
  const recentTitles = [...player.seasonTitles].slice(-4).reverse();
  const archetype = deriveArchetype(player.traits, player.shadow);
  const shadowTitle = deriveShadowTitle(player.shadow, player.shadowFlags?.redeemed ?? false);
  const lastClub = player.clubHistory.at(-1)?.club ?? player.club;
  const firstAge = player.clubHistory[0]?.ageFrom ?? player.age;
  const savings = splitSavings(player.wallet.savingsEur);

  const provisionalEntry: ArchivedCareer = buildArchiveEntry(player);
  const hofWins = hallOfFameWinsFor(provisionalEntry, archive);
  const publishStatusText = isLeaderboardConfigured() ? PUBLISH_STATUS_TEXT[publishStatus] : undefined;
  const canContinueAsCoach = Boolean(onContinueAsCoach) && isEligibleForCoachContinuity(provisionalEntry);

  return (
    <div className="animate-step-in flex min-w-0 flex-1 flex-col gap-5 pb-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
      <section className="flex flex-wrap items-center gap-6">
        <div className="flex min-w-0 flex-[999_1_28rem] flex-col gap-3">
          <span className="md-fill md-slant md-label self-start py-1 pr-7 pl-3 text-base">
            Carriera conclusa
          </span>
          <h2 className="md-heading truncate text-6xl leading-[0.85] text-(--color-text) sm:text-8xl lg:text-[7.25rem]">
            {player.lastName}
          </h2>
          <div className="flex flex-wrap items-center gap-2.5 text-base text-(--color-text-muted)">
            <span>
              {POSITION_LABELS[player.position]} · {countryLabel(player.nationality)} · dai {firstAge}{" "}
              ai {player.age} anni
            </span>
            <span className={cn(CHIP_CLASS, "bg-(--color-accent)/15 text-(--color-accent)")}>
              {bestTitle}
            </span>
            {archetype.primary ? (
              <span className={cn(CHIP_CLASS, "bg-(--color-accent)/15 text-(--color-accent)")}>
                Stile: {ARCHETYPE_LABELS[archetype.primary]}
              </span>
            ) : null}
            {shadowTitle ? (
              <span className={cn(CHIP_CLASS, "bg-(--color-text)/8 text-(--color-text)")}>
                {shadowTitle}
              </span>
            ) : null}
          </div>
        </div>
        <Jersey
          kit={clubKit(lastClub?.id)}
          number={player.number}
          lastName={player.lastName}
          size="lg"
          className="sm:h-56 sm:w-56"
        />
      </section>

      <section
        aria-label="Numeri della carriera"
        className="grid grid-cols-2 gap-1 drop-shadow-lg sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]"
      >
        <StatCell label="OVR massimo" value={peakOvr(player)} highlight />
        <StatCell label="Presenze" value={player.career.apps} />
        <StatCell
          label={isGoalkeeper ? "Gol subiti" : "Gol"}
          value={isGoalkeeper ? (player.career.goalsAgainst ?? 0) : player.career.goals}
        />
        <StatCell
          label={isGoalkeeper ? "Clean sheet" : "Assist"}
          value={isGoalkeeper ? (player.career.cleanSheets ?? 0) : player.career.assists}
        />
        <StatCell
          label="Patrimonio"
          className="col-span-2 sm:col-span-1"
          value={
            <>
              {savings.amount}
              <span className="text-2xl sm:text-[1.75rem]"> {savings.unit}</span>
            </>
          }
        />
      </section>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-(--color-text-muted)">
        <span className="flex min-w-48 items-center gap-2">
          Popolarità finale
          <PopularityMeter value={player.popularity} className="min-w-24 flex-1" />
        </span>
        {recentTitles.length > 0 ? (
          <span>
            Titoli di stagione:{" "}
            <span className="text-(--color-text)">
              {recentTitles.map((t) => `${t.label} (${t.age})`).join(" · ")}
            </span>
          </span>
        ) : null}
        {player.playStyles.length > 0 ? (
          <span>
            Stili di gioco:{" "}
            <span className="text-(--color-text)">
              {player.playStyles.map((id) => PLAY_STYLE_LABELS[id]).join(" · ")}
            </span>
          </span>
        ) : null}
      </div>

      {ribbon.seasons.length > 0 ? (
        <section aria-labelledby="ribbon-title" className="flex flex-col gap-2">
          <h3 id="ribbon-title" className="md-label text-sm text-(--color-text-muted)">
            Il percorso, anno per anno
          </h3>
          <ol
            className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-[3px] sm:grid-cols-[repeat(var(--ribbon-seasons),minmax(0,1fr))]"
            style={{ "--ribbon-seasons": ribbon.seasons.length } as CSSProperties}
          >
            {ribbon.seasons.map((season) => {
              const palette = clubPalette(season.club.id);
              const trophyText =
                season.trophies > 0
                  ? `, ${season.trophies} ${season.trophies === 1 ? "trofeo" : "trofei"}`
                  : "";
              return (
                <li
                  key={season.age}
                  title={`${season.age} anni · ${season.club.name}${trophyText}`}
                  aria-label={`${season.age} anni, ${season.club.name}${trophyText}`}
                  className="md-label flex items-center justify-center gap-0.5 py-1.5 text-[13px] tracking-normal"
                  style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
                >
                  {season.trophies > 0 ? <Star size={10} aria-hidden="true" fill="currentColor" /> : null}
                  {season.age}
                </li>
              );
            })}
          </ol>
          <div
            aria-hidden="true"
            className="hidden gap-[3px] sm:grid"
            style={{
              gridTemplateColumns: ribbon.segments.map((s) => `${s.seasons}fr`).join(" "),
            }}
          >
            {ribbon.segments.map((segment, i) => (
              <span
                key={`${segment.club.id}-${i}`}
                title={segment.club.name}
                className="md-heading truncate text-base text-(--color-text-muted)"
              >
                {segment.club.name}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-start gap-5">
        <section aria-label="Club" className="flex min-w-0 flex-[1_1_28rem] flex-col">
          <SectionTitle>Club</SectionTitle>
          {clubs.length > 0 ? (
            <table className="w-full table-fixed text-sm sm:text-base">
              <thead>
                <tr className="md-label bg-(--color-surface-raised) text-left text-xs text-(--color-text-muted) sm:text-sm">
                  <th className="w-14 py-2 pl-3 font-bold sm:w-20 sm:pl-4">Anni</th>
                  <th className="py-2 font-bold">Club</th>
                  <th className="w-11 py-2 text-right font-bold sm:w-16">Pres.</th>
                  <th className="w-10 py-2 text-right font-bold sm:w-14">{isGoalkeeper ? "GS" : "Gol"}</th>
                  <th className="w-16 py-2 pr-3 text-right font-bold sm:w-18 sm:pr-4">Trofei</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map((c) => {
                  const clubTrophies = player.trophies.filter((t) => t.club?.id === c.club.id).length;
                  return (
                    <tr key={c.club.id} className="bg-(--color-surface) even:bg-(--color-surface-raised)/60">
                      <td
                        className="border-l-[5px] py-3 pl-2 text-xs text-(--color-text-muted) sm:pl-3 sm:text-sm"
                        style={{ borderLeftColor: clubPalette(c.club.id).primary }}
                      >
                        {/* Età di inizio stagione, come nel nastro: l'ultima stagione inizia a ageTo - 1. */}
                        {c.ageTo - 1 > c.ageFrom ? `${c.ageFrom}–${c.ageTo - 1}` : c.ageFrom}
                      </td>
                      <td className="py-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <ClubCrest crestUrl={c.club.crestUrl} clubName={c.club.name} size={20} />
                          <span className="md-heading truncate text-lg text-(--color-text) sm:text-xl">
                            {c.club.name}
                          </span>
                          {c.stintCount > 1 ? (
                            <span className="shrink-0 text-xs text-(--color-text-muted)">×{c.stintCount}</span>
                          ) : null}
                        </span>
                      </td>
                      <td className="py-3 text-right text-(--color-text)">{c.stats.apps}</td>
                      <td className="py-3 text-right text-(--color-text)">
                        {isGoalkeeper ? (c.stats.goalsAgainst ?? 0) : c.stats.goals}
                      </td>
                      <td
                        className={cn(
                          "py-3 pr-3 text-right sm:pr-4",
                          clubTrophies > 0 ? "font-semibold text-(--color-accent)" : "text-(--color-text-muted)",
                        )}
                      >
                        {clubTrophies > 0 ? clubTrophies : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="py-3 text-sm text-(--color-text-muted)">Nessun club nella carriera.</p>
          )}
        </section>

        <section aria-label="Trofei e premi" className="flex min-w-0 flex-[1_1_24rem] flex-col gap-2.5">
          <SectionTitle>Trofei e premi</SectionTitle>
          {trophyGroups.length === 0 && awardGroups.length === 0 ? (
            <EmptyShowcase>Nessun trofeo o premio vinto in carriera.</EmptyShowcase>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {trophyGroups.map((t) => (
                <li
                  key={t.competition}
                  className="flex min-w-0 items-center gap-3 border-t-[3px] border-(--club-primary) bg-(--color-surface-raised) p-3.5"
                >
                  <span className="md-heading text-[2.75rem] leading-none text-(--color-accent)">
                    {t.count}×
                  </span>
                  <CompetitionBadge competition={t.competition} size={22} />
                  <span className="min-w-0 font-semibold text-(--color-text)">
                    {t.competition}
                    {t.isNational ? (
                      <span className="block text-xs font-normal text-(--color-text-muted)">Nazionale</span>
                    ) : null}
                  </span>
                </li>
              ))}
              {awardGroups.map((a) => (
                <li
                  key={a.type}
                  className="flex min-w-0 items-center gap-3 border-t-[3px] border-(--color-text) bg-(--color-surface-raised) p-3.5"
                >
                  <span className="md-heading text-[2.75rem] leading-none text-(--color-text)">
                    {a.count}×
                  </span>
                  <AwardBadge type={a.type} size={22} />
                  <span className="min-w-0 font-semibold text-(--color-text)">{AWARD_LABELS[a.type]}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="border-l-4 border-(--color-text)/20 bg-(--color-text)/4 px-3.5 py-2.5 text-sm text-(--color-text-muted)">
            {player.nationalTeam.called ? (
              <>
                Nazionale:{" "}
                <span className="text-(--color-text)">
                  {player.nationalTeam.apps} presenze ·{" "}
                  {isGoalkeeper
                    ? `${player.nationalTeam.goalsAgainst ?? 0} gol subiti · ${player.nationalTeam.cleanSheets ?? 0} clean sheet`
                    : `${player.nationalTeam.goals} gol · ${player.nationalTeam.assists} assist`}
                </span>
              </>
            ) : (
              "Mai convocato in nazionale."
            )}
          </p>

          {hofWins.length > 0 ? (
            <p className="flex items-center gap-3 border-l-4 border-(--club-primary) bg-(--color-accent)/12 px-3.5 py-2.5 text-sm text-(--color-text)">
              <span className="md-fill md-label shrink-0 px-2 py-0.5 text-[15px] tracking-normal">HoF</span>
              <span>
                {hofWins.length === 1 ? "Nuovo record personale" : "Nuovi record personali"} tra le tue
                carriere: <strong>{hofWins.map((win) => HOF_WIN_LABELS[win]).join(", ")}</strong>
              </span>
            </p>
          ) : null}
        </section>
      </div>

      <footer className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onRestart}
          className="md-fill md-slant md-heading min-h-14 pr-10 pl-5 text-[1.625rem] transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-(--color-focus-glow) focus-visible:outline-none"
        >
          Gioca ancora
        </button>
        {canContinueAsCoach && onContinueAsCoach ? (
          <button
            type="button"
            onClick={() => onContinueAsCoach(provisionalEntry)}
            className="md-slant md-heading min-h-14 bg-(--color-text) pr-10 pl-5 text-[1.625rem] text-(--color-background) transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-(--color-focus-glow) focus-visible:outline-none"
          >
            Inizia carriera da allenatore
          </button>
        ) : null}
        {publishStatusText ? (
          <p
            className={cn(
              "text-sm sm:ml-auto",
              publishStatus === "error" || publishStatus === "error-nickname-taken"
                ? "text-(--color-error)"
                : publishStatus === "done"
                  ? "text-(--color-success)"
                  : "text-(--color-text-muted)",
            )}
          >
            {publishStatusText}
          </p>
        ) : null}
      </footer>
    </div>
  );
}
