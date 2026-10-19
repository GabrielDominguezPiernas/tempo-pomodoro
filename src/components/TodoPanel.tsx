import { useEffect, useRef, useState, useCallback, FormEvent, KeyboardEvent } from 'react';
import { TodoItem, MAX_TODO_TEXT_LENGTH } from '../lib/todos';

interface TodoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isNarrow: boolean;
  pending: TodoItem[];
  completed: TodoItem[];
  pendingCount: number;
  completedCount: number;
  onAdd: (text: string) => boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onClearCompleted: () => void;
  announcement: string | null;
}

export function TodoPanel({
  isOpen,
  onClose,
  isNarrow,
  pending,
  completed,
  pendingCount,
  completedCount,
  onAdd,
  onToggle,
  onRemove,
  onClearCompleted,
  announcement,
}: TodoPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Guardar el foco antes de abrir (solo en modo modal)
  useEffect(() => {
    if (isOpen && isNarrow) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen, isNarrow]);

  // En modo modal (estrecho): atrapar foco y manejar Escape
  useEffect(() => {
    if (!isOpen || !isNarrow) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Atrapar Tab dentro del panel
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isNarrow, onClose]);

  // Mover foco al panel al abrir (solo en modo modal)
  useEffect(() => {
    if (isOpen && isNarrow) {
      closeButtonRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else if (!isOpen && isNarrow) {
      document.body.style.overflow = '';
      // Restaurar foco
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isNarrow]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (onAdd(inputValue)) {
        setInputValue('');
      }
    },
    [inputValue, onAdd]
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (onAdd(inputValue)) {
          setInputValue('');
        }
      }
    },
    [inputValue, onAdd]
  );

  // Renderizado condicional basado en estado
  if (!isOpen && !isNarrow) {
    // En modo ancho, el panel colapsado ocupa espacio 0 pero existe en el DOM
    return <div className="todo-panel todo-panel--collapsed" />;
  }

  if (!isOpen && isNarrow) {
    return null;
  }

  const panelContent = (
    <div
      ref={panelRef}
      id="todo-panel"
      className={`todo-panel ${isNarrow ? 'todo-panel--narrow' : 'todo-panel--wide'}`}
      role={isNarrow ? 'dialog' : undefined}
      aria-modal={isNarrow ? 'true' : undefined}
      aria-label={isNarrow ? 'Panel de tareas' : undefined}
    >
      <div className="todo-header">
        <h2 className="todo-title">
          Tareas
          {pendingCount > 0 && (
            <span className="todo-count">{pendingCount} pendientes</span>
          )}
        </h2>
        {isNarrow && (
          <button
            ref={closeButtonRef}
            type="button"
            className="todo-close"
            onClick={onClose}
            aria-label="Cerrar panel de tareas"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      <form className="todo-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="todo-input"
          placeholder="Añadir tarea..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          maxLength={MAX_TODO_TEXT_LENGTH}
          aria-label="Nueva tarea"
        />
        <button type="submit" className="todo-add-btn" aria-label="Añadir tarea">
          Añadir
        </button>
      </form>

      <div className="todo-content">
        {pending.length === 0 && completed.length === 0 ? (
          <p className="todo-empty">Nada pendiente</p>
        ) : (
          <>
            {pending.length > 0 && (
              <ul className="todo-list" aria-label="Tareas pendientes">
                {pending.map((todo) => (
                  <TodoItemRow
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggle}
                    onRemove={onRemove}
                  />
                ))}
              </ul>
            )}

            {completed.length > 0 && (
              <div className="todo-completed-section">
                <div className="todo-completed-header">
                  <span className="todo-completed-label">
                    Completadas ({completedCount})
                  </span>
                  <button
                    type="button"
                    className="todo-clear-btn"
                    onClick={onClearCompleted}
                  >
                    Borrar completadas
                  </button>
                </div>
                <ul className="todo-list todo-list--completed" aria-label="Tareas completadas">
                  {completed.map((todo) => (
                    <TodoItemRow
                      key={todo.id}
                      todo={todo}
                      onToggle={onToggle}
                      onRemove={onRemove}
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );

  // En modo estrecho, envolver con overlay
  if (isNarrow) {
    return (
      <>
        <div
          className="todo-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
        {panelContent}
      </>
    );
  }

  return panelContent;
}

// Componente de fila de tarea
interface TodoItemRowProps {
  todo: TodoItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

function TodoItemRow({ todo, onToggle, onRemove }: TodoItemRowProps) {
  return (
    <li className={`todo-item ${todo.done ? 'todo-item--done' : ''}`}>
      <label className="todo-checkbox-label">
        <input
          type="checkbox"
          className="todo-checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
          aria-label={todo.done ? `Desmarcar: ${todo.text}` : `Completar: ${todo.text}`}
        />
        <span className="todo-checkbox-custom" aria-hidden="true" />
        <span className="todo-text">{todo.text}</span>
      </label>
      <button
        type="button"
        className="todo-delete-btn"
        onClick={() => onRemove(todo.id)}
        aria-label={`Eliminar: ${todo.text}`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M1 1l10 10M11 1L1 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </li>
  );
}
