"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Award,
  Decision,
  DecisionCategory,
  GameSpeed,
  Injury,
  Player,
  PlayerIdentity,
  PlayStyleId,
  SeasonTitleEntry,
  Trophy,
  AttributeKey,
} from "@/types/career";
import { createPlayer } from "@/lib/career/engine";
import { generateAcademyOffer } from "@/lib/career/decisions";
import {
  INITIAL_LOOP_CONTEXT,
  pickNextDecision,
  pushRecentCategory,
  resolveCycle,
  type LoopContext,
} from "@/lib/career/loop";
import { appendToArchive, buildArchiveEntry, clearGame, loadGame, saveGame } from "@/lib/career/storage";
import { saveLastIdentity } from "@/lib/last-identity";

export interface CycleOutcomeSummary {
  optionLabel: string;
  outcomeText: string;
  newTrophies: Trophy[];
  newAward: Award | null;
  nationalCallup: boolean;
  ovrBefore: number;
  ovrDelta: number;
  ageBefore: number;
  newInjury: Injury | null;
  injuryHealed: boolean;
  savingsDelta: number;
  popularityDelta: number;
  newMilestones: number[];
  seasonTitle: SeasonTitleEntry | null;
  objectiveResult: { label: string; met: boolean; firstTime: boolean } | null;
  brokenRecords: string[];
  highlights: string[];
  newPlayStyles: PlayStyleId[];
}

interface CareerGameState {
  player: Player;
  speed: GameSpeed;
  context: LoopContext;
  recentCategories: DecisionCategory[];
  currentDecision: Decision | null;
  currentCategory: DecisionCategory | null;
  lastOutcome: CycleOutcomeSummary | null;
  retired: boolean;
}

export interface UseCareerGame {
  state: CareerGameState | null;
  startCareer: (identity: PlayerIdentity, speed: GameSpeed) => void;
  chooseOption: (optionId: string) => void;
  setTrainingFocus: (key: AttributeKey | null) => void;
  restart: () => void;
  isResuming: boolean;
}

function buildInitialState(identity: PlayerIdentity, speed: GameSpeed): CareerGameState {
  const player = createPlayer(identity);
  const decision = generateAcademyOffer(identity);
  return {
    player,
    speed,
    context: INITIAL_LOOP_CONTEXT,
    recentCategories: [],
    currentDecision: decision,
    currentCategory: decision.category,
    lastOutcome: null,
    retired: false,
  };
}

export function useCareerGame(): UseCareerGame {
  const [state, setState] = useState<CareerGameState | null>(null);
  const [isResuming, setIsResuming] = useState(true);
  const hydrated = useRef(false);

  // Lettura di localStorage al mount: deve restare in un effect (non un lazy initializer di
  // useState) perché window non esiste in SSR — leggere qui evita un hydration mismatch tra
  // il render server (sempre "nessun salvataggio") e il primo render client.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const saved = loadGame();
    if (saved && !saved.player.retired) {
      const hasPersistedDecision = Boolean(saved.currentDecision && saved.currentCategory);
      const next = hasPersistedDecision
        ? null
        : pickNextDecision(saved.player, saved.context, saved.recentCategories, Math.random);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- vedi commento sopra l'effect
      setState({
        player: saved.player,
        speed: saved.speed,
        context: next?.context ?? saved.context,
        recentCategories: saved.recentCategories,
        currentDecision: saved.currentDecision ?? next!.decision,
        currentCategory: saved.currentCategory ?? next!.category,
        lastOutcome: null,
        retired: false,
      });
    }
    setIsResuming(false);
  }, []);

  useEffect(() => {
    if (!state) return;
    saveGame({
      player: state.player,
      speed: state.speed,
      context: state.context,
      recentCategories: state.recentCategories,
      currentDecision: state.currentDecision,
      currentCategory: state.currentCategory,
    });
  }, [state]);

  // Archivia la carriera non appena si ritira, non al click di "Gioca ancora": un reload prima
  // di quel click perderebbe lo stato di fine carriera (il mount effect ignora i save retired).
  const archivedRef = useRef(false);
  useEffect(() => {
    if (!state?.retired || archivedRef.current) return;
    archivedRef.current = true;
    appendToArchive(buildArchiveEntry(state.player));
  }, [state?.retired, state?.player]);

  const startCareer = useCallback((identity: PlayerIdentity, speed: GameSpeed) => {
    clearGame();
    archivedRef.current = false;
    saveLastIdentity(identity);
    setState(buildInitialState(identity, speed));
  }, []);

  const chooseOption = useCallback((optionId: string) => {
    setState((prev) => {
      if (!prev || !prev.currentDecision || !prev.currentCategory) return prev;

      const option = prev.currentDecision.options.find((o) => o.id === optionId);
      if (!option) return prev;

      const result = resolveCycle(
        prev.player,
        prev.context,
        prev.currentCategory,
        option,
        prev.speed,
        Math.random,
      );

      const outcomeSummary: CycleOutcomeSummary = {
        optionLabel: result.optionLabel,
        outcomeText: result.outcomeText,
        newTrophies: result.newTrophies,
        newAward: result.newAward,
        nationalCallup: result.nationalCallup,
        ovrBefore: prev.player.ovr,
        ovrDelta: result.player.ovr - prev.player.ovr,
        ageBefore: prev.player.age,
        newInjury: result.newInjury,
        injuryHealed: result.injuryHealed,
        savingsDelta: result.player.wallet.savingsEur - prev.player.wallet.savingsEur,
        popularityDelta: result.player.popularity - prev.player.popularity,
        newMilestones: result.newMilestones,
        seasonTitle: result.seasonTitle,
        objectiveResult: result.objectiveResult,
        brokenRecords: result.brokenRecords,
        highlights: result.highlights,
        newPlayStyles: result.newPlayStyles,
      };

      if (result.retired) {
        return {
          ...prev,
          player: result.player,
          context: result.context,
          currentDecision: null,
          currentCategory: null,
          lastOutcome: outcomeSummary,
          retired: true,
        };
      }

      const nextRecentCategories = pushRecentCategory(prev.recentCategories, prev.currentCategory);
      const next = pickNextDecision(result.player, result.context, nextRecentCategories, Math.random);

      return {
        ...prev,
        player: result.player,
        context: next.context,
        recentCategories: nextRecentCategories,
        currentDecision: next.decision,
        currentCategory: next.category,
        lastOutcome: outcomeSummary,
        retired: false,
      };
    });
  }, []);

  const restart = useCallback(() => {
    clearGame();
    archivedRef.current = false;
    setState(null);
  }, []);

  const setTrainingFocus = useCallback((key: AttributeKey | null) => {
    setState((prev) => {
      if (!prev || prev.retired) return prev;
      return { ...prev, player: { ...prev.player, trainingFocus: key } };
    });
  }, []);

  return { state, startCareer, chooseOption, setTrainingFocus, restart, isResuming };
}
