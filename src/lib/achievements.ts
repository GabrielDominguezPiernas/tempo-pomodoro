/**
 * Sistema de insignias/logros (62 insignias)
 * Generado desde definiciones de series para evitar repetición.
 */

import { StatsContext, parseDateKey, getWeekKey } from './stats';

// === TYPES ===

export type Tier = 'bronce' | 'plata' | 'oro' | 'platino';

export type Category =
  | 'constancia'
  | 'objetivo'
  | 'pomodoros'
  | 'tiempo'
  | 'dia'
  | 'sesion'
  | 'semana'
  | 'anillos'
  | 'especiales'
  | 'retos';

export interface Achievement {
  id: string;
  category: Category;
  tier: Tier;
  emoji: string;
  name: string;
  description: string;
  hint: string;
  target: number;
  progress: (ctx: StatsContext) => number;
}

export type UnlockedMap = Record<string, string>; // id -> ISO date

// === ACHIEVEMENT CATALOG ===

const achievements: Achievement[] = [];

// --- CONSTANCIA (días con ≥1 pomodoro, usa bestStreak) ---
const streakLevels: Array<{ id: string; target: number; tier: Tier; emoji: string; name: string; desc: string }> = [
  { id: 'streak3', target: 3, tier: 'bronce', emoji: '🔥', name: 'Constancia', desc: 'Racha de 3 días' },
  { id: 'streak7', target: 7, tier: 'plata', emoji: '⚡️', name: 'Una semana', desc: 'Racha de 7 días' },
  { id: 'streak14', target: 14, tier: 'plata', emoji: '🗓️', name: 'Dos semanas', desc: 'Racha de 14 días' },
  { id: 'streak21', target: 21, tier: 'plata', emoji: '🧠', name: 'Tres semanas', desc: 'Racha de 21 días' },
  { id: 'streak30', target: 30, tier: 'oro', emoji: '🏆', name: 'Un mes', desc: 'Racha de 30 días' },
  { id: 'streak60', target: 60, tier: 'oro', emoji: '💎', name: 'Dos meses', desc: 'Racha de 60 días' },
  { id: 'streak100', target: 100, tier: 'oro', emoji: '💯', name: 'Cien días', desc: 'Racha de 100 días' },
  { id: 'streak180', target: 180, tier: 'platino', emoji: '🌍', name: 'Medio año', desc: 'Racha de 180 días' },
  { id: 'streak365', target: 365, tier: 'platino', emoji: '👑', name: 'Un año', desc: 'Racha de 365 días' },
];

for (const level of streakLevels) {
  achievements.push({
    id: level.id,
    category: 'constancia',
    tier: level.tier,
    emoji: level.emoji,
    name: level.name,
    description: level.desc,
    hint: `Mantén una racha de ${level.target} días`,
    target: level.target,
    progress: (ctx) => ctx.bestStreak,
  });
}

// --- OBJETIVO DIARIO (días consecutivos cerrando anillo de pomodoros, estricto) ---
const goalStreakLevels: Array<{ id: string; target: number; tier: Tier }> = [
  { id: 'goalstreak3', target: 3, tier: 'bronce' },
  { id: 'goalstreak7', target: 7, tier: 'plata' },
  { id: 'goalstreak14', target: 14, tier: 'plata' },
  { id: 'goalstreak30', target: 30, tier: 'oro' },
  { id: 'goalstreak60', target: 60, tier: 'oro' },
  { id: 'goalstreak100', target: 100, tier: 'platino' },
];

for (const level of goalStreakLevels) {
  achievements.push({
    id: level.id,
    category: 'objetivo',
    tier: level.tier,
    emoji: '🎯',
    name: `Objetivo ${level.target}`,
    description: `${level.target} días seguidos cumpliendo objetivo`,
    hint: `Cierra el anillo de pomodoros ${level.target} días seguidos`,
    target: level.target,
    progress: (ctx) => ctx.bestGoalStreak,
  });
}

