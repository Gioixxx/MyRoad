"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ArchivedCareer, GameSpeed, PlayerIdentity } from "@/types/career";
import { useCareerGame, type CycleOutcomeSummary } from "@/hooks/useCareerGame";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { usePrefersReducedMotion } from "@/hooks/useMotion";
import { AWARD_LABELS } from "@/lib/career/award-labels";
import { loadArchive } from "@/lib/career/storage";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { AwardBadge } from "./AwardBadge";
import { CareerArchive } from "./CareerArchive";
import { CareerSummary } from "./CareerSummary";
import { CareerTable } from "./CareerTable";
import { CareerTimeline } from "./CareerTimeline";
import { CompetitionBadge } from "./CompetitionBadge";
import { DecisionPanel } from "./DecisionPanel";
import { IdentityForm } from "./IdentityForm";
import { MainMenu } from "./MainMenu";
import { buildCareerMoments, MomentOverlay, type CareerMoment } from "./MomentOverlay";
import { OfferPanel } from "./OfferPanel";
import { PenaltyShootout } from "./PenaltyShootout";
import { PlayerCard } from "./PlayerCard";
import { SettingsPanel } from "./SettingsPanel";
import { SpeedSelect } from "./SpeedSelect";
import { ClubCrest } from "./ClubCrest";

type Step = "menu" | "speed" | "identity" | "archive" | "settings";
type ResolvePhase = "season" | "moments" | "outcome" | null;

const DECISION_EXIT_MS = 320;
const SEASON_BEAT_MS = 1200;
const OUTCOME_CONTINUE_MS = 1000;

const SAVINGS_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

function SeasonBeat({
  playerAge,
  ageBefore,
  clubName,
  crestUrl,
  seasonTitle,
}: {
  playerAge: number;
  ageBefore: number;
  clubName: string | null;
  crestUrl?: string;
  seasonTitle?: string | null;
}) {
  return (
    <Card className="animate-step-in flex flex-col items-center gap-3 border-(--color-accent)/30 p-6 text-center sm:p-8">
      <p className="font-display text-xs tracking-[0.35em] gold-metal-text">Ciclo in corso</p>
      <div className="flex items-center gap-2 text-(--color-text-muted)">
        {crestUrl && clubName ? (
          <ClubCrest crestUrl={crestUrl} clubName={clubName} size={22} />
        ) : null}
        <span className="text-sm font-medium text-(--color-text)">
          {clubName ?? "Svincolato"}
        </span>
      </div>
      <p className="font-display text-3xl text-(--color-text)">
        {ageBefore}
        <span className="mx-2 text-(--color-accent)">→</span>
        {playerAge}
        <span className="ml-2 text-lg tracking-wide text-(--color-text-muted)">anni</span>
      </p>
      {seasonTitle ? (
        <p className="font-display text-sm tracking-wide text-(--color-ovr-gold)">{seasonTitle}</p>
      ) : (
        <p className="animate-pulse text-sm text-(--color-text-muted)">Stagione in corso…</p>
      )}
    </Card>
  );
}

