import { ProgressRing } from './ProgressRing';

interface GoalRingProps {
  current: number;
  goal: number;
  size?: number;
}

export function GoalRing({ current, goal, size = 80 }: GoalRingProps) {
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
  const isComplete = current >= goal;

  return (
    <ProgressRing
      progress={progress}
      size={size}
      strokeWidth={6}
      color={isComplete ? 'var(--color-accent-break)' : 'var(--color-accent-study)'}
      bgColor="var(--color-border)"
      className="goal-ring"
    >
      <div className="goal-ring-content">
        <span className="goal-ring-current">{current}</span>
        <span className="goal-ring-divider">/</span>
        <span className="goal-ring-goal">{goal}</span>
      </div>
    </ProgressRing>
  );
}
