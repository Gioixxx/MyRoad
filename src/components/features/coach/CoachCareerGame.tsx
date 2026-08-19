"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArchivedCareer, GameSpeed } from "@/types/career";
import type { ArchivedCoachCareer, CoachDecision, CoachIdentity } from "@/types/coach";
import { useCoachCareerGame, type CoachCycleOutcomeSummary } from "@/hooks/useCoachCareerGame";
import { seedCoachFromArchivedCareer } from "@/lib/coach-career/bridge";
import { loadCoachArchive } from "@/lib/coach-career/storage";
import { TACTICAL_SYSTEM_LABELS, type TacticalSystem } from "@/lib/career/tactics";
import { deriveArchetype, ARCHETYPE_LABELS } from "@/lib/career/traits";
import { SHADOW_RUMOR_THRESHOLD } from "@/lib/career/shadow";
import { formatAffinity } from "@/lib/career/relations";
import { COACH_RELATION_LABELS } from "@/lib/coach-career/coach-relations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { NationalitySelect } from "@/components/features/career/NationalitySelect";
import { ClubCrest } from "@/components/features/career/ClubCrest";
import { CoachArchive } from "./CoachArchive";
import { CoachHistoryTable } from "./CoachHistoryTable";
import { buildCoachMoments, CoachMomentOverlay, type CoachMoment } from "./CoachMomentOverlay";
import { CoachSummary } from "./CoachSummary";

interface CoachCareerGameProps {
  onBack: () => void;
  /** Carriera calciatore archiviata da cui continuare (Fase C — continuità), o null/undefined per
   * una carriera allenatore standalone da zero. */
  seedEntry?: ArchivedCareer | null;
}

const TACTICAL_SYSTEMS: TacticalSystem[] = ["possesso", "pressing", "contropiede", "diretto"];
const DEFAULT_SPEED: GameSpeed = "normal";

