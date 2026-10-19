interface TodoButtonProps {
  isOpen: boolean;
  onClick: () => void;
  pendingCount: number;
}

export function TodoButton({ isOpen, onClick, pendingCount }: TodoButtonProps) {
  return (
    <button
      type="button"
      className="todo-button"
      onClick={onClick}
      aria-label={isOpen ? 'Ocultar tareas' : 'Mostrar tareas'}
      aria-expanded={isOpen}
      aria-controls="todo-panel"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        {/* Lista con checkbox */}
        <rect
          x="2"
          y="3"
          width="5"
          height="5"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M10 5.5h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect
          x="2"
          y="12"
          width="5"
          height="5"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M10 14.5h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Checkmark en el primer checkbox */}
        <path
          d="M3.5 5.5l1 1 2-2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {pendingCount > 0 && (
        <span className="todo-button-badge" aria-hidden="true">
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}
    </button>
  );
}
