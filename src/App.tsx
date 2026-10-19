import { useState, useCallback, useRef, useEffect } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { TimerScreen } from './components/TimerScreen';
import { MenuButton } from './components/MenuButton';
import { SideMenu } from './components/SideMenu';
import { TodoButton } from './components/TodoButton';
import { TodoPanel } from './components/TodoPanel';
import { Toast } from './components/Toast';
import { RingClosureToast, ChallengeToast } from './components/RingClosureToast';
import { useTimer, Phase } from './hooks/useTimer';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useWakeLock } from './hooks/useWakeLock';
import { useHistory } from './hooks/useHistory';
import { useRingGoals } from './hooks/useRingGoals';
import { useAchievements } from './hooks/useAchievements';
import { useTheme } from './hooks/useTheme';
import { useRingNotifications } from './hooks/useRingNotifications';
import { useChallenges } from './hooks/useChallenges';
import { useTodos } from './hooks/useTodos';
import { unlockAudio, playNotificationSound, SoundId } from './lib/audio';
import { requestNotificationPermission } from './lib/notifications';
import { todayCount, calculateStreaks, getTodayStats } from './lib/stats';
import { applyTheme, loadTheme } from './lib/rewards';
import { clearTimerSnapshot } from './lib/timerPersistence';

type Screen = 'setup' | 'timer';

// Determinar si la pantalla es estrecha
function useIsNarrow(breakpoint = 1024): boolean {
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsNarrow(e.matches);
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpoint]);

  return isNarrow;
}

// Determinar el estado inicial del panel de tareas
function getInitialTodoOpen(isNarrow: boolean, hasTodos: boolean): boolean {
  try {
    const stored = localStorage.getItem('pomodoro-todos-open-v1');
    if (stored !== null) {
      return JSON.parse(stored) === true;
    }
  } catch {
    // Ignorar
  }
  // Por defecto: abierto en pantallas anchas si hay tareas, cerrado en estrechas
  return !isNarrow && hasTodos;
}

