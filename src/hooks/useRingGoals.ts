import { useState, useEffect, useCallback } from 'react';
import {
  RingGoals,
  GoalHistory,
  loadRingGoals,
  saveRingGoals,
  loadGoalHistory,
  saveGoalHistory,
  updateGoal,
} from '../lib/ringGoals';

interface UseRingGoalsReturn {
  goals: RingGoals;
  goalHistory: GoalHistory;
  setPomodoros: (value: number) => void;
  setMinutes: (value: number) => void;
  setHours: (value: number) => void;
  importGoalHistory: (history: GoalHistory) => void;
}

export function useRingGoals(): UseRingGoalsReturn {
  const [goals, setGoals] = useState<RingGoals>(() => loadRingGoals());
  const [goalHistory, setGoalHistory] = useState<GoalHistory>(() => loadGoalHistory());

  // Sincronizar con localStorage cuando cambia en otra pestaña
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pomodoro-ring-goals-v1' && e.newValue) {
        setGoals(loadRingGoals());
      }
      if (e.key === 'pomodoro-goal-history-v1' && e.newValue) {
        setGoalHistory(loadGoalHistory());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setPomodoros = useCallback((value: number) => {
    setGoals((prev) => {
      setGoalHistory((prevHistory) => {
        const { goals: newGoals, history: newHistory } = updateGoal(
          prev,
          prevHistory,
          'pomodoros',
          value
        );
        saveRingGoals(newGoals);
        saveGoalHistory(newHistory);
        return newHistory;
      });
      return { ...prev, pomodoros: value };
    });
  }, []);

  const setMinutes = useCallback((value: number) => {
    setGoals((prev) => {
      setGoalHistory((prevHistory) => {
        const { goals: newGoals, history: newHistory } = updateGoal(
          prev,
          prevHistory,
          'minutes',
          value
        );
        saveRingGoals(newGoals);
        saveGoalHistory(newHistory);
        return newHistory;
      });
      return { ...prev, minutes: value };
    });
  }, []);

  const setHours = useCallback((value: number) => {
    setGoals((prev) => {
      setGoalHistory((prevHistory) => {
        const { goals: newGoals, history: newHistory } = updateGoal(
          prev,
          prevHistory,
          'hours',
          value
        );
        saveRingGoals(newGoals);
        saveGoalHistory(newHistory);
        return newHistory;
      });
      return { ...prev, hours: value };
    });
  }, []);

  const importGoalHistory = useCallback((history: GoalHistory) => {
    setGoalHistory(history);
    saveGoalHistory(history);
    // Actualizar objetivos actuales al último del historial
    if (history.length > 0) {
      const latest = history[history.length - 1];
      const newGoals: RingGoals = {
        pomodoros: latest.pomodoros,
        minutes: latest.minutes,
        hours: latest.hours,
      };
      setGoals(newGoals);
      saveRingGoals(newGoals);
    }
  }, []);

  return {
    goals,
    goalHistory,
    setPomodoros,
    setMinutes,
    setHours,
    importGoalHistory,
  };
}
