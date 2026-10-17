/**
 * Calendario mensual con mini anillos de actividad por día
 */

import { useMemo } from 'react';
import { SessionRecord, toDateKey } from '../lib/history';
import { GoalHistory, getGoalsForDate } from '../lib/ringGoals';
import { MiniActivityRings } from './ActivityRings';

interface MonthCalendarProps {
  records: SessionRecord[];
  goalHistory: GoalHistory;
  /** Mes a mostrar en formato YYYY-MM. Por defecto el mes actual. */
  month?: string;
  onMonthChange?: (month: string) => void;
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface DayData {
  dateKey: string;
  day: number;
  pomodoros: number;
  minutes: number;
  hours: Set<number>;
  isToday: boolean;
  isFuture: boolean;
  isCurrentMonth: boolean;
}

export function MonthCalendar({
  records,
  goalHistory,
  month,
  onMonthChange,
}: MonthCalendarProps) {
  const today = toDateKey(new Date());
  const currentMonth = month || today.slice(0, 7);
  const [year, monthNum] = currentMonth.split('-').map(Number);

  // Generar datos del calendario
  const calendarData = useMemo(() => {
    // Primer día del mes
    const firstDay = new Date(year, monthNum - 1, 1);
    // Último día del mes
    const lastDay = new Date(year, monthNum, 0);
    const daysInMonth = lastDay.getDate();

    // Qué día de la semana es el primero (0=Dom, queremos 0=Lun)
    const firstDayOfWeek = firstDay.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Agrupar registros por día
    const byDay = new Map<string, { count: number; minutes: number; hours: Set<number> }>();
    for (const record of records) {
      if (!byDay.has(record.dateKey)) {
        byDay.set(record.dateKey, { count: 0, minutes: 0, hours: new Set() });
      }
      const dayData = byDay.get(record.dateKey)!;
      dayData.count++;
      dayData.minutes += record.studyMinutes;
      dayData.hours.add(record.hour);
    }

    const days: DayData[] = [];

    // Días del mes anterior para rellenar
    const prevMonth = new Date(year, monthNum - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const dateKey = toDateKey(new Date(year, monthNum - 2, day));
      const data = byDay.get(dateKey);
      days.push({
        dateKey,
        day,
        pomodoros: data?.count || 0,
        minutes: data?.minutes || 0,
        hours: data?.hours || new Set(),
        isToday: dateKey === today,
        isFuture: dateKey > today,
        isCurrentMonth: false,
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const data = byDay.get(dateKey);
      days.push({
        dateKey,
        day,
        pomodoros: data?.count || 0,
        minutes: data?.minutes || 0,
        hours: data?.hours || new Set(),
        isToday: dateKey === today,
        isFuture: dateKey > today,
        isCurrentMonth: true,
      });
    }

    // Días del siguiente mes para completar la semana
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let day = 1; day <= remaining; day++) {
        const dateKey = toDateKey(new Date(year, monthNum, day));
        const data = byDay.get(dateKey);
        days.push({
          dateKey,
          day,
          pomodoros: data?.count || 0,
          minutes: data?.minutes || 0,
          hours: data?.hours || new Set(),
          isToday: dateKey === today,
          isFuture: dateKey > today,
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [records, year, monthNum, today]);

  // Navegación de mes
  const goToPrevMonth = () => {
    const prev = new Date(year, monthNum - 2, 1);
    onMonthChange?.(
      `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const goToNextMonth = () => {
    const next = new Date(year, monthNum, 1);
    onMonthChange?.(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const monthName = new Date(year, monthNum - 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  // Contar días con los anillos cerrados
  const closedDays = calendarData.filter((day) => {
    if (!day.isCurrentMonth || day.isFuture) return false;
    const goals = getGoalsForDate(goalHistory, day.dateKey);
    return (
      day.pomodoros >= goals.pomodoros &&
      day.minutes >= goals.minutes
    );
  }).length;

  return (
    <div className="month-calendar">
      <div className="month-calendar-header">
        <button
          type="button"
          className="month-nav-btn"
          onClick={goToPrevMonth}
          aria-label="Mes anterior"
        >
          ←
        </button>
        <span className="month-calendar-title">{monthName}</span>
        <button
          type="button"
          className="month-nav-btn"
          onClick={goToNextMonth}
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      <div className="month-calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day} className="weekday-label">
            {day}
          </span>
        ))}
      </div>

      <div className="month-calendar-grid">
        {calendarData.map((day) => {
          const goals = getGoalsForDate(goalHistory, day.dateKey);
          const hasActivity = day.pomodoros > 0;

          return (
            <div
              key={day.dateKey}
              className={`calendar-day${day.isToday ? ' calendar-day--today' : ''}${
                !day.isCurrentMonth ? ' calendar-day--outside' : ''
              }${day.isFuture ? ' calendar-day--future' : ''}`}
            >
              <span className="calendar-day-number">{day.day}</span>
              {hasActivity && !day.isFuture && (
                <MiniActivityRings
                  pomodoros={{ current: day.pomodoros, goal: goals.pomodoros }}
                  minutes={{ current: day.minutes, goal: goals.minutes }}
                  size={24}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="month-calendar-summary">
        <span className="calendar-summary-text">
          {closedDays} días con anillos cerrados
        </span>
      </div>
    </div>
  );
}
