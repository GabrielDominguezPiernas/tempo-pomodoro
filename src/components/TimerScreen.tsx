import { useEffect, useCallback } from 'react';
import { Phase, Status } from '../hooks/useTimer';
import { formatTime } from '../lib/format';
import { ProgressRing } from './ProgressRing';
import { Controls } from './Controls';

interface TimerScreenProps {
  phase: Phase;
  status: Status;
  remaining: number;
  progress: number;
  completedPomodoros: number;
  onTogglePause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onStop: () => void;
  menuOpen?: boolean;
}

export function TimerScreen({
  phase,
  status,
  remaining,
  progress,
  completedPomodoros,
  onTogglePause,
  onReset,
  onSkip,
  onStop,
  menuOpen = false,
}: TimerScreenProps) {
  const phaseLabel = phase === 'study' ? 'Estudio' : 'Descanso';
  const formattedTime = formatTime(remaining);

  // Atajos de teclado
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignorar si el menú está abierto
      if (menuOpen) return;

      // Ignorar si el foco está en un input
      if (e.target instanceof HTMLInputElement) return;

      // Ignorar si el foco está en un elemento del panel de tareas
      const todoPanel = document.getElementById('todo-panel');
      if (todoPanel && e.target instanceof HTMLElement && todoPanel.contains(e.target)) {
        return;
      }

      // Ignorar Espacio si el foco está en un botón o checkbox (evita doble disparo)
      if (e.code === 'Space' && e.target instanceof HTMLButtonElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onTogglePause();
          break;
        case 'KeyR':
          e.preventDefault();
          onReset();
          break;
      }
    },
    [onTogglePause, onReset, menuOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Renderizar los puntos del contador
  const maxDots = 8;
  const visibleDots = Math.min(completedPomodoros, maxDots);
  const dots = Array.from({ length: visibleDots }, (_, i) => (
    <span key={i} className="pomodoro-dot pomodoro-dot--filled" />
  ));

  return (
    <div className="timer-screen">
      <div
        className="timer-phase"
        data-phase={phase}
        role="status"
        aria-live="polite"
      >
        {phaseLabel}
      </div>

      <div className="timer-display">
        <ProgressRing progress={progress} phase={phase} size={336} strokeWidth={4}>
          <time className="timer-time" aria-label={`Tiempo restante: ${formattedTime}`}>
            {formattedTime}
          </time>
        </ProgressRing>
      </div>

      <Controls
        phase={phase}
        status={status}
        onTogglePause={onTogglePause}
        onReset={onReset}
        onSkip={onSkip}
        onStop={onStop}
      />

      {completedPomodoros > 0 && (
        <div className="pomodoro-count" aria-label={`${completedPomodoros} pomodoros completados`}>
          <div className="pomodoro-dots">{dots}</div>
          {completedPomodoros > maxDots && (
            <span>+{completedPomodoros - maxDots}</span>
          )}
          <span>{completedPomodoros === 1 ? 'pomodoro' : 'pomodoros'}</span>
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {status === 'paused' ? 'Temporizador en pausa' : ''}
      </span>
    </div>
  );
}
