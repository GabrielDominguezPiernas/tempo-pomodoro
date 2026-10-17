/**
 * Sistema de retos mensuales dinámicos
 *
 * Cada mes hay un reto especial que se genera automáticamente.
 * Los retos varían para mantener el engagement.
 */

import { StatsContext } from './stats';

export type ChallengeType =
  | 'close_pomodoro_ring'    // Cerrar anillo X días
  | 'close_all_rings'        // Cerrar los 3 anillos X días
  | 'total_pomodoros'        // Completar X pomodoros
  | 'total_minutes'          // Acumular X minutos
  | 'perfect_week'           // Semana perfecta (7 días cerrados)
  | 'early_bird'             // X días madrugando
  | 'streak'                 // Mantener racha de X días
  ;

export interface MonthlyChallenge {
  id: string;               // YYYY-MM-type (e.g., "2024-01-close_pomodoro_ring")
  type: ChallengeType;
  month: string;            // YYYY-MM
  emoji: string;
  name: string;
  description: string;
  target: number;
  progress: (ctx: StatsContext, month: string) => number;
}

export interface ChallengeProgress {
  challengeId: string;
  current: number;
  completed: boolean;
  completedAt?: string;     // ISO date when completed
}

export type ChallengeHistory = Record<string, ChallengeProgress>;

const STORAGE_KEY = 'pomodoro-challenges-v1';

// === CHALLENGE TEMPLATES ===

const CHALLENGE_TEMPLATES: Array<{
  type: ChallengeType;
  emoji: string;
  nameTemplate: string;
  descTemplate: string;
  targets: number[];
  progress: (ctx: StatsContext, month: string) => number;
}> = [
  {
    type: 'close_pomodoro_ring',
    emoji: '🔴',
    nameTemplate: 'Cierra el anillo',
    descTemplate: 'Cierra el anillo de pomodoros {target} días este mes',
    targets: [15, 20, 25],
    progress: (ctx, month) => {
      let count = 0;
      ctx.dayMap.forEach((day, dateKey) => {
        if (dateKey.startsWith(month) && day.closed.pomodoros) {
          count++;
        }
      });
      return count;
    },
  },
  {
    type: 'close_all_rings',
    emoji: '⭕',
    nameTemplate: 'Triple cierre',
    descTemplate: 'Cierra los tres anillos {target} días este mes',
    targets: [10, 15, 20],
    progress: (ctx, month) => {
      let count = 0;
      ctx.dayMap.forEach((day, dateKey) => {
        if (dateKey.startsWith(month) && day.closed.all) {
          count++;
        }
      });
      return count;
    },
  },
  {
    type: 'total_pomodoros',
    emoji: '🍅',
    nameTemplate: 'Productividad',
    descTemplate: 'Completa {target} pomodoros este mes',
    targets: [50, 75, 100],
    progress: (ctx, month) => {
      let count = 0;
      ctx.dayMap.forEach((day, dateKey) => {
        if (dateKey.startsWith(month)) {
          count += day.count;
        }
      });
      return count;
    },
  },
  {
    type: 'total_minutes',
    emoji: '⏱️',
    nameTemplate: 'Tiempo de enfoque',
    descTemplate: 'Acumula {target} minutos de estudio este mes',
    targets: [1500, 2000, 2500],
    progress: (ctx, month) => {
      let total = 0;
      ctx.dayMap.forEach((day, dateKey) => {
        if (dateKey.startsWith(month)) {
          total += day.minutes;
        }
      });
      return total;
    },
  },
  {
    type: 'perfect_week',
    emoji: '🗓️',
    nameTemplate: 'Semana perfecta',
    descTemplate: 'Cierra el anillo los 7 días de una semana',
    targets: [1],
    progress: (ctx, month) => {
      let perfectWeeks = 0;
      ctx.weekMap.forEach((week, weekKey) => {
        // Solo contar semanas que tengan al menos un día en el mes actual
        const [weekYear, weekNum] = weekKey.split('-W').map(Number);

        // Verificar si la semana corresponde al mes
        const weekStart = getWeekStartDate(weekYear, weekNum);
        const weekMonth = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`;

        if (weekMonth === month && week.closedDays === 7) {
          perfectWeeks++;
        }
      });
      return perfectWeeks;
    },
  },
  {
    type: 'early_bird',
    emoji: '🌅',
    nameTemplate: 'Madrugador',
    descTemplate: 'Completa un pomodoro antes de las 8:00 en {target} días',
    targets: [5, 10, 15],
    progress: (ctx, _month) => {
      // Por ahora retornamos earlyDays (global)
      // TODO: Filtrar por mes cuando tengamos acceso a los registros
      return Math.min(ctx.earlyDays, 15);
    },
  },
];

function getWeekStartDate(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const jan4DayOfWeek = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - jan4DayOfWeek + 1);

  const result = new Date(firstMonday);
  result.setDate(result.getDate() + (week - 1) * 7);
  return result;
}

// === CHALLENGE GENERATION ===

/**
 * Genera el reto mensual basado en el mes.
 * Usa un algoritmo determinista para que el mismo mes siempre tenga el mismo reto.
 */
export function generateMonthlyChallenge(month: string): MonthlyChallenge {
  // Hash simple del mes para seleccionar template y target
  const [year, monthNum] = month.split('-').map(Number);
  const seed = year * 12 + monthNum;

  const templateIndex = seed % CHALLENGE_TEMPLATES.length;
  const template = CHALLENGE_TEMPLATES[templateIndex];

  const targetIndex = (seed >> 2) % template.targets.length;
  const target = template.targets[targetIndex];

  const id = `${month}-${template.type}`;

  return {
    id,
    type: template.type,
    month,
    emoji: template.emoji,
    name: template.nameTemplate,
    description: template.descTemplate.replace('{target}', String(target)),
    target,
    progress: template.progress,
  };
}

/**
 * Obtiene el reto del mes actual
 */
export function getCurrentChallenge(): MonthlyChallenge {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return generateMonthlyChallenge(month);
}

// === STORAGE ===

export function loadChallengeHistory(): ChallengeHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveChallengeHistory(history: ChallengeHistory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignorar
  }
}

/**
 * Actualiza el progreso del reto actual
 */
export function updateChallengeProgress(
  challenge: MonthlyChallenge,
  ctx: StatsContext,
  history: ChallengeHistory
): { history: ChallengeHistory; justCompleted: boolean } {
  const current = challenge.progress(ctx, challenge.month);
  const wasCompleted = history[challenge.id]?.completed ?? false;
  const isNowCompleted = current >= challenge.target;
  const justCompleted = !wasCompleted && isNowCompleted;

  const newHistory = {
    ...history,
    [challenge.id]: {
      challengeId: challenge.id,
      current,
      completed: isNowCompleted,
      completedAt: isNowCompleted && !wasCompleted
        ? new Date().toISOString()
        : history[challenge.id]?.completedAt,
    },
  };

  return { history: newHistory, justCompleted };
}

/**
 * Cuenta retos completados históricamente
 */
export function getCompletedChallengesCount(history: ChallengeHistory): number {
  return Object.values(history).filter((p) => p.completed).length;
}
