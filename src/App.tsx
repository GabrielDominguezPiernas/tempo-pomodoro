import { useState, useCallback, useRef, useEffect } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { TimerScreen } from './components/TimerScreen';
import { MenuButton } from './components/MenuButton';
import { SideMenu } from './components/SideMenu';
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
import { unlockAudio, playNotificationSound, SoundId } from './lib/audio';
import { requestNotificationPermission, showNotification } from './lib/notifications';
import { todayCount, calculateStreaks, getTodayStats } from './lib/stats';
import { applyTheme, loadTheme } from './lib/rewards';
import {
  loadTimerSnapshot,
  calculateRestoreState,
  clearTimerSnapshot,
} from './lib/timerPersistence';

type Screen = 'setup' | 'timer';

export default function App() {
  const [screen, setScreen] = useLocalStorage<Screen>('pomodoro-screen', 'setup');
  const [studyMinutes, setStudyMinutes] = useLocalStorage('pomodoro-study', 25);
  const [breakMinutes, setBreakMinutes] = useLocalStorage('pomodoro-break', 5);
  const [menuOpen, setMenuOpen] = useState(false);

  const { records, addSession, addMissedSessions, reloadRecords, importRecords } = useHistory();
  const { goals, goalHistory, setPomodoros, setMinutes } = useRingGoals();
  const [restoredMessage, setRestoredMessage] = useState<string | null>(null);
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

  // Restaurar timer al montar
  useEffect(() => {
    const snapshot = loadTimerSnapshot();
    if (!snapshot) return;

    const result = calculateRestoreState(snapshot);
    if (!result) return;

    // Registrar pomodoros perdidos si los hay
    if (result.missedPomodoros > 0) {
      addMissedSessions(
        snapshot.studyMinutes,
        snapshot.sessionId,
        snapshot.completedPomodoros + 1,
        result.missedPomodoros
      );

      // Mostrar mensaje de restauración
      const msg =
        result.missedPomodoros === 1
          ? '¡1 pomodoro completado mientras estabas fuera!'
          : `¡${result.missedPomodoros} pomodoros completados mientras estabas fuera!`;
      setRestoredMessage(msg);
      showNotification('Pomodoro restaurado', msg);
    }

    // Si se completó una sesión completa (estudio + descanso), ir a setup
    if (result.sessionComplete && result.missedPomodoros > 0) {
      clearTimerSnapshot();
      setScreen('setup');
      return;
    }

    // Calcular el nuevo estado
    const studyMs = snapshot.studyMinutes * 60 * 1000;
    const breakMs = snapshot.breakMinutes * 60 * 1000;
    const newTotalDuration = result.currentPhase === 'study' ? studyMs : breakMs;
    const newCompletedPomodoros = snapshot.completedPomodoros + result.missedPomodoros;
    const newNextPomodoroNumber = snapshot.completedPomodoros + result.missedPomodoros + 1;

    // Restaurar timer
    timer.restore(
      result.currentPhase,
      result.shouldRun ? 'running' : 'paused',
      result.shouldRun ? Date.now() + result.remaining : 0,
      result.shouldRun ? 0 : result.remaining,
      newTotalDuration,
      newCompletedPomodoros,
      snapshot.sessionId,
      newNextPomodoroNumber
    );

    setScreen('timer');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limpiar mensaje de restauración después de un tiempo
  useEffect(() => {
    if (!restoredMessage) return;
    const timeout = setTimeout(() => setRestoredMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [restoredMessage]);

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
    setMenuOpen((prev) => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
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

  return (
    <>
      <MenuButton isOpen={menuOpen} onClick={handleMenuToggle} />

      <main className="app">
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
      />

      {newlyUnlocked.length > 0 && (
        <Toast
          achievementId={newlyUnlocked[0]}
          onDismiss={handleToastDismiss}
        />
      )}

      {restoredMessage && (
        <div className="restored-toast" role="status" aria-live="polite">
          {restoredMessage}
        </div>
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
