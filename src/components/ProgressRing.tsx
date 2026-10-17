import { ReactNode } from 'react';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  className?: string;
  children?: ReactNode;
  // Para compatibilidad con el uso existente en TimerScreen
  phase?: 'study' | 'break';
}

export function ProgressRing({
  progress,
  size = 280,
  strokeWidth = 3,
  color,
  bgColor,
  className = 'progress-ring',
  children,
  phase,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        className={className}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <circle
          className="progress-ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={bgColor ? { stroke: bgColor } : undefined}
        />
        <circle
          className="progress-ring-fill"
          data-phase={phase}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={color ? { stroke: color } : undefined}
        />
      </svg>
      {children && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
