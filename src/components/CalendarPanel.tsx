/**
 * Panel de calendario con heatmap, calendario mensual y reto
 */

import { useState, useMemo } from 'react';
import { SessionRecord } from '../lib/history';
import { GoalHistory } from '../lib/ringGoals';
import { heatmapData, buildContext } from '../lib/stats';
import { getCurrentChallenge, loadChallengeHistory } from '../lib/challenges';
import { Heatmap } from './Heatmap';
import { MonthCalendar } from './MonthCalendar';
import { ChallengeCard } from './ChallengeCard';

interface CalendarPanelProps {
  records: SessionRecord[];
  goalHistory: GoalHistory;
}

export function CalendarPanel({ records, goalHistory }: CalendarPanelProps) {
  const [calendarMonth, setCalendarMonth] = useState<string | undefined>(undefined);
  const heat = heatmapData(records, 12);

  // Contexto para el reto
  const context = useMemo(
    () => (records.length > 0 ? buildContext(records, goalHistory) : null),
    [records, goalHistory]
  );

  // Reto mensual
  const currentChallenge = useMemo(() => getCurrentChallenge(), []);
  const challengeHistory = useMemo(() => loadChallengeHistory(), []);
  const challengeState = challengeHistory[currentChallenge.id];
  const challengeProgress = context
    ? currentChallenge.progress(context, currentChallenge.month)
    : 0;

  return (
    <div className="calendar-panel">
      <div className="calendar-panel-section">
        <h3 className="calendar-panel-title">Últimas 12 semanas</h3>
        <Heatmap data={heat} />
      </div>

      <div className="calendar-panel-section">
        <h3 className="calendar-panel-title">Calendario</h3>
        <MonthCalendar
          records={records}
          goalHistory={goalHistory}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
        />
      </div>

      <div className="calendar-panel-section">
        <h3 className="calendar-panel-title">Reto mensual</h3>
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
