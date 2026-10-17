import type { Phase, Status } from '../hooks/useTimer';

const STORAGE_KEY = 'pomodoro-timer-v1';

export interface TimerSnapshot {
  screen: 'setup' | 'timer';
  phase: Phase;
  status: Status;
  targetTime: number;
  pausedRemaining: number;
  totalDuration: number;
  completedPomodoros: number;
  sessionId: string;
  studyMinutes: number;
  breakMinutes: number;
  savedAt: number;
}

export interface RestoreResult {
  snapshot: TimerSnapshot;
  // Cuántos pomodoros se completaron mientras la app estaba cerrada
  missedPomodoros: number;
  // La fase actual después de procesar los pomodoros perdidos
  currentPhase: Phase;
  // Tiempo restante actual (puede ser de una nueva fase)
  remaining: number;
  // Si el timer debería seguir corriendo
  shouldRun: boolean;
  // Si se completó una sesión completa (estudio + descanso)
  sessionComplete: boolean;
}

export function saveTimerSnapshot(snapshot: TimerSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage lleno o no disponible, ignorar
  }
}

export function clearTimerSnapshot(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorar errores
  }
}

export function loadTimerSnapshot(): TimerSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);

    // Validar campos requeridos
    if (
      typeof data.screen !== 'string' ||
      typeof data.phase !== 'string' ||
      typeof data.status !== 'string' ||
      typeof data.targetTime !== 'number' ||
      typeof data.pausedRemaining !== 'number' ||
      typeof data.totalDuration !== 'number' ||
      typeof data.completedPomodoros !== 'number' ||
      typeof data.sessionId !== 'string' ||
      typeof data.studyMinutes !== 'number' ||
      typeof data.breakMinutes !== 'number' ||
      typeof data.savedAt !== 'number'
    ) {
      clearTimerSnapshot();
      return null;
    }

    // Validar valores válidos
    if (!['setup', 'timer'].includes(data.screen)) {
      clearTimerSnapshot();
      return null;
    }
    if (!['study', 'break'].includes(data.phase)) {
      clearTimerSnapshot();
      return null;
    }
    if (!['idle', 'running', 'paused'].includes(data.status)) {
      clearTimerSnapshot();
      return null;
    }

    return data as TimerSnapshot;
  } catch {
    clearTimerSnapshot();
    return null;
  }
}

export function calculateRestoreState(snapshot: TimerSnapshot): RestoreResult | null {
  const now = Date.now();

  // Si estaba idle, no hay nada que restaurar
  if (snapshot.status === 'idle') {
    clearTimerSnapshot();
    return null;
  }

  // Si estaba pausado, restaurar tal cual
  if (snapshot.status === 'paused') {
    return {
      snapshot,
      missedPomodoros: 0,
      currentPhase: snapshot.phase,
      remaining: snapshot.pausedRemaining,
      shouldRun: false,
      sessionComplete: false,
    };
  }

  // Estaba running - calcular qué pasó mientras no estábamos
  const studyMs = snapshot.studyMinutes * 60 * 1000;
  const breakMs = snapshot.breakMinutes * 60 * 1000;

  // Tiempo que faltaba cuando se guardó
  const remainingAtSave = Math.max(0, snapshot.targetTime - snapshot.savedAt);

  // Tiempo transcurrido desde que se guardó
  const elapsed = now - snapshot.savedAt;

  // Si aún no ha expirado el tiempo original
  if (elapsed < remainingAtSave) {
    return {
      snapshot,
      missedPomodoros: 0,
      currentPhase: snapshot.phase,
      remaining: remainingAtSave - elapsed,
      shouldRun: true,
      sessionComplete: false,
    };
  }

  // El tiempo expiró mientras estábamos fuera
  // Necesitamos calcular cuántos pomodoros se completaron
  let timeOverflow = elapsed - remainingAtSave;
  let currentPhase = snapshot.phase;
  let missedPomodoros = 0;
  let sessionComplete = false;

  // Si la fase que terminó era estudio, cuenta como pomodoro
  if (currentPhase === 'study') {
    missedPomodoros++;
    currentPhase = 'break';
  } else {
    // Era break, ahora toca study
    currentPhase = 'study';
    // Una sesión completa terminó
    sessionComplete = true;
  }

  // Procesar ciclos completos que hayan pasado
  while (timeOverflow > 0) {
    const phaseDuration = currentPhase === 'study' ? studyMs : breakMs;

    if (timeOverflow >= phaseDuration) {
      timeOverflow -= phaseDuration;

      if (currentPhase === 'study') {
        missedPomodoros++;
        currentPhase = 'break';
      } else {
        currentPhase = 'study';
        sessionComplete = true;
      }
    } else {
      // No alcanzó para completar esta fase
      break;
    }
  }

  // El remaining es lo que queda de la fase actual
  const currentPhaseDuration = currentPhase === 'study' ? studyMs : breakMs;
  const remaining = currentPhaseDuration - timeOverflow;

  return {
    snapshot,
    missedPomodoros,
    currentPhase,
    remaining: Math.max(0, remaining),
    shouldRun: true,
    sessionComplete,
  };
}

// Generar ID determinístico para evitar duplicados
export function generatePomodoroId(sessionId: string, pomodoroNumber: number): string {
  return `${sessionId}-${pomodoroNumber}`;
}
