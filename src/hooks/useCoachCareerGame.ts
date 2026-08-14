"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameSpeed, Trophy } from "@/types/career";
import type { Coach, CoachAward, CoachDecision, CoachDecisionCategory, CoachIdentity, CoachSeasonTitleEntry } from "@/types/coach";
import { createCoach } from "@/lib/coach-career/engine";
import { generateJobOffers } from "@/lib/coach-career/decisions";
import {
  INITIAL_COACH_LOOP_CONTEXT,
  pickNextCoachDecision,
  pushRecentCoachCategory,
  resolveCoachCycle,
  type CoachLoopContext,
} from "@/lib/coach-career/loop";
import {
  appendToCoachArchive,
  buildCoachArchiveEntry,
  clearCoachGame,
  loadCoachGame,
  saveCoachGame,
} from "@/lib/coach-career/storage";

export interface CoachCycleOutcomeSummary {
  optionLabel: string;
  outcomeText: string;
  ageBefore: number;
  reputationBefore: number;
  reputationDelta: number;
  boardConfidenceDelta: number;
  savingsDelta: number;
  popularityDelta: number;
  seasonTitle: CoachSeasonTitleEntry | null;
  objectiveResult: { label: string; met: boolean; firstTime: boolean } | null;
  brokenRecords: string[];
  sacked: boolean;
  newTrophies: Trophy[];
  newAward: CoachAward | null;
  clubTierChange: "promoted" | "relegated" | null;
}

interface CoachCareerGameState {
  coach: Coach;
  speed: GameSpeed;
  context: CoachLoopContext;
  recentCategories: CoachDecisionCategory[];
  currentDecision: CoachDecision | null;
  currentCategory: CoachDecisionCategory | null;
  lastOutcome: CoachCycleOutcomeSummary | null;
  retired: boolean;
}

export interface UseCoachCareerGame {
  state: CoachCareerGameState | null;
  startCareer: (identity: CoachIdentity, speed: GameSpeed) => void;
  chooseOption: (optionId: string) => void;
  restart: () => void;
  isResuming: boolean;
}

function buildInitialState(identity: CoachIdentity, speed: GameSpeed): CoachCareerGameState {
  const coach = createCoach(identity);
  const decision = generateJobOffers(coach);
  return {
    coach,
    speed,
    context: INITIAL_COACH_LOOP_CONTEXT,
    recentCategories: [],
    currentDecision: decision,
    currentCategory: decision.category,
    lastOutcome: null,
    retired: false,
  };
}

export function useCoachCareerGame(): UseCoachCareerGame {
  const [state, setState] = useState<CoachCareerGameState | null>(null);
  const [isResuming, setIsResuming] = useState(true);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const saved = loadCoachGame();
    if (saved && !saved.coach.retired) {
      const hasPersistedDecision = Boolean(saved.currentDecision && saved.currentCategory);
      const next = hasPersistedDecision
        ? null
        : pickNextCoachDecision(saved.coach, saved.context, saved.recentCategories, Math.random);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- window non esiste in SSR, stesso motivo di useCareerGame
      setState({
        coach: saved.coach,
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
    saveCoachGame({
      coach: state.coach,
      speed: state.speed,
      context: state.context,
      recentCategories: state.recentCategories,
      currentDecision: state.currentDecision,
      currentCategory: state.currentCategory,
    });
  }, [state]);

  const archivedRef = useRef(false);
  useEffect(() => {
    if (!state?.retired || archivedRef.current) return;
    archivedRef.current = true;
    appendToCoachArchive(buildCoachArchiveEntry(state.coach));
  }, [state?.retired, state?.coach]);

  const startCareer = useCallback((identity: CoachIdentity, speed: GameSpeed) => {
    clearCoachGame();
    archivedRef.current = false;
    setState(buildInitialState(identity, speed));
  }, []);

  const chooseOption = useCallback((optionId: string) => {
    setState((prev) => {
      if (!prev || !prev.currentDecision || !prev.currentCategory) return prev;

      const option = prev.currentDecision.options.find((o) => o.id === optionId);
      if (!option) return prev;

      const result = resolveCoachCycle(
        prev.coach,
        prev.context,
        prev.currentCategory,
        option,
        prev.speed,
        Math.random,
      );

      const outcomeSummary: CoachCycleOutcomeSummary = {
        optionLabel: result.optionLabel,
        outcomeText: result.outcomeText,
        ageBefore: prev.coach.age,
        reputationBefore: prev.coach.reputation,
        reputationDelta: result.reputationDelta,
        boardConfidenceDelta: result.boardConfidenceDelta,
        savingsDelta: result.coach.wallet.savingsEur - prev.coach.wallet.savingsEur,
        popularityDelta: result.coach.popularity - prev.coach.popularity,
        seasonTitle: result.seasonTitle,
        objectiveResult: result.objectiveResult,
        brokenRecords: result.brokenRecords,
        sacked: result.sacked,
        newTrophies: result.newTrophies,
        newAward: result.newAward,
        clubTierChange: result.clubTierChange,
      };

      if (result.retired) {
        return {
          ...prev,
          coach: result.coach,
          context: result.context,
          currentDecision: null,
          currentCategory: null,
          lastOutcome: outcomeSummary,
          retired: true,
        };
      }

      const nextRecentCategories = pushRecentCoachCategory(prev.recentCategories, prev.currentCategory);
      const next = pickNextCoachDecision(result.coach, result.context, nextRecentCategories, Math.random);

      return {
        ...prev,
        coach: result.coach,
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
    clearCoachGame();
    archivedRef.current = false;
    setState(null);
  }, []);

  return { state, startCareer, chooseOption, restart, isResuming };
}
