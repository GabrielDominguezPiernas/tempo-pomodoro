interface MenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function MenuButton({ isOpen, onClick }: MenuButtonProps) {
  return (
    <button
      type="button"
      className="menu-button"
      onClick={onClick}
      aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
      aria-expanded={isOpen}
      aria-controls="side-menu"
    >
      <svg
        width="20"
        height="14"
        viewBox="0 0 20 14"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1 1h18M1 7h18M1 13h18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
