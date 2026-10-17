/**
 * Hook para gestionar retos mensuales
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MonthlyChallenge,
  ChallengeHistory,
  getCurrentChallenge,
  loadChallengeHistory,
  saveChallengeHistory,
  updateChallengeProgress,
  getCompletedChallengesCount,
} from '../lib/challenges';
import { buildContext, StatsContext } from '../lib/stats';
import { SessionRecord } from '../lib/history';
import { GoalHistory } from '../lib/ringGoals';

export interface UseChallengesReturn {
  currentChallenge: MonthlyChallenge;
  progress: number;
  isCompleted: boolean;
  completedAt: string | null;
  totalCompleted: number;
  justCompletedChallenge: boolean;
  dismissChallengeNotification: () => void;
}

export function useChallenges(
  records: SessionRecord[],
  goalHistory: GoalHistory
): UseChallengesReturn {
  const [history, setHistory] = useState<ChallengeHistory>(() => loadChallengeHistory());
  const [justCompleted, setJustCompleted] = useState(false);

  // Reto actual
  const currentChallenge = useMemo(() => getCurrentChallenge(), []);

  // Contexto de stats
  const context = useMemo<StatsContext | null>(
    () => (records.length > 0 ? buildContext(records, goalHistory) : null),
    [records, goalHistory]
  );

  // Progreso actual
  const currentProgress = useMemo(() => {
    if (!context) return 0;
    return currentChallenge.progress(context, currentChallenge.month);
  }, [context, currentChallenge]);

  const challengeState = history[currentChallenge.id];
  const isCompleted = challengeState?.completed ?? false;
  const completedAt = challengeState?.completedAt ?? null;

  // Actualizar progreso cuando cambian los records
  useEffect(() => {
    if (!context) return;

    const { history: newHistory, justCompleted: completed } = updateChallengeProgress(
      currentChallenge,
      context,
      history
    );

    if (completed) {
      setJustCompleted(true);
    }

    // Solo guardar si hay cambios
    if (JSON.stringify(newHistory) !== JSON.stringify(history)) {
      setHistory(newHistory);
      saveChallengeHistory(newHistory);
    }
  }, [context, currentChallenge, history]);

  const totalCompleted = useMemo(
    () => getCompletedChallengesCount(history),
    [history]
  );

  const dismissChallengeNotification = useCallback(() => {
    setJustCompleted(false);
  }, []);

  return {
    currentChallenge,
    progress: currentProgress,
    isCompleted,
    completedAt,
    totalCompleted,
    justCompletedChallenge: justCompleted,
    dismissChallengeNotification,
  };
}
