/**
 * Sistema de tres anillos diarios estilo Apple Fitness
 * - Anillo 1: Pomodoros completados
 * - Anillo 2: Minutos de enfoque
 * - Anillo 3: Franjas horarias activas
 */

import { toDateKey } from './history';

// === TYPES ===

export interface RingGoals {
  pomodoros: number; // 1-12, default 4
  minutes: number;   // 15-480, step 5, default 100
  hours: number;     // 1-12, default 3 (distinct hours with activity)
}

export interface GoalHistoryEntry {
  from: string; // dateKey YYYY-MM-DD
  pomodoros: number;
  minutes: number;
  hours: number;
}

export type GoalHistory = GoalHistoryEntry[];

// === CONSTANTS ===

export const DEFAULT_GOALS: RingGoals = {
  pomodoros: 4,
  minutes: 100,
  hours: 3,
};

export const GOAL_RANGES = {
  pomodoros: { min: 1, max: 12, step: 1 },
  minutes: { min: 15, max: 480, step: 5 },
  hours: { min: 1, max: 12, step: 1 },
} as const;

const RING_GOALS_KEY = 'pomodoro-ring-goals-v1';
const GOAL_HISTORY_KEY = 'pomodoro-goal-history-v1';
const LEGACY_DAILY_GOAL_KEY = 'pomodoro-daily-goal';

// === VALIDATION ===

function isValidGoalEntry(entry: unknown): entry is GoalHistoryEntry {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.from === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(e.from) &&
    typeof e.pomodoros === 'number' &&
    e.pomodoros >= GOAL_RANGES.pomodoros.min &&
    e.pomodoros <= GOAL_RANGES.pomodoros.max &&
    typeof e.minutes === 'number' &&
    e.minutes >= GOAL_RANGES.minutes.min &&
    e.minutes <= GOAL_RANGES.minutes.max &&
    typeof e.hours === 'number' &&
    e.hours >= GOAL_RANGES.hours.min &&
    e.hours <= GOAL_RANGES.hours.max
  );
}

// === STORAGE ===

/**
 * Migra el objetivo diario antiguo (solo pomodoros) al nuevo sistema.
 * Solo se ejecuta una vez.
 */
function migrateLegacyGoal(): RingGoals {
  const legacy = localStorage.getItem(LEGACY_DAILY_GOAL_KEY);
  if (legacy) {
    const pomodorosGoal = parseInt(legacy, 10);
    if (!isNaN(pomodorosGoal) && pomodorosGoal >= 1 && pomodorosGoal <= 12) {
      return {
        pomodoros: pomodorosGoal,
        minutes: DEFAULT_GOALS.minutes,
        hours: DEFAULT_GOALS.hours,
      };
    }
  }
  return DEFAULT_GOALS;
}

/**
 * Carga los objetivos actuales de los anillos
 */
export function loadRingGoals(): RingGoals {
  try {
    const raw = localStorage.getItem(RING_GOALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        pomodoros: Math.max(
          GOAL_RANGES.pomodoros.min,
          Math.min(GOAL_RANGES.pomodoros.max, parsed.pomodoros || DEFAULT_GOALS.pomodoros)
        ),
        minutes: Math.max(
          GOAL_RANGES.minutes.min,
          Math.min(GOAL_RANGES.minutes.max, parsed.minutes || DEFAULT_GOALS.minutes)
        ),
        hours: Math.max(
          GOAL_RANGES.hours.min,
          Math.min(GOAL_RANGES.hours.max, parsed.hours || DEFAULT_GOALS.hours)
        ),
      };
    }
    // Primera carga: migrar desde el sistema antiguo
    const migrated = migrateLegacyGoal();
    saveRingGoals(migrated);
    return migrated;
  } catch {
    return DEFAULT_GOALS;
  }
}

/**
 * Guarda los objetivos actuales de los anillos
 */
export function saveRingGoals(goals: RingGoals): void {
  try {
    localStorage.setItem(RING_GOALS_KEY, JSON.stringify(goals));
  } catch {
    // Ignorar errores de almacenamiento
  }
}

/**
 * Carga el historial de objetivos
 */
export function loadGoalHistory(): GoalHistory {
  try {
    const raw = localStorage.getItem(GOAL_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(isValidGoalEntry);
        // Asegurar orden cronológico
        valid.sort((a, b) => a.from.localeCompare(b.from));
        return valid;
      }
    }
    // Primera carga: crear entrada base con objetivos actuales
    const currentGoals = loadRingGoals();
    const initialEntry: GoalHistoryEntry = {
      from: '1970-01-01',
      ...currentGoals,
    };
    saveGoalHistory([initialEntry]);
    return [initialEntry];
  } catch {
    return [{ from: '1970-01-01', ...DEFAULT_GOALS }];
  }
}

/**
 * Guarda el historial de objetivos
 */
export function saveGoalHistory(history: GoalHistory): void {
  try {
    localStorage.setItem(GOAL_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignorar errores
  }
}

// === HELPERS ===

/**
 * Obtiene el objetivo vigente para una fecha dada.
 * Busca la última entrada con from <= dateKey.
 */
export function getGoalsForDate(history: GoalHistory, dateKey: string): RingGoals {
  // Buscar de atrás hacia adelante para encontrar la más reciente
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].from <= dateKey) {
      return {
        pomodoros: history[i].pomodoros,
        minutes: history[i].minutes,
        hours: history[i].hours,
      };
    }
  }
  return DEFAULT_GOALS;
}

/**
 * Actualiza un objetivo y registra el cambio en el historial.
 * Si ya existe una entrada para hoy, la actualiza; si no, la crea.
 */
export function updateGoal(
  currentGoals: RingGoals,
  history: GoalHistory,
  field: keyof RingGoals,
  value: number
): { goals: RingGoals; history: GoalHistory } {
  const today = toDateKey(new Date());
  const newGoals = { ...currentGoals, [field]: value };

  // Buscar si ya existe entrada para hoy
  const todayIndex = history.findIndex((e) => e.from === today);

  let newHistory: GoalHistory;
  if (todayIndex >= 0) {
    // Actualizar entrada existente
    newHistory = [...history];
    newHistory[todayIndex] = { from: today, ...newGoals };
  } else {
    // Añadir nueva entrada
    newHistory = [...history, { from: today, ...newGoals }];
    // Mantener orden cronológico
    newHistory.sort((a, b) => a.from.localeCompare(b.from));
  }

  return { goals: newGoals, history: newHistory };
}
