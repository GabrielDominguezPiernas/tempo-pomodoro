import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SessionRecord } from '../lib/history';
import { GoalHistory } from '../lib/ringGoals';
import { buildContext, StatsContext } from '../lib/stats';
import {
  UnlockedMap,
  loadUnlocked,
  saveUnlocked,
  checkAchievements,
  computeRetroactiveUnlocks,
  ACHIEVEMENTS,
} from '../lib/achievements';

interface UseAchievementsReturn {
  unlocked: UnlockedMap;
  newlyUnlocked: string[];
  clearNewlyUnlocked: () => void;
  context: StatsContext | null;
  migrationMessage: string | null;
  clearMigrationMessage: () => void;
}

export function useAchievements(
  records: SessionRecord[],
  goalHistory: GoalHistory
): UseAchievementsReturn {
  const [unlocked, setUnlocked] = useState<UnlockedMap>(() => loadUnlocked());
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);

  // Flag para evitar procesar desbloqueos en el primer render (migración)
  const hasInitialized = useRef(false);
  const lastRecordsLength = useRef(records.length);

  // Construir contexto (memoizado)
  const context = useMemo(() => {
    if (records.length === 0) return null;
    return buildContext(records, goalHistory);
  }, [records, goalHistory]);

  // Migración retroactiva al primer load
  useEffect(() => {
    if (hasInitialized.current || !context) return;
    hasInitialized.current = true;

    // Contar cuántas insignias hay actualmente
    const currentCount = Object.keys(unlocked).filter((id) =>
      ACHIEVEMENTS.some((a) => a.id === id)
    ).length;

    // Calcular desbloqueos retroactivos
    const newUnlocked = computeRetroactiveUnlocks(context, unlocked);
    const newCount = Object.keys(newUnlocked).filter((id) =>
      ACHIEVEMENTS.some((a) => a.id === id)
    ).length;

    const addedCount = newCount - currentCount;

    if (addedCount > 0) {
      setUnlocked(newUnlocked);
      saveUnlocked(newUnlocked);
      // Mostrar mensaje de migración (sin toasts individuales)
      setMigrationMessage(
        addedCount === 1
          ? 'Se ha añadido 1 insignia a tu colección'
          : `Se han añadido ${addedCount} insignias a tu colección`
      );
    }
  }, [context, unlocked]);

  // Verificar logros cuando cambian los records (no en el primer render)
  useEffect(() => {
    if (!context || !hasInitialized.current) return;

    // Solo verificar si hay nuevos records
    if (records.length <= lastRecordsLength.current) {
      lastRecordsLength.current = records.length;
      return;
    }
    lastRecordsLength.current = records.length;

    const { newlyUnlocked: justUnlocked, allUnlocked } = checkAchievements(
      context,
      unlocked
    );

    if (justUnlocked.length > 0) {
      setUnlocked(allUnlocked);
      saveUnlocked(allUnlocked);
      setNewlyUnlocked((prev) => [...prev, ...justUnlocked]);
    }
  }, [records, context, unlocked]);

  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked((prev) => prev.slice(1));
  }, []);

  const clearMigrationMessage = useCallback(() => {
    setMigrationMessage(null);
  }, []);

  return {
    unlocked,
    newlyUnlocked,
    clearNewlyUnlocked,
    context,
    migrationMessage,
    clearMigrationMessage,
  };
}
