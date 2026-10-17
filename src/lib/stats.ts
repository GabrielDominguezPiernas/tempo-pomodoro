/**
 * Funciones de estadísticas calculadas desde el historial
 */

import { SessionRecord, toDateKey } from './history';
import { RingGoals, GoalHistory, getGoalsForDate } from './ringGoals';

// === BASIC STATS (mantener compatibilidad) ===

/**
 * Cuenta pomodoros de hoy
 */
export function todayCount(records: SessionRecord[]): number {
  const today = toDateKey(new Date());
  return records.filter((r) => r.dateKey === today).length;
}

/**
 * Obtiene el lunes de la semana (la semana empieza en lunes)
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // getDay(): 0=domingo, 1=lunes, ..., 6=sábado
  // Queremos retroceder al lunes
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Obtiene la clave de semana YYYY-WNN (ISO week)
 */
export function getWeekKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const monday = getMondayOfWeek(date);
  const year = monday.getFullYear();
  // Calcular número de semana ISO
  const jan4 = new Date(year, 0, 4);
  const jan4Monday = getMondayOfWeek(jan4);
  const diff = monday.getTime() - jan4Monday.getTime();
  const weekNum = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Cuenta pomodoros de la semana actual (lunes a domingo)
 */
export function weekCount(records: SessionRecord[]): number {
  const monday = getMondayOfWeek(new Date());
  const mondayKey = toDateKey(monday);
  return records.filter((r) => r.dateKey >= mondayKey).length;
}

/**
 * Total de pomodoros
 */
export function totalCount(records: SessionRecord[]): number {
  return records.length;
}

/**
 * Total de minutos acumulados
 */
export function totalMinutes(records: SessionRecord[]): number {
  return records.reduce((sum, r) => sum + r.studyMinutes, 0);
}

/**
 * Formatea minutos como "Xh Ym" o "Xh" o "Ym"
 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

/**
 * Parsea un dateKey a Date (a medianoche local)
 */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Resta días a una fecha
 */
function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

// === STREAKS (con día de gracia) ===

/**
 * Obtiene todos los dateKeys únicos con actividad
 */
function getActiveDays(records: SessionRecord[]): Set<string> {
  return new Set(records.map((r) => r.dateKey));
}

/**
 * Calcula la racha actual y mejor racha.
 *
 * Regla de gracia: se perdona UN día sin actividad por cada ventana de 7 días.
 * Es decir, un hueco aislado de un día no rompe la racha.
 *
 * La racha actual sigue viva si el último día con actividad es:
 * - Hoy, o
 * - Ayer, o
 * - Anteayer si se está usando el día de gracia
 */