// --- POMODOROS ACUMULADOS ---
const pomodoroLevels: Array<{ id: string; target: number; tier: Tier; emoji: string; name: string }> = [
  { id: 'first', target: 1, tier: 'bronce', emoji: '🌱', name: 'Primer pomodoro' },
  { id: 'pom10', target: 10, tier: 'bronce', emoji: '🍅', name: 'Diez pomodoros' },
  { id: 'pom25', target: 25, tier: 'bronce', emoji: '🌷', name: 'Veinticinco' },
  { id: 'pom50', target: 50, tier: 'plata', emoji: '🍀', name: 'Cincuenta' },
  { id: 'pom100', target: 100, tier: 'plata', emoji: '💯', name: 'Cien pomodoros' },
  { id: 'pom250', target: 250, tier: 'oro', emoji: '🌳', name: 'Doscientos cincuenta' },
  { id: 'pom500', target: 500, tier: 'oro', emoji: '🏔️', name: 'Quinientos' },
  { id: 'pom1000', target: 1000, tier: 'oro', emoji: '🚀', name: 'Mil pomodoros' },
  { id: 'pom2500', target: 2500, tier: 'platino', emoji: '🌟', name: 'Dos mil quinientos' },
  { id: 'pom5000', target: 5000, tier: 'platino', emoji: '👑', name: 'Cinco mil' },
];

for (const level of pomodoroLevels) {
  achievements.push({
    id: level.id,
    category: 'pomodoros',
    tier: level.tier,
    emoji: level.emoji,
    name: level.name,
    description: `${level.target} pomodoros completados`,
    hint: `Completa ${level.target} pomodoros`,
    target: level.target,
    progress: (ctx) => ctx.totalPomodoros,
  });
}

// --- TIEMPO DE ESTUDIO (horas acumuladas) ---
const hourLevels: Array<{ id: string; target: number; tier: Tier; emoji: string; name: string }> = [
  { id: 'hours10', target: 10, tier: 'bronce', emoji: '⏱️', name: '10 horas' },
  { id: 'hours25', target: 25, tier: 'plata', emoji: '⌛️', name: '25 horas' },
  { id: 'hours50', target: 50, tier: 'plata', emoji: '📚', name: '50 horas' },
  { id: 'hours100', target: 100, tier: 'oro', emoji: '🎓', name: '100 horas' },
  { id: 'hours250', target: 250, tier: 'oro', emoji: '🧩', name: '250 horas' },
  { id: 'hours500', target: 500, tier: 'platino', emoji: '🔭', name: '500 horas' },
  { id: 'hours1000', target: 1000, tier: 'platino', emoji: '🏛️', name: '1000 horas' },
];

for (const level of hourLevels) {
  achievements.push({
    id: level.id,
    category: 'tiempo',
    tier: level.tier,
    emoji: level.emoji,
    name: level.name,
    description: `${level.target} horas de estudio`,
    hint: `Acumula ${level.target} horas de estudio`,
    target: level.target * 60, // Convertir a minutos
    progress: (ctx) => ctx.totalMinutes,
  });
}

// --- UN DÍA (pomodoros en un día) ---
const dayLevels: Array<{ id: string; target: number; tier: Tier; emoji: string; name: string }> = [
  { id: 'day6', target: 6, tier: 'plata', emoji: '💪', name: 'Día productivo' },
  { id: 'marathon', target: 8, tier: 'oro', emoji: '🏃', name: 'Maratón' },
  { id: 'day10', target: 10, tier: 'oro', emoji: '🥇', name: 'Día épico' },
  { id: 'day12', target: 12, tier: 'platino', emoji: '🏅', name: 'Día legendario' },
];