export default function App() {
  const [screen, setScreen] = useLocalStorage<Screen>('pomodoro-screen', 'setup');
  const [studyMinutes, setStudyMinutes] = useLocalStorage('pomodoro-study', 25);
  const [breakMinutes, setBreakMinutes] = useLocalStorage('pomodoro-break', 5);
  const [menuOpen, setMenuOpen] = useState(false);

  // Panel de tareas
  const isNarrow = useIsNarrow();
  const todos = useTodos();
  const [todoOpen, setTodoOpen] = useState(() =>
    getInitialTodoOpen(isNarrow, todos.todos.length > 0)
  );

  // Guardar estado de apertura en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pomodoro-todos-open-v1', JSON.stringify(todoOpen));
    } catch {
      // Ignorar
    }
  }, [todoOpen]);

  const { records, addSession, reloadRecords, importRecords } = useHistory();
  const { goals, goalHistory, setPomodoros, setMinutes } = useRingGoals();
  const {
    unlocked,
    newlyUnlocked,
    clearNewlyUnlocked,
    migrationMessage,
    clearMigrationMessage,
  } = useAchievements(records, goalHistory);
  const { theme, setAccent, setBackground, setSound } = useTheme(unlocked);

  // Ref para el soundId actual (para el timer)
  const soundIdRef = useRef<SoundId>(theme.soundId as SoundId);
  soundIdRef.current = theme.soundId as SoundId;

  // Aplicar tema inicial sin parpadeo
  useEffect(() => {
    applyTheme(loadTheme());
  }, []);

  const handlePhaseComplete = useCallback(
    (_phase: Phase, minutes: number, sessionId: string, pomodoroNumber: number) => {
      addSession(minutes, sessionId, pomodoroNumber);
    },
    [addSession]
  );

  const timer = useTimer({
    studyMinutes,
    breakMinutes,
    onPhaseComplete: handlePhaseComplete,
    soundId: soundIdRef,
  });

  // Mantener pantalla encendida mientras el timer está activo
  useWakeLock(timer.status === 'running');

  // Siempre empezar en setup (sin restaurar timer anterior)
  useEffect(() => {
    clearTimerSnapshot();
    setScreen('setup');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejar visibilitychange para actualizar el timer cuando vuelve la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && timer.status === 'running') {
        // Forzar re-render para actualizar el tiempo restante
        reloadRecords();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timer.status, reloadRecords]);

  // Volver a setup cuando el timer vuelve a idle (descanso terminado)
  useEffect(() => {
    if (timer.status === 'idle' && screen === 'timer') {
      setScreen('setup');
    }
  }, [timer.status, screen, setScreen]);

  const handleStart = useCallback(async () => {
    unlockAudio();
    await requestNotificationPermission();
    timer.start();
    setScreen('timer');
  }, [timer, setScreen]);

  const handleStop = useCallback(() => {
    timer.stop();
    setScreen('setup');
  }, [timer, setScreen]);

  const handleMenuToggle = useCallback(() => {
    setMenuOpen((prev) => {
      const newState = !prev;
      // En pantallas estrechas, cerrar el panel de tareas al abrir el menú
      if (newState && isNarrow) {
        setTodoOpen(false);
      }
      return newState;
    });
  }, [isNarrow]);

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleTodoToggle = useCallback(() => {
    setTodoOpen((prev) => {
      const newState = !prev;
      // En pantallas estrechas, cerrar el menú al abrir el panel de tareas
      if (newState && isNarrow) {
        setMenuOpen(false);
      }
      return newState;
    });
  }, [isNarrow]);

  const handleTodoClose = useCallback(() => {
    setTodoOpen(false);
  }, []);

  const handleToastDismiss = useCallback(() => {
    playNotificationSound(soundIdRef.current);
    clearNewlyUnlocked();
  }, [clearNewlyUnlocked]);

  // Calcular estadísticas
  const today = todayCount(records);
  const { currentStreak } = calculateStreaks(records);
  const todayStats = getTodayStats(records, goals);

  // Notificaciones de cierre de anillos
  const { justClosedRing, dismissRingNotification } = useRingNotifications(todayStats);

  // Retos mensuales
  const {
    currentChallenge,
    justCompletedChallenge,
    dismissChallengeNotification,
  } = useChallenges(records, goalHistory);

  // Limpiar mensaje de migración después de un tiempo
  useEffect(() => {
    if (!migrationMessage) return;
    const timeout = setTimeout(() => clearMigrationMessage(), 5000);
    return () => clearTimeout(timeout);
  }, [migrationMessage, clearMigrationMessage]);

  // Determinar si el panel de tareas debe mostrarse
  const showTodoPanel = todoOpen || !isNarrow;

  return (
    <>
      <MenuButton isOpen={menuOpen} onClick={handleMenuToggle} />
      <TodoButton
        isOpen={todoOpen}
        onClick={handleTodoToggle}
        pendingCount={todos.pendingCount}
      />

      <div className={isNarrow ? '' : 'app-layout'}>
        <main className={isNarrow ? 'app' : 'app app-main'}>
          {screen === 'setup' ? (
            <SetupScreen
              studyMinutes={studyMinutes}
              breakMinutes={breakMinutes}
              onStudyChange={setStudyMinutes}
              onBreakChange={setBreakMinutes}
              onStart={handleStart}
              todayCount={today}
              dailyGoal={goals.pomodoros}
              currentStreak={currentStreak}
            />
          ) : (
            <TimerScreen
              phase={timer.phase}
              status={timer.status}
              remaining={timer.remaining}
              progress={timer.progress}
              completedPomodoros={timer.completedPomodoros}
              onTogglePause={timer.togglePause}
              onReset={timer.reset}
              onSkip={timer.skip}
              onStop={handleStop}
              menuOpen={menuOpen}
            />
          )}
        </main>

        {showTodoPanel && (
          <TodoPanel
            isOpen={todoOpen}
            onClose={handleTodoClose}
            isNarrow={isNarrow}
            pending={todos.pending}
            completed={todos.completed}
            pendingCount={todos.pendingCount}
            completedCount={todos.completedCount}
            onAdd={todos.add}
            onToggle={todos.toggle}
            onRemove={todos.remove}
            onClearCompleted={todos.clearDone}
            announcement={todos.announcement}
          />
        )}
      </div>

      <SideMenu
        isOpen={menuOpen}
        onClose={handleMenuClose}
        records={records}
        unlocked={unlocked}
        goals={goals}
        goalHistory={goalHistory}
        onPomodorosChange={setPomodoros}
        onMinutesChange={setMinutes}
        theme={theme}
        onAccentChange={setAccent}
        onBackgroundChange={setBackground}
        onSoundChange={setSound}
        onImportData={importRecords}
        todos={todos.todos}
        onImportTodos={todos.importTodos}
      />

      {newlyUnlocked.length > 0 && (
        <Toast
          achievementId={newlyUnlocked[0]}
          onDismiss={handleToastDismiss}
        />
      )}

      {migrationMessage && (
        <div className="restored-toast" role="status" aria-live="polite">
          {migrationMessage}
        </div>
      )}

      {justClosedRing && (
        <RingClosureToast
          ringType={justClosedRing}
          onDismiss={dismissRingNotification}
        />
      )}

      {justCompletedChallenge && (
        <ChallengeToast
          emoji={currentChallenge.emoji}
          name={currentChallenge.name}
          onDismiss={dismissChallengeNotification}
        />
      )}
    </>
  );
}
