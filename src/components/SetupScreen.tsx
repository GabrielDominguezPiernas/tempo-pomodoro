import { DurationStepper } from './DurationStepper';
import { GoalRing } from './GoalRing';

interface SetupScreenProps {
  studyMinutes: number;
  breakMinutes: number;
  onStudyChange: (value: number) => void;
  onBreakChange: (value: number) => void;
  onStart: () => void;
  todayCount: number;
  dailyGoal: number;
  currentStreak: number;
}

export function SetupScreen({
  studyMinutes,
  breakMinutes,
  onStudyChange,
  onBreakChange,
  onStart,
  todayCount,
  dailyGoal,
  currentStreak,
}: SetupScreenProps) {
  return (
    <div className="setup-screen">
      <header className="setup-header">
        <h1 className="setup-title">Pomodoro</h1>
        <p className="setup-subtitle">Configura tu sesión de estudio</p>
      </header>

      <div className="setup-stats">
        <GoalRing current={todayCount} goal={dailyGoal} size={80} />
        {currentStreak > 0 && (
          <div className="streak-badge" aria-label={`${currentStreak} días de racha`}>
            <span className="streak-icon" aria-hidden="true">🔥</span>
            <span className="streak-count">{currentStreak}</span>
            <span className="streak-label">días</span>
          </div>
        )}
      </div>

      <div className="setup-fields">
        <DurationStepper
          label="Estudio"
          value={studyMinutes}
          min={1}
          max={180}
          onChange={onStudyChange}
        />
        <DurationStepper
          label="Descanso"
          value={breakMinutes}
          min={1}
          max={60}
          onChange={onBreakChange}
        />
      </div>

      <button type="button" className="btn-primary" onClick={onStart}>
        Empezar
      </button>
    </div>
  );
}