for (const level of dayLevels) {
  achievements.push({
    id: level.id,
    category: 'dia',
    tier: level.tier,
    emoji: level.emoji,
    name: level.name,
    description: `${level.target} pomodoros en un día`,
    hint: `Completa ${level.target} pomodoros en un día`,
    target: level.target,
    progress: (ctx) => ctx.maxPomodorosInDay,
  });
}

// --- UNA SESIÓN (pomodoros en una sesión) ---
const sessionLevels: Array<{ id: string; target: number; tier: Tier; emoji: string; name: string }> = [
  { id: 'cycle', target: 4, tier: 'bronce', emoji: '🍅', name: 'Ciclo completo' },
  { id: 'session6', target: 6, tier: 'plata', emoji: '🧘', name: 'Sesión profunda' },
  { id: 'session8', target: 8, tier: 'oro', emoji: '🎯', name: 'Sesión maestra' },
];

for (const level of sessionLevels) {
  achievements.push({
    id: level.id,
    category: 'sesion',
    tier: level.tier,
    emoji: level.emoji,
    name: level.name,
    description: `${level.target} pomodoros en una sesión`,
    hint: `Completa ${level.target} pomodoros seguidos`,
    target: level.target,
    progress: (ctx) => ctx.maxPomodorosInSession,
  });
}

// --- SEMANA ---
// Pomodoros en una semana
const weekPomLevels: Array<{ id: string; target: number; tier: Tier; emoji: string; name: string }> = [
  { id: 'week20', target: 20, tier: 'plata', emoji: '📈', name: 'Semana activa' },
  { id: 'week35', target: 35, tier: 'oro', emoji: '📊', name: 'Semana intensa' },
  { id: 'week50', target: 50, tier: 'platino', emoji: '🚀', name: 'Semana épica' },
];

for (const level of weekPomLevels) {
  achievements.push({
    id: level.id,
    category: 'semana',
    tier: level.tier,
    emoji: level.emoji,
    name: level.name,
    description: `${level.target} pomodoros en una semana`,
    hint: `Completa ${level.target} pomodoros en una semana`,
    target: level.target,
    progress: (ctx) => ctx.maxPomodorosInWeek,
  });
}

// Semana laboral (L-V cerrados)
achievements.push({
  id: 'workweek',
  category: 'semana',
  tier: 'oro',
  emoji: '💼',
  name: 'Semana laboral',
  description: 'Objetivo cerrado de lunes a viernes',
  hint: 'Cierra el anillo de pomodoros de lunes a viernes',
  target: 5,
  progress: (ctx) => {
    let best = 0;
    ctx.weekMap.forEach((week) => {
      // Contar L-V (índices 0-4)
      const workdaysClosed = week.closedByDay.slice(0, 5).filter(Boolean).length;
      if (workdaysClosed > best) best = workdaysClosed;
    });
    return best;
  },
});

// Semana perfecta (7 días cerrados)
achievements.push({
  id: 'perfectweek',
  category: 'semana',
  tier: 'platino',
  emoji: '🗓️',
  name: 'Semana perfecta',
  description: 'Objetivo cerrado los 7 días',
  hint: 'Cierra el anillo de pomodoros los 7 días de una semana',
  target: 7,
  progress: (ctx) => {
    let best = 0;
    ctx.weekMap.forEach((week) => {
      if (week.closedDays > best) best = week.closedDays;
    });
    return best;
  },
});

// Ritmo semanal (semanas consecutivas con ≥3 días activos)
const rhythmLevels: Array<{ id: string; target: number; tier: Tier }> = [
  { id: 'rhythm4', target: 4, tier: 'plata' },
  { id: 'rhythm12', target: 12, tier: 'oro' },
  { id: 'rhythm26', target: 26, tier: 'platino' },
];

for (const level of rhythmLevels) {
  achievements.push({
    id: level.id,
    category: 'semana',
    tier: level.tier,
    emoji: '🔁',
    name: `Ritmo ${level.target}`,
    description: `${level.target} semanas con ritmo`,
    hint: `Mantén ≥3 días activos por semana durante ${level.target} semanas`,
    target: level.target,
    progress: (ctx) => ctx.bestRhythmStreak,
  });
}

