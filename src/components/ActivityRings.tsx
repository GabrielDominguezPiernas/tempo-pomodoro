/**
 * Dos anillos concéntricos estilo Apple Fitness
 * - Exterior: Pomodoros (rojo/terracota)
 * - Interior: Minutos (verde)
 */

interface RingData {
  current: number;
  goal: number;
  color: string;
  bgColor: string;
  label: string;
}

interface ActivityRingsProps {
  pomodoros: { current: number; goal: number };
  minutes: { current: number; goal: number };
  size?: number;
}

const RING_COLORS = {
  pomodoros: { color: '#FA114F', bg: 'rgba(250, 17, 79, 0.2)' },
  minutes: { color: '#92E82A', bg: 'rgba(146, 232, 42, 0.2)' },
};

export function ActivityRings({
  pomodoros,
  minutes,
  size = 140,
}: ActivityRingsProps) {
  const strokeWidth = size * 0.10; // 10% del tamaño (más grueso con 2 anillos)
  const gap = size * 0.03; // 3% gap entre anillos
  const center = size / 2;

  const rings: RingData[] = [
    {
      current: pomodoros.current,
      goal: pomodoros.goal,
      color: RING_COLORS.pomodoros.color,
      bgColor: RING_COLORS.pomodoros.bg,
      label: 'Pomodoros',
    },
    {
      current: minutes.current,
      goal: minutes.goal,
      color: RING_COLORS.minutes.color,
      bgColor: RING_COLORS.minutes.bg,
      label: 'Minutos',
    },
  ];

  // Calcular radios: exterior hacia interior
  const outerPadding = strokeWidth / 2;
  const radii = rings.map((_, i) => {
    return center - outerPadding - i * (strokeWidth + gap);
  });

  return (
    <div
      className="activity-rings"
      style={{ width: size, height: size, position: 'relative' }}
      role="img"
      aria-label={`Anillos de actividad: ${pomodoros.current}/${pomodoros.goal} pomodoros, ${minutes.current}/${minutes.goal} minutos`}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {rings.map((ring, i) => {
          const radius = radii[i];
          const circumference = 2 * Math.PI * radius;
          const progress = ring.goal > 0 ? Math.min(ring.current / ring.goal, 1) : 0;
          const offset = circumference * (1 - progress);
          const isComplete = ring.current >= ring.goal;

          return (
            <g key={ring.label}>
              {/* Background ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.bgColor}
                strokeWidth={strokeWidth}
              />
              {/* Progress ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{
                  transition: 'stroke-dashoffset 0.5s ease',
                  filter: isComplete ? `drop-shadow(0 0 4px ${ring.color})` : undefined,
                }}
              />
            </g>
          );
        })}
      </svg>
      {/* Centro con indicador */}
      <div
        className="activity-rings-center"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div className="activity-rings-count" style={{ fontSize: size * 0.18, fontWeight: 600 }}>
          {pomodoros.current}
        </div>
        <div className="activity-rings-label" style={{ fontSize: size * 0.09, opacity: 0.6 }}>
          / {pomodoros.goal}
        </div>
      </div>
    </div>
  );
}

/**
 * Versión mini para calendarios (solo muestra los anillos sin texto)
 */
interface MiniRingsProps {
  pomodoros: { current: number; goal: number };
  minutes: { current: number; goal: number };
  size?: number;
}

export function MiniActivityRings({
  pomodoros,
  minutes,
  size = 28,
}: MiniRingsProps) {
  const strokeWidth = size * 0.14;
  const gap = size * 0.04;
  const center = size / 2;

  const rings = [
    { ...pomodoros, ...RING_COLORS.pomodoros },
    { ...minutes, ...RING_COLORS.minutes },
  ];

  const outerPadding = strokeWidth / 2;
  const radii = rings.map((_, i) => center - outerPadding - i * (strokeWidth + gap));

  const allClosed =
    pomodoros.current >= pomodoros.goal &&
    minutes.current >= minutes.goal;

  return (
    <svg
      className="mini-rings"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ transform: 'rotate(-90deg)' }}
      aria-hidden="true"
    >
      {rings.map((ring, i) => {
        const radius = radii[i];
        const circumference = 2 * Math.PI * radius;
        const progress = ring.goal > 0 ? Math.min(ring.current / ring.goal, 1) : 0;
        const offset = circumference * (1 - progress);

        return (
          <g key={i}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={ring.bg}
              strokeWidth={strokeWidth}
            />
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={ring.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                filter: allClosed ? `drop-shadow(0 0 2px ${ring.color})` : undefined,
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
