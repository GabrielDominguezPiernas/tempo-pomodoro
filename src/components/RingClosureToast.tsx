/**
 * Toast de notificación cuando se cierra un anillo
 */

import { useEffect } from 'react';

export type RingType = 'pomodoros' | 'minutes' | 'hours' | 'all';

interface RingClosureToastProps {
  ringType: RingType;
  onDismiss: () => void;
}

const RING_INFO: Record<RingType, { emoji: string; message: string; color: string }> = {
  pomodoros: {
    emoji: '🔴',
    message: '¡Anillo de pomodoros cerrado!',
    color: '#FA114F',
  },
  minutes: {
    emoji: '🟢',
    message: '¡Anillo de minutos cerrado!',
    color: '#92E82A',
  },
  hours: {
    emoji: '🔵',
    message: '¡Anillo de franjas cerrado!',
    color: '#00D4FF',
  },
  all: {
    emoji: '🎉',
    message: '¡Todos los anillos cerrados!',
    color: '#B8995A',
  },
};

export function RingClosureToast({ ringType, onDismiss }: RingClosureToastProps) {
  const info = RING_INFO[ringType];

  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="ring-closure-toast"
      role="status"
      aria-live="polite"
      style={{ '--ring-color': info.color } as React.CSSProperties}
    >
      <span className="ring-toast-emoji" aria-hidden="true">
        {info.emoji}
      </span>
      <span className="ring-toast-message">{info.message}</span>
    </div>
  );
}

/**
 * Toast para completar un reto mensual
 */
interface ChallengeToastProps {
  emoji: string;
  name: string;
  onDismiss: () => void;
}

export function ChallengeToast({ emoji, name, onDismiss }: ChallengeToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="challenge-toast" role="status" aria-live="polite">
      <span className="challenge-toast-emoji" aria-hidden="true">
        {emoji}
      </span>
      <div className="challenge-toast-content">
        <span className="challenge-toast-title">¡Reto completado!</span>
        <span className="challenge-toast-name">{name}</span>
      </div>
    </div>
  );
}
