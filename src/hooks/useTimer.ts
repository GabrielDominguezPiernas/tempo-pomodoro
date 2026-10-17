import { useReducer, useEffect, useCallback, useState, useRef, MutableRefObject } from 'react';
import { formatTimeForTitle } from '../lib/format';
import { playNotificationSound, SoundId } from '../lib/audio';
import { showNotification } from '../lib/notifications';
import {
  TimerSnapshot,
  saveTimerSnapshot,
  clearTimerSnapshot,
} from '../lib/timerPersistence';

export type Phase = 'study' | 'break';
export type Status = 'idle' | 'running' | 'paused';

interface TimerState {
  phase: Phase;
  status: Status;
  targetTime: number;
  pausedRemaining: number;
  totalDuration: number;
  completedPomodoros: number;
  sessionId: string;
  // Número del próximo pomodoro a completar (1-indexed)
  nextPomodoroNumber: number;
}

type TimerAction =
  | { type: 'START'; studyMs: number; sessionId: string }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }
  | { type: 'SKIP'; nextPhaseMs: number }
  | { type: 'PHASE_COMPLETE'; nextPhaseMs: number }
  | { type: 'STOP' }
  | {
      type: 'RESTORE';
      phase: Phase;
      status: Status;
      targetTime: number;
      pausedRemaining: number;
      totalDuration: number;
      completedPomodoros: number;
      sessionId: string;
      nextPomodoroNumber: number;
    };

const initialState: TimerState = {
  phase: 'study',
  status: 'idle',
  targetTime: 0,
  pausedRemaining: 0,
  totalDuration: 0,
  completedPomodoros: 0,
  sessionId: '',
  nextPomodoroNumber: 1,
};

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        phase: 'study',
        status: 'running',
        targetTime: Date.now() + action.studyMs,
        pausedRemaining: 0,
        totalDuration: action.studyMs,
        completedPomodoros: 0,
        sessionId: action.sessionId,
        nextPomodoroNumber: 1,
      };
    case 'PAUSE':
      return {
        ...state,
        status: 'paused',
        pausedRemaining: Math.max(0, state.targetTime - Date.now()),
      };
    case 'RESUME':
      return {
        ...state,
        status: 'running',
        targetTime: Date.now() + state.pausedRemaining,
        pausedRemaining: 0,
      };
    case 'RESET':
      return {
        ...state,
        status: 'running',
        targetTime: Date.now() + state.totalDuration,
        pausedRemaining: 0,
      };
    case 'SKIP': {
      // SKIP: cambia de fase pero NO suma al contador
      const nextPhase: Phase = state.phase === 'study' ? 'break' : 'study';
      return {
        ...state,
        phase: nextPhase,
        status: 'running',
        targetTime: Date.now() + action.nextPhaseMs,
        pausedRemaining: 0,
        totalDuration: action.nextPhaseMs,
        // completedPomodoros NO cambia
      };
    }
    case 'PHASE_COMPLETE': {
      // PHASE_COMPLETE: fin natural, suma al contador si era estudio
      const nextPhase: Phase = state.phase === 'study' ? 'break' : 'study';
      const wasStudy = state.phase === 'study';
      const newPomodoros = wasStudy
        ? state.completedPomodoros + 1
        : state.completedPomodoros;
      const newNextNumber = wasStudy
        ? state.nextPomodoroNumber + 1
        : state.nextPomodoroNumber;
      // Auto-iniciar solo el descanso, no el siguiente pomodoro
      const shouldAutoStart = wasStudy;
      return {
        ...state,
        phase: nextPhase,
        status: shouldAutoStart ? 'running' : 'paused',
        targetTime: shouldAutoStart ? Date.now() + action.nextPhaseMs : 0,
        pausedRemaining: shouldAutoStart ? 0 : action.nextPhaseMs,
        totalDuration: action.nextPhaseMs,
        completedPomodoros: newPomodoros,
        nextPomodoroNumber: newNextNumber,
      };
    }
    case 'RESTORE':
      return {
        ...state,
        phase: action.phase,
        status: action.status,
        targetTime: action.targetTime,
        pausedRemaining: action.pausedRemaining,
        totalDuration: action.totalDuration,
        completedPomodoros: action.completedPomodoros,
        sessionId: action.sessionId,
        nextPomodoroNumber: action.nextPomodoroNumber,
      };
    case 'STOP':
      return initialState;
    default:
      return state;
  }
}

interface UseTimerOptions {
  studyMinutes: number;
  breakMinutes: number;
  onPhaseComplete?: (
    completedPhase: Phase,
    studyMinutes: number,
    sessionId: string,
    pomodoroNumber: number
  ) => void;
  soundId?: MutableRefObject<SoundId>;
}

interface UseTimerReturn {
  phase: Phase;
  status: Status;
  remaining: number;
  progress: number;
  completedPomodoros: number;
  sessionId: string;
  nextPomodoroNumber: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  stop: () => void;
  togglePause: () => void;
  restore: (
    phase: Phase,
    status: Status,
    targetTime: number,
    pausedRemaining: number,
    totalDuration: number,
    completedPomodoros: number,
    sessionId: string,
    nextPomodoroNumber: number
  ) => void;
}

