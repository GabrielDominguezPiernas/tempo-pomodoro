import { useEffect } from 'react';
import { ACHIEVEMENTS } from '../lib/achievements';

interface ToastProps {
  achievementId: string;
  onDismiss: () => void;
}

export function Toast({ achievementId, onDismiss }: ToastProps) {
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!achievement) return null;

  return (
    <div
      className="toast"
      role="status"
      aria-live="polite"
      aria-label={`Insignia conseguida: ${achievement.name}`}
    >
      <span className="toast-emoji" aria-hidden="true">
        {achievement.emoji}
      </span>
      <div className="toast-content">
        <span className="toast-title">Insignia conseguida</span>
        <span className="toast-name">{achievement.name}</span>
      </div>
    </div>
  );
}