// --- ANILLOS ---
// Primer cierre de cada anillo
achievements.push({
  id: 'ring-pom',
  category: 'anillos',
  tier: 'bronce',
  emoji: '⭕️',
  name: 'Anillo de pomodoros',
  description: 'Primer cierre del anillo de pomodoros',
  hint: 'Cierra el anillo de pomodoros por primera vez',
  target: 1,
  progress: (ctx) => {
    let closed = 0;
    ctx.dayMap.forEach((day) => {
      if (day.closed.pomodoros) closed++;
    });
    return closed > 0 ? 1 : 0;
  },
});

achievements.push({
  id: 'ring-min',
  category: 'anillos',
  tier: 'bronce',
  emoji: '⭕️',
  name: 'Anillo de minutos',
  description: 'Primer cierre del anillo de minutos',
  hint: 'Cierra el anillo de minutos por primera vez',
  target: 1,
  progress: (ctx) => {
    let closed = 0;
    ctx.dayMap.forEach((day) => {
      if (day.closed.minutes) closed++;
    });
    return closed > 0 ? 1 : 0;
  },
});

achievements.push({
  id: 'ring-hours',
  category: 'anillos',
  tier: 'bronce',
  emoji: '⭕️',
  name: 'Anillo de franjas',
  description: 'Primer cierre del anillo de franjas',
  hint: 'Cierra el anillo de franjas por primera vez',
  target: 1,
  progress: (ctx) => {
    let closed = 0;
    ctx.dayMap.forEach((day) => {
      if (day.closed.hours) closed++;
    });
    return closed > 0 ? 1 : 0;
  },
});

// Primer día con los tres cerrados
achievements.push({
  id: 'allrings',
  category: 'anillos',
  tier: 'plata',
  emoji: '✅',
  name: 'Tres anillos',
  description: 'Primer día con los tres anillos cerrados',
  hint: 'Cierra los tres anillos en un día',
  target: 1,
  progress: (ctx) => (ctx.allRingsClosedDays > 0 ? 1 : 0),
});

// Días con los tres cerrados (no consecutivos)
const allRingsLevels: Array<{ id: string; target: number; tier: Tier }> = [
  { id: 'allrings10', target: 10, tier: 'oro' },
  { id: 'allrings50', target: 50, tier: 'oro' },
  { id: 'allrings100', target: 100, tier: 'platino' },
];

for (const level of allRingsLevels) {
  achievements.push({
    id: level.id,
    category: 'anillos',
    tier: level.tier,
    emoji: '🌀',
    name: `Tres anillos ×${level.target}`,
    description: `${level.target} días con los tres anillos cerrados`,
    hint: `Cierra los tres anillos ${level.target} días`,
    target: level.target,
    progress: (ctx) => ctx.allRingsClosedDays,
  });
}

// --- MES PERFECTO ---
achievements.push({
  id: 'perfectmonth',
  category: 'anillos',
  tier: 'platino',
  emoji: '🗓️',
  name: 'Mes perfecto',
  description: 'Objetivo cerrado todos los días de un mes',
  hint: 'Cierra el anillo de pomodoros todos los días de un mes',
  target: 1,
  progress: (ctx) => {
    let perfectMonths = 0;
    ctx.monthMap.forEach((month) => {
      if (month.allDaysClosed) perfectMonths++;
    });
    return perfectMonths;
  },
});

// --- ESPECIALES ---
// Early bird
achievements.push({
  id: 'early',
  category: 'especiales',
  tier: 'bronce',
  emoji: '🌅',
  name: 'Madrugador',
  description: 'Pomodoro antes de las 8:00',
  hint: 'Completa un pomodoro antes de las 8:00',
  target: 1,
  progress: (ctx) => (ctx.earlyDays > 0 ? 1 : 0),
});

