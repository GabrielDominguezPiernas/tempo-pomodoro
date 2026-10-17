/**
 * Historial de sesiones Pomodoro
 */

export interface SessionRecord {
  id: string;
  sessionId: string;
  endedAt: string; // ISO string
  dateKey: string; // YYYY-MM-DD local
  hour: number; // 0-23 local
  studyMinutes: number;
}

const STORAGE_KEY = 'pomodoro-history-v1';

/**
 * Convierte una fecha a clave YYYY-MM-DD en hora LOCAL (no UTC)
 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Valida que un registro tenga la estructura correcta
 */
function isValidRecord(record: unknown): record is SessionRecord {
  if (!record || typeof record !== 'object') return false;
  const r = record as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.sessionId === 'string' &&
    typeof r.endedAt === 'string' &&
    typeof r.dateKey === 'string' &&
    typeof r.hour === 'number' &&
    typeof r.studyMinutes === 'number'
  );
}

/**
 * Lee el historial desde localStorage de forma defensiva
 */
export function loadHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRecord);
  } catch {
    return [];
  }
}

/**
 * Guarda el historial en localStorage
 */
export function saveHistory(records: SessionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignorar errores de quota o modo privado
  }
}

/**
 * Genera un ID determinístico para un pomodoro
 */
export function generatePomodoroId(sessionId: string, pomodoroNumber: number): string {
  return `${sessionId}-${pomodoroNumber}`;
}

/**
 * Añade un nuevo registro al historial (con ID determinístico)
 */
export function addRecord(
  records: SessionRecord[],
  studyMinutes: number,
  sessionId: string,
  pomodoroNumber: number,
  timestamp?: Date
): SessionRecord[] {
  const id = generatePomodoroId(sessionId, pomodoroNumber);

  // Evitar duplicados
  if (records.some((r) => r.id === id)) {
    return records;
  }

  const now = timestamp ?? new Date();
  const newRecord: SessionRecord = {
    id,
    sessionId,
    endedAt: now.toISOString(),
    dateKey: toDateKey(now),
    hour: now.getHours(),
    studyMinutes,
  };
  return [...records, newRecord];
}

/**
 * Añade múltiples pomodoros perdidos al historial
 * (para cuando la app estaba cerrada y se completaron pomodoros)
 */
export function addMissedPomodoros(
  records: SessionRecord[],
  studyMinutes: number,
  sessionId: string,
  startingPomodoroNumber: number,
  count: number
): SessionRecord[] {
  let result = records;
  for (let i = 0; i < count; i++) {
    result = addRecord(
      result,
      studyMinutes,
      sessionId,
      startingPomodoroNumber + i
    );
  }
  return result;
}