export function useTimer({
  studyMinutes,
  breakMinutes,
  onPhaseComplete,
  soundId,
}: UseTimerOptions): UseTimerReturn {
  const [state, dispatch] = useReducer(timerReducer, initialState);
  const [, setTick] = useState(0);

  // Ref para onPhaseComplete para evitar reiniciar el intervalo
  const onPhaseCompleteRef = useRef(onPhaseComplete);
  onPhaseCompleteRef.current = onPhaseComplete;

  // Refs para guardar snapshot
  const studyMinutesRef = useRef(studyMinutes);
  const breakMinutesRef = useRef(breakMinutes);
  studyMinutesRef.current = studyMinutes;
  breakMinutesRef.current = breakMinutes;

  const studyMs = studyMinutes * 60 * 1000;
  const breakMs = breakMinutes * 60 * 1000;

  const getNextPhaseMs = useCallback(
    (currentPhase: Phase) => (currentPhase === 'study' ? breakMs : studyMs),
    [studyMs, breakMs]
  );

  const calculateRemaining = useCallback(() => {
    if (state.status === 'paused') {
      return state.pausedRemaining;
    }
    if (state.status === 'running') {
      return Math.max(0, state.targetTime - Date.now());
    }
    return state.totalDuration || studyMs;
  }, [state.status, state.pausedRemaining, state.targetTime, state.totalDuration, studyMs]);

  // Guardar snapshot cuando cambia el estado
  useEffect(() => {
    if (state.status === 'idle') {
      clearTimerSnapshot();
      return;
    }

    const snapshot: TimerSnapshot = {
      screen: 'timer',
      phase: state.phase,
      status: state.status,
      targetTime: state.targetTime,
      pausedRemaining: state.pausedRemaining,
      totalDuration: state.totalDuration,
      completedPomodoros: state.completedPomodoros,
      sessionId: state.sessionId,
      studyMinutes: studyMinutesRef.current,
      breakMinutes: breakMinutesRef.current,
      savedAt: Date.now(),
    };
    saveTimerSnapshot(snapshot);
  }, [
    state.status,
    state.phase,
    state.targetTime,
    state.pausedRemaining,
    state.totalDuration,
    state.completedPomodoros,
    state.sessionId,
  ]);

  // Actualizar título de la pestaña
  useEffect(() => {
    if (state.status === 'idle') {
      document.title = 'Pomodoro';
      return;
    }

    const updateTitle = () => {
      const remaining = calculateRemaining();
      document.title = formatTimeForTitle(remaining, state.phase);
    };

    updateTitle();
    const interval = setInterval(updateTitle, 1000);
    return () => clearInterval(interval);
  }, [state.status, state.phase, calculateRemaining]);

  // Intervalo para actualizar el tiempo restante
  useEffect(() => {
    if (state.status !== 'running') {
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, state.targetTime - Date.now());

      if (remaining <= 0) {
        playNotificationSound(soundId?.current || 'gentle');

        const completedPhase = state.phase;
        const message =
          completedPhase === 'study'
            ? '¡Tiempo de descanso!'
            : '¡Vuelve al estudio!';

        showNotification(
          completedPhase === 'study' ? 'Pomodoro completado' : 'Descanso terminado',
          message
        );

        // Solo llamar a onPhaseComplete en fin NATURAL de fase de estudio
        if (completedPhase === 'study') {
          onPhaseCompleteRef.current?.(
            completedPhase,
            studyMinutes,
            state.sessionId,
            state.nextPomodoroNumber
          );
        }
        dispatch({ type: 'PHASE_COMPLETE', nextPhaseMs: getNextPhaseMs(completedPhase) });
      } else {
        setTick((t) => t + 1);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [state.status, state.targetTime, state.phase, state.sessionId, studyMinutes, getNextPhaseMs]);

  const remaining = calculateRemaining();
  const progress = state.totalDuration > 0 ? 1 - remaining / state.totalDuration : 0;

  return {
    phase: state.phase,
    status: state.status,
    remaining,
    progress: Math.min(1, Math.max(0, progress)),
    completedPomodoros: state.completedPomodoros,
    sessionId: state.sessionId,
    nextPomodoroNumber: state.nextPomodoroNumber,
    start: useCallback(() => {
      const sessionId = `session-${Date.now()}`;
      dispatch({ type: 'START', studyMs, sessionId });
    }, [studyMs]),
    pause: useCallback(() => dispatch({ type: 'PAUSE' }), []),
    resume: useCallback(() => dispatch({ type: 'RESUME' }), []),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
    skip: useCallback(
      () => dispatch({ type: 'SKIP', nextPhaseMs: getNextPhaseMs(state.phase) }),
      [getNextPhaseMs, state.phase]
    ),
    stop: useCallback(() => {
      clearTimerSnapshot();
      dispatch({ type: 'STOP' });
    }, []),
    togglePause: useCallback(() => {
      if (state.status === 'running') {
        dispatch({ type: 'PAUSE' });
      } else if (state.status === 'paused') {
        dispatch({ type: 'RESUME' });
      }
    }, [state.status]),
    restore: useCallback(
      (
        phase: Phase,
        status: Status,
        targetTime: number,
        pausedRemaining: number,
        totalDuration: number,
        completedPomodoros: number,
        sessionId: string,
        nextPomodoroNumber: number
      ) => {
        dispatch({
          type: 'RESTORE',
          phase,
          status,
          targetTime,
          pausedRemaining,
          totalDuration,
          completedPomodoros,
          sessionId,
          nextPomodoroNumber,
        });
      },
      []
    ),
  };
}