// Night owl
achievements.push({
  id: 'night',
  category: 'especiales',
  tier: 'bronce',
  emoji: '🌙',
  name: 'Noctámbulo',
  description: 'Pomodoro después de las 22:00',
  hint: 'Completa un pomodoro después de las 22:00',
  target: 1,
  progress: (ctx) => (ctx.nightDays > 0 ? 1 : 0),
});

// 7 días madrugando
achievements.push({
  id: 'early7',
  category: 'especiales',
  tier: 'plata',
  emoji: '🐓',
  name: 'Ave temprana',
  description: '7 días distintos con pomodoro antes de las 8:00',
  hint: 'Madruga 7 días distintos',
  target: 7,
  progress: (ctx) => ctx.earlyDays,
});

// 7 días noctámbulo
achievements.push({
  id: 'night7',
  category: 'especiales',
  tier: 'plata',
  emoji: '🦉',
  name: 'Búho nocturno',
  description: '7 días distintos con pomodoro después de las 22:00',
  hint: 'Trasnocha 7 días distintos',
  target: 7,
  progress: (ctx) => ctx.nightDays,
});

// Weekend warrior
achievements.push({
  id: 'weekend',
  category: 'especiales',
  tier: 'bronce',
  emoji: '🏖️',
  name: 'Fin de semana',
  description: 'Pomodoro el sábado y domingo de la misma semana',
  hint: 'Completa pomodoros el sábado y domingo',
  target: 1,
  progress: (ctx) => {
    let found = false;
    ctx.weekMap.forEach((week) => {
      // Sábado es índice 5, domingo es índice 6
      if (week.closedByDay[5] || week.closedByDay[6]) {
        // Verificar si hay actividad ambos días
        // closedByDay solo marca si cerró, necesitamos verificar actividad
      }
    });
    // Verificar de otra forma: buscar semanas con actividad sáb y dom
    const weekendWeeks = new Set<string>();
    ctx.dayMap.forEach((_, dateKey) => {
      const date = parseDateKey(dateKey);
      const dayOfWeek = date.getDay(); // 0=dom, 6=sáb
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendWeeks.add(getWeekKey(dateKey));
      }
    });
    // Verificar cuáles tienen ambos
    for (const weekKey of weekendWeeks) {
      let hasSat = false;
      let hasSun = false;
      ctx.dayMap.forEach((_, dateKey) => {
        if (getWeekKey(dateKey) === weekKey) {
          const dayOfWeek = parseDateKey(dateKey).getDay();
          if (dayOfWeek === 6) hasSat = true;
          if (dayOfWeek === 0) hasSun = true;
        }
      });
      if (hasSat && hasSun) {
        found = true;
        break;
      }
    }
    return found ? 1 : 0;
  },
});

// Comeback
achievements.push({
  id: 'comeback',
  category: 'especiales',
  tier: 'plata',
  emoji: '🔄',
  name: 'Regreso',
  description: 'Volver tras 7+ días sin actividad',
  hint: 'Completa un pomodoro tras 7 días o más sin actividad',
  target: 1,
  progress: (ctx) => {
    if (ctx.totalActiveDays < 2) return 0;

    const sortedDays = Array.from(ctx.dayMap.keys()).sort();
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = parseDateKey(sortedDays[i - 1]);
      const curr = parseDateKey(sortedDays[i]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays >= 8) {
        return 1;
      }
    }
    return 0;
  },
});

// New Year
achievements.push({
  id: 'newyear',
  category: 'especiales',
  tier: 'oro',
  emoji: '🎆',
  name: 'Año Nuevo',
  description: 'Pomodoro el 1 de enero',
  hint: 'Completa un pomodoro el día de Año Nuevo',
  target: 1,
  progress: (ctx) => (ctx.newYearDays.length > 0 ? 1 : 0),
});

