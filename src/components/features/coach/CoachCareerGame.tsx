"use client";

import { useCallback, useState } from "react";
import type { GameSpeed } from "@/types/career";
import type { CoachDecision, CoachIdentity } from "@/types/coach";
import { useCoachCareerGame, type CoachCycleOutcomeSummary } from "@/hooks/useCoachCareerGame";
import { TACTICAL_SYSTEM_LABELS, type TacticalSystem } from "@/lib/career/tactics";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { NationalitySelect } from "@/components/features/career/NationalitySelect";
import { ClubCrest } from "@/components/features/career/ClubCrest";

interface CoachCareerGameProps {
  onBack: () => void;
}

const TACTICAL_SYSTEMS: TacticalSystem[] = ["possesso", "pressing", "contropiede", "diretto"];
const DEFAULT_SPEED: GameSpeed = "normal";

function CoachIdentityStep({ onSubmit, onBack }: { onSubmit: (identity: CoachIdentity) => void; onBack: () => void }) {
  const [lastName, setLastName] = useState("");
  const [nationality, setNationality] = useState<string | null>(null);
  const [preferredSystem, setPreferredSystem] = useState<TacticalSystem>("possesso");

  const canSubmit = lastName.trim().length > 0 && nationality !== null;

  return (
    <Card className="animate-step-in flex flex-col gap-4 p-5 sm:p-7">
      <div>
        <p className="font-display text-sm tracking-[0.2em] gold-metal-text">Nuovo incarico</p>
        <h2 className="font-display text-2xl text-(--color-text)">Crea il tuo profilo da allenatore</h2>
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
        <Button variant="ghost" onClick={onBack} className="px-0 text-xs">
          ← Menu
        </Button>
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
            <span className="text-sm font-semibold text-(--color-text)">{option.label}</span>
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

        {outcome.sacked ? <p className="text-sm font-semibold text-(--color-error)">Sei stato esonerato.</p> : null}

        {outcome.objectiveResult ? (
          <p
            className={cn(
              "text-sm font-medium",
              outcome.objectiveResult.met ? "text-(--color-success)" : "text-(--color-text-muted)",
            )}
          >
            Obiettivo {outcome.objectiveResult.met ? "raggiunto" : "mancato"}: {outcome.objectiveResult.label}
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

      <Button onClick={onContinue} className="self-start">
        Continua
      </Button>
    </Card>
  );
}

export function CoachCareerGame({ onBack }: CoachCareerGameProps) {
  const { state, startCareer, chooseOption, restart, isResuming } = useCoachCareerGame();
  const [awaitingOutcome, setAwaitingOutcome] = useState(false);

  const handleStart = useCallback(
    (identity: CoachIdentity) => {
      startCareer(identity, DEFAULT_SPEED);
    },
    [startCareer],
  );

  const handleChoose = useCallback(
    (optionId: string) => {
      chooseOption(optionId);
      setAwaitingOutcome(true);
    },
    [chooseOption],
  );

  const handleOutcomeContinue = useCallback(() => setAwaitingOutcome(false), []);

  const handleRestart = useCallback(() => {
    restart();
    setAwaitingOutcome(false);
  }, [restart]);

  if (isResuming) {
    return <p className="text-center text-sm text-(--color-text-muted)">Caricamento…</p>;
  }

  if (!state) {
    return <CoachIdentityStep onSubmit={handleStart} onBack={onBack} />;
  }

  if (state.retired) {
    return (
      <Card className="animate-step-in flex flex-col gap-4 p-5 text-center sm:p-7">
        <p className="font-display text-sm tracking-[0.2em] gold-metal-text">Carriera conclusa</p>
        <h2 className="font-display text-2xl text-(--color-text)">
          {state.coach.lastName} appende il taccuino al chiodo
        </h2>
        <div className="flex flex-col gap-1 text-sm text-(--color-text-muted)">
          <p>Reputazione di picco: {state.coach.records.peakReputation}</p>
          <p>Club allenati: {new Set(state.coach.clubHistory.map((s) => s.club.id)).size}</p>
          <p>Trofei vinti: {state.coach.trophies.length}</p>
          <p>Età al ritiro: {state.coach.age}</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" onClick={onBack}>
            Menu
          </Button>
          <Button onClick={handleRestart}>Nuova carriera</Button>
        </div>
      </Card>
    );
  }

  const { coach } = state;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <header className="flex shrink-0 items-center justify-between gap-4">
        <p className="font-display text-lg tracking-[0.2em] gold-metal-text">ALLENATORE</p>
        <Button variant="ghost" onClick={onBack} className="px-0 text-xs">
          ← Menu
        </Button>
      </header>

      <Card className="flex flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          {coach.club ? <ClubCrest crestUrl={coach.club.crestUrl} clubName={coach.club.name} size={28} /> : null}
          <div>
            <p className="font-semibold text-(--color-text)">{coach.lastName}</p>
            <p className="text-xs text-(--color-text-muted)">{coach.club?.name ?? "Svincolato"} · {coach.age} anni</p>
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
      </Card>

      {awaitingOutcome && state.lastOutcome ? (
        <CoachOutcomeBanner outcome={state.lastOutcome} onContinue={handleOutcomeContinue} />
      ) : state.currentDecision ? (
        <Card className="p-4 shadow-lg shadow-black/5 sm:p-5">
          <CoachDecisionPanel decision={state.currentDecision} onChoose={handleChoose} />
        </Card>
      ) : null}
    </div>
  );
}
