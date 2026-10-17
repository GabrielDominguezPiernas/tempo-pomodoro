import { Phase, Status } from '../hooks/useTimer';

interface ControlsProps {
  phase: Phase;
  status: Status;
  onTogglePause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onStop: () => void;
}

export function Controls({
  phase,
  status,
  onTogglePause,
  onReset,
  onSkip,
  onStop,
}: ControlsProps) {
  const isPaused = status === 'paused';

  return (
    <div className="controls" role="group" aria-label="Controles del temporizador">
      <button
        type="button"
        className="btn-control btn-control--primary"
        data-phase={phase}
        onClick={onTogglePause}
        aria-label={isPaused ? 'Reanudar (Espacio)' : 'Pausar (Espacio)'}
      >
        {isPaused ? '▶ Reanudar' : '⏸ Pausar'}
      </button>
      <button
        type="button"
        className="btn-control"
        onClick={onReset}
        aria-label="Reiniciar fase (R)"
      >
        ↻ Reiniciar
      </button>
      <button
        type="button"
        className="btn-control"
        onClick={onSkip}
        aria-label="Saltar a siguiente fase"
      >
        ⏭ Saltar
      </button>
      <button
        type="button"
        className="btn-control"
        onClick={onStop}
        aria-label="Volver a ajustes"
      >
        ✕ Salir
      </button>
    </div>
  );
}
