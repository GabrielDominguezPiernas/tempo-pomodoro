/**
 * Tarjeta de reto mensual actual
 */

import { MonthlyChallenge } from '../lib/challenges';

interface ChallengeCardProps {
  challenge: MonthlyChallenge;
  progress: number;
  isCompleted: boolean;
  completedAt: string | null;
}

function formatCompletedDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

function getMonthName(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1);
  return date.toLocaleDateString('es-ES', { month: 'long' });
}

export function ChallengeCard({
  challenge,
  progress,
  isCompleted,
  completedAt,
}: ChallengeCardProps) {
  const progressPercent = Math.min(1, progress / challenge.target) * 100;
  const monthName = getMonthName(challenge.month);

  return (
    <div className={`challenge-card${isCompleted ? ' challenge-card--completed' : ''}`}>
      <div className="challenge-header">
        <span className="challenge-month">Reto de {monthName}</span>
        {isCompleted && (
          <span className="challenge-completed-badge">✓ Completado</span>
        )}
      </div>

      <div className="challenge-body">
        <span className="challenge-emoji" aria-hidden="true">
          {challenge.emoji}
        </span>
        <div className="challenge-info">
          <span className="challenge-name">{challenge.name}</span>
          <span className="challenge-description">{challenge.description}</span>
        </div>
      </div>

      <div className="challenge-progress-section">
        <div className="challenge-progress-bar">
          <div
            className="challenge-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="challenge-progress-text">
          <span className="challenge-current">{progress}</span>
          <span className="challenge-divider">/</span>
          <span className="challenge-target">{challenge.target}</span>
        </div>
      </div>

      {isCompleted && completedAt && (
        <div className="challenge-completed-info">
          Completado el {formatCompletedDate(completedAt)}
        </div>
      )}
    </div>
  );
}