function CoachIdentityStep({
  seedEntry,
  onSubmit,
  onBack,
  onShowArchive,
}: {
  seedEntry?: ArchivedCareer | null;
  onSubmit: (identity: CoachIdentity) => void;
  onBack: () => void;
  onShowArchive?: () => void;
}) {
  const [lastName, setLastName] = useState(seedEntry?.lastName ?? "");
  const [nationality, setNationality] = useState<string | null>(seedEntry?.nationality ?? null);
  const [preferredSystem, setPreferredSystem] = useState<TacticalSystem>("possesso");

  const canSubmit = lastName.trim().length > 0 && nationality !== null;

  return (
    <Card className="animate-step-in flex flex-col gap-4 p-5 sm:p-7">
      <div>
        <p className="font-display text-sm tracking-[0.2em] gold-metal-text">Nuovo incarico</p>
        <h2 className="font-display text-2xl text-(--color-text)">Crea il tuo profilo da allenatore</h2>
        {seedEntry ? (
          <p className="mt-1 text-xs text-(--color-text-muted)">
            Continui la carriera di {seedEntry.lastName.toUpperCase()}, ex calciatore: patrimonio e popolarità
            ereditati, prima panchina con qualche credito in più.
          </p>
        ) : null}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-(--color-text-muted)">Cognome</span>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Es. Bianchi"
          className="input-recessed rounded-md px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-(--color-text-muted)">Nazionalità</span>
        <NationalitySelect value={nationality} onChange={setNationality} />
      </label>

      <fieldset className="flex flex-col gap-1.5 text-sm">
        <legend className="text-(--color-text-muted)">Identità tattica di partenza</legend>
        <div className="grid grid-cols-2 gap-2">
          {TACTICAL_SYSTEMS.map((system) => (
            <button
              key={system}
              type="button"
              onClick={() => setPreferredSystem(system)}
              className={cn(
                "rounded-md border border-(--color-border) px-3 py-2 text-left text-sm transition-colors",
                system === preferredSystem
                  ? "border-(--color-accent) bg-(--color-surface-raised) font-semibold"
                  : "hover:border-(--color-accent)/50",
              )}
            >
              {TACTICAL_SYSTEM_LABELS[system]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="px-0 text-xs">
            ← Menu
          </Button>
          {onShowArchive ? (
            <Button variant="ghost" onClick={onShowArchive} className="px-0 text-xs">
              Le mie carriere
            </Button>
          ) : null}
        </div>
        <Button
          disabled={!canSubmit}
          onClick={() => nationality && onSubmit({ lastName: lastName.trim(), nationality, preferredSystem })}
        >
          Inizia la carriera
        </Button>
      </div>
    </Card>
  );
}

function CoachDecisionPanel({ decision, onChoose }: { decision: CoachDecision; onChoose: (optionId: string) => void }) {
  return (
    <div className="animate-step-in flex flex-col gap-4">
      <div>
        <p className="font-display text-sm tracking-[0.2em] gold-metal-text">{decision.title}</p>
        <p className="text-sm text-(--color-text-muted)">{decision.description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {decision.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChoose(option.id)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border border-(--color-border) bg-(--color-surface-raised) p-4 text-left",
              "transition-all duration-150 hover:-translate-y-0.5 hover:border-(--color-accent) hover:shadow-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
            )}
          >
            {option.club ? (
              <span className="mb-1 flex items-center gap-2">
                <ClubCrest crestUrl={option.club.crestUrl} clubName={option.club.name} size={20} />
                <span className="text-sm font-semibold text-(--color-text)">{option.label}</span>
              </span>
            ) : (
              <span className="text-sm font-semibold text-(--color-text)">{option.label}</span>
            )}
            {option.hint ? <span className="text-xs text-(--color-text-muted)">{option.hint}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function CoachOutcomeBanner({ outcome, onContinue }: { outcome: CoachCycleOutcomeSummary; onContinue: () => void }) {
  return (
    <Card className="animate-step-in flex flex-col gap-3 border-(--color-accent)/40 p-4 sm:p-5">
      <div>
        {outcome.seasonTitle ? (
          <p className="font-display text-sm tracking-[0.2em] text-(--color-ovr-gold)">{outcome.seasonTitle.label}</p>
        ) : (
          <p className="font-display text-sm tracking-[0.2em] gold-metal-text">Esito</p>
        )}
        <p className="font-semibold text-(--color-text)">{outcome.optionLabel}</p>
        <p className="mt-1 text-sm text-(--color-text-muted)">{outcome.outcomeText}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <p
          className={cn(
            "text-sm font-semibold",
            outcome.reputationDelta > 0 && "text-(--color-success)",
            outcome.reputationDelta < 0 && "text-(--color-error)",
          )}
        >
          Reputazione {outcome.reputationDelta > 0 ? "+" : ""}
          {outcome.reputationDelta}{" "}
          <span className="font-normal text-(--color-text-muted)">
            ({outcome.reputationBefore} → {outcome.reputationBefore + outcome.reputationDelta})
          </span>
        </p>

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

      <Button onClick={onContinue} className="self-start">
        Continua
      </Button>
    </Card>
  );
}

export function CoachCareerGame({ onBack, seedEntry }: CoachCareerGameProps) {
  const { state, startCareer, chooseOption, restart, isResuming } = useCoachCareerGame();
  const [moments, setMoments] = useState<CoachMoment[]>([]);
  const [momentIndex, setMomentIndex] = useState(0);
  const [awaitingOutcome, setAwaitingOutcome] = useState(false);
  const seenOutcome = useRef<CoachCycleOutcomeSummary | null>(null);

  // Cattura seedEntry una sola volta al mount: "Nuova carriera" dopo un ritiro non deve
  // ri-applicare il bonus di continuità Fase C una seconda volta (page.tsx non rimonta mai
  // CoachCareerGame tra un ritiro e il successivo "Nuova carriera").
  const [activeSeed, setActiveSeed] = useState<ArchivedCareer | null | undefined>(seedEntry);
  const [archiveEntries, setArchiveEntries] = useState<ArchivedCoachCareer[]>([]);
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- window non esiste in SSR, stesso motivo di useCoachCareerGame
    setArchiveEntries(loadCoachArchive());
  }, []);

  const handleStart = useCallback(
    (identity: CoachIdentity) => {
      const seed = activeSeed ? seedCoachFromArchivedCareer(activeSeed) : undefined;
      startCareer(identity, DEFAULT_SPEED, seed);
    },
    [startCareer, activeSeed],
  );

  const handleRestart = useCallback(() => {
    restart();
    setActiveSeed(null);
    setArchiveEntries(loadCoachArchive());
  }, [restart]);

  const handleShowArchiveView = useCallback(() => {
    setArchiveEntries(loadCoachArchive());
    setShowArchive(true);
  }, []);

  const handleBackFromArchive = useCallback(() => setShowArchive(false), []);

  useEffect(() => {
    const outcome = state?.lastOutcome ?? null;
    if (outcome === seenOutcome.current) return;
    seenOutcome.current = outcome;

    if (!outcome) {
      setMoments([]);
      setMomentIndex(0);
      setAwaitingOutcome(false);
      return;
    }

    const nextMoments = buildCoachMoments({
      newTrophies: outcome.newTrophies,
      newAward: outcome.newAward,
      objectiveResult: outcome.objectiveResult,
      clubTierChange: outcome.clubTierChange,
      sacked: outcome.sacked,
      clubName: outcome.clubName,
      crestUrl: outcome.crestUrl,
    });
    setMoments(nextMoments);
    setMomentIndex(0);
    setAwaitingOutcome(true);
  }, [state?.lastOutcome]);

  const handleChoose = useCallback(
    (optionId: string) => {
      chooseOption(optionId);
    },
    [chooseOption],
  );

  const handleMomentContinue = useCallback(() => setMomentIndex((i) => i + 1), []);
  const handleOutcomeContinue = useCallback(() => setAwaitingOutcome(false), []);

  if (showArchive) {
    return <CoachArchive entries={archiveEntries} onBack={handleBackFromArchive} />;
  }

  if (isResuming) {
    return <p className="text-center text-sm text-(--color-text-muted)">Caricamento…</p>;
  }

  if (!state) {
    return (
      <CoachIdentityStep
        seedEntry={activeSeed}
        onSubmit={handleStart}
        onBack={onBack}
        onShowArchive={archiveEntries.length > 0 ? handleShowArchiveView : undefined}
      />
    );
  }

  if (state.retired) {
    // Lettura fresca (non lo stato `archiveEntries`, aggiornato solo al mount/restart/apertura
    // archivio): la carriera appena ritirata è già stata archiviata dall'effect di
    // useCoachCareerGame prima di questo render, e "Le mie carriere" deve comparire subito.
    const freshArchive = loadCoachArchive();
    return (
      <CoachSummary
        coach={state.coach}
        onRestart={handleRestart}
        onShowArchive={freshArchive.length > 0 ? handleShowArchiveView : undefined}
        archive={freshArchive}
      />
    );
  }

  const { coach } = state;
  const archetype = deriveArchetype(coach.traits, coach.shadow);
  // `cyclesPlayed` (cicli di carriera, non stagioni/stint) invece di `clubHistory.length`: dal
  // wiring "Due classifiche" una stint è per stagione, non per ciclo — vedi piano, criticità 1.
  const showArchetypeChip = (coach.cyclesPlayed ?? 0) >= 4 && archetype.primary !== null;
  const showRumorsChip = coach.shadow >= SHADOW_RUMOR_THRESHOLD;
  const activeMoment = awaitingOutcome && momentIndex < moments.length ? moments[momentIndex] : null;
  const showOutcomeBanner = awaitingOutcome && !activeMoment && state.lastOutcome;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 lg:min-h-0">
      {activeMoment ? (
        <CoachMomentOverlay
          key={`moment-${momentIndex}-${activeMoment.kind}`}
          moment={activeMoment}
          onContinue={handleMomentContinue}
        />
      ) : null}

      <header className="flex shrink-0 items-center justify-between gap-4">
        <p className="font-display text-lg tracking-[0.2em] gold-metal-text">ALLENATORE</p>
        <div className="flex items-center gap-3">
          {archiveEntries.length > 0 ? (
            <Button variant="ghost" onClick={handleShowArchiveView} className="px-0 text-xs">
              Le mie carriere
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onBack} className="px-0 text-xs">
            ← Menu
          </Button>
        </div>
      </header>

      <div className="grid min-w-0 flex-1 gap-3 lg:min-h-0 lg:grid-cols-[20rem_1fr_16rem] lg:items-stretch xl:grid-cols-[23rem_1fr_18rem]">
        <div className="min-w-0 shrink-0 lg:max-h-full lg:overflow-y-auto">
          <Card className="flex flex-col gap-2 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              {coach.club ? <ClubCrest crestUrl={coach.club.crestUrl} clubName={coach.club.name} size={28} /> : null}
              <div>
                <p className="flex flex-wrap items-center gap-1.5 font-semibold text-(--color-text)">
                  {coach.lastName}
                  {showArchetypeChip ? (
                    <span className="rounded bg-(--color-accent)/15 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-(--color-accent) uppercase">
                      Stile: {ARCHETYPE_LABELS[archetype.primary!]}
                    </span>
                  ) : null}
                  {showRumorsChip ? (
                    <span
                      className="rounded bg-(--color-warning)/15 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-(--color-warning) uppercase"
                      title="Girano voci poco lusinghiere sul tuo conto"
                    >
                      Rumors
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-(--color-text-muted)">
                  {coach.club?.name ?? "Svincolato"} · {coach.age} anni
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-(--color-text-muted)">
              <div>
                <p className="text-base font-semibold text-(--color-text)">{coach.reputation}</p>
                <p>Reputazione</p>
              </div>
              <div>
                <p className="text-base font-semibold text-(--color-text)">{coach.boardConfidence}</p>
                <p>Fiducia società</p>
              </div>
              <div>
                <p className="text-base font-semibold text-(--color-text)">{coach.popularity}</p>
                <p>Popolarità</p>
              </div>
            </div>
            {coach.currentObjective ? (
              <p className="text-xs text-(--color-text-muted)">Obiettivo: {coach.currentObjective.label}</p>
            ) : null}
            {coach.relations.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 border-t border-(--color-border) pt-2">
                {coach.relations.map((rel) => (
                  <span
                    key={rel.id}
                    className="rounded bg-(--color-surface-raised) px-1.5 py-0.5 text-[11px] text-(--color-text-muted)"
                    title={rel.name}
                  >
                    {COACH_RELATION_LABELS[rel.id]} {formatAffinity(rel.affinity)}
                  </span>
                ))}
              </div>
            ) : null}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:min-h-0">
          <div className="min-w-0 shrink-0">
            {showOutcomeBanner && state.lastOutcome ? (
              <CoachOutcomeBanner outcome={state.lastOutcome} onContinue={handleOutcomeContinue} />
            ) : !awaitingOutcome && state.currentDecision ? (
              <Card className="p-4 shadow-lg shadow-black/5 sm:p-5">
                <CoachDecisionPanel decision={state.currentDecision} onChoose={handleChoose} />
              </Card>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 lg:min-h-0 lg:max-h-full">
          <p className="shrink-0 font-display text-sm tracking-[0.15em] text-(--color-text-muted) uppercase">
            Storico
          </p>
          <div className="min-w-0 flex-1 overflow-y-auto lg:min-h-0">
            {coach.clubHistory.length > 0 ? <CoachHistoryTable coach={coach} compact /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