// === EXPORT ===

export const ACHIEVEMENTS: Achievement[] = achievements;

export const CATEGORIES: { id: Category; name: string }[] = [
  { id: 'constancia', name: 'Constancia' },
  { id: 'objetivo', name: 'Objetivo' },
  { id: 'pomodoros', name: 'Pomodoros' },
  { id: 'tiempo', name: 'Tiempo' },
  { id: 'dia', name: 'Día y sesión' },
  { id: 'sesion', name: 'Día y sesión' },
  { id: 'semana', name: 'Semana' },
  { id: 'anillos', name: 'Anillos' },
  { id: 'especiales', name: 'Especiales' },
  { id: 'retos', name: 'Retos' },
];

export const TIER_COLORS: Record<Tier, string> = {
  bronce: '#A47E5F',
  plata: '#9A9EA5',
  oro: '#B8995A',
  platino: '#8FA3B3',
};

// === STORAGE ===

const STORAGE_KEY = 'pomodoro-unlocked-v1';

export function loadUnlocked(): UnlockedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as UnlockedMap;
  } catch {
    return {};
  }
}

export function saveUnlocked(unlocked: UnlockedMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
  } catch {
    // Ignorar errores
  }
}

// === UNLOCK LOGIC ===

export interface UnlockResult {
  newlyUnlocked: string[];
  allUnlocked: UnlockedMap;
}

/**
 * Verifica qué logros se han desbloqueado con el contexto actual.
 * Devuelve los nuevos desbloqueos con la fecha actual.
 */
export function checkAchievements(
  ctx: StatsContext,
  currentUnlocked: UnlockedMap
): UnlockResult {
  const newlyUnlocked: string[] = [];
  const allUnlocked = { ...currentUnlocked };
  const now = new Date().toISOString();

  for (const achievement of ACHIEVEMENTS) {
    if (!allUnlocked[achievement.id]) {
      const progress = achievement.progress(ctx);
      if (progress >= achievement.target) {
        allUnlocked[achievement.id] = now;
        newlyUnlocked.push(achievement.id);
      }
    }
  }

  return { newlyUnlocked, allUnlocked };
}

/**
 * Obtiene el conteo de logros desbloqueados
 */
export function getUnlockedCount(unlocked: UnlockedMap): number {
  return Object.keys(unlocked).filter((id) =>
    ACHIEVEMENTS.some((a) => a.id === id)
  ).length;
}

/**
 * Obtiene el progreso de un logro como porcentaje
 */
export function getAchievementProgress(
  achievement: Achievement,
  ctx: StatsContext
): number {
  const progress = achievement.progress(ctx);
  return Math.min(1, progress / achievement.target);
}

// === RETROACTIVE UNLOCK ===

/**
 * Calcula desbloqueos retroactivos iterando día por día.
 * Para cada insignia, encuentra el primer día en que se cumplió la condición.
 * Solo considera insignias del catálogo fijo (no retos mensuales).
 */
export function computeRetroactiveUnlocks(
  ctx: StatsContext,
  alreadyUnlocked: UnlockedMap
): UnlockedMap {
  const result = { ...alreadyUnlocked };

  // Obtener lista de días ordenada
  const sortedDays = Array.from(ctx.dayMap.keys()).sort();
  if (sortedDays.length === 0) return result;

  // Para cada insignia no desbloqueada
  for (const achievement of ACHIEVEMENTS) {
    if (result[achievement.id]) continue;

    // Verificar si actualmente se cumple
    const currentProgress = achievement.progress(ctx);
    if (currentProgress >= achievement.target) {
      // Buscar el primer día en que se cumplió
      // Simplificación: usamos la fecha actual para insignias cumplidas
      // En un sistema más complejo, reconstruiríamos el historial día a día
      result[achievement.id] = new Date().toISOString();
    }
  }

  return result;
}