function OutcomeBanner({
  outcome,
  onContinue,
}: {
  outcome: CycleOutcomeSummary;
  onContinue: () => void;
}) {
  const [stage, setStage] = useState(0);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setStage(3);
      setCanContinue(true);
      return;
    }

    setStage(0);
    setCanContinue(false);
    const t1 = setTimeout(() => setStage(1), 280);
    const t2 = setTimeout(() => setStage(2), 560);
    const t3 = setTimeout(() => setStage(3), 840);
    const t4 = setTimeout(() => setCanContinue(true), OUTCOME_CONTINUE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [outcome]);

  const delta = outcome.ovrDelta;
  const deltaPositive = delta > 0;
  const deltaNegative = delta < 0;

  return (
    <Card className="animate-step-in flex flex-col gap-3 border-(--color-accent)/40 p-4 sm:p-5">
      <div>
        {outcome.seasonTitle ? (
          <p className="font-display text-xs tracking-[0.3em] text-(--color-ovr-gold)">
            {outcome.seasonTitle.label}
          </p>
        ) : (
          <p className="font-display text-xs tracking-[0.3em] gold-metal-text">Esito</p>
        )}
        <p
          className={cn(
            "font-semibold text-(--color-text) transition-opacity duration-300",
            stage >= 0 ? "opacity-100" : "opacity-0",
          )}
        >
          {outcome.optionLabel}
        </p>
        <p
          className={cn(
            "mt-1 text-sm text-(--color-text-muted) transition-opacity duration-300",
            stage >= 1 ? "opacity-100" : "opacity-0",
          )}
        >
          {outcome.outcomeText}
        </p>
      </div>

      {outcome.highlights.length > 0 ? (
        <ul
          className={cn(
            "flex flex-col gap-1 border-l-2 border-(--color-accent)/40 pl-3 transition-opacity duration-300",
            stage >= 1 ? "opacity-100" : "opacity-0",
          )}
        >
          {outcome.highlights.map((line) => (
            <li key={line} className="text-sm text-(--color-text)">
              {line}
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-2 transition-opacity duration-300",
          stage >= 2 ? "opacity-100" : "opacity-0",
        )}
      >
        {delta !== 0 ? (
          <p
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold",
              deltaPositive && "text-(--color-success)",
              deltaNegative && "text-(--color-error)",
            )}
          >
            {deltaPositive ? <TrendingUp size={16} aria-hidden="true" /> : null}
            {deltaNegative ? <TrendingDown size={16} aria-hidden="true" /> : null}
            OVR {deltaPositive ? "+" : ""}
            {delta}
            <span className="font-normal text-(--color-text-muted)">
              ({outcome.ovrBefore} → {outcome.ovrBefore + delta})
            </span>
          </p>
        ) : (
          <p className="text-sm text-(--color-text-muted)">OVR invariato ({outcome.ovrBefore})</p>
        )}

        {outcome.objectiveResult ? (
          <p
            className={cn(
              "text-sm font-medium",
              outcome.objectiveResult.met ? "text-(--color-success)" : "text-(--color-text-muted)",
            )}
          >
            Obiettivo {outcome.objectiveResult.met ? "raggiunto" : "mancato"}:{" "}
            {outcome.objectiveResult.label}
          </p>
        ) : null}

        {outcome.brokenRecords.length > 0 ? (
          <ul className="flex flex-col gap-0.5">
            {outcome.brokenRecords.map((label) => (
              <li key={label} className="text-xs text-(--color-ovr-gold)">
                Record: {label}
              </li>
            ))}
          </ul>
        ) : null}

        {outcome.nationalCallup ? (
          <p className="text-sm font-medium text-(--color-accent)">Convocato in nazionale!</p>
        ) : null}

        {outcome.newTrophies.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {outcome.newTrophies.map((trophy, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm font-medium text-(--color-ovr-gold)"
              >
                <CompetitionBadge competition={trophy.competition} size={18} />
                <span>Vinci: {trophy.competition}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {outcome.newAward ? (
          <p className="flex items-center gap-2 text-sm font-medium text-(--color-ovr-gold)">
            <AwardBadge type={outcome.newAward.type} size={18} />
            {AWARD_LABELS[outcome.newAward.type]}
          </p>
        ) : null}

        {outcome.newInjury ? (
          <p className="flex items-center gap-2 text-sm font-medium text-(--color-error)">
            Infortunio: {outcome.newInjury.label} — fuori per {outcome.newInjury.turnsRemaining}{" "}
            {outcome.newInjury.turnsRemaining === 1 ? "ciclo" : "cicli"}
          </p>
        ) : null}

        {outcome.injuryHealed ? (
          <p className="text-sm font-medium text-(--color-success)">
            Torni disponibile dopo l&apos;infortunio.
          </p>
        ) : null}

        {outcome.savingsDelta !== 0 ? (
          <p
            className={cn(
              "text-sm font-medium",
              outcome.savingsDelta > 0 ? "text-(--color-success)" : "text-(--color-error)",
            )}
          >
            Patrimonio {outcome.savingsDelta > 0 ? "+" : ""}
            {SAVINGS_FORMATTER.format(outcome.savingsDelta)}
          </p>
        ) : null}

        {outcome.popularityDelta !== 0 ? (
          <p
            className={cn(
              "text-sm font-medium",
              outcome.popularityDelta > 0 ? "text-(--color-success)" : "text-(--color-error)",
            )}
          >
            Popolarità {outcome.popularityDelta > 0 ? "+" : ""}
            {outcome.popularityDelta}
          </p>
        ) : null}
      </div>

      <Button
        onClick={onContinue}
        disabled={!canContinue}
        className={cn(
          "self-start transition-opacity duration-300",
          canContinue ? "opacity-100" : "opacity-40",
        )}
      >
        Continua
      </Button>
    </Card>
  );
}

function SetupStepDots({ current }: { current: Step }) {
  return (
    <div className="mx-auto flex w-28 items-center gap-0" aria-hidden="true">
      <div
        className={cn(
          "h-1 flex-1 rounded-l-full transition-colors duration-150",
          current === "speed" || current === "identity"
            ? "bg-(--color-accent)"
            : "bg-(--color-border)",
        )}
      />
      <div
        className={cn(
          "h-1 flex-1 rounded-r-full transition-colors duration-150",
          current === "identity" ? "bg-(--color-accent)" : "bg-(--color-border)",
        )}
      />
    </div>
  );
}

export function CareerGame() {
  const [step, setStep] = useState<Step>("menu");
  const [speed, setSpeed] = useState<GameSpeed | null>(null);
  const [archiveEntries, setArchiveEntries] = useState<ArchivedCareer[]>([]);
  const { state, startCareer, chooseOption, restart, isResuming } = useCareerGame();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { audioRef, volume, muted, setVolume, setMuted } = useBackgroundMusic();

  // Letto in un effect (non lazy initializer) per lo stesso motivo di useCareerGame: window non
  // esiste in SSR, evita un hydration mismatch tra il render server e il primo render client.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- vedi commento sopra l'effect
    setArchiveEntries(loadArchive());
  }, []);

  const [resolvePhase, setResolvePhase] = useState<ResolvePhase>(null);
  const [moments, setMoments] = useState<CareerMoment[]>([]);
  const [momentIndex, setMomentIndex] = useState(0);
  const [decisionExiting, setDecisionExiting] = useState(false);
  const seenOutcome = useRef<CycleOutcomeSummary | null>(null);
  const chooseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleBusy = useRef(false);

  const showPlaying = state !== null;
  const isRetired = state?.retired ?? false;
  const awaitingResolve = resolvePhase !== null || decisionExiting;

  useEffect(() => {
    return () => {
      if (chooseTimeout.current) clearTimeout(chooseTimeout.current);
    };
  }, []);

  useEffect(() => {
    const outcome = state?.lastOutcome ?? null;
    if (outcome === seenOutcome.current) return;
    seenOutcome.current = outcome;

    if (!outcome) {
      setResolvePhase(null);
      setMoments([]);
      setMomentIndex(0);
      return;
    }

    const nextMoments = buildCareerMoments({
      newTrophies: outcome.newTrophies,
      newAward: outcome.newAward,
      nationalCallup: outcome.nationalCallup,
      newMilestones: outcome.newMilestones,
    });
    setMoments(nextMoments);
    setMomentIndex(0);
    setResolvePhase("season");
  }, [state?.lastOutcome]);

  // Auto-advance from season beat → moments or outcome
  useEffect(() => {
    if (resolvePhase !== "season") return;

    const delay = prefersReducedMotion ? 0 : SEASON_BEAT_MS;
    const timer = setTimeout(() => {
      setResolvePhase(moments.length > 0 ? "moments" : "outcome");
    }, delay);

    return () => clearTimeout(timer);
  }, [resolvePhase, moments.length, prefersReducedMotion]);

  const handleSpeedSelected = useCallback((selected: GameSpeed) => {
    setSpeed(selected);
    setStep("identity");
  }, []);

  const handleIdentitySubmitted = useCallback(
    (identity: PlayerIdentity) => {
      if (!speed) return;
      startCareer(identity, speed);
    },
    [speed, startCareer],
  );

  const handleRestart = useCallback(() => {
    if (chooseTimeout.current) clearTimeout(chooseTimeout.current);
    cycleBusy.current = false;
    restart();
    setSpeed(null);
    setStep("speed");
    setResolvePhase(null);
    setMoments([]);
    setMomentIndex(0);
    setDecisionExiting(false);
    seenOutcome.current = null;
    setArchiveEntries(loadArchive());
  }, [restart]);

  const handleShowArchive = useCallback(() => {
    setArchiveEntries(loadArchive());
    setStep("archive");
  }, []);

  const handleBackFromArchive = useCallback(() => {
    setStep("speed");
  }, []);

  const handleGoMenu = useCallback(() => {
    setStep("menu");
  }, []);

  const handleShowSettings = useCallback(() => {
    setStep("settings");
  }, []);

  const handleQuit = useCallback(() => {
    // No-op nei browser normali (i browser bloccano window.close() su tab non aperte da script);
    // nel launcher desktop il WebView2 host intercetta questa richiesta e chiude la finestra.
    window.close();
  }, []);

  const handleChoose = useCallback(
    (optionId: string) => {
      if (cycleBusy.current || resolvePhase !== null || decisionExiting) return;
      cycleBusy.current = true;

      if (prefersReducedMotion) {
        chooseOption(optionId);
        return;
      }

      setDecisionExiting(true);
      chooseTimeout.current = setTimeout(() => {
        chooseOption(optionId);
        setDecisionExiting(false);
      }, DECISION_EXIT_MS);
    },
    [chooseOption, decisionExiting, prefersReducedMotion, resolvePhase],
  );

  const handleMomentContinue = useCallback(() => {
    if (momentIndex + 1 < moments.length) {
      setMomentIndex((i) => i + 1);
      return;
    }
    setResolvePhase("outcome");
  }, [momentIndex, moments.length]);

  const handleOutcomeContinue = useCallback(() => {
    cycleBusy.current = false;
    setResolvePhase(null);
  }, []);

  const decisionUsesOffers =
    state?.currentDecision?.options.some((o) => o.club || o.retire) ?? false;

  const currentMoment = resolvePhase === "moments" ? moments[momentIndex] ?? null : null;
  const showDecision = Boolean(
    state && !state.retired && state.currentDecision && (!awaitingResolve || decisionExiting),
  );
  const showSeason = Boolean(state?.lastOutcome && resolvePhase === "season");
  const showOutcome = Boolean(state?.lastOutcome && resolvePhase === "outcome");
  const showSummary = Boolean(state?.retired && !awaitingResolve);
  const showPlayShell = Boolean(state && (!isRetired || awaitingResolve));

  const isSetup = !showPlaying;
  const isMenu = isSetup && step === "menu";
  const isIdentity = isSetup && step === "identity";
  const isArchive = isSetup && step === "archive";
  const isSettings = isSetup && step === "settings";
  const outcomeKey = state?.lastOutcome
    ? `${state.player.age}-${state.lastOutcome.optionLabel}-${state.lastOutcome.outcomeText}`
    : "none";
  const decisionKey = state?.currentDecision
    ? `${state.player.age}-${state.currentDecision.id}`
    : "none";

  return (
    <div
      className={cn(
        "mx-auto flex w-full min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden px-4",
        showPlayShell
          ? "max-w-[88rem] gap-2 overflow-hidden py-2 sm:gap-3 sm:py-3"
          : showSummary
            ? "max-w-[88rem] gap-2 overflow-y-auto py-2 sm:gap-3 sm:py-3 lg:overflow-hidden"
            : isIdentity
              ? "max-w-6xl gap-2 overflow-hidden py-2 sm:py-3"
              : "max-w-4xl gap-3 overflow-y-auto py-4 sm:py-6",
      )}
    >
      <audio ref={audioRef} src="/audio/passaggio-di-spogliatoio.mp3" loop preload="auto" className="hidden" />

      {showPlaying ? (
        <header className="flex shrink-0 items-center justify-between gap-4">
          <p className="font-display text-lg tracking-[0.2em] gold-metal-text">CARRIERA</p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleRestart} className="px-0 text-xs">
              Ricomincia
            </Button>
            <ThemeToggle />
          </div>
        </header>
      ) : (
        <header className="flex shrink-0 flex-col gap-2">
          <div className="flex items-center justify-between">
            {!isMenu ? (
              <Button variant="ghost" onClick={handleGoMenu} className="px-0 text-xs">
                ← Menu
              </Button>
            ) : (
              <span />
            )}
            <ThemeToggle />
          </div>
          <div className="text-center">
            <p className="font-display text-[10px] tracking-[0.35em] gold-metal-text">
              My Road - L&apos;Ascesa
            </p>
            <h1 className="font-display text-2xl text-(--color-text) sm:text-3xl">
              {isIdentity
                ? "Crea la tua identità"
                : isArchive
                  ? "Le mie carriere"
                  : isSettings
                    ? "Impostazioni"
                    : "Costruisci la tua carriera da calciatore"}
            </h1>
            {isIdentity ? (
              <p className="mt-0.5 font-display text-xs tracking-[0.3em] gold-metal-text">
                Passo 2 di 2
              </p>
            ) : isMenu ? (
              <p className="mt-0.5 text-sm text-(--color-text-muted)">
                Scegli chi sei, affronta le decisioni che contano, scrivi la tua leggenda.
              </p>
            ) : null}
          </div>
          {step === "speed" || step === "identity" ? <SetupStepDots current={step} /> : null}
        </header>
      )}

      {isResuming ? (
        <p className="text-center text-sm text-(--color-text-muted)">Caricamento…</p>
      ) : (
        <>
          {!showPlaying && step === "menu" ? (
            <Card key="step-menu" className="animate-step-in flex flex-col gap-4 p-5 sm:p-7">
              <MainMenu
                onSinglePlayer={() => setStep("speed")}
                onSettings={handleShowSettings}
                onQuit={handleQuit}
              />
            </Card>
          ) : null}

          {!showPlaying && step === "settings" ? (
            <Card key="step-settings" className="animate-step-in flex flex-col gap-4 p-5 sm:p-7">
              <SettingsPanel
                volume={volume}
                muted={muted}
                onVolumeChange={setVolume}
                onMutedChange={setMuted}
                onBack={handleGoMenu}
              />
            </Card>
          ) : null}

          {!showPlaying && step === "speed" ? (
            <Card key="step-speed" className="animate-step-in flex flex-col gap-4 p-5 sm:p-7">
              <SpeedSelect onSelect={handleSpeedSelected} />
              {archiveEntries.length > 0 ? (
                <Button variant="ghost" onClick={handleShowArchive} className="self-center text-xs">
                  Le mie carriere
                </Button>
              ) : null}
            </Card>
          ) : null}

          {!showPlaying && step === "identity" ? (
            <Card
              key="step-identity"
              className="animate-step-in flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-5 lg:overflow-hidden"
            >
              <IdentityForm onSubmit={handleIdentitySubmitted} />
            </Card>
          ) : null}

          {!showPlaying && step === "archive" ? (
            <Card key="step-archive" className="animate-step-in p-5 sm:p-7">
              <CareerArchive entries={archiveEntries} onBack={handleBackFromArchive} />
            </Card>
          ) : null}

          {showPlayShell && state ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
              <CareerTimeline player={state.player} />

              <div className="grid min-h-0 min-w-0 flex-1 gap-3 lg:grid-cols-[20rem_1fr_16rem] lg:items-stretch xl:grid-cols-[23rem_1fr_18rem]">
                <div className="min-w-0 shrink-0 lg:max-h-full lg:overflow-y-auto">
                  <PlayerCard
                    player={state.player}
                    compact
                    flashRecords={state.lastOutcome?.brokenRecords}
                  />
                </div>

                <div className="flex min-h-0 min-w-0 flex-col gap-3">
                  <div className="min-w-0 shrink-0">
                    {showSeason && state.lastOutcome ? (
                      <SeasonBeat
                        key={`season-${outcomeKey}`}
                        playerAge={state.player.age}
                        ageBefore={state.lastOutcome.ageBefore}
                        clubName={state.player.club?.name ?? null}
                        crestUrl={state.player.club?.crestUrl}
                        seasonTitle={state.lastOutcome.seasonTitle?.label}
                      />
                    ) : null}

                    {showOutcome && state.lastOutcome ? (
                      <OutcomeBanner
                        key={`outcome-${outcomeKey}`}
                        outcome={state.lastOutcome}
                        onContinue={handleOutcomeContinue}
                      />
                    ) : null}

                    {showDecision && state.currentDecision ? (
                      <Card
                        key={`decision-${decisionKey}`}
                        className={cn(
                          "p-4 shadow-lg shadow-black/5 sm:p-5",
                          decisionExiting ? "animate-step-out" : "animate-step-in",
                        )}
                      >
                        {state.currentCategory === "continental-final" || state.currentCategory === "cup-upset" ? (
                          <PenaltyShootout
                            decision={state.currentDecision}
                            onChoose={handleChoose}
                          />
                        ) : decisionUsesOffers ? (
                          <OfferPanel decision={state.currentDecision} onChoose={handleChoose} />
                        ) : (
                          <DecisionPanel
                            decision={state.currentDecision}
                            onChoose={handleChoose}
                          />
                        )}
                      </Card>
                    ) : null}
                  </div>
                </div>

                <div className="flex min-h-0 min-w-0 flex-col gap-2 lg:max-h-full">
                  <p className="shrink-0 font-display text-xs tracking-[0.2em] text-(--color-text-muted) uppercase">
                    Storico
                  </p>
                  <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                    <CareerTable
                      player={state.player}
                      compact
                      pendingLabel={
                        (resolvePhase === "season" || decisionExiting) && !isRetired
                          ? "Ciclo in corso…"
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {showSummary && state ? (
            <CareerSummary
              key={`summary-${state.player.lastName}-${state.player.age}`}
              player={state.player}
              onRestart={handleRestart}
              archive={loadArchive()}
            />
          ) : null}
        </>
      )}

      {currentMoment ? (
        <MomentOverlay
          key={`moment-${momentIndex}-${currentMoment.kind}`}
          moment={currentMoment}
          onContinue={handleMomentContinue}
        />
      ) : null}
    </div>
  );
}
