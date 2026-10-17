/**
 * Hook para notificaciones de cierre de anillos
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { TodayStats } from '../lib/stats';
import { RingType } from '../components/RingClosureToast';

export interface UseRingNotificationsReturn {
  /** Anillo que acaba de cerrarse (null si ninguno) */
  justClosedRing: RingType | null;
  /** Dismiss la notificación actual */
  dismissRingNotification: () => void;
}

export function useRingNotifications(
  todayStats: TodayStats
): UseRingNotificationsReturn {
  const [justClosedRing, setJustClosedRing] = useState<RingType | null>(null);

  // Guardar el estado anterior para detectar cambios
  const prevClosed = useRef({
    pomodoros: false,
    minutes: false,
    hours: false,
    all: false,
  });

  useEffect(() => {
    const prev = prevClosed.current;
    const curr = todayStats.closed;

    // Detectar qué anillo acaba de cerrarse
    // Priorizar "all" si los tres se cierran a la vez
    if (!prev.all && curr.all) {
      setJustClosedRing('all');
    } else if (!prev.pomodoros && curr.pomodoros) {
      setJustClosedRing('pomodoros');
    } else if (!prev.minutes && curr.minutes) {
      setJustClosedRing('minutes');
    } else if (!prev.hours && curr.hours) {
      setJustClosedRing('hours');
    }

    // Actualizar ref
    prevClosed.current = { ...curr };
  }, [todayStats.closed]);

  const dismissRingNotification = useCallback(() => {
    setJustClosedRing(null);
  }, []);

  return {
    justClosedRing,
    dismissRingNotification,
  };
}
