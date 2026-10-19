/**
 * Lista de tareas pendientes (to-do)
 */

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
}

const STORAGE_KEY = 'pomodoro-todos-v1';
const MAX_TEXT_LENGTH = 120;

/**
 * Genera un ID único usando crypto.randomUUID con fallback
 */
export function generateTodoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para navegadores antiguos
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Valida que un item tenga la estructura correcta
 */
export function isValidTodo(item: unknown): item is TodoItem {
  if (!item || typeof item !== 'object') return false;
  const t = item as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    t.id.length > 0 &&
    typeof t.text === 'string' &&
    t.text.trim().length > 0 &&
    t.text.length <= MAX_TEXT_LENGTH &&
    typeof t.done === 'boolean' &&
    typeof t.createdAt === 'string' &&
    (t.completedAt === undefined || typeof t.completedAt === 'string')
  );
}

/**
 * Valida y limpia el texto de entrada
 */
export function sanitizeText(text: string): string {
  return text.trim().slice(0, MAX_TEXT_LENGTH);
}

/**
 * Verifica si el texto de entrada es válido
 */
export function isValidText(text: string): boolean {
  const sanitized = sanitizeText(text);
  return sanitized.length > 0;
}

/**
 * Lee las tareas desde localStorage de forma defensiva
 */
export function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filtrar items válidos y eliminar duplicados por ID
    const seen = new Set<string>();
    return parsed.filter((item) => {
      if (!isValidTodo(item)) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  } catch {
    return [];
  }
}

/**
 * Guarda las tareas en localStorage
 */
export function saveTodos(todos: TodoItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Ignorar errores de quota o modo privado
  }
}

/**
 * Crea una nueva tarea
 */
export function createTodo(text: string): TodoItem | null {
  const sanitized = sanitizeText(text);
  if (!sanitized) return null;

  return {
    id: generateTodoId(),
    text: sanitized,
    done: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Añade una tarea al principio de la lista
 */
export function addTodo(todos: TodoItem[], todo: TodoItem): TodoItem[] {
  // Evitar duplicados por ID
  if (todos.some((t) => t.id === todo.id)) {
    return todos;
  }
  return [todo, ...todos];
}

/**
 * Marca una tarea como completada o pendiente
 */
export function toggleTodo(todos: TodoItem[], id: string): TodoItem[] {
  return todos.map((todo) => {
    if (todo.id !== id) return todo;
    const done = !todo.done;
    return {
      ...todo,
      done,
      completedAt: done ? new Date().toISOString() : undefined,
    };
  });
}

/**
 * Elimina una tarea
 */
export function removeTodo(todos: TodoItem[], id: string): TodoItem[] {
  return todos.filter((todo) => todo.id !== id);
}

/**
 * Elimina todas las tareas completadas
 */
export function clearCompleted(todos: TodoItem[]): TodoItem[] {
  return todos.filter((todo) => !todo.done);
}

/**
 * Separa las tareas en pendientes y completadas
 */
export function partitionTodos(todos: TodoItem[]): {
  pending: TodoItem[];
  completed: TodoItem[];
} {
  const pending: TodoItem[] = [];
  const completed: TodoItem[] = [];

  for (const todo of todos) {
    if (todo.done) {
      completed.push(todo);
    } else {
      pending.push(todo);
    }
  }

  return { pending, completed };
}

/**
 * Valida tareas para importación (más estricta que isValidTodo)
 */
export function validateTodosForImport(data: unknown): TodoItem[] {
  if (!Array.isArray(data)) return [];

  const seen = new Set<string>();
  const validTodos: TodoItem[] = [];

  for (const item of data) {
    if (!isValidTodo(item)) continue;
    // Evitar IDs duplicados en la importación
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    validTodos.push(item);
  }

  return validTodos;
}

/**
 * Combina tareas existentes con importadas (merge)
 */
export function mergeTodos(existing: TodoItem[], imported: TodoItem[]): TodoItem[] {
  const existingIds = new Set(existing.map((t) => t.id));
  const newTodos = imported.filter((t) => !existingIds.has(t.id));

  // Combinar y ordenar por fecha de creación (más recientes primero)
  return [...existing, ...newTodos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export const MAX_TODO_TEXT_LENGTH = MAX_TEXT_LENGTH;
