import { useState, useEffect, useCallback } from 'react';
import {
  TodoItem,
  loadTodos,
  saveTodos,
  createTodo,
  addTodo,
  toggleTodo,
  removeTodo,
  clearCompleted,
  partitionTodos,
} from '../lib/todos';

interface UseTodosReturn {
  todos: TodoItem[];
  pending: TodoItem[];
  completed: TodoItem[];
  pendingCount: number;
  completedCount: number;
  add: (text: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clearDone: () => void;
  importTodos: (newTodos: TodoItem[]) => void;
  announcement: string | null;
  clearAnnouncement: () => void;
}

export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<TodoItem[]>(() => loadTodos());
  const [announcement, setAnnouncement] = useState<string | null>(null);

  // Sincronizar con localStorage cuando cambia en otra pestaña
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pomodoro-todos-v1' && e.newValue) {
        setTodos(loadTodos());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Limpiar anuncio después de un tiempo
  useEffect(() => {
    if (!announcement) return;
    const timeout = setTimeout(() => setAnnouncement(null), 1000);
    return () => clearTimeout(timeout);
  }, [announcement]);

  const add = useCallback((text: string): boolean => {
    const todo = createTodo(text);
    if (!todo) return false;

    setTodos((prev) => {
      const updated = addTodo(prev, todo);
      saveTodos(updated);
      return updated;
    });
    setAnnouncement('Tarea añadida');
    return true;
  }, []);

  const toggle = useCallback((id: string) => {
    setTodos((prev) => {
      const updated = toggleTodo(prev, id);
      saveTodos(updated);
      // Determinar si se completó o se desmarcó
      const todo = updated.find((t) => t.id === id);
      if (todo?.done) {
        setAnnouncement('Tarea completada');
      }
      return updated;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setTodos((prev) => {
      const updated = removeTodo(prev, id);
      saveTodos(updated);
      return updated;
    });
    setAnnouncement('Tarea eliminada');
  }, []);

  const clearDone = useCallback(() => {
    setTodos((prev) => {
      const updated = clearCompleted(prev);
      saveTodos(updated);
      return updated;
    });
  }, []);

  const importTodos = useCallback((newTodos: TodoItem[]) => {
    setTodos(newTodos);
    saveTodos(newTodos);
  }, []);

  const clearAnnouncement = useCallback(() => {
    setAnnouncement(null);
  }, []);

  const { pending, completed } = partitionTodos(todos);

  return {
    todos,
    pending,
    completed,
    pendingCount: pending.length,
    completedCount: completed.length,
    add,
    toggle,
    remove,
    clearDone,
    importTodos,
    announcement,
    clearAnnouncement,
  };
}
