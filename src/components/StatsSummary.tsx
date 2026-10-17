import { useMemo, useState } from 'react';
import { SessionRecord } from '../lib/history';
import { RingGoals, GoalHistory, GOAL_RANGES } from '../lib/ringGoals';
import {
  weekCount,
  totalCount,
  totalMinutes,
  formatMinutes,
  calculateStreaks,
  heatmapData,
  getTodayStats,
  buildContext,
} from '../lib/stats';
import { ActivityRings } from './ActivityRings';
import { MonthCalendar } from './MonthCalendar';
import { ChallengeCard } from './ChallengeCard';
import { Heatmap } from './Heatmap';
import { DurationStepper } from './DurationStepper';
import { getCurrentChallenge, loadChallengeHistory } from '../lib/challenges';

interface StatsSummaryProps {
  records: SessionRecord[];
  goals: RingGoals;
  goalHistory: GoalHistory;
  onPomodorosChange: (value: number) => void;
  onMinutesChange: (value: number) => void;
}

export function StatsSummary({
  records,
  goals,
  goalHistory,
  onPomodorosChange,
  onMinutesChange,
}: StatsSummaryProps) {
  const todayStats = getTodayStats(records, goals);
  const week = weekCount(records);
  const total = totalCount(records);
  const minutes = totalMinutes(records);
  const { currentStreak, bestStreak } = calculateStreaks(records);
  const heat = heatmapData(records, 12);

  // Contexto memoizado para estadísticas avanzadas
  const context = useMemo(
    () => (records.length > 0 ? buildContext(records, goalHistory) : null),
    [records, goalHistory]
  );

  const [calendarMonth, setCalendarMonth] = useState<string | undefined>(undefined);

  // Reto mensual
  const currentChallenge = useMemo(() => getCurrentChallenge(), []);
  const challengeHistory = useMemo(() => loadChallengeHistory(), []);
  const challengeState = challengeHistory[currentChallenge.id];
  const challengeProgress = context
    ? currentChallenge.progress(context, currentChallenge.month)
    : 0;

  return (
    <div className="stats-summary">
      {/* Anillos de actividad */}
      <div className="stats-rings-section">
        <ActivityRings
          pomodoros={{ current: todayStats.pomodoros, goal: goals.pomodoros }}
          minutes={{ current: todayStats.minutes, goal: goals.minutes }}
          size={140}
        />
        <div className="stats-rings-legend">
          <div className="ring-legend-item ring-legend--pomodoros">
            <span className="ring-legend-dot" />
            <span className="ring-legend-label">Pomodoros</span>
            <span className="ring-legend-value">{todayStats.pomodoros}/{goals.pomodoros}</span>
          </div>
          <div className="ring-legend-item ring-legend--minutes">
            <span className="ring-legend-dot" />
            <span className="ring-legend-label">Minutos</span>
            <span className="ring-legend-value">{todayStats.minutes}/{goals.minutes}</span>
          </div>
        </div>
      </div>

      {/* Racha */}
      <div className="stats-streaks">
        {currentStreak > 0 && (
          <div className="streak-badge" aria-label={`${currentStreak} días de racha`}>
            <span className="streak-icon" aria-hidden="true">🔥</span>
            <span className="streak-count">{currentStreak}</span>
            <span className="streak-label">días</span>
          </div>
        )}
      </div>

      {/* Steppers para objetivos */}
      <div className="stats-goals-edit">
        <div className="stats-goal-row">
          <span className="stats-goal-label">Pomodoros</span>
          <DurationStepper
            label=""
            value={goals.pomodoros}
            min={GOAL_RANGES.pomodoros.min}
            max={GOAL_RANGES.pomodoros.max}
            onChange={onPomodorosChange}
          />
        </div>
        <div className="stats-goal-row">
          <span className="stats-goal-label">Minutos</span>
          <DurationStepper
            label=""
            value={goals.minutes}
            min={GOAL_RANGES.minutes.min}
            max={GOAL_RANGES.minutes.max}
            onChange={onMinutesChange}
          />
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <span className="stat-value">{todayStats.pomodoros}</span>
          <span className="stat-label">Hoy</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{week}</span>
          <span className="stat-label">Esta semana</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatMinutes(minutes)}</span>
          <span className="stat-label">Tiempo total</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            <span className="stat-icon" aria-hidden="true">🔥</span>
            {currentStreak}
          </span>
          <span className="stat-label">Racha actual</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            <span className="stat-icon" aria-hidden="true">⭐</span>
            {bestStreak}
          </span>
          <span className="stat-label">Mejor racha</span>
        </div>
      </div>

      <div className="stats-heatmap">
        <h3 className="stats-section-title">Últimas 12 semanas</h3>
        <Heatmap data={heat} />
      </div>

      {/* Calendario mensual */}
      <div className="stats-calendar">
        <h3 className="stats-section-title">Calendario</h3>
        <MonthCalendar
          records={records}
          goalHistory={goalHistory}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
        />
      </div>

      {/* Reto mensual */}
      <div className="stats-challenge">
        <h3 className="stats-section-title">Reto mensual</h3>
        <ChallengeCard
          challenge={currentChallenge}
          progress={challengeProgress}
          isCompleted={challengeState?.completed ?? false}
          completedAt={challengeState?.completedAt ?? null}
        />
      </div>
    </div>
  );
}