export function calculateStreaks(records: SessionRecord[]): {
  currentStreak: number;
  bestStreak: number;
} {
  const activeDays = getActiveDays(records);
  if (activeDays.size === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Ordenar días de más reciente a más antiguo
  const sortedDays = Array.from(activeDays).sort().reverse();
  const today = toDateKey(new Date());
  const yesterday = toDateKey(subtractDays(new Date(), 1));
  const dayBeforeYesterday = toDateKey(subtractDays(new Date(), 2));

  // Calcular racha actual
  let currentStreak = 0;
  const lastActiveDay = sortedDays[0];

  // La racha está activa si el último día es hoy o ayer (o anteayer con gracia)
  const isStreakActive =
    lastActiveDay === today ||
    lastActiveDay === yesterday ||
    (lastActiveDay === dayBeforeYesterday && sortedDays.length > 1);

  if (isStreakActive) {
    currentStreak = countStreakWithGrace(sortedDays, today);
  }

  // Calcular mejor racha (sobre todos los días históricos)
  const allDaysSorted = Array.from(activeDays).sort();
  let bestStreak = 0;
  let tempStreak = 0;
  let graceUsed = 0;
  let lastDate: Date | null = null;

  for (const dateKey of allDaysSorted) {
    const currentDate = parseDateKey(dateKey);

    if (lastDate === null) {
      tempStreak = 1;
      graceUsed = 0;
    } else {
      const diffDays = Math.round(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        // Día consecutivo
        tempStreak++;
        // Cada 7 días restauramos un día de gracia
        if (tempStreak % 7 === 0) graceUsed = Math.max(0, graceUsed - 1);
      } else if (diffDays === 2 && graceUsed < Math.floor(tempStreak / 7) + 1) {
        // Hueco de 1 día, usamos gracia si está disponible
        tempStreak += 2; // Contamos ambos días
        graceUsed++;
      } else {
        // Racha rota
        tempStreak = 1;
        graceUsed = 0;
      }
    }

    bestStreak = Math.max(bestStreak, tempStreak);
    lastDate = currentDate;
  }

  return { currentStreak, bestStreak };
}

/**
 * Cuenta la racha con regla de gracia desde el día más reciente hacia atrás
 */
function countStreakWithGrace(sortedDaysDesc: string[], today: string): number {
  if (sortedDaysDesc.length === 0) return 0;

  let streak = 0;
  let graceAvailable = 1; // Un día de gracia inicial
  let expectedDate = new Date();

  // Si hoy no hay actividad, empezamos desde ayer
  if (sortedDaysDesc[0] !== today) {
    expectedDate = subtractDays(expectedDate, 1);
    // Si el último día es ayer, contamos desde ayer
    if (sortedDaysDesc[0] !== toDateKey(expectedDate)) {
      // El último día es anteayer, usamos gracia
      expectedDate = subtractDays(expectedDate, 1);
      graceAvailable = 0;
    }
  }

  for (const dateKey of sortedDaysDesc) {
    const expectedKey = toDateKey(expectedDate);

    if (dateKey === expectedKey) {
      streak++;
      expectedDate = subtractDays(expectedDate, 1);
      // Cada 7 días de racha, ganamos un día de gracia adicional
      if (streak % 7 === 0) graceAvailable++;
    } else if (graceAvailable > 0) {
      // Intentamos usar gracia
      const graceDateKey = toDateKey(subtractDays(expectedDate, 1));
      if (dateKey === graceDateKey) {
        streak += 2; // Contamos el día perdido también
        graceAvailable--;
        expectedDate = subtractDays(expectedDate, 2);
      } else {
        break; // Más de un día de hueco, racha rota
      }
    } else {
      break;
    }
  }

  return streak;
}

// === GOAL STREAK (estricto, sin gracia) ===

/**
 * Calcula racha de días con objetivo de pomodoros cerrado.
 * ESTRICTO: no hay día de gracia. Deben ser días consecutivos.
 *
 * La racha actual se considera activa si el último día cerrado es hoy o ayer.
 */
export function calculateGoalStreaks(
  dayMap: Map<string, DayStats>,
  today: string
): { currentGoalStreak: number; bestGoalStreak: number } {
  // Obtener días cerrados ordenados
  const closedDays: string[] = [];
  dayMap.forEach((day, dateKey) => {
    if (day.closed.pomodoros) {
      closedDays.push(dateKey);
    }
  });

  if (closedDays.length === 0) {
    return { currentGoalStreak: 0, bestGoalStreak: 0 };
  }

  closedDays.sort();

  // Mejor racha
  let bestGoalStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < closedDays.length; i++) {
    const prev = parseDateKey(closedDays[i - 1]);
    const curr = parseDateKey(closedDays[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      tempStreak++;
      bestGoalStreak = Math.max(bestGoalStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // Racha actual: contar hacia atrás desde hoy o ayer
  let currentGoalStreak = 0;
  const yesterday = toDateKey(subtractDays(new Date(), 1));
  const lastClosed = closedDays[closedDays.length - 1];

  if (lastClosed === today || lastClosed === yesterday) {
    currentGoalStreak = 1;
    let checkDate = lastClosed;
    // Buscar hacia atrás
    for (let i = closedDays.length - 2; i >= 0; i--) {
      const prevDate = toDateKey(subtractDays(parseDateKey(checkDate), 1));
      if (closedDays[i] === prevDate) {
        currentGoalStreak++;
        checkDate = prevDate;
      } else {
        break;
      }
    }
  }

  return { currentGoalStreak, bestGoalStreak };
}

// === WEEKLY RHYTHM STREAK ===

/**
 * Calcula racha de semanas "con ritmo" (≥3 días activos por semana)
 */
function calculateRhythmStreak(
  weekMap: Map<string, WeekStats>
): { currentRhythmStreak: number; bestRhythmStreak: number } {
  const weeks = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b));

  if (weeks.length === 0) {
    return { currentRhythmStreak: 0, bestRhythmStreak: 0 };
  }

  // Identificar semanas con ritmo (≥3 días activos)
  const rhythmWeeks: string[] = [];
  weeks.forEach(([weekKey, stats]) => {
    if (stats.activeDays >= 3) {
      rhythmWeeks.push(weekKey);
    }
  });

  if (rhythmWeeks.length === 0) {
    return { currentRhythmStreak: 0, bestRhythmStreak: 0 };
  }

  // Mejor racha de semanas consecutivas
  let bestRhythmStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < rhythmWeeks.length; i++) {
    // Extraer año y número de semana
    const [yearA, weekA] = rhythmWeeks[i - 1].split('-W').map(Number);
    const [yearB, weekB] = rhythmWeeks[i].split('-W').map(Number);

    // Verificar si son consecutivas
    const isConsecutive =
      (yearA === yearB && weekB === weekA + 1) ||
      (yearB === yearA + 1 && weekA >= 52 && weekB === 1);

    if (isConsecutive) {
      tempStreak++;
      bestRhythmStreak = Math.max(bestRhythmStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // Racha actual
  const currentWeekKey = getWeekKey(toDateKey(new Date()));
  const lastRhythmWeek = rhythmWeeks[rhythmWeeks.length - 1];

  // Verificar si la última semana con ritmo es esta o la anterior
  const [currYear, currWeek] = currentWeekKey.split('-W').map(Number);
  const [lastYear, lastWeek] = lastRhythmWeek.split('-W').map(Number);

  const isCurrentOrLast =
    lastRhythmWeek === currentWeekKey ||
    (currYear === lastYear && currWeek === lastWeek + 1) ||
    (currYear === lastYear + 1 && lastWeek >= 52 && currWeek === 1);

  if (!isCurrentOrLast) {
    return { currentRhythmStreak: 0, bestRhythmStreak };
  }

  // Contar hacia atrás
  let currentRhythmStreak = 1;
  for (let i = rhythmWeeks.length - 2; i >= 0; i--) {
    const [yearA, weekA] = rhythmWeeks[i].split('-W').map(Number);
    const [yearB, weekB] = rhythmWeeks[i + 1].split('-W').map(Number);

    const isConsecutive =
      (yearA === yearB && weekB === weekA + 1) ||
      (yearB === yearA + 1 && weekA >= 52 && weekB === 1);

    if (isConsecutive) {
      currentRhythmStreak++;
    } else {
      break;
    }
  }

  return { currentRhythmStreak, bestRhythmStreak };
}

// === HEATMAP ===

export interface HeatmapDay {
  dateKey: string;
  count: number;
  isToday: boolean;
  isFuture: boolean;
}

export function heatmapData(
  records: SessionRecord[],
  weeks: number = 12
): HeatmapDay[][] {
  const today = new Date();
  const todayKey = toDateKey(today);

  // Encontrar el lunes de esta semana
  const thisMonday = getMondayOfWeek(today);

  // Retroceder (weeks - 1) semanas para empezar
  const startMonday = subtractDays(thisMonday, (weeks - 1) * 7);

  // Contar pomodoros por día
  const countByDay = new Map<string, number>();
  for (const record of records) {
    countByDay.set(record.dateKey, (countByDay.get(record.dateKey) || 0) + 1);
  }

  const result: HeatmapDay[][] = [];

  for (let week = 0; week < weeks; week++) {
    const weekData: HeatmapDay[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(startMonday);
      date.setDate(date.getDate() + week * 7 + day);
      const dateKey = toDateKey(date);

      weekData.push({
        dateKey,
        count: countByDay.get(dateKey) || 0,
        isToday: dateKey === todayKey,
        isFuture: dateKey > todayKey,
      });
    }
    result.push(weekData);
  }

  return result;
}

/**
 * Máximo de pomodoros en una misma sesión
 */
export function maxPomodorosInSession(records: SessionRecord[]): number {
  const bySession = new Map<string, number>();
  for (const record of records) {
    bySession.set(record.sessionId, (bySession.get(record.sessionId) || 0) + 1);
  }
  return Math.max(0, ...Array.from(bySession.values()));
}

/**
 * Máximo de pomodoros en un día
 */
export function maxPomodorosInDay(records: SessionRecord[]): number {
  const byDay = new Map<string, number>();
  for (const record of records) {
    byDay.set(record.dateKey, (byDay.get(record.dateKey) || 0) + 1);
  }
  return Math.max(0, ...Array.from(byDay.values()));
}

// === CONTEXT ===

export interface DayStats {
  count: number;
  minutes: number;
  hours: Set<number>;
  goals: RingGoals;
  closed: {
    pomodoros: boolean;
    minutes: boolean;
    hours: boolean;
    all: boolean;
  };
}

export interface WeekStats {
  pomodoros: number;
  activeDays: number;
  closedDays: number; // días con anillo de pomodoros cerrado
  // Para insignias de semana laboral/perfecta
  closedByDay: boolean[]; // índice 0=lunes, 6=domingo
}

export interface MonthStats {
  pomodoros: number;
  activeDays: number;
  closedDays: number;
  totalDays: number; // días del mes
  allDaysClosed: boolean; // mes perfecto
}

export interface StatsContext {
  // Mapa por día
  dayMap: Map<string, DayStats>;

  // Totales
  totalPomodoros: number;
  totalMinutes: number;
  totalActiveDays: number;

  // Rachas (con gracia)
  currentStreak: number;
  bestStreak: number;

  // Rachas de objetivo (estricto)
  currentGoalStreak: number;
  bestGoalStreak: number;

  // Semanas
  weekMap: Map<string, WeekStats>;
  maxPomodorosInWeek: number;

  // Meses
  monthMap: Map<string, MonthStats>;

  // Máximos
  maxPomodorosInDay: number;
  maxPomodorosInSession: number;

  // Racha de ritmo semanal
  currentRhythmStreak: number;
  bestRhythmStreak: number;

  // Días con todos los anillos cerrados
  allRingsClosedDays: number;

  // Para insignias especiales
  earlyDays: number; // días con pomodoro antes de las 8
  nightDays: number; // días con pomodoro >= 22
  newYearDays: string[]; // dateKeys de 1 de enero con actividad

  // Sesiones por sessionId
  sessionCounts: Map<string, number>;

  // Fecha del primer registro
  firstRecordDate: string | null;

  // Hoy
  today: string;
}

/**
 * Construye el contexto de estadísticas desde el historial.
 * Se calcula una sola vez y se usa con useMemo.
 */
export function buildContext(
  records: SessionRecord[],
  goalHistory: GoalHistory
): StatsContext {
  const today = toDateKey(new Date());

  // Mapas de acumulación
  const dayMap = new Map<string, DayStats>();
  const weekMap = new Map<string, WeekStats>();
  const monthMap = new Map<string, MonthStats>();
  const sessionCounts = new Map<string, number>();

  // Sets para días especiales
  const earlyDaysSet = new Set<string>();
  const nightDaysSet = new Set<string>();
  const newYearDays: string[] = [];

  let totalMinutesAcc = 0;
  let firstRecordDate: string | null = null;

  // Procesar cada registro
  for (const record of records) {
    const { dateKey, hour, studyMinutes, sessionId } = record;

    // Actualizar primer registro
    if (!firstRecordDate || dateKey < firstRecordDate) {
      firstRecordDate = dateKey;
    }

    // Sesiones
    sessionCounts.set(sessionId, (sessionCounts.get(sessionId) || 0) + 1);

    // Día
    let dayStats = dayMap.get(dateKey);
    if (!dayStats) {
      const goals = getGoalsForDate(goalHistory, dateKey);
      dayStats = {
        count: 0,
        minutes: 0,
        hours: new Set(),
        goals,
        closed: { pomodoros: false, minutes: false, hours: false, all: false },
      };
      dayMap.set(dateKey, dayStats);
    }
    dayStats.count++;
    dayStats.minutes += studyMinutes;
    dayStats.hours.add(hour);
    totalMinutesAcc += studyMinutes;

    // Semana
    const weekKey = getWeekKey(dateKey);
    let weekStats = weekMap.get(weekKey);
    if (!weekStats) {
      weekStats = {
        pomodoros: 0,
        activeDays: 0,
        closedDays: 0,
        closedByDay: [false, false, false, false, false, false, false],
      };
      weekMap.set(weekKey, weekStats);
    }
    weekStats.pomodoros++;

    // Mes
    const monthKey = dateKey.slice(0, 7); // YYYY-MM
    let monthStats = monthMap.get(monthKey);
    if (!monthStats) {
      const [year, month] = monthKey.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      monthStats = {
        pomodoros: 0,
        activeDays: 0,
        closedDays: 0,
        totalDays: daysInMonth,
        allDaysClosed: false,
      };
      monthMap.set(monthKey, monthStats);
    }
    monthStats.pomodoros++;

    // Días especiales
    if (hour < 8) earlyDaysSet.add(dateKey);
    if (hour >= 22) nightDaysSet.add(dateKey);

    // Año nuevo
    if (dateKey.endsWith('-01-01') && !newYearDays.includes(dateKey)) {
      newYearDays.push(dateKey);
    }
  }

  // Segunda pasada: calcular cierres y estadísticas agregadas
  const activeDaysInWeek = new Map<string, Set<string>>();
  const activeDaysInMonth = new Map<string, Set<string>>();
  let allRingsClosedDays = 0;
  let maxPomInDay = 0;

  dayMap.forEach((day, dateKey) => {
    // Calcular cierres
    day.closed.pomodoros = day.count >= day.goals.pomodoros;
    day.closed.minutes = day.minutes >= day.goals.minutes;
    day.closed.hours = day.hours.size >= day.goals.hours;
    day.closed.all = day.closed.pomodoros && day.closed.minutes && day.closed.hours;

    if (day.closed.all) allRingsClosedDays++;
    if (day.count > maxPomInDay) maxPomInDay = day.count;

    // Semana
    const weekKey = getWeekKey(dateKey);
    if (!activeDaysInWeek.has(weekKey)) {
      activeDaysInWeek.set(weekKey, new Set());
    }
    activeDaysInWeek.get(weekKey)!.add(dateKey);

    const weekStats = weekMap.get(weekKey)!;
    if (day.closed.pomodoros) {
      weekStats.closedDays++;
      // Determinar qué día de la semana es (0=lunes, 6=domingo)
      const date = parseDateKey(dateKey);
      const dayOfWeek = date.getDay();
      const mondayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStats.closedByDay[mondayIndex] = true;
    }

    // Mes
    const monthKey = dateKey.slice(0, 7);
    if (!activeDaysInMonth.has(monthKey)) {
      activeDaysInMonth.set(monthKey, new Set());
    }
    activeDaysInMonth.get(monthKey)!.add(dateKey);

    const monthStats = monthMap.get(monthKey)!;
    if (day.closed.pomodoros) {
      monthStats.closedDays++;
    }
  });

  // Actualizar conteos de días activos
  activeDaysInWeek.forEach((days, weekKey) => {
    const weekStats = weekMap.get(weekKey)!;
    weekStats.activeDays = days.size;
  });

  activeDaysInMonth.forEach((days, monthKey) => {
    const monthStats = monthMap.get(monthKey)!;
    monthStats.activeDays = days.size;
    // Mes perfecto: todos los días cerrados
    monthStats.allDaysClosed = monthStats.closedDays === monthStats.totalDays;
  });

  // Máximo en sesión
  let maxPomInSession = 0;
  sessionCounts.forEach((count) => {
    if (count > maxPomInSession) maxPomInSession = count;
  });

  // Máximo en semana
  let maxPomInWeek = 0;
  weekMap.forEach((week) => {
    if (week.pomodoros > maxPomInWeek) maxPomInWeek = week.pomodoros;
  });

  // Rachas
  const { currentStreak, bestStreak } = calculateStreaks(records);
  const { currentGoalStreak, bestGoalStreak } = calculateGoalStreaks(dayMap, today);
  const { currentRhythmStreak, bestRhythmStreak } = calculateRhythmStreak(weekMap);

  return {
    dayMap,
    totalPomodoros: records.length,
    totalMinutes: totalMinutesAcc,
    totalActiveDays: dayMap.size,
    currentStreak,
    bestStreak,
    currentGoalStreak,
    bestGoalStreak,
    weekMap,
    maxPomodorosInWeek: maxPomInWeek,
    monthMap,
    maxPomodorosInDay: maxPomInDay,
    maxPomodorosInSession: maxPomInSession,
    currentRhythmStreak,
    bestRhythmStreak,
    allRingsClosedDays,
    earlyDays: earlyDaysSet.size,
    nightDays: nightDaysSet.size,
    newYearDays,
    sessionCounts,
    firstRecordDate,
    today,
  };
}

// === TODAY STATS ===

export interface TodayStats {
  pomodoros: number;
  minutes: number;
  hours: number;
  goals: RingGoals;
  closed: {
    pomodoros: boolean;
    minutes: boolean;
    hours: boolean;
    all: boolean;
  };
}

export function getTodayStats(
  records: SessionRecord[],
  goals: RingGoals
): TodayStats {
  const today = toDateKey(new Date());
  const todayRecords = records.filter((r) => r.dateKey === today);

  const pomodoros = todayRecords.length;
  const minutes = todayRecords.reduce((sum, r) => sum + r.studyMinutes, 0);
  const hoursSet = new Set(todayRecords.map((r) => r.hour));
  const hours = hoursSet.size;

  const closedPomodoros = pomodoros >= goals.pomodoros;
  const closedMinutes = minutes >= goals.minutes;
  const closedHours = hours >= goals.hours;

  return {
    pomodoros,
    minutes,
    hours,
    goals,
    closed: {
      pomodoros: closedPomodoros,
      minutes: closedMinutes,
      hours: closedHours,
      all: closedPomodoros && closedMinutes && closedHours,
    },
  };
}
